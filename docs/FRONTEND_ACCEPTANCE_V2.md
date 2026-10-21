# DeltaProof V2 frontend acceptance record

**Date:** 2026-10-21  
**Public URL:** [https://deltaproof-v2.vercel.app/v2/](https://deltaproof-v2.vercel.app/v2/)  
**Vercel production deployment:** `dpl_51RTQ41JrmTegWhh4gY3bJhk25Dh` (`READY`)  
**Contract:** `0x367C2B9f8B52EEd57977B84c458eaD4c3105E718` on StudioNet chain 61999.

## Production configuration and current display

The served V2 app identifies StudioNet chain 61999, identifies the V2 contract as configured, and labels reads as latest-final. An initial dashboard load during this pass displayed **4 agents, 2 releases, and 4 decisions**. After the read-heavy section sweep, a later page observation showed `checking RPC` and `No live value loaded` as StudioNet rate limiting took effect. The empty/loading values are not on-chain state, and no authorization conclusion was drawn from them. The browser check did not independently re-query every authorization pair; recorded outcomes remain linked in [`proofs/v2-live.md`](proofs/v2-live.md).

The current proof records distinguish deterministic compatibility checks from the semantic independent-validator path. Synthetic, publisher-controlled fixtures are labeled as test fixtures. Evidence digest verification is reported as byte-integrity verification only, not proof that a claim is true. Event tracing remains `REVIEW_REQUIRED`; do not relabel it as approved or infer behavior of a real consumer from the synthetic scenario.

## Responsive browser QA

The actual public URL was inspected at the following viewport sizes. At each width, all eight V2 sections were opened: Protocol, Agent registry, Releases, Authorization gate, Safety & appeals, Passports, CI/CD, and Protocol guide.

| Viewport | Sections checked | Document overflow | Cards outside viewport | Result |
| --- | ---: | --- | ---: | --- |
| 375 × 900 | 8/8 | None | 0 | Pass; mobile navigation rail scrolls horizontally within its own container |
| 768 × 900 | 8/8 | None | 0 | Pass |
| 1440 × 900 | 8/8 | None | 0 | Pass |

All checked controls had accessible names. Form controls, buttons, and cards stayed within their containers. Long code snippets in cards wrap at narrow widths after the `pre` wrapping correction. Tables and record lists use bounded internal scrolling where applicable. The wallet menu's CSS stays anchored within the viewport, but menu behavior with an injected provider was not verified. Browser screenshots for the three widths were captured during the QA session.

## Wallet verification

**Not verified; blocked by browser environment.** The in-app browser did not expose `window.ethereum`. The available Chrome extension tab was not accessible as an active tab to the automation session, preventing a controlled test with a clean profile containing exactly one supported wallet extension. No wallet was connected and no signature or transaction request was made.

The following acceptance checks therefore remain open: connect; display/copy address; disconnect and reconnect; refresh restoration; account changes; wrong-network switch to chain 61999; chain-change handling; safe signature request; transaction status/finality tracking; and transaction failure presentation. No wallet secret was requested or exposed. Complete these checks only in a local Chrome profile with Rabby or MetaMask available and unlocked by the user locally.

## Frontend test and build record

- `npm test`: **54 passed, 0 failed**.
- `npm run build`: **passed** for the root and `/v2/` builds; 460 and 459 modules transformed respectively.
- The public V2 project was redeployed to the existing Vercel project `deltaproof-v2`; no new Vercel project was created and V1 was not changed.
- No StudioNet write, contract redeployment, or paid lifecycle transaction was performed for this acceptance pass.

## Acceptance conclusion

Responsive presentation and offline frontend tests pass. Production chain configuration and live dashboard counts are confirmed. Complete wallet acceptance is still blocked on a browser session where one supported extension injects its provider; no wallet functionality should be described as verified until those interactions succeed.



## Read-limit behavior observed

The last screenshots in this browser session showed the RPC checking state and empty live-value placeholders. This pass did not treat a throttled read as a confirmed authorization transition. The earlier 4/2/4 counts are the last successful dashboard observation; a fresh post-recovery read remains outstanding.
