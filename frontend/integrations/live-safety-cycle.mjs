#!/usr/bin/env node
// One-step-at-a-time StudioNet safety-challenge runner. No write is sent without --submit.
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { createAccount, createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant, TransactionStatus } from 'genlayer-js/types';

const address = process.env.DELTAPROOF_V2_ADDRESS || '0xEf72A2db4EbeD151273B137D8a741e4C537415f9';
const signerAddress = '0xaffe15eec45b68835cc9e5b4ab85dd5deae8e70b';
const accountName = 'my-studionet-wallet';
const agentId = 'eventtrace-live-20261021';
const releaseId = 'eventtrace-v2-20261021';
const unrelated = { releaseId: 'v2api-20261020', agentId: 'analytics-live-20261020' };
const fixtureCommit = 'a310f3cd59d83fe43c2c264b648225c5302d6825';
const compatibilityEvidence = [{
  kind: 'synthetic-api-compatibility-test',
  sha256: 'dab5d3a1431c08b850ebe09f910ec28a8c4a56a6108654d55a944422e0f08d25',
  source: `https://raw.githubusercontent.com/Chinny070/DeltaProof/${fixtureCommit}/docs/proofs/fixtures/safety/eventtrace-compatibility.md`,
  provenance: 'PUBLISHER-CONTROLLED SYNTHETIC TEST FIXTURE',
}];
const dependencies = [{
  method: 'GET', path: '/events/{event_id}', critical: true,
  guarantees: ['event payload preserved', 'stable event identifier'],
}];
const charter = {
  guarantees: ['event payload preserved', 'stable event identifier'],
  unacceptable_changes: ['event_id omitted for any event type', 'existing payload fields removed or renamed'],
  required_evidence_kinds: ['synthetic-api-compatibility-test'],
  risk_tolerance: 'MEDIUM',
};
const baseline = { endpoints: [{
  method: 'GET', path: '/events/{event_id}',
  behavior: 'Returns the requested event with its stable event identifier, type, and payload; no tracing metadata is returned.',
  request_required: ['event_id'], response_required: ['event_id', 'payload', 'type'],
}] };
const candidate = { endpoints: [{
  method: 'GET', path: '/events/{event_id}',
  behavior: 'Returns the requested event with its stable event identifier, type, and payload, and adds optional trace_id and delivery_region response metadata for standard and archived events.',
  request_required: ['event_id'], response_required: ['event_id', 'payload', 'type'],
}] };

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
const sha256 = value => createHash('sha256').update(value, 'utf8').digest('hex');
const routeKey = e => `${e.method} ${e.path.replace(/\{[^}]+\}/g, '{}')}`;
function canonicalSpec(spec) {
  return stable({ endpoints: [...spec.endpoints].sort((a, b) => routeKey(a).localeCompare(routeKey(b))).map(e => ({
    method: e.method.toUpperCase(), path: e.path, behavior: e.behavior,
    request_required: [...(e.request_required || [])].sort(), response_required: [...(e.response_required || [])].sort(),
  })) });
}
function keytar() {
  if (!process.env.APPDATA) throw Error('APPDATA unavailable; run this from the PowerShell terminal where the wallet was unlocked.');
  return createRequire(import.meta.url)(join(process.env.APPDATA, 'npm', 'node_modules', 'genlayer', 'node_modules', 'keytar'));
}
function getArg(name) { const i = process.argv.indexOf(name); return i < 0 ? '' : process.argv[i + 1] || ''; }
function requireSubmission() {
  if (!process.argv.includes('--submit')) throw Error('Preflight only; append --submit to authorize this single transaction step.');
}
async function evidenceFromEnv(prefix, kind, provenance) {
  const source = process.env[`${prefix}_URL`] || '';
  const digest = process.env[`${prefix}_SHA256`] || '';
  if (!source.startsWith('https://raw.githubusercontent.com/Chinny070/DeltaProof/')) throw Error(`${prefix}_URL must be a pinned public DeltaProof raw GitHub URL.`);
  if (!/^[0-9a-f]{64}$/.test(digest)) throw Error(`${prefix}_SHA256 must be a lowercase SHA-256 digest.`);
  const response = await fetch(source, { redirect: 'error' });
  if (!response.ok) throw Error(`${prefix} source fetch failed with HTTP ${response.status}.`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const content = bytes.toString('utf8');
  if (bytes.length > 16_000 || !content || content.includes('\uFFFD')) throw Error(`${prefix} source is empty, oversized, or invalid UTF-8.`);
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (actual !== digest) throw Error(`${prefix} source SHA-256 mismatch.`);
  return { item: { kind, sha256: digest, source, provenance }, characters: content.length };
}
async function verifyPinned(item) {
  const response = await fetch(item.source, { redirect: 'error' });
  if (!response.ok) throw Error(`Pinned evidence source fetch failed with HTTP ${response.status}.`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const content = bytes.toString('utf8');
  if (bytes.length > 16_000 || !content || content.includes('\uFFFD')) throw Error('Pinned evidence source is empty, oversized, or invalid UTF-8.');
  const actual = createHash('sha256').update(bytes).digest('hex');
  if (actual !== item.sha256) throw Error('Pinned compatibility evidence SHA-256 mismatch.');
  return { characters: content.length, sha256: actual };
}
async function main() {
  const step = getArg('--step');
  const allowed = ['preflight', 'register-agent', 'register-release', 'adjudicate', 'open', 'respond', 'resolve', 'reassess'];
  if (!allowed.includes(step)) throw Error(`Use --step ${allowed.join('|')}.`);
  const client = createClient({ chain: studionet });
  const read = (functionName, args = []) => client.readContract({ address, functionName, args, transactionHashVariant: TransactionHashVariant.LATEST_FINAL });
  const [overview, existingAgent, existingRelease, existingDecision] = await Promise.all([
    read('get_overview'), read('get_agent', [agentId]).catch(() => null), read('get_release', [releaseId]).catch(() => null), read('get_decision', [releaseId, agentId]).catch(() => null),
  ]);
  if (overview?.protocol !== 'deltaproof/2.0') throw Error('StudioNet V2 protocol read did not match the expected contract.');

  if (step === 'preflight') {
    const evidence = await verifyPinned(compatibilityEvidence[0]);
    console.log(JSON.stringify({ network: 'studionet', chainId: 61999, address, agentId, releaseId, overview,
      agentExists: existingAgent?.id === agentId, releaseExists: existingRelease?.id === releaseId,
      decisionExists: Boolean(existingDecision?.revision), baselineCharacters: JSON.stringify(baseline).length,
      candidateCharacters: JSON.stringify(candidate).length, charterCharacters: JSON.stringify(charter).length,
      compatibilityEvidence, compatibilityEvidenceRetrieved: evidence,
      challengeCounterevidence: 'Must be published only after a finalized APPROVED affected-pair decision.', transactionSent: false }));
    return;
  }

  if (step === 'register-agent') {
    if (existingAgent?.id === agentId) throw Error('Safety fixture agent already exists; refusing duplicate registration.');
    const deps = JSON.stringify(dependencies), charterJson = JSON.stringify(charter);
    const args = [agentId, 'DeltaProof synthetic event tracing consumer', deps, charterJson];
    if (args.length !== 4 || args.some(x => typeof x !== 'string')) throw Error('register_agent ABI preflight failed.');
    await submit(step, 'register_agent', args, async () => {
      const [agent, savedCharter] = await Promise.all([read('get_agent', [agentId]), read('get_charter', [agentId, 1])]);
      if (agent?.controller?.toLowerCase() !== signerAddress || agent?.status !== 'ACTIVE' || agent?.config_version !== 1 || agent?.charter_version !== 1
          || stable(agent.dependencies) !== stable(dependencies) || stable(savedCharter) !== stable(charter)) throw Error('Finalized agent or immutable charter does not match fixture.');
      return { agent, charter: savedCharter };
    });
    return;
  }

  if (step === 'register-release') {
    if (existingRelease?.id === releaseId) throw Error('Safety fixture release already exists; refusing duplicate registration.');
    if (existingAgent?.id !== agentId || existingAgent.status !== 'ACTIVE') throw Error('Register and verify the safety fixture agent first.');
    const ev = JSON.stringify(compatibilityEvidence);
    const args = [releaseId, 'DeltaProof synthetic event tracing compatibility', '2.1.0', JSON.stringify(baseline), JSON.stringify(candidate), ev];
    if (args.length !== 6 || args.some(x => typeof x !== 'string')) throw Error('register_release ABI preflight failed.');
    await verifyPinned(compatibilityEvidence[0]);
    await submit(step, 'register_release', args, async () => {
      const saved = await read('get_release', [releaseId]);
      const evidenceHash = sha256(stable(compatibilityEvidence));
      if (saved?.publisher?.toLowerCase() !== signerAddress || saved?.status !== 'ACTIVE'
          || saved?.baseline !== canonicalSpec(baseline) || saved?.candidate !== canonicalSpec(candidate)
          || saved?.baseline_hash !== sha256(canonicalSpec(baseline)) || saved?.candidate_hash !== sha256(canonicalSpec(candidate))
          || saved?.evidence_hash !== evidenceHash || stable(saved.evidence) !== stable(compatibilityEvidence)) throw Error('Latest-final release does not match source/spec commitments.');
      return { release: saved, baseline_hash: saved.baseline_hash, candidate_hash: saved.candidate_hash, evidence_hash: saved.evidence_hash };
    });
    return;
  }

  if (step === 'adjudicate') {
    if (existingRelease?.status !== 'ACTIVE' || existingAgent?.status !== 'ACTIVE') throw Error('Active agent and release are required.');
    if (existingDecision?.revision) throw Error('A decision already exists; refusing duplicate adjudication.');
    const savedCharter = await read('get_charter', [agentId, 1]);
    if (stable(savedCharter) !== stable(charter)) throw Error('On-chain charter differs from precommitted fixture.');
    await submit(step, 'adjudicate', [releaseId, agentId], async () => {
      const [decision, authorization, passport] = await Promise.all([read('get_decision', [releaseId, agentId]), read('get_authorization', [releaseId, agentId]), read('get_passport', [releaseId, agentId])]);
      if (decision?.mode !== 'GENLAYER_INDEPENDENT_CONSENSUS' || !decision?.impacted_dependencies?.length) throw Error('The finalized result did not use semantic consensus for an affected pair. No challenge is eligible.');
      const eligible = decision.decision === 'APPROVED' && authorization.allow === true && authorization.status === 'ALLOW'
        && decision.evidence_profile?.length === 1 && decision.evidence_profile[0].status === 'VERIFIED'
        && decision.evidence_profile[0].sha256 === compatibilityEvidence[0].sha256;
      console.log(`INITIAL_SAFETY_CHALLENGE_ELIGIBILITY=${eligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE'}`);
      return { decision, authorization, passport, safetyChallengeEligible: eligible };
    });
    return;
  }

  const [decision, authorization, challenge] = await Promise.all([
    read('get_decision', [releaseId, agentId]).catch(() => null), read('get_authorization', [releaseId, agentId]), read('get_safety_challenge', [releaseId, agentId]).catch(() => null),
  ]);
  if (!decision || decision.agent_id !== agentId || authorization.agent_id !== agentId) throw Error('Latest-final safety pair is missing or malformed.');

  if (step === 'open') {
    if (decision.decision !== 'APPROVED' || !decision.impacted_dependencies?.length || !authorization.allow || authorization.status !== 'ALLOW') throw Error('No finalized approval for an affected pair; do not submit a safety challenge.');
    if (challenge?.status === 'OPEN') throw Error('Safety challenge already open; refusing duplicate.');
    const ev = await evidenceFromEnv('DP_SAFETY_COUNTEREVIDENCE', 'synthetic-safety-counterevidence', 'PUBLISHER-CONTROLLED SYNTHETIC TEST FIXTURE');
    if (decision.evidence_profile?.some(item => item.sha256 === ev.item.sha256)) throw Error('Challenge evidence was already present in initial adjudication.');
    const unrelatedAuth = await read('get_authorization', [unrelated.releaseId, unrelated.agentId]);
    if (unrelatedAuth?.allow !== true || unrelatedAuth?.status !== 'ALLOW') throw Error('Unrelated Analytics control is not currently ALLOW; stop before challenge submission.');
    await submit(step, 'open_safety_challenge', [releaseId, agentId, JSON.stringify([ev.item])], async () => {
      const [record, held, stillUnrelated] = await Promise.all([read('get_safety_challenge', [releaseId, agentId]), read('get_authorization', [releaseId, agentId]), read('get_authorization', [unrelated.releaseId, unrelated.agentId])]);
      if (record?.status !== 'OPEN' || held?.allow !== false || held?.status !== 'SAFETY_CHALLENGE_PENDING') throw Error('Finalized challenge did not create the expected targeted hold.');
      if (stillUnrelated?.allow !== true || stillUnrelated?.status !== 'ALLOW') throw Error('Unrelated Analytics authorization changed during the targeted challenge.');
      return { challenge: record, targetedAuthorization: held, unrelatedAuthorization: stillUnrelated };
    });
    return;
  }
  if (step === 'respond') {
    if (challenge?.status !== 'OPEN' || challenge.response_submitted) throw Error('No response-eligible open safety challenge.');
    const ev = await evidenceFromEnv('DP_SAFETY_RESPONSE', 'synthetic-safety-publisher-response', 'PUBLISHER-CONTROLLED SYNTHETIC TEST FIXTURE');
    await submit(step, 'respond_to_safety_challenge', [releaseId, agentId, JSON.stringify([ev.item])], async () => {
      const updated = await read('get_safety_challenge', [releaseId, agentId]);
      if (updated?.status !== 'OPEN' || updated.response_submitted !== true || !updated.response_hash) throw Error('Latest-final safety challenge response not verified.');
      return { challenge: updated };
    });
    return;
  }
  if (step === 'resolve') {
    if (challenge?.status !== 'OPEN' || challenge.response_submitted !== true) throw Error('Resolve only after publisher response finalizes; no timeout simulation.');
    await submit(step, 'resolve_safety_challenge', [releaseId, agentId], async () => {
      const [updated, auth, passport] = await Promise.all([read('get_safety_challenge', [releaseId, agentId]), read('get_authorization', [releaseId, agentId]), read('get_passport', [releaseId, agentId])]);
      if (updated?.status !== 'RESOLVED' || !['UPHELD', 'BLOCKED', 'REVIEW_REQUIRED'].includes(updated.outcome)
          || updated.resolution_profile?.length !== (updated.counterevidence?.length || 0) + (updated.response?.length || 0) + (existingRelease?.evidence?.length || 0)) throw Error('Resolved challenge or retrieved evidence profile failed verification.');
      if (!updated.resolution_profile.every(x => x.status === 'VERIFIED') && updated.outcome !== 'REVIEW_REQUIRED') throw Error('Unverified evidence produced an unsafe outcome.');
      const expected = updated.outcome === 'UPHELD' ? 'ALLOW' : 'REASSESSMENT_REQUIRED';
      if (auth.allow !== (expected === 'ALLOW') || (expected !== 'ALLOW' && auth.status !== expected)) throw Error(`Post-resolution authorization expected ${expected}, got ${auth.status}/${auth.allow}.`);
      const unrelatedAuth = await read('get_authorization', [unrelated.releaseId, unrelated.agentId]);
      if (unrelatedAuth?.allow !== true || unrelatedAuth?.status !== 'ALLOW') throw Error('Unrelated Analytics authorization changed after resolution.');
      return { challenge: updated, authorization: auth, passport, unrelatedAuthorization: unrelatedAuth };
    });
    return;
  }
  if (step === 'reassess') {
    if (challenge?.status !== 'RESOLVED' || !['BLOCKED', 'REVIEW_REQUIRED'].includes(challenge.outcome)
        || authorization.status !== 'REASSESSMENT_REQUIRED') throw Error('Fresh adjudication is only required after BLOCKED or REVIEW_REQUIRED challenge resolution.');
    await submit(step, 'adjudicate', [releaseId, agentId], async () => {
      const [after, auth, passport, previous] = await Promise.all([
        read('get_decision', [releaseId, agentId]), read('get_authorization', [releaseId, agentId]), read('get_passport', [releaseId, agentId]),
        read('get_decision_revision', [releaseId, agentId, decision.revision]),
      ]);
      if (after?.revision !== decision.revision + 1 || after.passport?.previous_passport_hash !== previous?.passport_hash) throw Error('Reassessment revision/passport history did not advance correctly.');
      return { decision: after, authorization: auth, passport, previousDecision: previous };
    });
    return;
  }
}

async function submit(step, functionName, args, verifyLatestFinal) {
  if (args.some(value => typeof value !== 'string')) throw Error('Every contract argument must be a string for this method.');
  console.log(`PREFLIGHT=${JSON.stringify({ network: 'studionet', chainId: 61999, address, step, functionName, args, transactionSent: false })}`);
  requireSubmission();
  const key = await keytar().getPassword('genlayer-cli', `account:${accountName}`);
  if (!key) throw Error('Wallet unavailable in this terminal. Unlock the existing account here with genlayer account unlock --account my-studionet-wallet. Never paste the key or recovery phrase.');
  const account = createAccount(key);
  if (account.address.toLowerCase() !== signerAddress) throw Error('Active signer does not match the authorized public address; no transaction sent.');
  const client = createClient({ chain: studionet, account });
  const hash = await client.writeContract({ address, functionName, args, value: 0n });
  console.log(`TRANSACTION_HASH=${hash}`);
  const receipt = await client.waitForTransactionReceipt({ hash, status: TransactionStatus.FINALIZED, interval: 3000, retries: 200, fullTransaction: true });
  const votes = receipt?.last_round?.validator_votes_name ?? [];
  const agrees = votes.filter(v => v === 'AGREE').length;
  const successfulAgreeExecutions = (receipt?.consensus_data?.validators ?? []).filter(v => v?.vote === 'agree' && v?.execution_result === 'SUCCESS').length;
  console.log(`RECEIPT=${JSON.stringify({ hash: receipt?.hash, status: receipt?.statusName, consensus: receipt?.result_name,
    rounds: receipt?.num_of_rounds, votes, successfulAgreeExecutions, executionHash: receipt?.tx_execution_hash,
    gasLimit: receipt?.gaslimit, nonce: receipt?.nonce, txExecutionResultName: receipt?.tx_execution_result_name })}`);
  if (receipt?.statusName !== 'FINALIZED' || receipt?.result_name !== 'MAJORITY_AGREE' || agrees < 3 || successfulAgreeExecutions < 2) {
    throw Error(`Transaction ${hash} did not meet verified successful-majority finality. Reconcile this hash; do not retry.`);
  }
  const verified = await verifyLatestFinal();
  console.log(`VERIFIED_LATEST_FINAL=${JSON.stringify(verified)}`);
}

main().catch(error => { console.error(`LIVE_SAFETY_CYCLE_FAILED=${error?.message ?? String(error)}`); process.exitCode = 1; });
