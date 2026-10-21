import test from 'node:test';
import assert from 'node:assert/strict';
import { TransactionHashVariant } from 'genlayer-js/types';
import { auditV2Deployment, PAIRS, REPRESENTATIVE_TRANSACTIONS } from './v2-deployment-audit.mjs';
import { V2_DEPLOYMENT } from './v2-runtime-smoke.mjs';

test('deployment audit checks deployed source, representative receipts, and exact latest-final pairs read-only', async () => {
  const receiptRequests = [];
  const readRequests = [];
  const client = {
    getContractCode: async address => {
      assert.equal(address, V2_DEPLOYMENT.address);
      return 'historical deployed source bytes';
    },
    waitForTransactionReceipt: async request => {
      receiptRequests.push(request);
      return { statusName: 'FINALIZED', result_name: 'MAJORITY_AGREE', tx_execution_hash: `exec-${receiptRequests.length}`,
        consensus_data: { leader_receipt: [{ execution_result: 'SUCCESS', genvm_result: { error_description: null, raw_error: null } }] } };
    },
    readContract: async request => {
      readRequests.push(request);
      if (request.functionName === 'get_overview') return { agents: 0, releases: 0, decisions: 0, protocol: 'deltaproof/2.0' };
      const [release_id, agent_id] = request.args;
      return { release_id, agent_id, allow: false, status: 'NO_DECISION', revision: 0 };
    },
  };
  const result = await auditV2Deployment({ client, localSourceBytes: Buffer.from('current branch source') });
  assert.equal(receiptRequests.length, REPRESENTATIVE_TRANSACTIONS.length);
  assert.ok(receiptRequests.every(request => request.status === 'FINALIZED' && request.fullTransaction === true));
  assert.equal(readRequests.length, PAIRS.length + 1);
  assert.ok(readRequests.every(request => request.address === V2_DEPLOYMENT.address
    && request.transactionHashVariant === TransactionHashVariant.LATEST_FINAL));
  assert.equal(result.source.local_matches_deployed, false);
  assert.equal(result.representative_transactions.length, 4);
  assert.equal(result.latest_final.authorizations.length, 4);
  assert.ok(!Object.hasOwn(client, 'writeContract'));
});
