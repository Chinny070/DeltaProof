# DeltaProof V2 security review

## Implemented controls

- Controller-only agent updates, monotonic config/charter versions, stale-version checks, one-way revocation, and retained charter/config snapshots.
- Publisher-bound release registration, bounded canonical input, unique IDs, immutable release payloads, separate supersession/revocation state, and duplicate-evaluation protection.
- Strict JSON parsing with duplicate-key rejection; control-character, public-host (no obvious private/local/IP literal), type, registry, collection, revision, and history bounds.
- Direct per-consumer dependency matching, normalized route parameter names, deterministic removal/request/response-field checks, critical versus noncritical handling, and a semantic complexity cap.
- Independent public evidence fetch and SHA-256 validation for semantic adjudication; missing, oversized, or contradictory evidence cannot approve.
- Prompt injection handling for both submitted descriptions and retrieved evidence. Data is JSON encoded and angle brackets are escaped before insertion into the fixed task.
- Strict AI response schema. Approval requires no declared violation, sufficient verified evidence, and risk within the charter's explicit tolerance.
- Leader/validator independent evaluation with consequential-field equivalence; malformed results, evidence profile disagreement, or consequential disagreement cannot mint a decision.
- Deterministic fail-closed authorization for stale versions, suspended/revoked agents, revoked/superseded releases, expired decisions, unresolved freezes, open appeals, open safety challenges, and reassessment requests. Structured `get_authorization` is the CI-facing machine-readable contract result.
- Targeted controller freezes with a seven-day maximum, permissionless timeout closure, indexed immutable event records, and fresh adjudication required after resolution. Expiry does not auto-restore a previous approval.
- Appeals independently retrieve and digest-check counterevidence, publisher responses and original release evidence on leader and validator. Validators inspect the retrieved content and agree on consequential outcome/risk/sufficiency. Missing, mismatched, oversized, or unavailable evidence resolves to inconclusive review or fails finalization; no overturn can be based only on a hash.
- A separate safety challenge lets only the controller of an affected consumer challenge its currently approved pair within seven days. One to four sources must be independently retrieved and validator-screened as credible, new and route-relevant before the targeted hold opens. A publisher has two days to respond; validators retrieve and inspect all challenge, response and release evidence. At most two challenges per pair are allowed. Pending, inconclusive, blocked, or timed-out challenges keep that pair denied pending fresh adjudication; unaffected pairs remain available.
- Appeals and challenge state are bound to exact decision revision/passport, with read-only history accessors. Resolution cannot replay against a superseded revision.
- Read-only Watchtower observation of latest-final machine-readable authorization; it emits JSONL alerts without signing or submitting transactions.
- Content-addressed passports; historical verification is separate from current authorization.

## Important residual risks and limits

1. **Deployed, with application runtime still unverified.** The corrected source is deployed on StudioNet; deployment reached finalized majority agreement and latest-final ABI reads work. No V2 application lifecycle write or semantic adjudication has yet been executed, so storage serialization, model/web retrieval, and validator behavior for application calls still need live verification. Offline state-machine tests use a lightweight harness and do not replace those checks.
2. **Evidence integrity is not evidence authenticity.** Retrieval confirms that bytes returned by a public URL match the submitted digest at evaluation time. It does not prove the publisher, test environment, completeness, or truth of the content. A malicious source can publish misleading evidence and a compromised domain can change content.
3. **Network content can change between validators.** V2 compares evidence status/profile and consequential AI fields; changing or unavailable evidence can prevent finalization or require validator rotation. This is fail-safe but may reduce liveness.
4. **Public URL retrieval has residual network-layer exposure.** The contract rejects obvious private/local host forms, but it cannot resolve DNS or guarantee against DNS rebinding. StudioNet validator web-access policy must be confirmed before deployment.
5. **Semantic quality is probabilistic.** Independent agreement is not a proof of truth. The equivalence check intentionally compares only the outcome, risk, violation labels, and evidence sufficiency.
6. **Direct graph only.** V2 analyzes an agent's direct API routes (with route-parameter normalization); it does not walk a transitive agent-to-agent graph or automatically enumerate all affected consumers.
7. **No protocol-level appeal integration.** Application appeal records are distinct from GenLayer consensus appeals. Protocol-level behavior remains controlled by GenLayer.
8. **No external enforcement.** An API, agent, or deployment system can ignore the view. The sample CI integration has been run against deployed V2 for an unknown pair and returned a structured deny; live approved, frozen, disputed, revoked, stale, and other authorization paths remain unverified.
9. **Bounded storage growth still costs fees.** Records are append-oriented and there is no archive or pruning mechanism. Each write incurs network cost.
10. **Passport finality reference is external.** The contract cannot read the transaction hash of its executing write. Clients must retain the verified finalized transaction receipt separately.
11. **Emergency freeze governance is narrow.** Only the affected agent controller can initiate a manual freeze or safety challenge. Validator-screened challenges limit arbitrary holds, but a controller can still consume its bounded challenge cycles and temporarily deny only its own pair. There is no global protocol owner or guardian.
12. **Watchtower is observational.** It detects and reports state changes; an authorized consumer operator must inspect alerts and submit any challenge/reassessment. The observer does not automatically authenticate new software artifacts or write to chain.
12. **Not a substitute for runtime testing.** Endpoint contracts and evidence do not prove the deployed service behaves as described.

## Deployment gate

Do not describe V2 as production-ready until a separately authorized StudioNet deployment passes current GenVM storage/model/web execution, live deterministic cases, real independent semantic consensus, validator dissent/rotation handling, evidence retrieval/hash cases, appeal and safety-challenge screening/resolution, freeze timeout/recovery, passport/history verification, transaction finality, Watchtower polling against the deployed ABI, and the V2 read-only CI gate. Keep V1 as the production system until those checks are complete.
