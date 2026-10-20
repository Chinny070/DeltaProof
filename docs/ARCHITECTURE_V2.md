# DeltaProof V2 architecture

## Scope and boundaries

V2 is an independent contract and frontend entry point. It does not modify the deployed V1 address `0x50D7C07A081A56dBd30fB3a244C11A8105E4faA6` or the existing V1 `/` application. V2 will be served at `/v2/` only after a separately authorized deployment and configuration. The target is StudioNet (chain 61999, `https://studio.genlayer.com/api`).

The contract answers a narrower, enforceable question: **for this registered consumer, is this release authorized by its current charter and current contract state?** It cannot force an external agent or API provider to honor that answer. A consumer or its CI deployment pipeline must call `get_authorization` (or `is_authorized`) at latest-final state before adopting the version.

## Storage and bounded inputs

Storage uses GenVM `TreeMap[str, str]` records containing canonical JSON, plus bounded `u32` counters and insertion indexes. The contract stores:

- Agent controller, status, configuration version, current charter version, and direct dependencies. Each charter and configuration version is retained under a version key.
- Immutable release inputs: canonical baseline and candidate endpoint snapshots, their SHA-256 hashes, publisher identity, and evidence commitments. Mutable ACTIVE / SUPERSEDED / REVOKED authorization state is stored separately from the release bytes.
- Current per-agent decisions and immutable prior revisions, content-addressed passports, reassessment triggers, targeted freeze state/history, and application-level appeal stages/history.

Bounds include 1,000 agents, 5,000 releases, 10,000 agent-release decisions, 64 agent config versions, 32 decision revisions per pair, 16 dependencies per agent, 20 endpoints per snapshot, 16 required fields per endpoint direction, 16 guarantees and 16 unacceptable-change labels per charter, 12 evidence references per submission, 4,000 characters per fetched source and 12,000 retrieved evidence characters per assessment, 8 semantic route changes per assessment, at most 24 combined evidence references during a reassessment, 20 entries per registry page, 16 freeze cycles per agent-release pair, 20,000 freeze history events, 7-day freezes and challenge window, 1–4 safety challenge evidence items, at most two safety challenges per pair, a 3-day appeal window, a 2-day publisher response period, at most two appeal cycles per agent-release pair, and 90-day decision freshness.

Endpoint matching is direct, not a transitive agent-to-agent dependency graph. Route parameters are normalized, so `/users/{id}` and `/users/:user_id` are treated as the same route. Only dependencies present in the baseline are considered existing dependencies. A release that changes no registered consumer dependency gets a deterministic consumer-specific approval; a new or removed endpoint that affects a registered route is handled using criticality and deterministic field rules.

## State transitions and authorization

```text
Agent:    register ACTIVE -> controller updates versioned config/charter
                         -> SUSPENDED or REVOKED (revoked cannot reactivate)
Release:  register ACTIVE -> SUPERSEDED or REVOKED (source bytes remain unchanged)
Decision: absent -> adjudicated revision 1 -> explicit reassessment -> linked revision N
Appeal:   eligible non-approval -> OPEN -> UPHELD / OVERTURNED / INCONCLUSIVE
                                  -> unanswered timeout resolves INCONCLUSIVE
Safety:   affected controller submits verified, relevant counterevidence against APPROVED
          -> publisher response (48h) -> independent content retrieval + validator consensus
          -> UPHELD may release only that pair; BLOCKED / REVIEW_REQUIRED needs fresh adjudication
          -> timeout never restores approval; at most two challenges per pair within seven days
Freeze:   controller opens bounded (<= 7 day) release-agent freeze
                         -> controller or permissionless timeout closes the record
                         -> expiry alone never restores approval; fresh adjudication is required
```

`is_authorized(release_id, agent_id)` returns true only when the latest decision is APPROVED; the agent and release are ACTIVE; the decision's charter/configuration versions are still current; the decision is less than 90 days old; there is no unresolved freeze, open appeal, open safety challenge, or reassessment request; and the approval is otherwise present in finalized state. An expired but unclosed freeze remains a denial. `get_authorization` returns machine-readable `allow`, `status`, `reason`, revision, passport hash and pair identity. It is a read-only gate and does not use optimistic UI state.

