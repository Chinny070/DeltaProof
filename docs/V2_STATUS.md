# DeltaProof V2 implementation status

**Branch:** `codex/deltaproof-v2`  
**Network target:** GenLayer StudioNet, chain 61999  
**Deployment status:** not deployed; no V2 transactions submitted  
**V1 status:** deployed V1 contract and root frontend remain intact.

## Implemented in this branch

- Standalone `DeltaProofV2` contract with controller registry, versioned dependencies/charters, immutable release payloads, publisher supersession/revocation, direct consumer impact analysis, bounded deterministic API checks, independent semantic evaluation, verified public evidence retrieval, targeted timed freezes, bounded application appeals, reassessment triggers, current authorization reads, and passport commitments.
- V2-specific `/v2/` responsive console. It reads only actual finalized contract state and shows an explicit unconfigured state without fabricating V2 records. The root route remains V1.
- Read-only GenLayerJS CI gate that queries `is_authorized` on StudioNet at `LATEST_FINAL` and fails closed.
- V1 CLI JSON-string regression coverage remains in place. V2 form tests assert string arguments and ABI order.
- Architecture, security review, and separate deployment preparation documents.

## Verification performed

- Offline Python suite: 111 passed, 1 skipped. The skipped test is the intentionally gated live StudioNet integration; no V2 live writes were attempted.
- Frontend Node suite: 40 passed, including the installed SDK's StudioNet chain/RPC/currency check, wallet lifecycle, V1 transaction finality and argument serialization, V2 ABI-form construction, and CI gate allow/deny/error tests.
- Vite production build: V1 root entry and V2 `/v2/` entry both built successfully. V1 transformed 460 modules; V2 transformed 459. No bundling warnings were emitted. SDK and CCIP packages are split into shared/dynamic chunks by Vite.
- `genvm-lint check contracts/deltaproof_v2.py --json`: passed 3 lint checks; schema reports 26 public methods (13 views, 13 writes). Advisory I200 says the installed py-genlayer runner is older than the recommended runner. The Vite development server also hit sandbox dependency-optimizer access errors; the production build succeeds. Browser visual QA could not complete because the in-app browser timed out opening the preview.
- Installed `genlayer-js` is 1.1.8. Local declarations/documentation confirm `createClient`, `readContract`, `writeContract`, `waitForTransactionReceipt`, `TransactionHashVariant.LATEST_FINAL`, `TransactionStatus.FINALIZED`, and `ExecutionResult.FINISHED_WITH_RETURN`. The V2 gate uses read-only access only.

## Remaining gates

- Run the source in a current GenVM/gltest execution environment, including actual storage serialization and actual web access. The current contract tests are a lightweight Python harness, not GenVM proof.
- Deploy V2 to StudioNet only after separate user approval; the existing V1 contract cannot run V2 methods.
- Conduct live finalized deterministic, semantic-consensus, evidence, freeze, appeal, passport, and integration cases after deployment and separate approval for each paid test batch.
- Verify MetaMask/Rabby/browser behavior and visual responsiveness in real browsers, configure V2 contract address, and publish the V2 route to Vercel only after live contract checks.
- Add transaction hash finality evidence to passports externally; GenVM contract code cannot observe the hash of its own transaction.

**Assessment: PARTIAL.** Useful V2 contract/frontend/integration code is implemented and offline-verified. It is not production-ready or live-tested.
