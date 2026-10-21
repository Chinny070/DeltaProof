import { createRequire } from 'node:module';
import { join } from 'node:path';
import { createAccount, createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant, TransactionStatus } from 'genlayer-js/types';

const address = process.env.DELTAPROOF_V2_ADDRESS || '0xEf72A2db4EbeD151273B137D8a741e4C537415f9';
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
  {
    id: 'eventtrace-live-20261021',
    name: 'DeltaProof synthetic event tracing consumer',
    dependencies: [{ method: 'GET', path: '/events/{event_id}', critical: true, guarantees: ['event payload preserved', 'stable event identifier'] }],
    charter: {
      guarantees: ['event payload preserved', 'stable event identifier'],
      unacceptable_changes: ['event_id omitted for any event type', 'existing payload fields removed or renamed'],
      required_evidence_kinds: ['synthetic-api-compatibility-test'],
      risk_tolerance: 'MEDIUM',
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

function sameStringSet(actual, expected) {
  return Array.isArray(actual) && Array.isArray(expected)
    && stableJson([...actual].sort()) === stableJson([...expected].sort());
}

function dependenciesMatch(actual, expected) {
  return Array.isArray(actual) && Array.isArray(expected) && actual.length === expected.length
    && actual.every((item, index) => item.method === expected[index].method
      && item.path === expected[index].path
      && item.critical === expected[index].critical
      && sameStringSet(item.guarantees, expected[index].guarantees));
}

function charterMatches(actual, expected) {
  return actual?.risk_tolerance === expected.risk_tolerance
    && ['guarantees', 'unacceptable_changes', 'required_evidence_kinds']
      .every((field) => sameStringSet(actual?.[field], expected[field]));
}

function loadKeytar() {
  if (!process.env.APPDATA) throw new Error('APPDATA is unavailable; run this from the Windows terminal where the wallet was unlocked.');
  return createRequire(import.meta.url)(join(process.env.APPDATA, 'npm', 'node_modules', 'genlayer', 'node_modules', 'keytar'));
}

async function main() {
  if (!process.argv.includes('--submit')) throw new Error('No transaction was sent. Add --submit to authorize these three controlled fixture registrations.');
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
    if (currentAgents.some((agent) => agent?.id === fixture.id)) {
      const [registered, charter] = await Promise.all([
        client.readContract({ address, functionName: 'get_agent', args: [fixture.id], transactionHashVariant: TransactionHashVariant.LATEST_FINAL }),
        client.readContract({ address, functionName: 'get_charter', args: [fixture.id, 1], transactionHashVariant: TransactionHashVariant.LATEST_FINAL }),
      ]);
      if (registered?.controller?.toLowerCase() !== signerAddress || registered?.status !== 'ACTIVE'
          || registered?.config_version !== 1 || registered?.charter_version !== 1
          || !dependenciesMatch(registered.dependencies, fixture.dependencies) || !charterMatches(charter, fixture.charter)) {
        throw new Error(`Existing ${fixture.id} is not the expected latest-final fixture; stopping without a duplicate transaction.`);
      }
      console.log(`ALREADY_REGISTERED_LATEST_FINAL=${JSON.stringify({ id: fixture.id, controller: registered.controller, config_version: registered.config_version, charter_version: registered.charter_version })}`);
      continue;
    }

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
    const charterIsMatch = charterMatches(charter, fixture.charter);
    const dependenciesAreMatch = dependenciesMatch(registered?.dependencies, fixture.dependencies);
    if (!dependenciesAreMatch) throw new Error(`Latest-final dependency mismatch for ${fixture.id}; stop and reconcile ${hash}.`);
    if (!charterIsMatch) throw new Error(`Latest-final charter mismatch for ${fixture.id}; stop and reconcile ${hash}.`);
    console.log(`VERIFIED_LATEST_FINAL=${JSON.stringify({ agent: registered, charter })}`);
  }
}

main().catch((error) => {
  console.error(`LIVE_AGENT_REGISTRATION_FAILED=${error?.message ?? String(error)}`);
  process.exitCode = 1;
});

