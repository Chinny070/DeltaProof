import test from 'node:test';
import assert from 'node:assert/strict';
import { abi } from 'genlayer-js';
import { requireSuccessfulFinality, buildRegisterReleaseArgs } from '../src/genlayer.js';

test('register calldata preserves both JSON snapshots as strings in contract argument order', () => {
  const baseline = '{"endpoints":[{"method":"GET","path":"/v1/quote","request_required":["symbol"],"response_required":["price"],"behavior":"Returns the current quote for a symbol."}]}';
  const candidate = '{"endpoints":[{"method":"GET","path":"/v1/quote","request_required":["symbol"],"response_required":["price"],"behavior":"Returns the current quote for a symbol."},{"method":"GET","path":"/v1/status","request_required":[],"response_required":["status"],"behavior":"Returns service availability."}]}';
  const args = buildRegisterReleaseArgs({
    project: 'DeltaProof-test-20261020', from: '1.0.0', to: '1.1.0',
    baseline_json: baseline, candidate_json: candidate,
    baseline_url: 'https://example.com/baseline.json', candidate_url: 'https://example.com/candidate.json',
  });
  assert.deepEqual(args.slice(0, 3), ['DeltaProof-test-20261020', '1.0.0', '1.1.0']);
  assert.equal(typeof args[3], 'string');
  assert.equal(typeof args[4], 'string');
  assert.equal(args[3].length, 164);
  assert.equal(args[4].length, 297);
  assert.equal(JSON.parse(args[3]).endpoints.length, 1);
  assert.equal(JSON.parse(args[4]).endpoints.length, 2);
  assert.deepEqual(args.slice(5), ['https://example.com/baseline.json', 'https://example.com/candidate.json']);
  const sdkCalldata = abi.calldata.toString(abi.calldata.makeCalldataObject('register_release', args));
  assert.ok(sdkCalldata.includes('\\"endpoints\\"'), 'SDK encodes the JSON text inside a string argument');
});

test('register calldata rejects decoded specification objects', () => {
  assert.throws(() => buildRegisterReleaseArgs({
    project: 'DeltaProof-test', from: '1.0.0', to: '1.1.0',
    baseline_json: { endpoints: [] }, candidate_json: '{"endpoints":[]}',
    baseline_url: 'https://example.com/baseline.json', candidate_url: 'https://example.com/candidate.json',
  }), /must be JSON strings/);
});

test('successful finality returns the finalized SDK transaction', () => {
  const receipt = { statusName: 'FINALIZED', txExecutionResultName: 'FINISHED_WITH_RETURN' };
  assert.equal(requireSuccessfulFinality('0xabc', receipt), receipt);
});

test('unsuccessful finalized transaction is not reported as success', () => {
  const receipt = { statusName: 'FINALIZED', txExecutionResultName: 'FINISHED_WITH_ERROR' };
  assert.throws(
    () => requireSuccessfulFinality('0xabc', receipt),
    /did not successfully finalize: FINALIZED \/ FINISHED_WITH_ERROR/,
  );
});

test('missing finality result is not reported as success', () => {
  assert.throws(() => requireSuccessfulFinality('0xabc', null), /did not successfully finalize/);
});

test('accepted transactions are not reported as finalized success', () => {
  const receipt = { statusName: 'ACCEPTED', txExecutionResultName: 'FINISHED_WITH_RETURN' };
  assert.throws(() => requireSuccessfulFinality('0xabc', receipt), /ACCEPTED \/ FINISHED_WITH_RETURN/);
});
