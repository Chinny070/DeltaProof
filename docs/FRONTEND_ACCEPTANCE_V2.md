# DeltaProof V2 frontend acceptance record

**Date:** 2026-10-21
**Public URL:** [https://deltaproof-v2.vercel.app/v2/](https://deltaproof-v2.vercel.app/v2/)
**Current Vercel production deployment:** `dpl_5rFm7X1Tdj9DYfAfUhHRJGpmcqZC` (`READY`)
**Current contract:** `0xEf72A2db4EbeD151273B137D8a741e4C537415f9` on StudioNet chain 61999. Earlier browser QA was against the superseded address `0x367C2B9f8B52EEd57977B84c458eaD4c3105E718`.

## Production configuration and current display

Before the newest redeployment, the public app displayed **4 agents, 2 releases, and 4 decisions** from the previous contract. Those counts are historical and are not current state. After the new production build, the actual Chrome tab displayed **0 agents, 0 releases, and 0 decisions** from the current fresh contract; a separate latest-final runtime smoke confirmed the counts and returned `NO_DECISION` for a pair registered only on the previous deployment. During the earlier read-heavy navigation, a `checking RPC` / `No live value loaded` read error was not treated as state. Recorded historical lifecycle outcomes remain linked in [`proofs/v2-live.md`](proofs/v2-live.md).

The proof records distinguish deterministic compatibility checks from semantic independent-validator decisions. Synthetic, publisher-controlled fixtures are labeled as test fixtures. Evidence digest verification proves byte integrity only, not claim truth. Event tracing remains `REVIEW_REQUIRED`; no real consumer behavior is inferred from the synthetic scenario.

## Responsive browser QA

The prior acceptance record reported 375, 768, and 1440 pixel checks. This session could not independently reproduce the exact viewport tests: Chrome's viewport override returned a 375 CSS-pixel width once, then its debugger detached; the native Chrome window remained at another width and subsequent browser-control calls stopped. I opened Agent registry at a narrow layout, but could not reliably verify all eight sections at all three exact widths. Treat the earlier matrix as historical evidence, not a fresh pass from this acceptance run. Exact responsive acceptance remains **pending**.

The outstanding sections are Protocol, Agent registry, Releases, Authorization gate, Safety & appeals, Passports, CI/CD, and Protocol guide. In a browser session with reliable viewport control, record page overflow, component fit, wallet-menu visibility, and transaction notice legibility at 375 × 900, 768 × 900, and 1440 × 900, with screenshots.

## Wallet verification

Rabby was tested on the actual public V2 URL in Chrome. Connection, address display and copying, disconnect/reconnect, refresh restoration, Base Sepolia to StudioNet switching, and account-change detection passed in the preceding browser interaction. The original account was restored on StudioNet afterward.

A one-time EIP-191 `personal_sign` test was requested from the connected Rabby provider. Rabby displayed the public origin and a message explicitly limited to signer-recovery QA, not a transaction or authorization. The approved signature recovered to `0xaffE15eEc45b68835cc9E5B4Ab85dD5deaE8e70b`, matching the requested signer. This verifies provider-level message signing and off-chain recovery; DeltaProof does not expose an in-app message-signing workflow. No GEN was spent and no contract write was submitted.

## Existing transaction tracking and fix

The existing finalized V2 transaction `0x1568c7b546c075ee01b3e8d777781489173989e273a59adcb91f300e825f9198` was read through `genlayer-js@1.1.8` on StudioNet. The SDK reported `FINALIZED` and `MAJORITY_AGREE`; its full receipt contained successful leader execution records. This is an existing transaction read, not a new write.

That receipt exposed a frontend defect: V2 requested the SDK's full raw transaction and checked `txExecutionResultName`, which is absent from the raw StudioNet shape. The tracker now requires `FINALIZED`, successful leader execution evidence (or an explicit `FINISHED_WITH_RETURN` field when supplied), and `MAJORITY_AGREE` when available. Missing execution evidence, errors, non-final status, and non-agreed consensus fail closed. Five regression cases cover these conditions. A new wallet-signed contract write remains **unverified** and was not attempted.

## Test and build record

- `npm test`: **63 passed, 0 failed** after adding latest-final runtime-smoke and deployment-audit regressions.
- `npm run build`: **passed** for the root and `/v2/` production outputs; 460 and 459 modules transformed, respectively.
- A read-only SDK receipt fetch for the existing transaction passed the corrected finality guard: `FINALIZED`, `MAJORITY_AGREE`, two successful leader execution records.
- No contract redeployment, new write, or paid lifecycle transaction was performed for this acceptance pass.
- StudioNet's observed RPC limit is 500 requests per hour. The current read-limit behavior was documented, and this pass did not treat a throttled RPC read as an authorization transition.

## Follow-up verification — 2026-10-21

The public Chrome tab at `/v2/` displayed four agents, two releases, and four decisions. A separate read-only audit retrieved the deployed source bytes, fetched four representative transaction receipts, and queried `get_overview` plus four pair-specific `get_authorization` values at `LATEST_FINAL`. The four current values were Checkout `BLOCKED`, Analytics revision 2 `ALLOW`, Refund `BLOCKED`, and event tracing revision 2 `REVIEW_REQUIRED`. See [`proofs/v2-final-audit-2026-10-21.json`](proofs/v2-final-audit-2026-10-21.json). This is a fresh chain read; it does not upgrade a historical approval into a permanent authorization.

This paragraph records the earlier audit of the superseded deployment: that contract’s hash was `72f114...5285c0`, while the then-current source was `98c783...ec13ab`. The evidence-enforcement source was subsequently deployed and independently retrieved from the current address with the exact matching hash. See [`v2-deployment-2026-10-21.json`](proofs/v2-deployment-2026-10-21.json).

Vercel published deployment `dpl_5rFm7X1Tdj9DYfAfUhHRJGpmcqZC` to the existing production project. Its served V2 JavaScript bundle contains current contract `0xEf72A2db4EbeD151273B137D8a741e4C537415f9` and not the previous address. The actual Chrome tab was refreshed and showed 0 agents, 0 releases, and 0 decisions with no registered records, consistent with latest-final reads on the fresh contract. Vercel reports authentication deployment protection; anonymous reviewer access is not established. Exact all-eight-section responsive checks at 375, 768, and 1440 pixels were not reproduced in this session. Prior Rabby message signature recovery and existing finalized-transaction reads passed; a new signed contract write, rejected write, pending-transaction account/network changes, and UI finality edge-paths remain unverified.

## Acceptance conclusion

Rabby connection and message signing are verified; recovered signer matched. The existing finalized transaction was retrieved and the V2 tracker was corrected and regression-tested against the raw SDK receipt shape. Production dashboard counts and configured StudioNet address were observed. Exact responsive acceptance at 375, 768, and 1440 pixels remains pending because browser viewport control stopped before all sections could be verified. The new V2 receipt-tracking fix is locally tested; a new wallet-signed contract write was not tested.
