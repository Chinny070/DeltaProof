import test from 'node:test';
import assert from 'node:assert/strict';
import { gateResultMatchesQuery } from '../src/v2-gate-state.mjs';

const result = {
  agent_id: 'analytics-live-20261020',
  release_id: 'v2api-20261020',
  agentId: 'analytics-live-20261020',
  releaseId: 'v2api-20261020',
  allow: true,
  status: 'ALLOW',
};

test('a finalized gate result is displayed only for its exact query pair', () => {
  assert.equal(gateResultMatchesQuery(result, {
    agentId: 'analytics-live-20261020', releaseId: 'v2api-20261020',
  }), true);
  assert.equal(gateResultMatchesQuery(result, {
    agentId: 'checkout-live-20261020', releaseId: 'v2api-20261020',
  }), false);
  assert.equal(gateResultMatchesQuery(result, {
    agentId: 'analytics-live-20261020', releaseId: 'payments-2.0.0',
  }), false);
  assert.equal(gateResultMatchesQuery(result, null), false);
});

test('gate results missing their pair identity fail closed in the UI', () => {
  assert.equal(gateResultMatchesQuery({ allow: true }, {
    agentId: 'analytics-live-20261020', releaseId: 'v2api-20261020',
  }), false);
});
