import test from 'node:test';
import assert from 'node:assert/strict';
import { studionet } from 'genlayer-js/chains';
import { checkAuthorization, CHAIN_ID } from './ci-gate.mjs';

const address = '0x' + '1'.repeat(40);

test('installed GenLayerJS StudioNet config matches the fixed target network', () => {
  assert.equal(studionet.id, 61999);
  assert.deepEqual(studionet.rpcUrls.default.http, ['https://studio.genlayer.com/api']);
  assert.equal(studionet.nativeCurrency.symbol, 'GEN');
});

test('queries exact agent and release at latest finalized state and permits only true', async () => {
  let request;
  const result = await checkAuthorization({
    client: { readContract: async value => { request = value; return true; } },
    address, agentId: 'checkout', releaseId: 'payment-2',
  });
  assert.deepEqual(request.args, ['payment-2', 'checkout']);
  assert.equal(request.functionName, 'is_authorized');
  assert.equal(request.transactionHashVariant, 'latest-final');
  assert.deepEqual(result, { allow: true, agentId: 'checkout', releaseId: 'payment-2', chainId: CHAIN_ID, state: 'LATEST_FINAL' });
});

test('rejects blocked and unavailable authorization reads', async () => {
  const result = await checkAuthorization({ client: { readContract: async () => false }, address, agentId: 'checkout', releaseId: 'payment-2' });
  assert.equal(result.allow, false);
  await assert.rejects(checkAuthorization({ client: { readContract: async () => null }, address, agentId: 'checkout', releaseId: 'payment-2' }), /invalid value/);
  await assert.rejects(checkAuthorization({ client: { readContract: async () => { throw Error('RPC offline'); } }, address, agentId: 'checkout', releaseId: 'payment-2' }), /RPC offline/);
});

test('rejects incomplete or invalid deployment configuration before an RPC call', async () => {
  const client = { readContract: async () => { throw Error('must not query'); } };
  await assert.rejects(checkAuthorization({ client, address: 'bad', agentId: 'checkout', releaseId: 'payment-2' }), /address/);
  await assert.rejects(checkAuthorization({ client, address, agentId: '', releaseId: 'payment-2' }), /identity/);
});
