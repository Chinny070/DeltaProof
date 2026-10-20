import test from 'node:test';
import assert from 'node:assert/strict';
import { requireSuccessfulFinality } from '../src/genlayer.js';

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
