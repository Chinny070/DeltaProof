# DeltaProof V2 implementation status

**Branch:** `codex/deltaproof-v2`  
**Network target:** GenLayer StudioNet, chain 61999  
**Deployment status:** StudioNet deployed; three agents and one API release finalized and latest-final verified
**V1 status:** deployed V1 contract and root frontend remain intact.

The corrected V2 deployment transaction finalized with majority agreement, and its embedded source hash matches the corrected local source. The active address responds to SDK latest-final reads; the full 34-method schema is available. A real read-only CI gate call for an unknown pair returns an identity-bound `NO_DECISION` deny. The original deployment was superseded after its gate response omitted pair identity. Full evidence is in [`DEPLOYMENT_V2.md`](DEPLOYMENT_V2.md) and [`studionet-v2.json`](../deployments/studionet-v2.json).

## Implemented in this branch

- Standalone `DeltaProofV2` contract with versioned consumer charters and dependencies, normalized parameterized routes, immutable release payloads, direct impact results, bounded deterministic checks, independent semantic evaluation, and content-digest-verified evidence.
- Appeals retrieve and inspect counterevidence, publisher responses and original release evidence on leader and validator. A hash-only appeal cannot overturn; missing/mismatched evidence yields an inconclusive review. Consequential outcomes require validator agreement.
- Approved releases have a separate targeted safety-challenge flow: only an affected consumer controller can submit within seven days, with 1–4 verified sources; validators screen evidence as new and relevant before opening the hold. The publisher has a two-day response window. Two-cycle cap per pair. Pending, inconclusive, blocked or timed-out challenges deny that pair until safe resolution/fresh adjudication; unaffected pairs remain usable.
- Unresolved freezes stay denied after their timer; controller or permissionless timeout closes the event, and fresh adjudication is required. Exact revisions prevent stale appeal/challenge resolution. Historical decision, appeal, challenge, and freeze records have read-only verification/access methods.
- Structured machine-readable `get_authorization`; the CI gate validates pair identity and `allow/status` consistency at `LATEST_FINAL`. A read-only Watchtower observer polls up to 100 pairs and emits JSONL state changes without signing or spending.
- Guided `/v2/` responsive console: line-based charter/dependency and endpoint builders, finalized dependency-impact/evidence view, safety challenge and appeal workflows/timelines, freeze controls, passport verification, CI gate demo, persistent wallet session, and StudioNet switch. The existing V1 root remains unchanged.
- Architecture, security review, and separate deployment preparation documents.

## Verification performed

- Offline Python suite after the identity-bound gate fix: 133 passed. `gltest tests/integration -q --network studionet` selected StudioNet and skipped its single gated test. One V2 application registration was later submitted and verified live; that application write is not a GenVM integration-suite run.
- Frontend Node suite: 48 passed, including SDK StudioNet configuration, wallet lifecycle, V1 transaction finality and argument serialization, guided V2 form construction, CI gate failures, and Watchtower target validation/state-change behavior.
- Vite production build: V1 root entry and V2 `/v2/` entry both built successfully. V1 transformed 460 modules; V2 transformed 459. No bundling warnings were emitted. SDK and CCIP packages are split into shared/dynamic chunks by Vite.
- `genvm-lint check contracts/deltaproof_v2.py --json`: passed 3 lint checks; schema reports 34 public methods (18 views, 16 writes). `genvm-lint typecheck` passed with UTF-8 terminal output. Advisory I200 says the installed py-genlayer runner is older than the recommended runner. `gltest tests/integration -q --network studionet` selected StudioNet and skipped its gated V1 live test. This is not V2 runtime execution. The installed Python environment reports `genlayer-py 0.16.3` but no `py-genlayer` package. Browser visual QA could not complete because the in-app browser timed out opening the preview.
- Corrected V2 deployment: finalized transaction `0x1578c201d04155f61bf16594bdc0b663aacdf9c28be08b71b4ef07d0755a218e`; source SHA-256 matched the corrected local source; one round, majority agreement, 3 validator executions succeeded and 2 validators idled after quorum. SDK latest-final reads for protocol, overview, agents, releases, plus the complete 34-method schema succeeded. The live `ci-gate.mjs` returned an identity-bound `NO_DECISION` with `allow: false` for an unknown pair.
- Three V2 agent records (Checkout, Analytics, Refund), including their controller, dependency, and charter data, and one API release with verified baseline, candidate, and evidence commitments are confirmed at latest-final state in [`proofs/v2-live.md`](proofs/v2-live.md). Checkout, Refund, and release receipts are independently verified; the Analytics transaction hash was not captured and is not inferred. The live overview reports three agents, one release, and zero decisions. Adjudications remain pending.
- Public V2 frontend: production deployment `dpl_BUxTvqsSqjq5GBZBNwxLaeGs7Zx4` is live at [`https://deltaproof-v2.vercel.app/v2/`](https://deltaproof-v2.vercel.app/v2/). HTTP and browser smoke checks loaded the V2 page and showed latest-final counts of zero. Vercel project `deltaproof` and its V1 production URL are unchanged.
- Installed `genlayer-js` is 1.1.8. Local declarations/documentation confirm `createClient`, `readContract`, `writeContract`, `waitForTransactionReceipt`, `TransactionHashVariant.LATEST_FINAL`, `TransactionStatus.FINALIZED`, and `ExecutionResult.FINISHED_WITH_RETURN`. The V2 gate uses read-only access only.

## Remaining gates

- Continue live finalized deterministic, semantic-consensus, evidence screening/appeal/challenge, freeze, passport/history, Watchtower and integration cases. The deployment consensus verifies deployment only; it does not establish these application workflows. The unlocked signer is available in the user's Codex terminal, while the separate command runner cannot access its OS-keychain cache.
- Run the full lifecycle suite against the corrected contract. The live no-decision denial is verified, but allow, frozen, disputed, revoked, stale, and other gate paths need real records.
- Verify MetaMask/Rabby wallet signing and visual responsiveness in real browsers, then exercise frontend write flows after the live contract lifecycle tests.
- Add transaction hash finality evidence to passports externally; GenVM contract code cannot observe the hash of its own transaction.

**Assessment: PARTIAL — corrected deployment, deny gate, three agents, and one release verified; not production-ready.** The critical offline state-machine fixes, guided UI, CI gate and read-only observer are implemented and tested. The corrected deployment finalized with majority agreement, its embedded code matches the local checksum, all 34 methods are described by the deployed schema, and latest-final reads confirm three distinct controlled agent fixtures and a release with matching commitments. Deterministic and semantic decisions, appeals, challenges, freezes, passports, allow gate, and current frontend behavior remain unverified.

