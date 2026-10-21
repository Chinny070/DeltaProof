import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MAX_WATCH_TARGETS, MIN_POLL_INTERVAL_MS, PersistentHourlyBudget, RPC_WINDOW_MS,
  calculateBackoffMs, classifyRpcError, createPollingConfig, parseTargets, pollAuthorization, watch } from './watchtower.mjs';

const address = '0x' + '1'.repeat(40);
const target = { address, agentId: 'checkout', releaseId: 'payments-2' };
const result = { allow: false, status: 'SAFETY_CHALLENGE_PENDING', revision: 2,
  agent_id: 'checkout', release_id: 'payments-2', reason: 'pending challenge' };
const immediateBudget = { waitForSlot: async () => true };

test('watch target parsing is bounded, validated and duplicate-safe', () => {
  assert.deepEqual(parseTargets(JSON.stringify([target])), [target]);
  assert.throws(() => parseTargets('[]'), /1 to/);
  assert.throws(() => parseTargets(JSON.stringify([target, target])), /unique/);
  assert.throws(() => parseTargets(JSON.stringify(Array(MAX_WATCH_TARGETS + 1).fill(target))), /1 to/);
  assert.throws(() => parseTargets('{'), /must be JSON/);
});

test('polling budget reserves capacity for other processes and scales with target count', () => {
  const one = createPollingConfig(1);
  const two = createPollingConfig(2);
  const five = createPollingConfig(5, { otherProcessReservePerHour: 450 });
  assert.equal(one.watcherBudgetPerHour, 100);
  assert.equal(two.intervalMs, 72_000);
  assert.equal(five.watcherBudgetPerHour, 50);
  assert.equal(five.intervalMs, 360_000);
  assert.throws(() => createPollingConfig(2, { otherProcessReservePerHour: 500 }), /reserve/);
});

test('separate Watchtower processes share one rolling-hour request budget', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'deltaproof-budget-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  let now = 10_000;
  const statePath = join(dir, 'budget.json');
  const first = new PersistentHourlyBudget({ budgetPerHour: 2, statePath, now: () => now });
  const second = new PersistentHourlyBudget({ budgetPerHour: 2, statePath, now: () => now });
  const third = new PersistentHourlyBudget({ budgetPerHour: 2, statePath, now: () => now });
  const slots = await Promise.all([first.reserve(), second.reserve(), third.reserve()]);
  assert.equal(slots.filter(slot => slot.granted).length, 2);
  assert.equal(slots.filter(slot => !slot.granted).length, 1);
  assert.ok(slots.find(slot => !slot.granted).waitMs > 0);
  now += RPC_WINDOW_MS;
  assert.deepEqual(await third.reserve(), { granted: true, waitMs: 0 });
});

test('watchtower reads latest-final structured authorization and rejects malformed records', async () => {
  let request;
  const record = await pollAuthorization({ readContract: async input => { request = input; return result; } }, target);
  assert.equal(request.functionName, 'get_authorization');
  assert.deepEqual(request.args, ['payments-2', 'checkout']);
  assert.equal(request.transactionHashVariant, 'latest-final');
  assert.equal(record.status, 'SAFETY_CHALLENGE_PENDING');
  await assert.rejects(pollAuthorization({ readContract: async () => ({ ...result, agent_id: 'other' }) }, target), /malformed/);
  await assert.rejects(pollAuthorization({ readContract: async () => ({ ...result, status: 'READ_ERROR' }) }, target), /malformed/);
});

test('RPC failures emit health events, preserve last good state, and recovery reports only real transitions', async () => {
  const controller = new AbortController();
  let calls = 0;
  const events = [];
  const waits = [];
  const client = { readContract: async () => {
    calls += 1;
    if (calls === 1) return { ...result, status: 'ALLOW', allow: true };
    if (calls === 2 || calls === 3) throw Object.assign(Error('HTTP 429: rate limit exceeded'), { status: 429 });
    controller.abort();
    return { ...result, status: 'FROZEN', allow: false, revision: 3 };
  } };
  await watch({ client, targets: [target], intervalMs: MIN_POLL_INTERVAL_MS, signal: controller.signal,
    requestBudget: immediateBudget, random: () => 0.5, wait: async ms => waits.push(ms), emit: event => events.push(event) });
  assert.deepEqual(events.map(event => event.event_type), [
    'AUTHORIZATION_STATE', 'RPC_READ_ERROR', 'RPC_READ_ERROR', 'RPC_RECOVERED', 'AUTHORIZATION_STATE',
  ]);
  assert.equal(events[0].status, 'ALLOW');
  assert.equal(events[1].error_kind, 'RATE_LIMIT');
  assert.equal(events[2].consecutive_errors, 2);
  for (const event of events.filter(item => item.event_type === 'RPC_READ_ERROR')) {
    assert.equal(event.chain_state_observed, false);
    assert.equal(Object.hasOwn(event, 'allow'), false);
    assert.equal(Object.hasOwn(event, 'status'), false);
  }
  assert.equal(events[3].chain_state_observed, false);
  assert.equal(events[4].status, 'FROZEN');
  assert.equal(events[4].chain_state_observed, true);
  const baseInterval = createPollingConfig(1).intervalMs;
  assert.deepEqual(waits, [baseInterval, baseInterval, baseInterval * 2]);
});

test('rate limit classification and exponential backoff respect retry-after and jitter', () => {
  assert.deepEqual(classifyRpcError(Object.assign(Error('slow down'), { status: 429, retryAfter: '5' })),
    { kind: 'RATE_LIMIT', message: 'slow down', retryAfterMs: 5000 });
  assert.equal(classifyRpcError(Error('socket closed')).kind, 'RPC_READ_FAILURE');
  assert.equal(calculateBackoffMs({ baseIntervalMs: 15_000, failureCount: 3, random: () => 0.5 }), 60_000);
  assert.equal(calculateBackoffMs({ baseIntervalMs: 15_000, failureCount: 1, retryAfterMs: 40_000, random: () => 0.5 }), 40_000);
  assert.ok(calculateBackoffMs({ baseIntervalMs: 15_000, failureCount: 2, random: () => 0 }) >= 24_000);
});

test('multiple targets are budgeted as separate RPC requests', async () => {
  const targets = ['a', 'b', 'c'].map((id, i) => ({ ...target, agentId: id, releaseId: `release-${i}` }));
  const config = createPollingConfig(targets.length, { rpcLimitPerHour: 10, otherProcessReservePerHour: 0 });
  const controller = new AbortController();
  let calls = 0;
  let reservations = 0;
  const events = [];
  await watch({ targets, pollingConfig: config, signal: controller.signal, emit: event => events.push(event), wait: async () => {},
    requestBudget: { waitForSlot: async () => { reservations += 1; return true; } },
    client: { readContract: async request => {
      calls += 1;
      if (calls === targets.length) controller.abort();
      const targetRecord = targets.find(item => item.agentId === request.args[1]);
      return { ...result, allow: true, status: 'ALLOW', agent_id: targetRecord.agentId, release_id: targetRecord.releaseId };
    } } });
  assert.equal(calls, 3);
  assert.equal(reservations, 3);
  assert.equal(events.filter(event => event.event_type === 'AUTHORIZATION_STATE').length, 3);
  assert.equal(config.intervalMs, 1_080_000);
});

test('watchtower refuses intervals below the safe polling floor', async () => {
  assert.throws(() => createPollingConfig(1, { requestedIntervalMs: 1 }), /at least/);
});

