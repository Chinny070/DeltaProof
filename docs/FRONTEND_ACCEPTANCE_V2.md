# DeltaProof V2 frontend acceptance record

**Date:** 2026-10-21
**Public URL:** [https://deltaproof-v2.vercel.app/v2/](https://deltaproof-v2.vercel.app/v2/)
**Vercel production deployment:** `dpl_51RTQ41JrmTegWhh4gY3bJhk25Dh` (`READY`)
**Contract:** `0x367C2B9f8B52EEd57977B84c458eaD4c3105E718` on StudioNet chain 61999.

## Production configuration and current display

The public V2 app identifies StudioNet chain 61999, identifies the configured V2 contract, and labels reads as latest-final. A successful dashboard observation displayed **4 agents, 2 releases, and 4 decisions**. After read-heavy navigation, a later browser observation showed `checking RPC` and `No live value loaded` while StudioNet rate limiting took effect. Empty/loading placeholders are not on-chain state, and no authorization conclusion was drawn from them. Recorded lifecycle outcomes remain linked in [`proofs/v2-live.md`](proofs/v2-live.md).

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

- `npm test`: **59 passed, 0 failed**.
- `npm run build`: **passed** for the root and `/v2/` production outputs; 460 and 459 modules transformed, respectively.
- A read-only SDK receipt fetch for the existing transaction passed the corrected finality guard: `FINALIZED`, `MAJORITY_AGREE`, two successful leader execution records.
- No contract redeployment, new write, or paid lifecycle transaction was performed for this acceptance pass.
- StudioNet's observed RPC limit is 500 requests per hour. The current read-limit behavior was documented, and this pass did not treat a throttled RPC read as an authorization transition.

## Acceptance conclusion

Rabby connection and message signing are verified; recovered signer matched. The existing finalized transaction was retrieved and the V2 tracker was corrected and regression-tested against the raw SDK receipt shape. Production dashboard counts and configured StudioNet address were observed. Exact responsive acceptance at 375, 768, and 1440 pixels remains pending because browser viewport control stopped before all sections could be verified. The new V2 receipt-tracking fix is locally tested; a new wallet-signed contract write was not tested.
