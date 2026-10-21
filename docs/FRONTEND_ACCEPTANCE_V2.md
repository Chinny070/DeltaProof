# DeltaProof V2 frontend acceptance record

**Date:** 2026-10-21
**Public URL:** [https://deltaproof-v2.vercel.app/v2/](https://deltaproof-v2.vercel.app/v2/)
**Current Vercel production deployment:** `dpl_4UAdv1uSKjMATxPFXckDM24mntif` (`READY`)
**Immutable deployment URL:** [https://deltaproof-v2-67faydjk3-chinny070s-projects.vercel.app](https://deltaproof-v2-67faydjk3-chinny070s-projects.vercel.app)
**Current contract:** `0xEf72A2db4EbeD151273B137D8a741e4C537415f9` on StudioNet chain 61999. Earlier browser QA was against the superseded address `0x367C2B9f8B52EEd57977B84c458eaD4c3105E718`.

## Production configuration and current display

The actual public Chrome page read **4 agents, 2 releases, and 4 decisions** from the current configured StudioNet contract. Pair-specific latest-final checks returned Checkout `BLOCKED` and Analytics `ALLOW` at revision 2. Refund remains `BLOCKED`; EventTrace remains `REVIEW_REQUIRED`. These are finalized contract states, distinct from synthetic offline fixtures. An RPC read error is a read failure, never a confirmed authorization transition. Full lifecycle records are in [`proofs/v2-live-current-2026-10-21.md`](proofs/v2-live-current-2026-10-21.md).

The proof records distinguish deterministic compatibility checks from semantic independent-validator decisions. Synthetic, publisher-controlled fixtures are labeled as test fixtures. Evidence digest verification proves byte integrity only, not claim truth. Event tracing remains `REVIEW_REQUIRED`; no real consumer behavior is inferred from the synthetic scenario.

## Responsive browser QA

Chrome responsive emulation was set to exact widths **375px, 768px, and 1440px**. At each width, all eight sections (Protocol, Agent registry, Releases, Authorization gate, Safety & appeals, Passports, CI/CD, Protocol guide) were opened. No page-level horizontal overflow was observed. At 375px the navigation is horizontally scrollable, forms and cards stack, and the wallet control remains visible; at 768px and 1440px the sidebar and multi-column cards fit. Evidence lists/tables remain inside their scrolling containers. Long contract values are displayed within the existing bounded records. The gate state change is limited to the gate form and result panel; the deployed page was tested directly at the 402px emulated width and the live result cleared when the query changed. All eight-section matrix was completed before this gate-only change.

## Wallet verification

Rabby was tested on the actual public V2 URL in Chrome. Connection, address display and copying, disconnect/reconnect, refresh restoration, Base Sepolia to StudioNet switching, and account-change detection passed in the preceding browser interaction. The original account was restored on StudioNet afterward.

A one-time EIP-191 `personal_sign` test was requested from the connected Rabby provider. Rabby displayed the public origin and a message explicitly limited to signer-recovery QA, not a transaction or authorization. The approved signature recovered to `0xaffE15eEc45b68835cc9E5B4Ab85dD5deaE8e70b`, matching the requested signer. This verifies provider-level message signing and off-chain recovery; DeltaProof does not expose an in-app message-signing workflow. No GEN was spent and no contract write was submitted.

## Existing transaction tracking and fix

The existing finalized V2 transaction `0x1568c7b546c075ee01b3e8d777781489173989e273a59adcb91f300e825f9198` was read through `genlayer-js@1.1.8` on StudioNet. The SDK reported `FINALIZED` and `MAJORITY_AGREE`; its full receipt contained successful leader execution records. This is an existing transaction read, not a new write.

That receipt exposed a frontend defect: V2 requested the SDK's full raw transaction and checked `txExecutionResultName`, which is absent from the raw StudioNet shape. The tracker now requires `FINALIZED`, successful leader execution evidence (or an explicit `FINISHED_WITH_RETURN` field when supplied), and `MAJORITY_AGREE` when available. Missing execution evidence, errors, non-final status, and non-agreed consensus fail closed. Five regression cases cover these conditions. A new wallet-signed contract write remains **unverified** and was not attempted.

## Test and build record

- `npm test`: **65 passed, 0 failed**, including two regressions for exact gate-query/result association and fail-closed missing identity.
- `npm run build`: **passed** for root and `/v2/`; 460 modules transformed in each output.
- A read-only SDK receipt fetch for the existing transaction passed the corrected finality guard: `FINALIZED`, `MAJORITY_AGREE`, two successful leader execution records.
- No contract redeployment, new write, or paid lifecycle transaction was performed for this acceptance pass.
- StudioNet's observed RPC limit is 500 requests per hour. The current read-limit behavior was documented, and this pass did not treat a throttled RPC read as an authorization transition.

## Follow-up verification — 2026-10-21

The public Chrome tab at `/v2/` displayed four agents, two releases, and four decisions. A separate read-only audit retrieved the deployed source bytes, fetched four representative transaction receipts, and queried `get_overview` plus four pair-specific `get_authorization` values at `LATEST_FINAL`. The four current values were Checkout `BLOCKED`, Analytics revision 2 `ALLOW`, Refund `BLOCKED`, and event tracing revision 2 `REVIEW_REQUIRED`. See [`proofs/v2-final-audit-2026-10-21.json`](proofs/v2-final-audit-2026-10-21.json). This is a fresh chain read; it does not upgrade a historical approval into a permanent authorization.

This paragraph records the earlier audit of the superseded deployment: that contract’s hash was `72f114...5285c0`, while the then-current source was `98c783...ec13ab`. The evidence-enforcement source was subsequently deployed and independently retrieved from the current address with the exact matching hash. See [`v2-deployment-2026-10-21.json`](proofs/v2-deployment-2026-10-21.json).

Deployment `dpl_4UAdv1uSKjMATxPFXckDM24mntif` is `READY` in the existing `deltaproof-v2` production project. Anonymous `GET https://deltaproof-v2.vercel.app/v2/` returned HTTP 200. The served V2 bundle was verified to contain the new gate-state message and not the old result-rendering branch. After reloading the actual public Chrome tab, the V2 page displayed four agents, two releases, and four decisions. The gate initially showed no result for empty query state; changing the agent cleared the prior record and showed “Inputs changed; query again.” A read-only latest-final query for `checkout-live-20261020` + `v2api-20261020` returned `DENY` (`allow:false`); changing the agent cleared it again, and querying `analytics-live-20261020` + `v2api-20261020` returned `ALLOW` (`allow:true`, revision 2). Result cards stated the exact queried identity. Project-wide Vercel deployment protection is disabled under the user's authorization.

## Acceptance conclusion

Rabby connect, address display/copy, disconnect/reconnect, StudioNet switching, account-change detection, and an off-chain signature with recovered signer match were verified in prior live browser interaction. The existing finalized transaction was read and the V2 tracker regression-tested against the raw SDK receipt. Exact-width responsive checks covered all eight sections at 375px, 768px, and 1440px. Production bundle, anonymous access, and pair-specific gate results are verified. On the latest production reload, the UI showed `Connect wallet`; persistence therefore needs rechecking on this build. DevTools also recorded wallet-extension injection conflicts (including a MetaMask getter-only `window.ethereum` warning) and extension-origin errors. A new wallet-signed contract write, rejected signature, pending-transaction account/network changes, and visible UI finality edge path remain unverified.
