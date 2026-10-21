# DeltaProof V2 verification status

**Branch:** `codex/deltaproof-v2`  
**Network:** GenLayer StudioNet, chain 61999  
**Active contract:** [`0x367C2B9f8B52EEd57977B84c458eaD4c3105E718`](https://explorer-studio.genlayer.com/address/0x367c2b9f8b52eed57977b84c458ead4c3105e718)  
**Public V2 UI:** [deltaproof-v2.vercel.app/v2](https://deltaproof-v2.vercel.app/v2/)  
**Assessment:** **PARTIAL — not production ready.**

V1 remains separate and unchanged. V2 has finalized StudioNet deployment and live test records; do not interpret controlled synthetic fixtures as production-service evidence. Full transaction and latest-final details are in [`proofs/v2-live.md`](proofs/v2-live.md) and [`proofs/v2-live.json`](proofs/v2-live.json).

## Verified live workflows

- Checkout: deterministic `BLOCKED`, latest-final authorization denied.
- Analytics: deterministic unaffected approval; targeted freeze and resolution finalized; latest-final state is revision 2 `APPROVED` / `ALLOW`. Passport history links the previous passport and a freeze-history commitment. The attempted reassess command did not submit because the current state was `ALLOW`, not `REASSESSMENT_REQUIRED`.
- Refund: semantic GenLayer independent-consensus `BLOCKED`; the pinned synthetic evidence digest is `VERIFIED`. Evidence-backed appeal was finalized `UPHELD`; original/revised decision remains `BLOCKED`, and latest-final authorization remains denied.
- CI gate: live checks for Checkout, Analytics, and Refund match their latest-final decisions. Unknown or not-yet-registered pair returns `NO_DECISION`, deny, exit code 1.
- Watchtower: the new safety fixture observer captured four `NO_DECISION` observations and three transient `READ_ERROR` records during RPC fetch failures, then recovered to `NO_DECISION`; it was stopped after this diagnostic window. No safety-pair authorization transition has been observed.
- Receipt audit: the semantic adjudication and appeal-resolution receipts were fetched independently by transaction hash. Both report the same `tx_execution_hash` despite distinct transaction hashes, methods, nonces, gas limits, votes, arguments, and return values. This is recorded as the node/SDK output; its protocol meaning is not inferred.

## Test and build results

- Python: `python -m pytest -q` — **133 passed, 1 skipped**. The skipped test is gated StudioNet integration.
- GenVM lint: `genvm-lint check contracts/deltaproof_v2.py --json` — **3 checks passed**, schema found 34 methods (18 views, 16 writes). Advisory I200 reports the installed runner is older than recommended.
- GenVM typecheck: **no type errors** (UTF-8 console output enabled).
- StudioNet gltest integration selection: `gltest tests/integration -q --network studionet` — **1 skipped**. This is not a live V2 GenVM execution test.
- Frontend: `npm test` — **48 passed, 0 failed**.
- Production build: both V1 root and V2 `/v2/` entries built; 460 and 459 modules transformed. Largest emitted chunk is about 330 kB (100 kB gzip); no Vite chunk-size warning appeared.
- Public UI: Chrome rendered current live counts (3 agents, 1 release, 3 decisions). At 375, 768, and 1440 CSS pixels, document scroll width matched its client width (no horizontal overflow).

## Remaining blockers

- Safety challenge is incomplete. A new affected agent, release, and genuine semantic approval must first be submitted from the user's unlocked PowerShell terminal. Counterevidence may only be published after actual approval; response evidence must follow an opened challenge. The signer keychain is not available to the separate command runner.
- The Watchtower captured the initial `NO_DECISION` observation and is running against the new pair. It has not yet observed `ALLOW → SAFETY_CHALLENGE_PENDING → resolution`; no raw log record may be described as a transition.
- Browser wallet acceptance is incomplete. Chrome diagnostics show MetaMask failing provider injection because another wallet extension already defines a getter-only `window.ethereum`. The page sees no provider. Connect, disconnect, copy, persistence, network switching, account changes, wallet signing, frontend writes, finality UI, and transaction-error UI therefore remain unverified in a supported injected-wallet browser.
- No actual V2 StudioNet GenVM execution test was run by the gltest suite; the suite skipped its gated test. Lint and typecheck do not establish GenVM runtime compatibility.
- Fee totals are not exposed by the verified receipts. Explorer `0 GEN` transaction value and receipt gas limits are not settled-fee evidence.

## Readiness

**PARTIAL / NO-GO for production readiness.** The verified bounded workflows and tests are real and useful, but the safety-challenge lifecycle and real wallet/browser acceptance are still outstanding, and a gltest runtime execution has not been captured. Do not claim full acceptance or production readiness until those gaps are closed.

