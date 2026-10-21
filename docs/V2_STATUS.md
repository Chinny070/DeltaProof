# DeltaProof V2 verification status

**Branch:** `codex/deltaproof-v2`  
**Network:** GenLayer StudioNet, chain 61999  
**Active contract:** [`0x367C2B9f8B52EEd57977B84c458eaD4c3105E718`](https://explorer-studio.genlayer.com/address/0x367c2b9f8b52eed57977b84c458ead4c3105e718)  
**Public V2 UI:** [deltaproof-v2.vercel.app/v2](https://deltaproof-v2.vercel.app/v2/)  
**Assessment:** **PARTIAL — not production ready.**

V1 remains separate and unchanged. V2 has finalized StudioNet deployment and live test records. Controlled synthetic fixtures are not production-service evidence. Full transaction details and latest-final snapshots are in [`proofs/v2-live.md`](proofs/v2-live.md) and [`proofs/v2-live.json`](proofs/v2-live.json).

## Verified live workflows

- **Checkout:** deterministic `BLOCKED`, latest-final authorization denied.
- **Analytics:** unaffected approval; targeted freeze and resolution finalized; fresh revision 2 is `APPROVED` / `ALLOW`. Revision history links the previous passport and freeze commitment.
- **Refund:** independent semantic consensus returned `BLOCKED`; evidence-backed appeal finalized `UPHELD`; latest-final authorization remains denied.
- **Event-tracing safety challenge:** the affected consumer and release were registered; initial semantic adjudication returned revision 1 `APPROVED`. A bounded strict-client test demonstrated that a strict JSON Schema consumer rejects added unknown fields. The challenge screen found the evidence credible and verified. Publisher response and all evidence retrievals were verified. Independent resolution returned `REVIEW_REQUIRED`, evidence insufficient because the synthetic case did not establish that the registered consumer uses strict schema validation. Fresh adjudication created revision 2 `REVIEW_REQUIRED`, MEDIUM risk. Its passport links to revision 1. Current authorization is `allow: false`, `REVIEW_REQUIRED`; the prior approval is historical only.
- **Targeting:** while the event-tracing authorization was held and reviewed, the unrelated Analytics pair remained `ALLOW` at revision 2.
- **Live CI gate:** run against event-tracing latest-final state after revision 2. It returned `allow: false`, `REVIEW_REQUIRED`, `LATEST_FINAL` and process exit code 1. This is an actual deployment-gate refusal.
- **Watchtower:** observed the event-tracing pair transition `ALLOW` → `SAFETY_CHALLENGE_PENDING` → `REASSESSMENT_REQUIRED` → `REVIEW_REQUIRED`, and Analytics `ALLOW` at revision 2. It encountered the StudioNet 500-requests/hour limit and a transient read error, recovered on later reads, then was stopped to avoid additional load.
- **Latest contract overview:** 4 agents, 2 releases, 4 decisions at the latest-final read.

The safety challenge lifecycle is complete. The event-tracing candidate remains denied until genuine evidence about the registered consumer is supplied or a revised release addresses the strict-client risk and a later finalized decision authorizes it.

## Test and build results

- Python: `python -m pytest -q` — **133 passed, 1 skipped**. The skipped test is gated StudioNet integration.
- GenVM lint: `genvm-lint check contracts/deltaproof_v2.py --json` — **3 checks passed**, schema found 34 methods (18 views, 16 writes). Advisory I200 reports the installed runner is older than recommended.
- GenVM typecheck: **no type errors** (UTF-8 console output enabled).
- StudioNet gltest integration selection: `gltest tests/integration -q --network studionet` — **1 skipped**. This is not a live V2 GenVM execution test.
- Frontend: `npm test` — **48 passed, 0 failed**.
- Production build: V1 and V2 entries built; 460 and 459 modules transformed. Largest emitted chunk was about 330 kB (100 kB gzip); no Vite chunk-size warning appeared.
- Public UI browser snapshot: earlier acceptance showed 3 agents, 1 release, and 3 decisions before the event-tracing records. Responsive checks at 375, 768, and 1440 CSS pixels found no horizontal overflow.

## Remaining blockers

- **The event-tracing release is not approved for use.** Its latest-final decision and gate state are `REVIEW_REQUIRED` / deny. The evidence is synthetic and does not verify that the registered consumer rejects unknown fields. A production consumer schema or a revised compatibility-safe release is needed before an approving adjudication.
- **Wallet browser acceptance is incomplete.** Chrome diagnostics showed MetaMask provider injection failing because another extension already defines a getter-only `window.ethereum`; the app saw no injected provider. Connect/disconnect, copy, persistence, network switching, signing, frontend writes, finality UI, and transaction-error UI remain unverified in a supported injected-wallet browser.
- **Public Vercel deployment of the corrected current source is unverified.** The public V2 page had stale explanatory copy during the earlier browser check. The source branch has been corrected, but no Vercel deployment credential was available to publish that update.
- **No actual V2 StudioNet GenVM execution test was run by gltest.** Its gated test was skipped. Lint and typecheck do not establish real GenVM runtime compatibility.
- **Settled fee totals remain unknown.** Explorer transaction value of 0 GEN and a receipt gas limit are not settled-fee evidence; the verified receipts did not expose the total protocol fee.

## Readiness

**PARTIAL / NO-GO for production readiness.** Live bounded workflows, independent consensus outcomes, safety challenge and response retrieval, targeted holds, passport revision history, a real CI gate rejection, and Watchtower state transitions are verified. The event-tracing authorization correctly fails closed at `REVIEW_REQUIRED`. Browser wallet acceptance, Vercel publication of corrected copy, settled protocol fee evidence, and real GenVM integration execution remain unverified. Do not claim full acceptance or production readiness until those requirements are addressed.
