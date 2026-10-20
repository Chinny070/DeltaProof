# DeltaProof V2 architecture

## Scope and boundaries

V2 is an independent contract and frontend entry point. It does not modify the deployed V1 address `0x50D7C07A081A56dBd30fB3a244C11A8105E4faA6` or the existing V1 `/` application. V2 will be served at `/v2/` only after a separately authorized deployment and configuration. The target is StudioNet (chain 61999, `https://studio.genlayer.com/api`).

The contract answers a narrower, enforceable question: **for this registered consumer, is this release authorized by its current charter and current contract state?** It cannot force an external agent or API provider to honor that answer. A consumer or its CI deployment pipeline must call `is_authorized` before adopting the version.

## Storage and bounded inputs

Storage uses GenVM `TreeMap[str, str]` records containing canonical JSON, plus bounded `u32` counters and insertion indexes. The contract stores:

- Agent controller, status, configuration version, current charter version, and direct dependencies. Each charter and configuration version is retained under a version key.
- Immutable release inputs: canonical baseline and candidate endpoint snapshots, their SHA-256 hashes, publisher identity, and evidence commitments. Mutable ACTIVE / SUPERSEDED / REVOKED authorization state is stored separately from the release bytes.
- Current per-agent decisions and immutable prior revisions, content-addressed passports, reassessment triggers, targeted freeze state/history, and application-level appeal stages/history.

Bounds include 1,000 agents, 5,000 releases, 10,000 agent-release decisions, 64 agent config versions, 32 decision revisions per pair, 16 dependencies per agent, 20 endpoints per snapshot, 16 required fields per endpoint direction, 16 guarantees and 16 unacceptable-change labels per charter, 12 evidence references per submission, 4,000 characters per fetched source and 12,000 retrieved evidence characters per assessment, 8 semantic route changes per assessment, at most 24 combined evidence references during a reassessment, 20 entries per registry page, 16 freeze cycles per agent-release pair, 20,000 freeze history events, 7-day freezes, a 3-day appeal window, a 2-day publisher response period, at most two appeal cycles per agent-release pair, and 90-day decision freshness.

Endpoint matching is direct, not a transitive agent-to-agent dependency graph. Only dependencies present in the baseline are considered existing dependencies. A release that changes no registered consumer dependency gets a deterministic consumer-specific approval; a new or removed endpoint that affects a registered route is handled using criticality and deterministic field rules.

## State transitions and authorization

```text
Agent:    register ACTIVE -> controller updates versioned config/charter
                         -> SUSPENDED or REVOKED (revoked cannot reactivate)
Release:  register ACTIVE -> SUPERSEDED or REVOKED (source bytes remain unchanged)
Decision: absent -> adjudicated revision 1 -> explicit reassessment -> linked revision N
Appeal:   eligible non-approval -> OPEN -> UPHELD / OVERTURNED / INCONCLUSIVE
                                  -> unanswered timeout resolves INCONCLUSIVE
Freeze:   controller opens bounded (<= 7 day) release-agent freeze
                         -> controller or permissionless timeout resolves
                         -> fresh adjudication required before authorization returns
```

`is_authorized(release_id, agent_id)` returns true only when the latest decision is APPROVED; the agent and release are ACTIVE; the decision's charter/configuration versions are still current; the decision is less than 90 days old; there is no active freeze, open appeal, or reassessment request; and the approval is otherwise present in finalized state. It is a read-only gate. It does not use a user's optimistic UI state.

Only the registered controller may change its agent record, suspend/revoke it, freeze its own agent-release authorization, or appeal a decision for its agent. Only a release publisher may supersede/revoke its release or submit the one publisher response. Any caller may request a release evaluation or resolve an appeal after the publisher window closes. State-changing operations reject stale config versions, duplicate registration, duplicate adjudication, duplicate responses, stale appeals, and over-limit appeals.

## Evidence and the GenLayer role

Evidence records include type, lowercase SHA-256, HTTPS public hostname, and a provenance label. URLs are not claims of authenticity. In a semantic adjudication, the leader and each validator independently call `gl.nondet.web.get`, decode the UTF-8 body, cap it at 4,000 characters, and compare the fetched body's SHA-256 to the committed digest. Missing sources, oversized content, or digest mismatch produce REVIEW_REQUIRED with evidence insufficient; they cannot produce APPROVED. Retrieved text is untrusted data and delimiter characters are escaped before prompting.

For a changed behavior on a registered dependency with verified evidence, V2 uses `gl.nondet.exec_prompt(..., response_format="json")` within `gl.vm.run_nondet_unsafe`. Each validator independently fetches the sources and runs the assessment. The strict JSON schema accepts only APPROVED, BLOCKED, or REVIEW_REQUIRED; a risk level; exact charter labels; a boolean evidence-sufficiency result; bounded advisory migration text; and bounded rationale. An APPROVED output is rejected unless violations are empty, evidence is sufficient, and risk is within the charter's explicit LOW/MEDIUM/HIGH tolerance.

The Equivalence Principle compares decision, risk, charter violations, and evidence sufficiency. Explanatory prose and migration wording may differ. Any invalid output, retrieval disagreement, or validator disagreement rejects the transaction; no contract state is committed by an unsuccessful write. URLs are fetched by validators, but publisher identity/provenance and the truth of evidence are not established by a matching hash.

## Passport binding

Each decision passport binds the protocol, release and agent IDs, publisher, immutable release snapshot hash, baseline/candidate/evidence hashes, charter and config versions, outcome/risk/violations/evidence sufficiency, deterministic impact hash, migration-advice hash, evidence retrieval profile, relevant appeal/freeze snapshot hashes, release authorization state, revision, and previous passport hash. The passport is content-addressed. `verify_passport` supports historical passport commitments. `get_passport` separately reports current authorization so a historically valid decision cannot be mistaken for a current grant.

GenVM does not expose the current transaction's final transaction hash to its own contract execution. Passport records therefore do not embed a transaction hash; clients should retain the finalized transaction hash as external finality evidence. V2 live passport and transaction verification remains untested until a separate deployment and test authorization.

## Watchtower and integrations

There are no background jobs in the contract. An external keeper may detect new evidence or aging decisions and call `request_reassessment`; that write is idempotent per current decision revision and is restricted to the agent controller or release publisher. The SDK CI gate is read-only and calls V2 `is_authorized` at `LATEST_FINAL` on StudioNet. It permits only a literal boolean `true`, returns machine-readable JSON, and exits nonzero on false, malformed values, missing configuration, or RPC errors.

## Fee and deployment boundaries

Every write can incur StudioNet protocol fees. V2 has not been deployed and no V2 write has been submitted. The separate V2 deployment and any live contract writes require explicit user authorization. Local Python tests use a fake GenLayer harness and do not demonstrate GenVM execution, validator votes, fee settlement, or live consensus.
