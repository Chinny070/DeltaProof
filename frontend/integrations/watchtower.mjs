#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';

export const MAX_WATCH_TARGETS = 100;
export const MIN_POLL_INTERVAL_MS = 15_000;

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

export async function pollAuthorization(client, target) {
  const result = await client.readContract({
    address: target.address, functionName: 'get_authorization',
    args: [target.releaseId, target.agentId],
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  });
  if (!result || typeof result.allow !== 'boolean' || typeof result.status !== 'string'
      || result.agent_id !== target.agentId || result.release_id !== target.releaseId
      || typeof result.revision !== 'number' || (result.allow && result.status !== 'ALLOW')
      || (!result.allow && result.status === 'ALLOW')) throw Error('Contract returned a malformed authorization record.');
  return { ...result, chainId: 61999, state: 'LATEST_FINAL' };
}

export async function watch({ client, targets, emit, intervalMs = MIN_POLL_INTERVAL_MS, signal,
  wait = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  if (!Array.isArray(targets) || targets.length < 1 || targets.length > MAX_WATCH_TARGETS) throw Error('Invalid watch target list.');
  if (!Number.isInteger(intervalMs) || intervalMs < MIN_POLL_INTERVAL_MS) throw Error(`Polling interval must be at least ${MIN_POLL_INTERVAL_MS} ms.`);
  const previous = new Map();
  while (!signal?.aborted) {
    for (const target of targets) {
      let record;
      try { record = await pollAuthorization(client, target); }
      catch (error) { record = { allow: false, status: 'READ_ERROR', reason: error?.message || String(error), agent_id: target.agentId, release_id: target.releaseId, chainId: 61999, state: 'LATEST_FINAL' }; }
      const key = `${target.address.toLowerCase()}:${target.agentId}:${target.releaseId}`;
      const signature = `${record.allow}:${record.status}:${record.revision ?? 0}:${record.passport_hash ?? ''}`;
      if (previous.get(key) !== signature) emit({ ...record, address: target.address, observed_at: new Date().toISOString() });
      previous.set(key, signature);
    }
    if (!signal || signal.aborted) break;
    await wait(intervalMs, signal);
  }
}

async function main() {
  const address = process.env.DELTAPROOF_V2_CONTRACT_ADDRESS;
  if (!/^0x[a-fA-F0-9]{40}$/.test(address || '')) throw Error('DELTAPROOF_V2_CONTRACT_ADDRESS must be a verified V2 address.');
  const targets = parseTargets(process.env.DELTAPROOF_WATCH_TARGETS);
  for (const target of targets) if (target.address.toLowerCase() !== address.toLowerCase()) throw Error('Every watch target must use the configured V2 contract address.');
  const parsedInterval = Number(process.env.DELTAPROOF_WATCH_INTERVAL_MS || MIN_POLL_INTERVAL_MS);
  const controller = new AbortController();
  process.once('SIGINT', () => controller.abort());
  const client = createClient({ chain: studionet });
  await watch({ client, targets, intervalMs: parsedInterval, signal: controller.signal,
    emit: event => process.stdout.write(JSON.stringify(event) + '\n') });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => { process.stderr.write(JSON.stringify({ status: 'ERROR', reason: error?.message || String(error) }) + '\n'); process.exitCode = 2; });
}
