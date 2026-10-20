# DeltaProof V2 implementation status

**Branch:** `codex/deltaproof-v2`  
**Network target:** GenLayer StudioNet, chain 61999  
**Deployment status:** not deployed; no V2 transactions submitted  
**V1 status:** deployed V1 contract and root frontend remain intact.

## Implemented in this branch

- Standalone `DeltaProofV2` contract with versioned consumer charters and dependencies, normalized parameterized routes, immutable release payloads, direct impact results, bounded deterministic checks, independent semantic evaluation, and content-digest-verified evidence.
- Appeals retrieve and inspect counterevidence, publisher responses and original release evidence on leader and validator. A hash-only appeal cannot overturn; missing/mismatched evidence yields an inconclusive review. Consequential outcomes require validator agreement.
- Approved releases have a separate targeted safety-challenge flow: only an affected consumer controller can submit within seven days, with 1–4 verified sources; validators screen evidence as new and relevant before opening the hold. The publisher has a two-day response window. Two-cycle cap per pair. Pending, inconclusive, blocked or timed-out challenges deny that pair until safe resolution/fresh adjudication; unaffected pairs remain usable.
- Unresolved freezes stay denied after their timer; controller or permissionless timeout closes the event, and fresh adjudication is required. Exact revisions prevent stale appeal/challenge resolution. Historical decision, appeal, challenge, and freeze records have read-only verification/access methods.
- Structured machine-readable `get_authorization`; the CI gate validates pair identity and `allow/status` consistency at `LATEST_FINAL`. A read-only Watchtower observer polls up to 100 pairs and emits JSONL state changes without signing or spending.
- Guided `/v2/` responsive console: line-based charter/dependency and endpoint builders, finalized dependency-impact/evidence view, safety challenge and appeal workflows/timelines, freeze controls, passport verification, CI gate demo, persistent wallet session, and StudioNet switch. The existing V1 root remains unchanged.
- Architecture, security review, and separate deployment preparation documents.

## Verification performed

- Offline Python suite: 132 passed, 1 skipped. The skipped test is the intentionally gated live StudioNet integration; no V2 live writes were attempted.
- Frontend Node suite: 48 passed, including SDK StudioNet configuration, wallet lifecycle, V1 transaction finality and argument serialization, guided V2 form construction, CI gate failures, and Watchtower target validation/state-change behavior.
- Vite production build: V1 root entry and V2 `/v2/` entry both built successfully. V1 transformed 460 modules; V2 transformed 459. No bundling warnings were emitted. SDK and CCIP packages are split into shared/dynamic chunks by Vite.
- `genvm-lint check contracts/deltaproof_v2.py --json`: passed 3 lint checks; schema reports 34 public methods (18 views, 16 writes). `genvm-lint typecheck` passed with UTF-8 terminal output. Advisory I200 says the installed py-genlayer runner is older than the recommended runner. `gltest tests/integration -q --network studionet` selected StudioNet and skipped its gated V1 live test. This is not V2 runtime execution. The installed Python environment reports `genlayer-py 0.16.3` but no `py-genlayer` package. Browser visual QA could not complete because the in-app browser timed out opening the preview.
- Installed `genlayer-js` is 1.1.8. Local declarations/documentation confirm `createClient`, `readContract`, `writeContract`, `waitForTransactionReceipt`, `TransactionHashVariant.LATEST_FINAL`, `TransactionStatus.FINALIZED`, and `ExecutionResult.FINISHED_WITH_RETURN`. The V2 gate uses read-only access only.

## Remaining gates

- Obtain actual GenVM/gltest execution against V2, including TreeMap storage serialization, transaction timestamp behavior, independent `web.get`, actual LLM response types, and successful consensus. The environment has no V2 deployment/local GenVM service, and live writes were expressly out of scope.
- Deploy V2 to StudioNet only after separate user approval; the existing V1 contract cannot run V2 methods.
- Conduct live finalized deterministic, semantic-consensus, evidence screening/appeal/challenge, freeze, passport/history, Watchtower and integration cases after deployment and separate approval for each paid test batch.
- Verify MetaMask/Rabby/browser behavior and visual responsiveness in real browsers, configure V2 contract address, and publish the V2 route to Vercel only after live contract checks.
- Add transaction hash finality evidence to passports externally; GenVM contract code cannot observe the hash of its own transaction.

**Assessment: PARTIAL — not ready for deployment authorization yet.** The critical offline state-machine fixes, guided UI, CI gate and read-only observer are implemented and tested. Static lint/typecheck does not establish actual GenVM execution. Resolve the GenVM runner/runtime compatibility gap and complete real-browser review before deployment authorization; then run paid StudioNet consensus tests only with separate approval.
