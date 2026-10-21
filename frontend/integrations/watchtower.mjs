#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

export const MAX_WATCH_TARGETS = 100;
export const MIN_POLL_INTERVAL_MS = 15_000;
export const RPC_LIMIT_PER_HOUR = 500;
// Leave most of the observed account allowance available to the UI, CI, and other RPC clients.
export const DEFAULT_OTHER_PROCESS_RESERVE_PER_HOUR = 400;
export const MAX_BACKOFF_MS = 60 * 60 * 1000;
export const RPC_WINDOW_MS = 60 * 60 * 1000;
const LOCK_STALE_MS = 30_000;

export function parseTargets(raw) {
  let targets;
  try { targets = JSON.parse(raw || ''); } catch { throw Error('DELTAPROOF_WATCH_TARGETS must be JSON.'); }
  if (!Array.isArray(targets) || targets.length < 1 || targets.length > MAX_WATCH_TARGETS) {
    throw Error(`Watch targets must be an array of 1 to ${MAX_WATCH_TARGETS} entries.`);
  }
  const seen = new Set();
  return targets.map(target => {
    if (!target || typeof target !== 'object' || !/^0x[a-fA-F0-9]{40}$/.test(target.address || '')
        || typeof target.agentId !== 'string' || !target.agentId.trim()
        || typeof target.releaseId !== 'string' || !target.releaseId.trim()) throw Error('Each watch target needs a V2 address, agentId and releaseId.');
    const key = `${target.address.toLowerCase()}:${target.agentId}:${target.releaseId}`;
    if (seen.has(key)) throw Error('Watch targets must be unique.');
    seen.add(key);
    return { address: target.address, agentId: target.agentId.trim(), releaseId: target.releaseId.trim() };
  });
}

export function createPollingConfig(targetCount, {
  rpcLimitPerHour = RPC_LIMIT_PER_HOUR,
  otherProcessReservePerHour = DEFAULT_OTHER_PROCESS_RESERVE_PER_HOUR,
  requestedIntervalMs = MIN_POLL_INTERVAL_MS,
} = {}) {
  if (!Number.isInteger(targetCount) || targetCount < 1 || targetCount > MAX_WATCH_TARGETS) throw Error('Invalid Watchtower target count.');
  if (!Number.isInteger(rpcLimitPerHour) || rpcLimitPerHour < 1) throw Error('RPC hourly limit must be a positive integer.');
  if (!Number.isInteger(otherProcessReservePerHour) || otherProcessReservePerHour < 0 || otherProcessReservePerHour >= rpcLimitPerHour) {
    throw Error('Other-process request reserve must be nonnegative and below the RPC hourly limit.');
  }
  if (!Number.isFinite(requestedIntervalMs) || requestedIntervalMs < MIN_POLL_INTERVAL_MS) throw Error(`Polling interval must be at least ${MIN_POLL_INTERVAL_MS} ms.`);
  const watcherBudgetPerHour = rpcLimitPerHour - otherProcessReservePerHour;
  const budgetIntervalMs = Math.ceil(targetCount * RPC_WINDOW_MS / watcherBudgetPerHour);
  return {
    rpcLimitPerHour,
    otherProcessReservePerHour,
    watcherBudgetPerHour,
    targetCount,
    intervalMs: Math.max(MIN_POLL_INTERVAL_MS, requestedIntervalMs, budgetIntervalMs),
  };
}

export function classifyRpcError(error) {
  const message = error?.message || String(error);
  const status = Number(error?.status ?? error?.statusCode ?? error?.cause?.status ?? 0);
  const rateLimit = status === 429 || /rate.?limit|too many requests|requests per hour|quota exceeded|http\s*429/i.test(message);
  const retryHeader = error?.headers?.['retry-after'] ?? error?.headers?.get?.('retry-after') ?? error?.retryAfter;
  let retryAfterMs = 0;
  if (retryHeader !== undefined) {
    const seconds = Number(retryHeader);
    if (Number.isFinite(seconds) && seconds >= 0) retryAfterMs = seconds * 1000;
    else {
      const date = Date.parse(String(retryHeader));
      if (Number.isFinite(date)) retryAfterMs = Math.max(0, date - Date.now());
    }
  }
  return { kind: rateLimit ? 'RATE_LIMIT' : 'RPC_READ_FAILURE', message, retryAfterMs };
}

export function calculateBackoffMs({ baseIntervalMs, failureCount, retryAfterMs = 0, random = Math.random, maxBackoffMs = MAX_BACKOFF_MS }) {
  if (!Number.isInteger(failureCount) || failureCount < 1) throw Error('Failure count must be positive.');
  const exponential = Math.min(maxBackoffMs, baseIntervalMs * (2 ** Math.min(30, failureCount - 1)));
  const bounded = Math.min(maxBackoffMs, Math.max(exponential, retryAfterMs));
  const jitter = 0.8 + (Math.max(0, Math.min(1, random())) * 0.4);
  return Math.min(maxBackoffMs, Math.max(baseIntervalMs, Math.round(bounded * jitter)));
}