Only the registered controller may change its agent record, suspend/revoke it, freeze its own agent-release authorization, appeal a non-approved decision, or challenge an approval affecting one of its registered dependencies. A safety challenge must arrive within seven days of the current approval, include one to four independently retrieved and digest-matched sources, and pass validator screening for credible, new, relevant content before the hold opens. At most two challenges are allowed per agent-release pair. A pending challenge holds only that pair. Only the release publisher may supersede/revoke its release or submit the one publisher response. Any caller may request a release evaluation or resolve an appeal/challenge after its publisher window closes. Changed/outdated revisions cannot be resolved as though current.

## Evidence and the GenLayer role

Evidence records include type, lowercase SHA-256, HTTPS public hostname, and a provenance label. URLs are not claims of authenticity. In a semantic adjudication, the leader and each validator independently call `gl.nondet.web.get`, decode the UTF-8 body, cap it at 4,000 characters, and compare the fetched body's SHA-256 to the committed digest. Missing sources, oversized content, or digest mismatch produce REVIEW_REQUIRED with evidence insufficient; they cannot produce APPROVED. Retrieved text is untrusted data and delimiter characters are escaped before prompting.

For a changed behavior on a registered dependency with verified evidence, V2 uses `gl.nondet.exec_prompt(..., response_format="json")` within `gl.vm.run_nondet_unsafe`. Each validator independently fetches the sources and runs the assessment. The strict JSON schema accepts only APPROVED, BLOCKED, or REVIEW_REQUIRED; a risk level; exact charter labels; a boolean evidence-sufficiency result; bounded advisory migration text; and bounded rationale. An APPROVED output is rejected unless violations are empty, evidence is sufficient, and risk is within the charter's explicit LOW/MEDIUM/HIGH tolerance.

The Equivalence Principle compares decision, risk, charter violations, and evidence sufficiency. Explanatory prose and migration wording may differ. Any invalid output, retrieval disagreement, or validator disagreement rejects the transaction; no contract state is committed by an unsuccessful write. Appeal and safety-challenge validators independently retrieve all submitted and original evidence, inspect retrieved contents, and agree on consequential outcomes. A challenge cannot open from a hash alone: validators first screen actual content for credible, new relevance. Missing or mismatched evidence cannot overturn an appeal or restore authorization. URLs are fetched by validators, but publisher identity/provenance and truth are not established by a matching hash.

## Passport binding

Each decision passport binds the protocol, release and agent IDs, publisher, immutable release snapshot hash, baseline/candidate/evidence hashes, charter and config versions, outcome/risk/violations/evidence sufficiency, deterministic impact hash, migration-advice hash, evidence retrieval profile, relevant appeal/freeze snapshot hashes, release authorization state, revision, and previous passport hash. The passport is content-addressed. `verify_passport` supports historical passport commitments. `get_passport` separately reports current authorization so a historically valid decision cannot be mistaken for a current grant.

GenVM does not expose the current transaction's final transaction hash to its own contract execution. Passport records therefore do not embed a transaction hash; clients should retain the finalized transaction hash as external finality evidence. V2 live passport and transaction verification remains untested until a separate deployment and test authorization.

## Watchtower and integrations

There are no background jobs in the contract. `frontend/integrations/watchtower.mjs` is a practical read-only observer: it polls up to 100 configured pairs at `LATEST_FINAL`, emits JSONL on state changes, and reports RPC/schema errors as denial events. It has no signer and does not submit paid writes. An authorized operator reviews an alert and signs a challenge or reassessment. `ci-gate.mjs` reads the structured `get_authorization` result and allows only a coherent `{allow:true,status:"ALLOW"}` response; all denials or errors fail the job.

## Fee and deployment boundaries

Every write can incur StudioNet protocol fees. V2 has not been deployed and no V2 write has been submitted. The separate V2 deployment and any live contract writes require explicit user authorization. Local Python tests use a fake GenLayer harness and do not demonstrate GenVM execution, validator votes, fee settlement, or live consensus.
