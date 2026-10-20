# DeltaProof V2 security review

## Implemented controls

- Controller-only agent updates, monotonic config/charter versions, stale-version checks, one-way revocation, and retained charter/config snapshots.
- Publisher-bound release registration, bounded canonical input, unique IDs, immutable release payloads, separate supersession/revocation state, and duplicate-evaluation protection.
- Strict JSON parsing with duplicate-key rejection; control-character, public-host (no obvious private/local/IP literal), type, registry, collection, revision, and history bounds.
- Direct per-consumer dependency matching, deterministic removal/request/response-field checks, critical versus noncritical handling, and a semantic complexity cap.
- Independent public evidence fetch and SHA-256 validation for semantic adjudication; missing, oversized, or contradictory evidence cannot approve.
- Prompt injection handling for both submitted descriptions and retrieved evidence. Data is JSON encoded and angle brackets are escaped before insertion into the fixed task.
- Strict AI response schema. Approval requires no declared violation, sufficient verified evidence, and risk within the charter's explicit tolerance.
- Leader/validator independent evaluation with consequential-field equivalence; malformed results, evidence profile disagreement, or consequential disagreement cannot mint a decision.
- Deterministic fail-closed authorization for stale versions, suspended/revoked agents, revoked/superseded releases, expired decisions, freezes, open appeals, and reassessment requests.
- Targeted controller freezes with a seven-day maximum, permissionless timeout, immutable event records, and fresh adjudication required after resolution.
- Appeal deadlines, one publisher response, a two-day response window, permissionless INCONCLUSIVE timeout, stale-decision binding, and a two-cycle cap.
- Content-addressed passports; historical verification is separate from current authorization.

## Important residual risks and limits

1. **Not deployed or runtime-verified.** `genvm-lint` accepts the source, but there is no GenVM execution against V2 and no live StudioNet validator result. The current V1 address does not expose this V2 ABI.
2. **Evidence integrity is not evidence authenticity.** Retrieval confirms that bytes returned by a public URL match the submitted digest at evaluation time. It does not prove the publisher, test environment, completeness, or truth of the content. A malicious source can publish misleading evidence and a compromised domain can change content.
3. **Network content can change between validators.** V2 compares evidence status/profile and consequential AI fields; changing or unavailable evidence can prevent finalization or require validator rotation. This is fail-safe but may reduce liveness.
4. **Public URL retrieval has residual network-layer exposure.** The contract rejects obvious private/local host forms, but it cannot resolve DNS or guarantee against DNS rebinding. StudioNet validator web-access policy must be confirmed before deployment.
5. **Semantic quality is probabilistic.** Independent agreement is not a proof of truth. The equivalence check intentionally compares only the outcome, risk, violation labels, and evidence sufficiency.
6. **Direct graph only.** V2 analyzes an agent's direct API routes; it does not walk a transitive agent-to-agent graph or automatically enumerate all affected consumers.
7. **No protocol-level appeal integration.** Application appeal records are distinct from GenLayer consensus appeals. Protocol-level behavior remains controlled by GenLayer.
8. **No external enforcement.** An API, agent, or deployment system can ignore the view. The sample CI integration demonstrates how a cooperating deploy pipeline can fail closed but has not been run against a deployed V2 contract.
9. **Bounded storage growth still costs fees.** Records are append-oriented and there is no archive or pruning mechanism. Each write incurs network cost.
10. **Passport finality reference is external.** The contract cannot read the transaction hash of its executing write. Clients must retain the verified finalized transaction receipt separately.
11. **Emergency freeze governance is narrow.** Only the affected agent controller can initiate a freeze. There is no global protocol owner or emergency guardian that can freeze other agents.
12. **Not a substitute for runtime testing.** Endpoint contracts and evidence do not prove the deployed service behaves as described.

## Deployment gate

Do not describe V2 as production-ready until a separately authorized StudioNet deployment passes GenVM execution, live deterministic cases, real independent semantic consensus, validator dissent/rotation handling, evidence retrieval/hash cases, appeals/freeze timeouts, passport verification, transaction finality, and the V2 read-only CI gate. Keep the V1 deployment and live frontend as the production system until those checks are complete.
