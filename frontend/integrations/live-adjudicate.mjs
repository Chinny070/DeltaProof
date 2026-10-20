import { createRequire } from 'node:module';
import { join } from 'node:path';
import { createAccount, createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant, TransactionStatus } from 'genlayer-js/types';

const address = '0x367C2B9f8B52EEd57977B84c458eaD4c3105E718';
const signerAddress = '0xaffe15eec45b68835cc9e5b4ab85dd5deae8e70b';
const accountName = 'my-studionet-wallet';
const releaseId = 'v2api-20261020';
const permittedAgents = new Set(['checkout-live-20261020', 'analytics-live-20261020', 'refund-live-20261020']);

function keytar() {
  if (!process.env.APPDATA) throw new Error('APPDATA is unavailable; run in the Windows terminal where the wallet was unlocked.');
  return createRequire(import.meta.url)(join(process.env.APPDATA, 'npm', 'node_modules', 'genlayer', 'node_modules', 'keytar'));
}

function agentArgument() {
  const index = process.argv.indexOf('--agent');
  return index >= 0 ? process.argv[index + 1] : '';
}

async function main() {
  const agentId = agentArgument();
  if (!permittedAgents.has(agentId)) throw new Error('Provide --agent checkout-live-20261020, analytics-live-20261020, or refund-live-20261020.');
  if (process.argv.includes('--preflight')) {
    console.log(JSON.stringify({ network: 'studionet', chainId: 61999, address, releaseId, agentId, method: 'adjudicate', args: [releaseId, agentId], argumentTypes: ['string', 'string'], transactionSent: false }));
    return;
  }
  if (!process.argv.includes('--submit')) throw new Error('No transaction was sent. Use --preflight for an offline check or add --submit to authorize one adjudication.');

  const privateKey = await keytar().getPassword('genlayer-cli', `account:${accountName}`);
  if (!privateKey) throw new Error('Signer is not unlocked in this terminal. Unlock it here with genlayer account unlock --account my-studionet-wallet.');
  const account = createAccount(privateKey);
  if (account.address.toLowerCase() !== signerAddress) throw new Error('Unlocked account does not match the authorized public signer.');
  const client = createClient({ chain: studionet, account });

  const release = await client.readContract({ address, functionName: 'get_release', args: [releaseId], transactionHashVariant: TransactionHashVariant.LATEST_FINAL });
  const agent = await client.readContract({ address, functionName: 'get_agent', args: [agentId], transactionHashVariant: TransactionHashVariant.LATEST_FINAL });
  const before = await client.readContract({ address, functionName: 'get_authorization', args: [releaseId, agentId], transactionHashVariant: TransactionHashVariant.LATEST_FINAL });
  if (release?.status !== 'ACTIVE' || agent?.id !== agentId || agent?.status !== 'ACTIVE') throw new Error('Latest-final release or agent is inactive/mismatched; no transaction sent.');
  if (before?.status !== 'NO_DECISION' || before?.release_id !== releaseId || before?.agent_id !== agentId) throw new Error(`A decision already exists or the gate response is malformed; no duplicate submitted (${JSON.stringify(before)}).`);
  if (agentId === 'refund-live-20261020' && !(release?.evidence ?? []).some((item) => item?.sha256 === '17014b71c97c5b08cda20058e7b68747a2c17930c9e9a1f37e30b02e0cefd6a9')) throw new Error('Release does not include the pinned Refund evidence commitment; no transaction sent.');

  console.log(`SUBMITTING_ADJUDICATION=${JSON.stringify({ releaseId, agentId, method: 'adjudicate', args: [releaseId, agentId] })}`);
  const hash = await client.writeContract({ address, functionName: 'adjudicate', args: [releaseId, agentId], value: 0n });
  console.log(`TRANSACTION_HASH=${hash}`);
  const receipt = await client.waitForTransactionReceipt({ hash, status: TransactionStatus.FINALIZED, interval: 3000, retries: 200, fullTransaction: true });
  const agreeVotes = (receipt?.last_round?.validator_votes_name ?? []).filter((vote) => vote === 'AGREE').length;
  const successfulAgreeExecutions = (receipt?.consensus_data?.validators ?? []).filter((v) => v?.vote === 'agree' && v?.execution_result === 'SUCCESS').length;
  console.log(`RECEIPT=${JSON.stringify({ hash: receipt?.hash, status: receipt?.statusName, consensus: receipt?.result_name, rounds: receipt?.num_of_rounds, agreeVotes, successfulAgreeExecutions, executionHash: receipt?.tx_execution_hash, gasLimit: receipt?.gaslimit, nonce: receipt?.nonce })}`);
  if (receipt?.statusName !== 'FINALIZED') throw new Error(`Transaction did not finalize; reconcile ${hash} before retrying.`);
  if (receipt?.result_name !== 'MAJORITY_AGREE' || agreeVotes < 3 || successfulAgreeExecutions < 2) throw new Error(`Finalized transaction lacks successful majority execution; stop and inspect ${hash}.`);

  const [decision, authorization, passport] = await Promise.all([
    client.readContract({ address, functionName: 'get_decision', args: [releaseId, agentId], transactionHashVariant: TransactionHashVariant.LATEST_FINAL }),
    client.readContract({ address, functionName: 'get_authorization', args: [releaseId, agentId], transactionHashVariant: TransactionHashVariant.LATEST_FINAL }),
    client.readContract({ address, functionName: 'get_passport', args: [releaseId, agentId], transactionHashVariant: TransactionHashVariant.LATEST_FINAL }),
  ]);
  if (decision?.release_id !== releaseId || decision?.agent_id !== agentId || decision?.revision !== 1 || typeof decision?.passport_hash !== 'string') throw new Error(`Latest-final decision did not match the submitted pair; reconcile ${hash}.`);
  if (authorization?.release_id !== releaseId || authorization?.agent_id !== agentId || typeof authorization?.allow !== 'boolean') throw new Error(`Latest-final authorization was malformed; reconcile ${hash}.`);
  if (authorization.allow !== (decision.decision === 'APPROVED')) throw new Error(`Gate and decision disagree for ${agentId}; halt the workflow.`);
  if (agentId === 'checkout-live-20261020' && (decision.decision !== 'BLOCKED' || decision.mode !== 'DETERMINISTIC_DEPENDENCY_CHECK')) throw new Error(`Checkout expected the deterministic structural block but got ${decision.decision}/${decision.mode}; halt and investigate.`);
  if (agentId === 'analytics-live-20261020' && (decision.decision !== 'APPROVED' || decision.mode !== 'DETERMINISTIC_UNAFFECTED')) throw new Error(`Analytics expected deterministic unaffected approval but got ${decision.decision}/${decision.mode}; halt and investigate.`);
  if (agentId === 'refund-live-20261020' && decision.mode !== 'GENLAYER_INDEPENDENT_CONSENSUS') throw new Error(`Refund did not use independent GenLayer consensus (${decision.mode}); halt and investigate.`);
  console.log(`VERIFIED_FINAL_DECISION=${JSON.stringify({ decision, authorization, passport })}`);
}

main().catch((error) => {
  console.error(`LIVE_ADJUDICATION_FAILED=${error?.message ?? String(error)}`);
  process.exitCode = 1;
});

