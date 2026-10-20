import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { createAccount, createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant, TransactionStatus } from 'genlayer-js/types';

const address = '0x367C2B9f8B52EEd57977B84c458eaD4c3105E718';
const signerAddress = '0xaffe15eec45b68835cc9e5b4ab85dd5deae8e70b';
const accountName = 'my-studionet-wallet';
const releaseId = 'v2api-20261020';
const baseline = {
  endpoints: [
    { method: 'GET', path: '/events/{event_id}', behavior: 'Returns the requested event with its stable event identifier, type, and payload.', request_required: ['event_id'], response_required: ['event_id', 'payload', 'type'] },
    { method: 'POST', path: '/payment', behavior: 'Creates a payment and honors the supplied idempotency key.', request_required: ['amount', 'idempotency_key'], response_required: ['id', 'status'] },
    { method: 'POST', path: '/refunds', behavior: 'Creates an idempotent refund operation and returns its refund identifier and status.', request_required: ['amount', 'idempotency_key', 'payment_id'], response_required: ['refund_id', 'status'] },
  ],
};
const candidate = {
  endpoints: [
    { method: 'GET', path: '/events/{event_id}', behavior: 'Returns the requested event with its stable event identifier, type, and payload.', request_required: ['event_id'], response_required: ['event_id', 'payload', 'type'] },
    { method: 'POST', path: '/payment', behavior: 'Creates a payment and honors the supplied idempotency key.', request_required: ['amount', 'currency', 'idempotency_key'], response_required: ['id', 'status'] },
    { method: 'POST', path: '/refunds', behavior: 'A retry may create another refund operation even if the idempotency key is unchanged.', request_required: ['amount', 'idempotency_key', 'payment_id'], response_required: ['refund_id', 'status'] },
  ],
};
const evidence = [{
  kind: 'synthetic-compatibility-scenario',
  sha256: '17014b71c97c5b08cda20058e7b68747a2c17930c9e9a1f37e30b02e0cefd6a9',
  source: 'https://raw.githubusercontent.com/Chinny070/DeltaProof/6b3af4b0e8abe29c676c454596f29c1b6f24830f/docs/proofs/fixtures/refund-semantic-scenario.md',
  provenance: 'PUBLISHER-CONTROLLED TEST FIXTURE',
}];

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

function keytar() {
  if (!process.env.APPDATA) throw new Error('APPDATA is unavailable; run in the Windows terminal where the wallet was unlocked.');
  return createRequire(import.meta.url)(join(process.env.APPDATA, 'npm', 'node_modules', 'genlayer', 'node_modules', 'keytar'));
}