async function delay(ms, signal) {
  if (signal?.aborted) return;
  await new Promise(resolve => {
    const timer = setTimeout(done, ms);
    function done() { signal?.removeEventListener('abort', abort); resolve(); }
    function abort() { clearTimeout(timer); done(); }
    signal?.addEventListener('abort', abort, { once: true });
  });
}

/** Shared rolling-window budget for Watchtower processes on this machine. */
export class PersistentHourlyBudget {
  constructor({ budgetPerHour, statePath = join(tmpdir(), 'deltaproof-studionet-watchtower-budget.json'), now = Date.now, wait = delay, random = Math.random } = {}) {
    if (!Number.isInteger(budgetPerHour) || budgetPerHour < 1) throw Error('Shared Watchtower budget must be a positive integer.');
    this.budgetPerHour = budgetPerHour;
    this.statePath = statePath;
    this.lockPath = `${statePath}.lock`;
    this.now = now;
    this.wait = wait;
    this.random = random;
  }

  async #lock() {
    await mkdir(dirname(this.statePath), { recursive: true });
    const started = this.now();
    while (true) {
      try {
        await mkdir(this.lockPath);
        return async () => rm(this.lockPath, { recursive: true, force: true });
      } catch (error) {
        if (error?.code !== 'EEXIST') throw error;
        try {
          const info = await stat(this.lockPath);
          if (this.now() - info.mtimeMs > LOCK_STALE_MS) {
            await rm(this.lockPath, { recursive: true, force: true });
            continue;
          }
        } catch (statError) {
          if (statError?.code === 'ENOENT') continue;
          throw statError;
        }
        if (this.now() - started > LOCK_STALE_MS) throw Error('Timed out coordinating the shared Watchtower RPC budget.');
        await this.wait(15 + Math.floor(this.random() * 35));
      }
    }
  }

  async reserve() {
    const unlock = await this.#lock();
    try {
      const now = this.now();
      let timestamps = [];
      try {
        const value = JSON.parse(await readFile(this.statePath, 'utf8'));
        if (!Array.isArray(value.timestamps) || value.timestamps.some(stamp => !Number.isFinite(stamp))) throw Error('Invalid shared Watchtower budget state.');
        timestamps = value.timestamps;
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error;
      }
      timestamps = timestamps.filter(stamp => stamp > now - RPC_WINDOW_MS);
      if (timestamps.length >= this.budgetPerHour) {
        return { granted: false, waitMs: Math.max(1, timestamps[0] + RPC_WINDOW_MS - now) };
      }
      timestamps.push(now);
      const temporary = `${this.statePath}.${process.pid}.${randomUUID()}.tmp`;
      await writeFile(temporary, JSON.stringify({ timestamps }), { encoding: 'utf8', flag: 'wx' });
      await rename(temporary, this.statePath);
      return { granted: true, waitMs: 0 };
    } finally {
      await unlock();
    }
  }

  async waitForSlot({ signal, wait = this.wait } = {}) {
    while (!signal?.aborted) {
      const slot = await this.reserve();
      if (slot.granted) return true;
      await wait(slot.waitMs, signal);
    }
    return false;
  }
}

export async function pollAuthorization(client, target) {
  const result = await client.readContract({
    address: target.address, functionName: 'get_authorization',
    args: [target.releaseId, target.agentId],
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  });
  if (!result || typeof result.allow !== 'boolean' || typeof result.status !== 'string'
      || result.status === 'READ_ERROR' || result.status === 'RPC_READ_ERROR'
      || result.agent_id !== target.agentId || result.release_id !== target.releaseId
      || typeof result.revision !== 'number' || (result.allow && result.status !== 'ALLOW')
      || (!result.allow && result.status === 'ALLOW')) throw Error('Contract returned a malformed authorization record.');
  return { ...result, chainId: 61999, state: 'LATEST_FINAL' };
}

function authorizationSignature(record) {
  return `${record.allow}:${record.status}:${record.revision ?? 0}:${record.passport_hash ?? ''}`;
}

