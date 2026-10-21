# DeltaProof V2 verification status

**Branch:** `codex/deltaproof-v2`  
**Network:** GenLayer StudioNet, chain 61999  
**Contract:** [`0x367C2B9f8B52EEd57977B84c458eaD4c3105E718`](https://explorer-studio.genlayer.com/address/0x367c2b9f8b52eed57977b84c458ead4c3105e718)  
**Production UI:** [https://deltaproof-v2.vercel.app/v2/](https://deltaproof-v2.vercel.app/v2/)  
**Latest verified Vercel production deployment:** `dpl_51RTQ41JrmTegWhh4gY3bJhk25Dh` (`READY`; alias remains the production URL above)  
**Assessment:** **PARTIAL — browser and wallet acceptance is incomplete.**

V1 remains separate and unchanged. No contract redeployment or paid StudioNet transaction was performed for this acceptance pass. The published frontend is configured for the existing V2 contract and reads finalized state from StudioNet. A fresh production page load displayed four agents, two releases, and four decisions. Transaction-by-transaction live proofs and their provenance are in [`proofs/v2-live.md`](proofs/v2-live.md) and [`proofs/v2-live.json`](proofs/v2-live.json).

## Live state and evidence boundaries

- The production page reports live counts of 4 agents, 2 releases, and 4 decisions. This UI count was freshly observed on 2026-10-21; the full authorization matrix was not re-queried in this browser acceptance pass.
- Recorded latest-final workflows include Checkout `BLOCKED`, Analytics revision 2 `APPROVED` / `ALLOW` after targeted freeze resolution, Refund `BLOCKED` with an upheld evidence-backed appeal, and event tracing `REVIEW_REQUIRED` after its safety challenge and follow-up adjudication; current authorization for that pair was not freshly re-queried in this browser pass. See the pinned transaction evidence in the live proof file.
- These are real finalized GenLayer StudioNet executions. The synthetic event-tracing fixtures demonstrate controlled test behavior; they are not evidence of a production consumer or production API telemetry.
- A matching SHA-256 digest establishes byte integrity against the committed evidence string. It does not establish that the evidence is true, representative, or independent of its publisher.
- A historical `APPROVED` verdict does not by itself imply current authorization. The app's gate reads the current finalized authorization for the exact release-agent pair and denies missing, frozen, stale, disputed, or otherwise ineligible states.
- The deployed live workflows demonstrate GenVM execution. The separate automated `gltest` integration remains skipped/gated and is not represented as a successful runtime test.

## Tests and build

- Frontend tests: `npm test` — **54 passed, 0 failed**.
- Production build: `npm run build` — **passed**; Vite built both the root and `/v2/` entries (460 and 459 modules transformed). Nonfatal chunking warnings were not build failures.
- The CSS correction makes code blocks in cards wrap long unbroken text, preventing the CI/CD page from widening the document at phone widths.
- Previously recorded contract checks remain: Python **133 passed, 1 skipped**; GenVM lint **3 checks passed** with an advisory about the installed runner version; typecheck passed; gated StudioNet `gltest` selection **1 skipped**. This frontend-only CSS change does not alter contract behavior.

## Responsive and navigation acceptance

The production V2 page was tested at exact viewport widths **375px, 768px, and 1440px**. Each of the eight navigation sections was opened at each width. At every width, all section pages had no unintended document-level horizontal overflow; cards stayed within the viewport; navigation controls were named; and no checked content escaped its container. At 375px, the navigation rail itself scrolls horizontally as intended while the page remains within the viewport. Long code content wraps inside its card. Screenshots were captured in the browser QA session at all three widths.

Detailed section-by-section results are in [`FRONTEND_ACCEPTANCE_V2.md`](FRONTEND_ACCEPTANCE_V2.md).

## Wallet acceptance blocker

Wallet acceptance was **not achieved**. The public page in the available in-app browser had no injected `window.ethereum`. The separate Chrome wallet-extension tab could not be brought into the active browser automation session, so a clean Chrome profile with exactly one Rabby or MetaMask provider was not available for verification. Consequently connect, address copy, disconnect/reconnect, persisted restoration, account/chain events, StudioNet switching, signing, and signed transaction finality/error UI remain unverified. No passwords, private keys, or recovery phrases were requested. Do not claim wallet acceptance based on a static UI or non-injected browser.

## Readiness

**PARTIAL / NO-GO for a claim of complete reviewer acceptance.** Responsive production UI and the offline frontend suite pass; live chain data is visible. A genuine injected-wallet browser session is still required to finish wallet acceptance. The separate `gltest` runtime remains unverified. No additional paid chain transaction is needed to resolve the wallet blocker.


