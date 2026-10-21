# DeltaProof V2 status and final review

**Branch:** `codex/deltaproof-v2`  
**Network:** GenLayer StudioNet, chain 61999  
**Deployed contract:** [`0xEf72A2db4EbeD151273B137D8a741e4C537415f9`](https://explorer-studio.genlayer.com/address/0xef72a2db4ebed151273b137d8a741e4c537415f9)  
**Production UI:** [https://deltaproof-v2.vercel.app/v2/](https://deltaproof-v2.vercel.app/v2/)  
**Readiness:** **PARTIAL — current source and production frontend target are verified; the new contract has no application records and anonymous reviewer access is protected.**

## Fix-order status

1. **Mandatory evidence kinds — deployed and verified.** `required_evidence_kinds` uses AND semantics: every listed kind must be present in the submitted evidence set for semantic adjudication. Missing any one triggers deterministic `REVIEW_REQUIRED` before a model prompt. Every committed item must independently retrieve within bounds and match its SHA-256 before semantic approval. Hostile approval regression tests cover missing one or all required kinds. The current deployed source hash is `98c783f80a04caccab8077f55c6de8ee1ff792afb0c47594c26e4dcb92ec13ab`.
2. **Consensus-certified fields — scoped and documented.** Leader and validator agreement determines only `decision`, `risk`, `violations`, and `evidence_sufficient`. `migration` and `reason` remain bounded leader-selected advisory text; they are not validator-certified and must never drive authorization. A tampering regression test confirms changed leader advice does not turn `REVIEW_REQUIRED` into an authorization.
3. **Clean-checkout CI — fixed.** `tests/integration/test_studionet.py` now imports `gltest` only inside the live-gated test, so ordinary pytest collection does not require the runner. The CI workflow installs pytest only and includes the gated integration module; it skips without `DELTAPROOF_LIVE_TESTS=1`.
4. **V2 configuration and runtime smoke — current target verified.** The browser reads `VITE_DELTAPROOF_V2_ADDRESS`; the current target is `0xEf72A2db4EbeD151273B137D8a741e4C537415f9`, StudioNet chain 61999, RPC `https://studio.genlayer.com/api`. `npm run test:v2:runtime` makes three read-only latest-final calls for protocol, overview, and an explicitly selected pair. The current contract returned protocol `deltaproof/2.0` and a zeroed overview. Offline validation tests are included.
5. **Deployment source reconciliation — verified match.** Transaction [`0xa40625af8b4a3b0ad83564e30f22cd149d399e7cd229dcf6189791662e41518e`](https://explorer-studio.genlayer.com/tx/0xa40625af8b4a3b0ad83564e30f22cd149d399e7cd229dcf6189791662e41518e) is `FINALIZED`, `MAJORITY_AGREE`, with successful GenVM execution and five agreeing votes. Retrieved deployed code is 80,174 bytes and hashes to `98c783f80a04caccab8077f55c6de8ee1ff792afb0c47594c26e4dcb92ec13ab`, matching commit `f74a37a`. Latest-final reads returned the expected protocol, schema, and zeroed overview. Prior lifecycle receipts and states remain associated with superseded address `0x367C2B9f8B52EEd57977B84c458eaD4c3105E718`; proof is preserved, not migrated. Details: [`proofs/v2-deployment-2026-10-21.json`](proofs/v2-deployment-2026-10-21.json).
6. **Browser/operational checks — partial.** Rabby connection, address copy, disconnect/reconnect, refresh persistence, Base Sepolia→StudioNet switching, account-change handling, and off-chain `personal_sign` recovery were verified in the actual public V2 Chrome session. The recovered signer matched `0xaffE15eEc45b68835cc9E5B4Ab85dD5deaE8e70b`. The existing transaction `0x1568c7b546c075ee01b3e8d777781489173989e273a59adcb91f300e825f9198` was re-read as FINALIZED / MAJORITY_AGREE on the superseded contract, not the fresh address. A new wallet-signed contract write remains unverified. Rejection, account/network changes during a pending signed transaction, RPC recovery, and a visual finality UI path remain unverified.
7. **Status documentation — reconciled.** Prior finalized proofs report 4 agents, 2 releases, and 4 decisions on the superseded contract: Checkout BLOCKED, Analytics revision 2 ALLOW, Refund BLOCKED after an upheld appeal, and event tracing revision 2 REVIEW_REQUIRED after its safety challenge. The new contract and Vercel production frontend both report zero application records; none of those prior states are claimed on the current address.
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
- The prior live audit used ten read operations. The current redeployment was user-authorized; its fee was not exposed in the verified receipt. The current contract read verification was read-only.
- Vercel production deployment `dpl_5rFm7X1Tdj9DYfAfUhHRJGpmcqZC` is READY and its bundle was checked for the current address. Vercel reports authentication protection; anonymous reviewer access is not verified.

**Current verdict: PARTIAL.** The updated source is deployed and verified, and production V2 uses its address. Re-establish application records/lifecycles on the new contract only with separate authorization for those writes, confirm reviewer access, and complete remaining browser acceptance before claiming full release acceptance.
