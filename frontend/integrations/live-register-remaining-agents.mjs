import { createRequire } from 'node:module';
import { join } from 'node:path';
import { createAccount, createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant, TransactionStatus } from 'genlayer-js/types';

const address = '0x367C2B9f8B52EEd57977B84c458eaD4c3105E718';
const signerAddress = '0xaffe15eec45b68835cc9e5b4ab85dd5deae8e70b';
const accountName = 'my-studionet-wallet';
const fixtures = [
  {
    id: 'analytics-live-20261020',
    name: 'DeltaProof Analytics consumer fixture',
    dependencies: [{ method: 'GET', path: '/events/{event_id}', critical: true, guarantees: ['stable event schema'] }],
    charter: {
      guarantees: ['stable event schema'],
      unacceptable_changes: ['event identifiers are removed', 'event payload fields are silently renamed'],
      required_evidence_kinds: [],
      risk_tolerance: 'MEDIUM',
    },
  },
  {
    id: 'refund-live-20261020',
    name: 'DeltaProof Refund consumer fixture',
    dependencies: [{ method: 'POST', path: '/refunds', critical: true, guarantees: ['idempotent refund requests'] }],
    charter: {
      guarantees: ['idempotent refund requests'],
      unacceptable_changes: ['retries may issue duplicate refunds', 'refund status is no longer returned'],
      required_evidence_kinds: [],
      risk_tolerance: 'LOW',
    },
  },
];

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function loadKeytar() {
  if (!process.env.APPDATA) throw new Error('APPDATA is unavailable; run this from the Windows terminal where the wallet was unlocked.');
  return createRequire(import.meta.url)(join(process.env.APPDATA, 'npm', 'node_modules', 'genlayer', 'node_modules', 'keytar'));
}

async function main() {
  if (!process.argv.includes('--submit')) throw new Error('No transaction was sent. Add --submit to authorize these two controlled fixture registrations.');
  const privateKey = await loadKeytar().getPassword('genlayer-cli', `account:${accountName}`);
  if (!privateKey) throw new Error('Signer is not unlocked in this terminal. Unlock it here with genlayer account unlock --account my-studionet-wallet.');
  const account = createAccount(privateKey);
  if (account.address.toLowerCase() !== signerAddress) throw new Error('Unlocked account does not match the authorized public signer.');
  const client = createClient({ chain: studionet, account });

  for (const fixture of fixtures) {
    const currentAgents = await client.readContract({
      address,
      functionName: 'list_agents',
      args: [0, 20],
      transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
    });
    if (!Array.isArray(currentAgents)) throw new Error('Latest-final agent registry was malformed; no transaction sent.');
    if (currentAgents.some((agent) => agent?.id === fixture.id)) throw new Error(`${fixture.id} already exists; stopping without a duplicate transaction.`);

    const args = [fixture.id, fixture.name, JSON.stringify(fixture.dependencies), JSON.stringify(fixture.charter)];
    if (args.length !== 4 || args.some((value) => typeof value !== 'string')) throw new Error(`Typed ABI preflight failed for ${fixture.id}.`);
    console.log(`SUBMITTING=${fixture.id}`);
    const hash = await client.writeContract({ address, functionName: 'register_agent', args, value: 0n });
    console.log(`TRANSACTION_HASH=${hash}`);

    const receipt = await client.waitForTransactionReceipt({
      hash,
      status: TransactionStatus.FINALIZED,
      interval: 3000,
      retries: 100,
      fullTransaction: true,
    });
    const agrees = (receipt?.last_round?.validator_votes_name ?? []).filter((vote) => vote === 'AGREE').length;
    const successfulAgreeExecutions = (receipt?.consensus_data?.validators ?? [])
      .filter((validator) => validator?.vote === 'agree' && validator?.execution_result === 'SUCCESS').length;
    console.log(`RECEIPT=${JSON.stringify({
      hash: receipt?.hash,
      status: receipt?.statusName,
      consensus: receipt?.result_name,
      agreeVotes: agrees,
      successfulAgreeExecutions,
      executionHash: receipt?.tx_execution_hash,
      gasLimit: receipt?.gaslimit,
      nonce: receipt?.nonce,
    })}`);
    if (receipt?.statusName !== 'FINALIZED') throw new Error(`Unresolved or nonfinal transaction ${hash}; stop and reconcile it before proceeding.`);
    if (receipt?.result_name !== 'MAJORITY_AGREE' || agrees < 3 || successfulAgreeExecutions < 2) {
      throw new Error(`Finalized transaction lacks a successful majority for ${fixture.id}; stop and inspect ${hash}.`);
    }

    const registered = await client.readContract({
      address,
      functionName: 'get_agent',
      args: [fixture.id],
      transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
    });
    const charter = await client.readContract({
      address,
      functionName: 'get_charter',
      args: [fixture.id, 1],
      transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
    });
    if (registered?.id !== fixture.id || registered?.controller?.toLowerCase() !== signerAddress || registered?.config_version !== 1 || registered?.charter_version !== 1) {
      throw new Error(`Latest-final agent state mismatch for ${fixture.id}; stop and reconcile ${hash}.`);
    }
    const charterMatches = charter?.risk_tolerance === fixture.charter.risk_tolerance
      && ['guarantees', 'unacceptable_changes', 'required_evidence_kinds'].every((field) =>
        stableJson(charter?.[field]) === stableJson(fixture.charter[field]));
    const dependenciesMatch = stableJson(registered?.dependencies) === stableJson(fixture.dependencies);
    if (!dependenciesMatch) throw new Error(`Latest-final dependency mismatch for ${fixture.id}; stop and reconcile ${hash}.`);
    if (!charterMatches) throw new Error(`Latest-final charter mismatch for ${fixture.id}; stop and reconcile ${hash}.`);
    console.log(`VERIFIED_LATEST_FINAL=${JSON.stringify({ agent: registered, charter })}`);
  }
}

main().catch((error) => {
  console.error(`LIVE_AGENT_REGISTRATION_FAILED=${error?.message ?? String(error)}`);
  process.exitCode = 1;
});

