import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_WATCH_TARGETS, MIN_POLL_INTERVAL_MS, parseTargets, pollAuthorization, watch } from './watchtower.mjs';

const address = '0x' + '1'.repeat(40);
const target = { address, agentId: 'checkout', releaseId: 'payments-2' };
const result = { allow: false, status: 'SAFETY_CHALLENGE_PENDING', revision: 2,
  agent_id: 'checkout', release_id: 'payments-2', reason: 'pending challenge' };

test('watch target parsing is bounded, validated and duplicate-safe', () => {
  assert.deepEqual(parseTargets(JSON.stringify([target])), [target]);
  assert.throws(() => parseTargets('[]'), /1 to/);
  assert.throws(() => parseTargets(JSON.stringify([target, target])), /unique/);
  assert.throws(() => parseTargets(JSON.stringify(Array(MAX_WATCH_TARGETS + 1).fill(target))), /1 to/);
  assert.throws(() => parseTargets('{'), /must be JSON/);
});

test('watchtower reads latest-final structured authorization and rejects malformed records', async () => {
  let request;
  const record = await pollAuthorization({ readContract: async input => { request = input; return result; } }, target);
  assert.equal(request.functionName, 'get_authorization');
  assert.deepEqual(request.args, ['payments-2', 'checkout']);
  assert.equal(request.transactionHashVariant, 'latest-final');
  assert.equal(record.status, 'SAFETY_CHALLENGE_PENDING');
  await assert.rejects(pollAuthorization({ readContract: async () => ({...result, agent_id:'other'}) }, target), /malformed/);
});

test('watchtower emits initial and changed hold state but does not submit writes', async () => {
  const controller = new AbortController();
  let count = 0;
  const events = [];
  const client = { readContract: async () => {
    count += 1;
    if (count === 1) return {...result, status:'ALLOW', allow:true};
    if (count === 2) { controller.abort(); return result; }
    throw Error('no more polls expected');
  } };
  await watch({ client, targets:[target], intervalMs:MIN_POLL_INTERVAL_MS, signal:controller.signal,
    emit:event=>events.push(event), wait:async()=>{} });
  assert.equal(events.length, 2);
  assert.equal(events[0].allow, true);
  assert.equal(events[1].status, 'SAFETY_CHALLENGE_PENDING');
  assert.equal(typeof client.writeContract, 'undefined');
});

test('watchtower refuses excessive polling intervals', async () => {
  await assert.rejects(watch({client:{},targets:[target],intervalMs:1,emit:()=>{}}), /at least/);
});
