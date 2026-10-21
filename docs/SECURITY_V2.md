# DeltaProof V2 security review

## Implemented controls

- Controller-only agent updates, monotonic config/charter versions, stale-version checks, one-way revocation, and retained charter/config snapshots.
- Publisher-bound release registration, bounded canonical input, unique IDs, immutable release payloads, separate supersession/revocation state, and duplicate-evaluation protection.
- Strict JSON parsing with duplicate-key rejection; control-character, public-host (no obvious private/local/IP literal), type, registry, collection, revision, and history bounds.
- Direct per-consumer dependency matching, normalized route parameter names, deterministic removal/request/response-field checks, critical versus noncritical handling, and a semantic complexity cap.
- Independent public evidence fetch and SHA-256 validation for semantic adjudication; missing, oversized, or contradictory evidence cannot approve.
- Charter `required_evidence_kinds` uses deterministic AND semantics in current source: every required kind must be committed, and each submitted source must be retrieved and digest-verified before semantic adjudication. Hostile approval outputs cannot bypass the pre-prompt gate. This correction is not present in the deployed contract bytes and requires a separately authorized deployment to protect live decisions.
- Prompt injection handling for both submitted descriptions and retrieved evidence. Data is JSON encoded and angle brackets are escaped before insertion into the fixed task.
- Strict AI response schema. Approval requires no declared violation, sufficient verified evidence, and risk within the charter's explicit tolerance.
- Leader/validator independent evaluation compares only `decision`, `risk`, `violations`, and `evidence_sufficient`. `migration` and `reason` are bounded leader-selected advisory text, not consensus-certified and never used by authorization. The passport hashes the selected advisory text but does not assert validators agreed with it.
- Deterministic fail-closed authorization for stale versions, suspended/revoked agents, revoked/superseded releases, expired decisions, unresolved freezes, open appeals, open safety challenges, and reassessment requests. Structured `get_authorization` is the CI-facing machine-readable contract result.
- Targeted controller freezes with a seven-day maximum, permissionless timeout closure, indexed immutable event records, and fresh adjudication required after resolution. Expiry does not auto-restore a previous approval.
- Appeals independently retrieve and digest-check counterevidence, publisher responses and original release evidence on leader and validator. Validators inspect the retrieved content and agree on consequential outcome/risk/sufficiency. Missing, mismatched, oversized, or unavailable evidence resolves to inconclusive review or fails finalization; no overturn can be based only on a hash.
- A separate safety challenge lets only the controller of an affected consumer challenge its currently approved pair within seven days. One to four sources must be independently retrieved and validator-screened as credible, new and route-relevant before the targeted hold opens. A publisher has two days to respond; validators retrieve and inspect all challenge, response and release evidence. At most two challenges per pair are allowed. Pending, inconclusive, blocked, or timed-out challenges keep that pair denied pending fresh adjudication; unaffected pairs remain available.
- Appeals and challenge state are bound to exact decision revision/passport, with read-only history accessors. Resolution cannot replay against a superseded revision.
- Read-only Watchtower observation of latest-final machine-readable authorization; it emits JSONL alerts without signing or submitting transactions.
- Content-addressed passports; historical verification is separate from current authorization.

## Important residual risks and limits

1. **Deployed source differs from reviewed source.** The deployed bytes match historical commit `aee912c0635d6ca3b5782e97da2db733f9a20d6a`; current source adds deterministic AND enforcement of required evidence kinds. Until that source is deployed, the live contract must not be represented as enforcing the corrected rule. The live lifecycle proofs remain valid for the deployed version they exercised.
2. **Evidence integrity is not evidence authenticity.** Retrieval confirms that bytes returned by a public URL match the submitted digest at evaluation time. It does not prove the publisher, test environment, completeness, or truth of the content. A malicious source can publish misleading evidence and a compromised domain can change content.
3. **Network content can change between validators.** V2 compares evidence status/profile and consequential AI fields; changing or unavailable evidence can prevent finalization or require validator rotation. This is fail-safe but may reduce liveness.
4. **Public URL retrieval has residual network-layer exposure.** The contract rejects obvious private/local host forms, but it cannot resolve DNS or guarantee against DNS rebinding. StudioNet validator web-access policy must be confirmed before deployment.
5. **Semantic quality is probabilistic.** Independent agreement is not a proof of truth. Validators independently evaluate the consequential fields, while leader-selected explanation and migration prose remains advisory. A client must not execute migration text automatically.
6. **Direct graph only.** V2 analyzes an agent's direct API routes (with route-parameter normalization); it does not walk a transitive agent-to-agent graph or automatically enumerate all affected consumers.
7. **No protocol-level appeal integration.** Application appeal records are distinct from GenLayer consensus appeals. Protocol-level behavior remains controlled by GenLayer.
8. **No external enforcement.** An API, agent, or deployment system can ignore the view. Historical live CI checks matched Checkout BLOCKED, Analytics ALLOW (revision 2), Refund BLOCKED, and event tracing REVIEW_REQUIRED; a live read-only CI check rejected event tracing after the safety challenge. These are time-bound observations, not a guarantee of current state.
9. **Bounded storage growth still costs fees.** Records are append-oriented and there is no archive or pruning mechanism. Each write incurs network cost.
10. **Passport finality reference is external.** The contract cannot read the transaction hash of its executing write. Clients must retain the verified finalized transaction receipt separately.
11. **Emergency freeze governance is narrow.** Only the affected agent controller can initiate a manual freeze or safety challenge. Validator-screened challenges limit arbitrary holds, but a controller can still consume its bounded challenge cycles and temporarily deny only its own pair. There is no global protocol owner or guardian.
12. **Watchtower is observational.** It detects and reports state changes; an authorized consumer operator must inspect alerts and submit any challenge/reassessment. The observer does not automatically authenticate new software artifacts or write to chain.
12. **Not a substitute for runtime testing.** Endpoint contracts and evidence do not prove the deployed service behaves as described.

## Deployment gate

V2 is **not ready for an updated contract deployment** until evidence-kind regression checks pass, source provenance is reconciled, and the corrected source is explicitly authorized and deployed. The existing deployed contract's genuine StudioNet transactions demonstrate GenVM execution for that historical source, but offline lint/typecheck and harness tests do not demonstrate GenVM execution of current local changes. Wallet message signing and current saved transaction tracking have been verified; wallet-signed writes remain unverified. The exact responsive matrix and anonymous public access also remain outstanding.