async function main() {
  if (!process.argv.includes('--submit')) throw new Error('No transaction was sent. Add --submit to authorize registering this one API fixture.');
  const privateKey = await keytar().getPassword('genlayer-cli', `account:${accountName}`);
  if (!privateKey) throw new Error('Signer is not unlocked in this terminal. Unlock it here with genlayer account unlock --account my-studionet-wallet.');
  const account = createAccount(privateKey);
  if (account.address.toLowerCase() !== signerAddress) throw new Error('Unlocked account does not match the authorized public signer.');
  const client = createClient({ chain: studionet, account });
  const releases = await client.readContract({ address, functionName: 'list_releases', args: [0, 20], transactionHashVariant: TransactionHashVariant.LATEST_FINAL });
  if (!Array.isArray(releases)) throw new Error('Latest-final release registry was malformed; no transaction sent.');
  if (releases.some((release) => release?.id === releaseId)) throw new Error(`${releaseId} already exists; refusing a duplicate registration.`);

  const baselineJson = JSON.stringify(baseline);
  const candidateJson = JSON.stringify(candidate);
  const evidenceJson = JSON.stringify(evidence);
  const args = [releaseId, 'DeltaProof controlled API compatibility fixture', '2.0.0', baselineJson, candidateJson, evidenceJson];
  if (args.length !== 6 || args.some((value) => typeof value !== 'string')) throw new Error('Typed register_release ABI preflight failed.');
  for (const [label, payload] of [['baseline', baselineJson], ['candidate', candidateJson], ['evidence', evidenceJson]]) {
    JSON.parse(payload);
    console.log(`${label.toUpperCase()}_CHARACTERS=${payload.length}`);
    if (payload.length < 2 || payload.length > (label === 'evidence' ? 20000 : 10000)) throw new Error(`${label} JSON length is outside the contract bound.`);
  }
  for (const [label, value] of [['baseline', baseline], ['candidate', candidate]]) {
    const canonical = stable({ endpoints: [...value.endpoints].sort((a, b) => `${a.method} ${a.path.replace(/\{[^}]+\}/g, '{}')}`.localeCompare(`${b.method} ${b.path.replace(/\{[^}]+\}/g, '{}')}`)) });
    console.log(`${label.toUpperCase()}_SHA256=${createHash('sha256').update(canonical, 'utf8').digest('hex')}`);
  }
  console.log(`EVIDENCE_COMMITMENT_SHA256=${evidence[0].sha256}`);
  console.log(`REGISTER_RELEASE_ARGS=${JSON.stringify({ releaseId, name: args[1], version: args[2], baselineType: typeof args[3], candidateType: typeof args[4], evidenceType: typeof args[5], evidence })}`);

  const hash = await client.writeContract({ address, functionName: 'register_release', args, value: 0n });
  console.log(`TRANSACTION_HASH=${hash}`);
  const receipt = await client.waitForTransactionReceipt({ hash, status: TransactionStatus.FINALIZED, interval: 3000, retries: 100, fullTransaction: true });
  const agreeVotes = (receipt?.last_round?.validator_votes_name ?? []).filter((vote) => vote === 'AGREE').length;
  const successfulAgreeExecutions = (receipt?.consensus_data?.validators ?? []).filter((v) => v?.vote === 'agree' && v?.execution_result === 'SUCCESS').length;
  console.log(`RECEIPT=${JSON.stringify({ hash: receipt?.hash, status: receipt?.statusName, consensus: receipt?.result_name, agreeVotes, successfulAgreeExecutions, executionHash: receipt?.tx_execution_hash, gasLimit: receipt?.gaslimit, nonce: receipt?.nonce })}`);
  if (receipt?.statusName !== 'FINALIZED') throw new Error(`Transaction did not finalize; reconcile ${hash} before retrying.`);
  if (receipt?.result_name !== 'MAJORITY_AGREE' || agreeVotes < 3 || successfulAgreeExecutions < 2) throw new Error(`Finalized transaction lacks successful majority execution; stop and inspect ${hash}.`);

  const release = await client.readContract({ address, functionName: 'get_release', args: [releaseId], transactionHashVariant: TransactionHashVariant.LATEST_FINAL });
  const expectedBaseline = stable({ endpoints: [...baseline.endpoints].sort((a, b) => `${a.method} ${a.path.replace(/\{[^}]+\}/g, '{}')}`.localeCompare(`${b.method} ${b.path.replace(/\{[^}]+\}/g, '{}')}`)) });
  const expectedCandidate = stable({ endpoints: [...candidate.endpoints].sort((a, b) => `${a.method} ${a.path.replace(/\{[^}]+\}/g, '{}')}`.localeCompare(`${b.method} ${b.path.replace(/\{[^}]+\}/g, '{}')}`)) });
  const expectedEvidence = stable(evidence);
  const verified = release?.id === releaseId
    && release?.publisher?.toLowerCase() === signerAddress
    && release?.baseline === expectedBaseline
    && release?.candidate === expectedCandidate
    && release?.baseline_hash === createHash('sha256').update(expectedBaseline, 'utf8').digest('hex')
    && release?.candidate_hash === createHash('sha256').update(expectedCandidate, 'utf8').digest('hex')
    && release?.evidence_hash === createHash('sha256').update(expectedEvidence, 'utf8').digest('hex');
  if (!verified) throw new Error(`Latest-final release record did not match submitted snapshot commitments; reconcile ${hash}.`);
  console.log(`VERIFIED_LATEST_FINAL_RELEASE=${JSON.stringify({ id: release.id, publisher: release.publisher, baseline_hash: release.baseline_hash, candidate_hash: release.candidate_hash, evidence_hash: release.evidence_hash, evidence: release.evidence, created_at: release.created_at })}`);
}

main().catch((error) => {
  console.error(`LIVE_RELEASE_REGISTRATION_FAILED=${error?.message ?? String(error)}`);
  process.exitCode = 1;
});

