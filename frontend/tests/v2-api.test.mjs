import test from 'node:test';
import assert from 'node:assert/strict';
import { requireSuccessfulV2Finality } from '../src/v2-api.js';

const successfulStudioNetReceipt = {
  statusName: 'FINALIZED',
  result_name: 'MAJORITY_AGREE',
  consensus_data: {
    leader_receipt: [
      { execution_result: 'SUCCESS', genvm_result: { error_description: null, raw_error: null } },
      { execution_result: 'SUCCESS', genvm_result: { error_description: null, raw_error: null } },
    ],
  },
};

test('V2 tracker accepts finalized raw StudioNet receipt with successful leader execution', () => {
  assert.equal(requireSuccessfulV2Finality('0xabc', successfulStudioNetReceipt), successfulStudioNetReceipt);
});

test('V2 tracker accepts SDK simplified execution result when present', () => {
  const receipt = { status_name: 'FINALIZED', result_name: 'MAJORITY_AGREE', tx_execution_result_name: 'FINISHED_WITH_RETURN' };
  assert.equal(requireSuccessfulV2Finality('0xabc', receipt), receipt);
});

test('V2 tracker rejects a finalized rollback even when consensus agreed', () => {
  const receipt = {
    statusName: 'FINALIZED', result_name: 'MAJORITY_AGREE',
    consensus_data: { leader_receipt: [{ execution_result: 'ERROR', genvm_result: { error_description: 'contract reverted', raw_error: null } }] },
  };
  assert.throws(() => requireSuccessfulV2Finality('0xabc', receipt), /did not successfully finalize: FINALIZED \/ unknown/);
});

test('V2 tracker fails closed when raw finalized receipt has no leader execution evidence', () => {
  const receipt = { statusName: 'FINALIZED', result_name: 'MAJORITY_AGREE', consensus_data: { validators: [{ execution_result: 'SUCCESS' }] } };
  assert.throws(() => requireSuccessfulV2Finality('0xabc', receipt), /did not successfully finalize/);
});

test('V2 tracker rejects non-final and non-agreed receipts', () => {
  assert.throws(() => requireSuccessfulV2Finality('0xabc', { ...successfulStudioNetReceipt, statusName: 'ACCEPTED' }), /ACCEPTED/);
  assert.throws(() => requireSuccessfulV2Finality('0xabc', { ...successfulStudioNetReceipt, result_name: 'MAJORITY_DISAGREE' }), /MAJORITY_DISAGREE/);
});