export async function watch({ client, targets, emit, intervalMs, pollingConfig, signal,
  requestBudget, wait = delay, random = Math.random, now = () => new Date().toISOString() } = {}) {
  if (!Array.isArray(targets) || targets.length < 1 || targets.length > MAX_WATCH_TARGETS) throw Error('Invalid watch target list.');
  const config = pollingConfig || createPollingConfig(targets.length, { requestedIntervalMs: intervalMs ?? MIN_POLL_INTERVAL_MS });
  if (config.targetCount !== targets.length || !Number.isInteger(config.watcherBudgetPerHour) || config.watcherBudgetPerHour < 1) throw Error('Polling budget does not match target count.');
  if (typeof emit !== 'function') throw Error('Watchtower emit callback is required.');
  const budget = requestBudget || new PersistentHourlyBudget({ budgetPerHour: config.watcherBudgetPerHour });
  const lastGood = new Map();
  const failures = new Map();
  let consecutiveFailedCycles = 0;

  while (!signal?.aborted) {
    let cycleFailed = false;
    for (const target of targets) {
      if (signal?.aborted) break;
      const reserved = await budget.waitForSlot({ signal, wait });
      if (reserved === false || signal?.aborted) break;
      const key = `${target.address.toLowerCase()}:${target.agentId}:${target.releaseId}`;
      try {
        const record = await pollAuthorization(client, target);
        const priorFailure = failures.get(key);
        if (priorFailure) {
          emit({ event_type: 'RPC_RECOVERED', chain_state_observed: false, address: target.address,
            agent_id: target.agentId, release_id: target.releaseId, recovered_after_errors: priorFailure.count,
            observed_at: now() });
          failures.delete(key);
        }
        const signature = authorizationSignature(record);
        if (lastGood.get(key) !== signature) {
          emit({ ...record, event_type: 'AUTHORIZATION_STATE', chain_state_observed: true,
            address: target.address, observed_at: now() });
          lastGood.set(key, signature);
        }
      } catch (error) {
        cycleFailed = true;
        const issue = classifyRpcError(error);
        const count = (failures.get(key)?.count || 0) + 1;
        failures.set(key, { count, kind: issue.kind });
        consecutiveFailedCycles += 1;
        const retryAfterMs = calculateBackoffMs({ baseIntervalMs: config.intervalMs,
          failureCount: consecutiveFailedCycles, retryAfterMs: issue.retryAfterMs, random });
        emit({ event_type: 'RPC_READ_ERROR', chain_state_observed: false, error_kind: issue.kind,
          error: issue.message, target: { address: target.address, agent_id: target.agentId, release_id: target.releaseId },
          consecutive_errors: count, retry_after_ms: retryAfterMs, observed_at: now() });
        // Stop the current sweep on the first RPC failure. Extra targets must not amplify throttling.
        break;
      }
    }
    if (signal?.aborted) break;
    if (!cycleFailed) consecutiveFailedCycles = 0;
    const nextInterval = cycleFailed
      ? calculateBackoffMs({ baseIntervalMs: config.intervalMs, failureCount: consecutiveFailedCycles, random })
      : Math.round(config.intervalMs * (0.9 + random() * 0.2));
    await wait(nextInterval, signal);
  }
}

function integerEnv(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw Error(`${name} must be an integer.`);
  return parsed;
}

async function main() {
  const address = process.env.DELTAPROOF_V2_CONTRACT_ADDRESS;
  if (!/^0x[a-fA-F0-9]{40}$/.test(address || '')) throw Error('DELTAPROOF_V2_CONTRACT_ADDRESS must be a verified V2 address.');
  const targets = parseTargets(process.env.DELTAPROOF_WATCH_TARGETS);
  for (const target of targets) if (target.address.toLowerCase() !== address.toLowerCase()) throw Error('Every watch target must use the configured V2 contract address.');
  const rpcLimitPerHour = integerEnv('DELTAPROOF_WATCH_RPC_LIMIT_PER_HOUR', RPC_LIMIT_PER_HOUR);
  const otherProcessReservePerHour = integerEnv('DELTAPROOF_WATCH_OTHER_PROCESS_REQUESTS_PER_HOUR', DEFAULT_OTHER_PROCESS_RESERVE_PER_HOUR);
  const requestedIntervalMs = Math.max(MIN_POLL_INTERVAL_MS, integerEnv('DELTAPROOF_WATCH_INTERVAL_MS', MIN_POLL_INTERVAL_MS));
  const pollingConfig = createPollingConfig(targets.length, { rpcLimitPerHour, otherProcessReservePerHour, requestedIntervalMs });
  const budgetPath = process.env.DELTAPROOF_WATCH_BUDGET_FILE || join(tmpdir(), 'deltaproof-studionet-watchtower-budget.json');
  const controller = new AbortController();
  process.once('SIGINT', () => controller.abort());
  process.once('SIGTERM', () => controller.abort());
  const client = createClient({ chain: studionet });
  process.stderr.write(`${JSON.stringify({ event_type: 'WATCHTOWER_CONFIG', chain_id: 61999, ...pollingConfig, budget_path: budgetPath })}\n`);
  await watch({ client, targets, pollingConfig, signal: controller.signal,
    requestBudget: new PersistentHourlyBudget({ budgetPerHour: pollingConfig.watcherBudgetPerHour, statePath: budgetPath }),
    emit: event => process.stdout.write(JSON.stringify(event) + '\n') });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { process.stderr.write(JSON.stringify({ status: 'ERROR', reason: error?.message || String(error) }) + '\n'); process.exitCode = 2; });
}
