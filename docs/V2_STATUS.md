# DeltaProof V2 status and final review

**Branch:** `codex/deltaproof-v2`  
**Network:** GenLayer StudioNet, chain 61999  
**Deployed contract:** [`0x367C2B9f8B52EEd57977B84c458eaD4c3105E718`](https://explorer-studio.genlayer.com/address/0x367C2B9f8B52EEd57977B84c458eaD4c3105E718)  
**Production UI:** [https://deltaproof-v2.vercel.app/v2/](https://deltaproof-v2.vercel.app/v2/)  
**Readiness:** **PARTIAL — deployed contract source predates a required-evidence enforcement fix; no redeployment is claimed.**

## Fix-order status

1. **Mandatory evidence kinds — fixed in source; not yet on chain.** `required_evidence_kinds` uses AND semantics: every listed kind must be present in the submitted verified evidence set for semantic adjudication. Missing any one triggers deterministic `REVIEW_REQUIRED` before a model prompt. Evidence items still must all retrieve within bounds and match their SHA-256 commitments before a semantic decision. Hostile approval regression tests cover missing one or all required kinds. Deployment of this source correction has not been authorized or performed.
2. **Consensus-certified fields — scoped and documented.** Leader and validator agreement determines only `decision`, `risk`, `violations`, and `evidence_sufficient`. `migration` and `reason` remain bounded leader-selected advisory text; they are not validator-certified and must never drive authorization. A tampering regression test confirms changed leader advice does not turn `REVIEW_REQUIRED` into an authorization.
3. **Clean-checkout CI — fixed.** `tests/integration/test_studionet.py` now imports `gltest` only inside the live-gated test, so ordinary pytest collection does not require the runner. The CI workflow installs pytest only and includes the gated integration module; it skips without `DELTAPROOF_LIVE_TESTS=1`.
4. **V2 configuration and runtime smoke — reproducible in source.** The browser reads `VITE_DELTAPROOF_V2_ADDRESS`; the fixed target is contract `0x367C2B9f8B52EEd57977B84c458eaD4c3105E718`, StudioNet chain 61999, RPC `https://studio.genlayer.com/api`. `npm run test:v2:runtime` makes three read-only latest-final calls for protocol, overview, and an explicitly selected pair. Offline validation tests are included. A live run is reported only when executed with network access and exact pair IDs.
5. **Deployment source reconciliation — verified drift.** The live `gen_getContractCode` result SHA-256 `72f114e73c91f34a10de53f2715323c87b3048fe830c6d32492cdd00cf5285c0` matches the deployment record and historical source commit [`aee912c`](https://github.com/Chinny070/DeltaProof/commit/aee912c0635d6ca3b5782e97da2db733f9a20d6a). Current branch source SHA-256 is `98c783f80a04caccab8077f55c6de8ee1ff792afb0c47594c26e4dcb92ec13ab` (UTF-8 source normalized to LF) and does not match deployed bytes. Four representative finalized receipts and latest-final overview plus four pair states were freshly read on 2026-10-21; details are in [`proofs/v2-final-audit-2026-10-21.json`](proofs/v2-final-audit-2026-10-21.json). No transaction was submitted.
6. **Browser/operational checks — partial.** Rabby connection, address copy, disconnect/reconnect, refresh persistence, Base Sepolia→StudioNet switching, account-change handling, and off-chain `personal_sign` recovery were verified in the actual public V2 Chrome session. The recovered signer matched `0xaffE15eEc45b68835cc9E5B4Ab85dD5deaE8e70b`. The existing transaction `0x1568c7b546c075ee01b3e8d777781489173989e273a59adcb91f300e825f9198` was freshly re-read as FINALIZED / MAJORITY_AGREE with successful executions. A new wallet-signed contract write remains unverified. Rejection, account/network changes during a pending signed transaction, RPC recovery, and a visual finality UI path remain unverified.
7. **Status documentation — reconciled.** The latest-final audit at 2026-10-21 reports 4 agents, 2 releases, and 4 decisions: Checkout BLOCKED, Analytics revision 2 ALLOW, Refund BLOCKED after an upheld appeal, and event tracing revision 2 REVIEW_REQUIRED after an independently adjudicated safety challenge. Later finalized proofs supersede older statements that the challenge had not started or wallet acceptance was unavailable. The actual public V2 page also displayed 4/2/4 during this review.
8. **Optional polish — deferred.** Pagination, refresh sequencing and broader accessibility review are not represented as complete by this review.

## Live proof and evidence limits

The deployed StudioNet transactions show genuine GenVM execution and validator consensus. Offline Python tests use a lightweight harness; they are not real GenVM execution. The automated `gltest` integration is gated and has not been run as a V2 runtime pass. SHA-256 match proves that retrieved evidence bytes match the commitment, not that the claims are true or independent. Event-tracing fixtures are publisher-controlled synthetic test evidence and do not establish production consumer behavior. Historical `APPROVED` decisions are not equivalent to current authorization; only a fresh pair-specific latest-final gate read establishes that state.

Detailed transaction records are in [`proofs/v2-live.md`](proofs/v2-live.md) and [`proofs/v2-live.json`](proofs/v2-live.json). The deployment source hash and configuration record are in [`DEPLOYMENT_V2.md`](DEPLOYMENT_V2.md) and [`../deployments/studionet-v2.json`](../deployments/studionet-v2.json).

## Verification status

- `python -m pytest -q`: **135 passed, 1 skipped**. The skipped test is the live-gated integration; a second run with a meta-path import blocker preventing all `gltest` imports also completed **135 passed, 1 skipped**, demonstrating clean-checkout collection.
- `python -m compileall -q contracts tests`: passed.
- `genvm-lint check contracts/deltaproof_v2.py --json`: passed, 3 lint checks and ABI validation for 34 methods; the tool warned that a newer runner version is available but used its local cache.
- `genvm-lint typecheck contracts/deltaproof_v2.py --json`: passed with 0 errors, warnings, or infos.
- `cd frontend && npm run check`: **63 tests passed, 0 failed**; both root and `/v2/` Vite builds succeeded (460 and 459 modules transformed).
- The separate V2 GenVM `gltest` runtime remains unverified. Existing live contract transactions show genuine GenVM execution for the deployed historical source; offline harnesses and lint do not establish runtime behavior of current changed source.
- Clean-checkout CI collection is tested with an import blocker for `gltest`; the live integration remains skipped unless `DELTAPROOF_LIVE_TESTS=1`.
- The live audit used ten read operations and no writes, deployment, or GEN expenditure.
- The Vercel production URL may have deployment protection on non-custom domains. The latest deployment being READY does not prove anonymous reviewer access.

**Current verdict: PARTIAL / NO-GO for deploying or claiming the updated contract.** Resolve source drift through an authorized new deployment, verify latest-final state and representative receipts, and complete the remaining browser matrix before claiming full acceptance.
