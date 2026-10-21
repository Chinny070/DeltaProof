import test from 'node:test';
import assert from 'node:assert/strict';
import { TransactionHashVariant } from 'genlayer-js/types';
import { runV2RuntimeSmoke, validateV2RuntimeReads, V2_DEPLOYMENT } from './v2-runtime-smoke.mjs';

const pair = { agentId: 'eventtrace-live-20261021', releaseId: 'eventtrace-v2-20261021' };
const reads = {
  protocol: 'deltaproof/2.0',
  overview: { protocol: 'deltaproof/2.0', agents: 0, releases: 0, decisions: 0 },
  authorization: { agent_id: pair.agentId, release_id: pair.releaseId, status: 'NO_DECISION', revision: 0, allow: false },
};

test('runtime smoke pins StudioNet 61999, the verified V2 address and protocol', () => {
  assert.deepEqual(V2_DEPLOYMENT, {
    chainId: 61999, rpcUrl: 'https://studio.genlayer.com/api',
    address: '0xEf72A2db4EbeD151273B137D8a741e4C537415f9', protocol: 'deltaproof/2.0',
  });
});

test('runtime smoke reads protocol, overview and exact pair at latest-final only', async () => {
  const requests = [];
  const client = { readContract: async request => {
    requests.push(request);
    if (request.functionName === 'get_protocol') return reads.protocol;
    if (request.functionName === 'get_overview') return reads.overview;
    return reads.authorization;
  } };
  const result = await runV2RuntimeSmoke({ client, ...pair });
  assert.equal(result.state, 'LATEST_FINAL');
  assert.equal(result.authorization.status, 'NO_DECISION');
  assert.equal(result.authorization.allow, false);
  assert.equal(requests.length, 3);
  assert.ok(requests.every(request => request.address === V2_DEPLOYMENT.address));
  assert.ok(requests.every(request => request.transactionHashVariant === TransactionHashVariant.LATEST_FINAL));
  assert.deepEqual(requests.find(request => request.functionName === 'get_authorization').args,
    [pair.releaseId, pair.agentId]);
});

test('runtime smoke rejects mismatched pair identity, malformed counts and contradictory allow', () => {
  assert.throws(() => validateV2RuntimeReads(reads, { ...pair, agentId: 'other-agent' }), /pair-bound/);
  assert.throws(() => validateV2RuntimeReads({ ...reads, overview: { ...reads.overview, agents: '4' } }, pair), /overview/);
  assert.throws(() => validateV2RuntimeReads({ ...reads, authorization: { ...reads.authorization, status: 'ALLOW' } }, pair), /pair-bound/);
  assert.throws(() => validateV2RuntimeReads({ ...reads, protocol: 'deltaproof/1.0' }, pair), /Unexpected V2 protocol/);
});
