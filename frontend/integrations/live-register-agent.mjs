import { createRequire } from 'node:module';
import { join } from 'node:path';
import { createAccount, createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant, TransactionStatus } from 'genlayer-js/types';

const contractAddress = '0x367C2B9f8B52EEd57977B84c458eaD4c3105E718';
const expectedSigner = '0xaffe15eec45b68835cc9e5b4ab85dd5deae8e70b';
const accountName = 'my-studionet-wallet';
const agentId = 'checkout-live-20261020';
const agentName = 'DeltaProof Checkout consumer fixture';
const dependenciesJson = JSON.stringify([
  { method: 'POST', path: '/payment', critical: true, guarantees: ['idempotent retries'] },
]);
const charterJson = JSON.stringify({
  guarantees: ['idempotent retries'],
  unacceptable_changes: ['retries may create duplicate charges'],
  required_evidence_kinds: [],
  risk_tolerance: 'LOW',
});

function keytarFromGenLayerCli() {
  if (!process.env.APPDATA) throw new Error('APPDATA is unavailable; use the Windows Codex terminal that unlocked the wallet.');
  const require = createRequire(import.meta.url);
  const keytarPath = join(process.env.APPDATA, 'npm', 'node_modules', 'genlayer', 'node_modules', 'keytar');
  return require(keytarPath);
}

async function main() {
  if (!process.argv.includes('--submit')) {
    throw new Error('No transaction was sent. Re-run with --submit to authorize this one agent registration.');
  }
  const keytar = keytarFromGenLayerCli();
  const privateKey = await keytar.getPassword('genlayer-cli', `account:${accountName}`);
  if (!privateKey) throw new Error('Signer is not unlocked in this terminal. Run genlayer account unlock --account my-studionet-wallet here first.');

  const account = createAccount(privateKey);
  if (account.address.toLowerCase() !== expectedSigner) throw new Error('The unlocked account does not match the authorized public signer.');
  const client = createClient({ chain: studionet, account });

  const existing = await client.readContract({
    address: contractAddress,
    functionName: 'list_agents',
    args: [0, 20],
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  });
  if (!Array.isArray(existing)) throw new Error('Latest-final agent registry returned an unexpected value; no transaction sent.');
  if (existing.some((entry) => entry?.id === agentId)) throw new Error(`Agent ${agentId} already exists; refusing to submit a duplicate.`);

  const args = [agentId, agentName, dependenciesJson, charterJson];
  if (args.length !== 4 || args.some((value) => typeof value !== 'string')) throw new Error('Registration arguments failed the typed ABI preflight.');
  console.log(JSON.stringify({
    network: 'studionet', chainId: 61999, contractAddress,
    signer: account.address, method: 'register_agent', agentId,
    dependenciesJson, charterJson,
  }));

  const hash = await client.writeContract({ address: contractAddress, functionName: 'register_agent', args, value: 0n });
  console.log(`TRANSACTION_HASH=${hash}`);
  const receipt = await client.waitForTransactionReceipt({
    hash,
    status: TransactionStatus.FINALIZED,
    interval: 3000,
    retries: 100,
    fullTransaction: true,
  });
  const successfulAgreeExecutions = (receipt?.consensus_data?.validators ?? [])
    .filter((validator) => validator?.vote === 'agree' && validator?.execution_result === 'SUCCESS').length;
  const agreeVotes = (receipt?.last_round?.validator_votes_name ?? []).filter((vote) => vote === 'AGREE').length;
  console.log(`RECEIPT=${JSON.stringify({
    hash: receipt?.hash,
    status: receipt?.statusName,
    consensus: receipt?.result_name,
    agreeVotes,
    successfulAgreeExecutions,
    executionHash: receipt?.tx_execution_hash,
    gasLimit: receipt?.gaslimit,
    nonce: receipt?.nonce,
  })}`);
  if (receipt?.statusName !== 'FINALIZED') throw new Error(`Transaction did not reach FINALIZED (${receipt?.statusName ?? 'unknown'}); do not retry before reconciling ${hash}.`);
  if (receipt?.result_name !== 'MAJORITY_AGREE' || agreeVotes < 3 || successfulAgreeExecutions < 2) {
    throw new Error(`Finalized transaction lacks verified successful majority execution (consensus=${receipt?.result_name ?? 'unknown'}, agrees=${agreeVotes}, successful_agree_executions=${successfulAgreeExecutions}); reconcile ${hash} before any retry.`);
  }

  const registered = await client.readContract({
    address: contractAddress,
    functionName: 'get_agent',
    args: [agentId],
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  });
  if (registered?.id !== agentId || registered?.controller?.toLowerCase() !== expectedSigner || registered?.config_version !== 1 || registered?.charter_version !== 1) {
    throw new Error(`Finalized state does not match the submitted agent fixture. Inspect latest-final state for ${agentId}; do not retry.`);
  }
  console.log(`VERIFIED_LATEST_FINAL_AGENT=${JSON.stringify(registered)}`);
}

main().catch((error) => {
  console.error(`LIVE_REGISTRATION_FAILED=${error?.message ?? String(error)}`);
  process.exitCode = 1;
});

