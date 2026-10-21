# DeltaProof V2 live proof

**Snapshot:** 2026-10-20 18:18:00 UTC  
**Network:** GenLayer StudioNet, chain 61999  
**Active V2 contract:** [`0x367C2B9f8B52EEd57977B84c458eaD4c3105E718`](https://explorer-studio.genlayer.com/address/0x367c2b9f8b52eed57977b84c458ead4c3105e718)  
**Deployment:** [`0x1578c201d04155f61bf16594bdc0b663aacdf9c28be08b71b4ef07d0755a218e`](https://explorer-studio.genlayer.com/tx/0x1578c201d04155f61bf16594bdc0b663aacdf9c28be08b71b4ef07d0755a218e), finalized with majority agreement. Embedded source SHA-256: `72f114e73c91f34a10de53f2715323c87b3048fe830c6d32492cdd00cf5285c0`.

## First application write: Checkout agent

The live `register_agent` call [`0xc4399b7b5e4df126d8319959e7f11ea527bb5c6325784260c16227a0784a87da`](https://explorer-studio.genlayer.com/tx/0xc4399b7b5e4df126d8319959e7f11ea527bb5c6325784260c16227a0784a87da) finalized and executed successfully. SDK latest-final receipt reports `FINALIZED`, `MAJORITY_AGREE`, one round, and execution hash `0x87418f0f7f01f18867f2b67a4ea38ca7604365895e8ee7024f0ebcaed402b29c`. Five validators revealed; three voted `AGREE` and two `IDLE` after quorum. The explorer reports `SUCCESS` and return value `46ee87d212ab89fa0df01a75d3630801ce03a7a830aa10c5f4c97bde226ae1a2`.

The submitted argument order and types matched `register_agent(agent_id, name, dependencies_json, charter_json)`; both JSON fields were strings. Latest-final reads verified the agent ID `checkout-live-20261020`, controller `0xaffE15eEc45b68835cc9E5B4Ab85dD5deaE8e70b`, `ACTIVE` status, config and charter version 1, the `/payment` critical dependency, and the exact charter contents. At that point, the overview reported one agent, zero releases, and zero decisions. The machine-readable details and complete arguments are in [`v2-live.json`](v2-live.json).

Fee evidence: the explorer shows transaction value `0 GEN`; the SDK receipt reports gas limit `2895`. Neither is a settled protocol fee, and the total fee was not exposed.

## Additional agent registrations

The Analytics and Refund fixture records are both present at `LATEST_FINAL`, with the expected controller, active status, version 1, dependency route, and stored charter. The latest overview reports three agents, zero releases, and zero decisions.

The Refund `register_agent` transaction [`0x383a51570302a088dc0c5a62548073d7ae81ced8865b83ad7885fbe11f52480e`](https://explorer-studio.genlayer.com/tx/0x383a51570302a088dc0c5a62548073d7ae81ced8865b83ad7885fbe11f52480e) was independently checked with GenLayerJS 1.1.8: `FINALIZED`, `MAJORITY_AGREE`, one round, execution hash `0x1f13bcaaf50a7d578bce6d53445a86b585cf184f0987a95ce22de9f23dd76bb1`. The five validator votes were `AGREE, AGREE, AGREE, IDLE, IDLE`; the three agreeing executions succeeded and two validators idled after quorum. Explorer execution is `SUCCESS`. Latest-final reads verified the Refund agent, `/refunds` dependency, and LOW risk charter. Its transaction value was `0 GEN`, gas limit `2913`; settled protocol fee was not exposed.

At the earlier registry snapshot, Analytics was verified from latest-final state and its transaction hash had not yet been captured. Its adjudication and state are now documented below.

## Semantic test fixture preparation

A bounded synthetic scenario for the Refund consumer is pinned in GitHub commit [`6b3af4b0e8abe29c676c454596f29c1b6f24830f`](https://github.com/Chinny070/DeltaProof/commit/6b3af4b0e8abe29c676c454596f29c1b6f24830f). Its UTF-8 SHA-256 is `17014b71c97c5b08cda20058e7b68747a2c17930c9e9a1f37e30b02e0cefd6a9` (1,111 characters). The content is explicitly marked as a controlled synthetic scenario, not production telemetry. GitHub content was fetched at the pinned commit and its digest checked before use. The Refund adjudication now records this exact 1,111-character source as `VERIFIED` with the matching SHA-256 in its finalized evidence profile. The finalized semantic result binds that evidence profile and decision; the scenario remains synthetic, publisher-controlled test evidence rather than production telemetry.

## API release registration

The `register_release` call [`0xc34e2bdb8198415c48c16ffd4bd520b9cf81e0612f0e8bc1470640a930a4b92a`](https://explorer-studio.genlayer.com/tx/0xc34e2bdb8198415c48c16ffd4bd520b9cf81e0612f0e8bc1470640a930a4b92a) finalized with `MAJORITY_AGREE`; the SDK receipt has execution hash `0xa6741c743530674f89d18c38d9b6578d134920c1afcafddb82f25e31eec8a9d6`, one round, four `AGREE` votes and one `IDLE`. The explorer reports `SUCCESS`. Latest-final reads confirm the active release `v2api-20261020`, the authorized signer as publisher, and exact baseline, candidate, and evidence commitments. At release-registration finality, the overview reported three agents, one release, and zero decisions.

Stored commitments: baseline `51caa0b45677efcf626910cf9e1b715d666bd904ea8e74ba298d9acfcf4c5c15`; candidate `1e39a3201847cf409b9bf4f7cf1d5dc2179c7f5e10e24140ff3a7319427ba30c`; evidence collection `7ca7f285d0c1bd846472eebcae4dc2f2bda799b182be791093d2688860b38bb7`. The release includes a critical Checkout request schema change, an unchanged Analytics route, and a Refund behavior change. These are controlled test specifications, not claims about a production service. At release registration, validator-side retrieval had not yet been exercised; the later Refund adjudication below verified its pinned evidence digest.

The explorer shows value `0 GEN`; SDK receipt gas limit is `2920`. The settled protocol fee was not exposed.

## Checkout adjudication

The user-provided `adjudicate("v2api-20261020", "checkout-live-20261020")` transaction [`0xdaeec7b23ba9815852430f5d5bb11013a4bd4d3e8195fc32bc2bd062adfc4cba`](https://explorer-studio.genlayer.com/tx/0xdaeec7b23ba9815852430f5d5bb11013a4bd4d3e8195fc32bc2bd062adfc4cba) was independently checked through GenLayerJS 1.1.8. It is `FINALIZED`, `MAJORITY_AGREE`, one round, with votes `AGREE, IDLE, IDLE, AGREE, AGREE`; execution hash `0xabf80e3e434f47508128448f3bac94568aeef2aac008e1e74e373870bc5d6a19`. Latest-final contract reads report overview counts of 3 agents, 1 release, and 1 decision. Checkout decision revision 1 is `BLOCKED`, `HIGH` risk, mode `DETERMINISTIC_DEPENDENCY_CHECK`, because `/payment` newly requires `currency`. The identity-bound authorization is `allow: false`, status `BLOCKED`. Passport `ff515fb61c0c511b7628dcb3b11946bb51beb7a23956d90308b73d84be5c8cbc` currently authorizes nothing. This deterministic rule short-circuited semantic evidence retrieval; this result does not establish semantic validator reasoning or evidence retrieval. Receipt gas limit was 2922 and nonce 2922; transaction value shown by the explorer was 0 GEN; settled protocol fee was not exposed.

## Analytics adjudication

The `adjudicate("v2api-20261020", "analytics-live-20261020")` transaction [`0x3b9a613967877d63aee180e943905312728aac0449008597acc3fe19447ba140`](https://explorer-studio.genlayer.com/tx/0x3b9a613967877d63aee180e943905312728aac0449008597acc3fe19447ba140) was independently verified through GenLayerJS 1.1.8: `FINALIZED`, `MAJORITY_AGREE`, one round, votes `AGREE, AGREE, IDLE, IDLE, AGREE`, execution hash `0xb5d92aa4044eb34fd44363c2b9656eb99a85e76abe96141cd647d6dd83eb25aa`, return value `523d0e077f3919832f0e6bc0e1217fab271a91535cd0c9845d966f831d7bc5cb`. Latest-final reads show revision 1 `APPROVED`, LOW risk, mode `DETERMINISTIC_UNAFFECTED`, with no impacted dependencies or violations. The identity-bound authorization is `allow: true`, status `ALLOW`; passport `523d0e077f3919832f0e6bc0e1217fab271a91535cd0c9845d966f831d7bc5cb` reports `currently_authorized: true`. The overview now reports three agents, one release, and two decisions. This is a deterministic unaffected-pair path; it does not demonstrate semantic consensus or evidence retrieval. Gas limit and nonce were 2931; explorer transaction value was 0 GEN; settled fee was not exposed.

## Refund semantic adjudication

The `adjudicate("v2api-20261020", "refund-live-20261020")` transaction [`0xa94d0375e5b09e4949af6a7aefaa236cafef17928bb9bbd0c417c8b11a61e81c`](https://explorer-studio.genlayer.com/tx/0xa94d0375e5b09e4949af6a7aefaa236cafef17928bb9bbd0c417c8b11a61e81c) was independently verified via GenLayerJS 1.1.8: `FINALIZED`, `MAJORITY_AGREE`, one round, votes `AGREE, AGREE, IDLE, AGREE, IDLE`, execution hash `0x35b5a08f8c509e6670af8894067f509fb9992da500d1b9d2fd976befdd281447`. The explorer's equivalence output shows the evidence profile `{characters: 1111, sha256: 17014b71c97c5b08cda20058e7b68747a2c17930c9e9a1f37e30b02e0cefd6a9, status: VERIFIED}` and a `BLOCKED` judgment. The SDK receipt records two successful validator execution records and two validators idling after quorum; latest-final state matches the finalized result. This demonstrates the semantic GenLayer independent-consensus path for the controlled fixture. It does not establish production service behavior because the source is explicitly synthetic and publisher-controlled.

Latest-final decision revision 1 is `BLOCKED`, HIGH risk, mode `GENLAYER_INDEPENDENT_CONSENSUS`; findings cite the broken idempotency guarantee and duplicate refunds on retry. The identity-bound authorization is `allow: false`, status `BLOCKED`. Passport `5f42f8d02d3854449a1680d0b238c1c15b491cc354a4b8fd80d4c4256c729b1b` is not currently authorized. Overview counts are now 3 agents, 1 release, and 3 decisions. Receipt gas limit and nonce were 2936; transaction value shown by explorer was 0 GEN; settled protocol fee was not exposed.

## Live CI authorization matrix

A read-only call through `frontend/integrations/ci-gate.mjs` checked each exact release-agent pair at `LATEST_FINAL` on StudioNet chain 61999. Checkout returned identity-bound `BLOCKED` / `allow: false`; Analytics returned `ALLOW` / `allow: true`; Refund returned `BLOCKED` / `allow: false`. All three responses reported revision 1. These results match the latest-final decision and passport reads above; no transaction was submitted.

## Public Vercel read-only acceptance

At 2026-10-20 20:18 UTC, the deployed page at https://deltaproof-v2.vercel.app/v2/ loaded in the browser and displayed StudioNet V2 contract counts of 3 agents, 1 release, and 3 decisions. Refresh finalized state was used, and the Authorization Gate returned these real LATEST_FINAL results:

- Analytics (v2api-20261020): ALLOW, allow true, revision 1, passport 523d0e077f3919832f0e6bc0e1217fab271a91535cd0c9845d966f831d7bc5cb.
- Checkout (v2api-20261020): BLOCKED, allow false, revision 1, passport ff515fb61c0c511b7628dcb3b11946bb51beb7a23956d90308b73d84be5c8cbc.

No wallet connection or transaction was attempted. Page JavaScript reported window.ethereum as undefined. The browser console recorded a MetaMask provider-injection error because window.ethereum was getter-only. Browser wallet connection, signing, and responsive viewport behavior therefore remain unverified; resolve the provider-extension conflict and retest in a browser with one working injected provider.

## Targeted freeze, resolution, and reassessment



Freeze transaction [`0xcb3b5d88301abc713d0da43da9aa6889c5bd86aadc41b9f77b35a7c7b0d0e0c5`](https://explorer-studio.genlayer.com/tx/0xcb3b5d88301abc713d0da43da9aa6889c5bd86aadc41b9f77b35a7c7b0d0e0c5) is FINALIZED with SUCCESS execution and Accepted consensus. It called freeze_authorization for v2api-20261020 / analytics-live-20261020 with an 1800-second duration. Latest-final reads showed Analytics FROZEN / deny; Checkout and Refund remained BLOCKED at revision 1.



Resolution transaction [`0xfe963b610a6ad70a71a93ac06dddfd16dedc179cfe3870e22d632cae235448af`](https://explorer-studio.genlayer.com/tx/0xfe963b610a6ad70a71a93ac06dddfd16dedc179cfe3870e22d632cae235448af) is FINALIZED with SUCCESS execution and Accepted consensus. It called resolve_freeze for the same pair. Latest-final authorization moved to REASSESSMENT_REQUIRED / deny; it did not restore the prior approval. Checkout and Refund stayed BLOCKED.



Fresh adjudication transaction [`0xc9779d7d8607015a498b3a4d5739e300f38ba4ab3ed2567dcd1d8cd9d36814b5`](https://explorer-studio.genlayer.com/tx/0xc9779d7d8607015a498b3a4d5739e300f38ba4ab3ed2567dcd1d8cd9d36814b5) is FINALIZED with SUCCESS execution and Accepted consensus (nonce 3005). It called adjudicate(v2api-20261020, analytics-live-20261020) and returned passport 9c1faa0103660734288b4fe7c205bb0a50c4e72c21511b64249a7b88f3959ab0. The current decision is revision 2, APPROVED, LOW risk, DETERMINISTIC_UNAFFECTED, with no impacted dependencies. Latest-final authorization is ALLOW at revision 2.



History and passport verification: revision 1 remains APPROVED with passport 523d0e077f3919832f0e6bc0e1217fab271a91535cd0c9845d966f831d7bc5cb; revision 2's previous_passport_hash points to that value. verify_passport returned true for both revisions and false for an all-zero invalid hash. Checkout and Refund remain BLOCKED / allow false at revision 1 with their prior passport hashes.



The user later ran the reassess command and saw “Expected REASSESSMENT_REQUIRED; got ALLOW.” That invocation stopped at the script's preflight before sending a write. The contract transaction list and latest-final revision show the reassessment had already finalized; the reported error is consistent with a repeat run after completion. Do not rerun reassess.



Explorer shows 0 GEN transaction value for these calls; it does not expose settled protocol fees, so total cost is unknown.

## Refund appeal lifecycle

The appeal-opening transaction [`0xc2ea312d379e107504f4e0dca145e58b19c9eb234137089315b068fbb7f501b7`](https://explorer-studio.genlayer.com/tx/0xc2ea312d379e107504f4e0dca145e58b19c9eb234137089315b068fbb7f501b7) and publisher-response transaction [`0x2db0b0cbf867ba5ed5e11dd47e8cb9a47b331ccda20ef4348b3b0c1c9b198847`](https://explorer-studio.genlayer.com/tx/0x2db0b0cbf867ba5ed5e11dd47e8cb9a47b331ccda20ef4348b3b0c1c9b198847) are recorded above. The resolution transaction [`0x368bfe2894ea2ff715cfdd3a401a7aaa08bc40c461b5c2d0824285dba2e542ab`](https://explorer-studio.genlayer.com/tx/0x368bfe2894ea2ff715cfdd3a401a7aaa08bc40c461b5c2d0824285dba2e542ab) called `resolve_appeal` for `v2api-20261020` / `refund-live-20261020`. Explorer reports FINALIZED, SUCCESS execution, Accepted consensus, five initial validators, nonce 3008, and return value `4b56cc9093f26cec77636246f20cc1df451d462755be21039ca9ece89f8e0514`.

The independent GenLayerJS 1.1.8 receipt reports `FINALIZED`, `MAJORITY_AGREE`, one round, votes `AGREE, IDLE, AGREE, IDLE, AGREE`, execution hash `0x35b5a08f8c509e6670af8894067f509fb9992da500d1b9d2fd976befdd281447`, gas limit 3008, and nonce 3008. Two listed validator executions succeeded; two idle validator executions were cancelled after quorum. The receipt does not expose settled protocol fee. Explorer transaction value is 0 GEN, which does not establish a zero total fee.

The finalized equivalence output and independent latest-final reads agree: appeal outcome `UPHELD`, revised decision `BLOCKED`, risk HIGH, sufficient evidence, and all three evidence commitments `VERIFIED`: counterevidence (967 characters, SHA-256 `d962e37957fc5ac424b2e8fb2cf2f0fa3a33aaf6a9a5b91fd9d0b8e17421bbc0`), publisher response (1,077 characters, SHA-256 `08447a5517b38801586b18b71e502a79b2108963c2396fc4f8d6a7a74912ef00`), and original controlled release evidence (1,111 characters, SHA-256 `17014b71c97c5b08cda20058e7b68747a2c17930c9e9a1f37e30b02e0cefd6a9`). Consensus concluded the general POST semantics counterevidence does not negate the publisher-defined candidate behavior in this controlled fixture, which violates the registered idempotency guarantee.

Latest-final state confirms the appeal is `RESOLVED` / `UPHELD`, Refund remains decision revision 1 `BLOCKED`, authorization remains `allow: false`, and its original passport remains not currently authorized. The resolved appeal event was independently retrieved using snapshot commitment `8d0694c0bc3e743ea2cff16696679c594d7d09ec6b98246e3a99c83e7a838e09`. These are controlled synthetic fixtures and do not establish production Refund API behavior.

## Remaining live lifecycle work

The Refund appeal lifecycle is complete and upheld with all submitted evidence digests verified. No reassessment is indicated because the decision remains BLOCKED. Analytics is unaffected and ineligible for a challenge; a separate affected pair is prepared but not yet registered or approved. A read-only Watchtower polled that fixture pair at 15-second intervals. The raw JSONL has four `NO_DECISION` observations and three transient `READ_ERROR` entries during failed RPC fetches; it recovered to `NO_DECISION` at `2026-10-21T07:06:44.096Z`, then was stopped. No authorization transition was observed. The CI gate baseline for the unregistered pair returned `NO_DECISION`, deny, exit code 1. The previous account-wide CI checks still show Checkout BLOCKED, Analytics ALLOW at revision 2, and Refund BLOCKED.

## Watchtower and CI gate latest-final verification

A fresh read-only GenLayerJS call at StudioNet `LATEST_FINAL` confirmed Checkout `BLOCKED` revision 1, Analytics `ALLOW` revision 2, and Refund `BLOCKED` revision 1. The Watchtower authorization poll returned the same three states and passport hashes. This records current snapshots; this poll did not observe a new state transition.

The CI gate was executed as a process for Refund using the configured V2 contract, release, and agent IDs. It returned the latest-final record with `allow: false`, status `BLOCKED`, revision 1, and process exit code `1`. This is an actual deployment-gate rejection. Analytics remains the live positive control at `ALLOW`, revision 2.

## Current assessment

PARTIAL. The V2 deployment, three consumer records, release, Checkout deterministic BLOCKED result, Refund semantic-consensus BLOCKED result, Analytics revision 2 APPROVED after targeted freeze and reassessment, passport history, targeted freeze resolution, unaffected Checkout/Refund authorizations, and evidence-backed Refund appeal UPHELD outcome are verified. The CI gate has produced a genuine nonzero rejection for Refund, and Watchtower latest-final snapshots match on-chain authorization state. A safety challenge is not eligible for the current unaffected Analytics approval. Capturing a Watchtower transition during a live state change and injected-wallet browser acceptance remain unverified.


## Repeated execution hash receipt audit

Both transaction receipts were independently fetched again with GenLayerJS 1.1.8 using each transaction hash. The Refund semantic adjudication `0xa94d0375e5b09e4949af6a7aefaa236cafef17928bb9bbd0c417c8b11a61e81c` and the appeal-resolution transaction `0x368bfe2894ea2ff715cfdd3a401a7aaa08bc40c461b5c2d0824285dba2e542ab` each returned `tx_execution_hash: 0x35b5a08f8c509e6670af8894067f509fb9992da500d1b9d2fd976befdd281447`. They have different transaction hashes, methods, nonces (2936 and 3008), gas limits (2936 and 3008), vote arrays, arguments, and return values. The shared value is confirmed as node/SDK output rather than an accidental local copy. Its protocol semantics are not established here; it is preserved verbatim and not used as a unique transaction identifier.

## Safety fixture and observer start

The new affected-pair fixture `eventtrace-live-20261021` / `eventtrace-v2-20261021` is explicitly synthetic and publisher-controlled. Its bounded compatibility evidence is pinned to a public GitHub commit and preflight fetched the exact bytes and verified SHA-256 `dab5d3a1431c08b850ebe09f910ec28a8c4a56a6108654d55a944422e0f08d25`. Read-only preflight found the agent, release, and decision do not yet exist; no transaction was sent. Before any safety writes, Watchtower polling began at 15-second intervals. The raw log contains four `NO_DECISION` entries and three transient `READ_ERROR` entries from failed RPC fetches. It returned to `NO_DECISION` at `2026-10-21T07:06:44.096Z` and was stopped; no approval, challenge, or resolution transition was observed. The separate command runner cannot access the signer cached in the user's unlocked PowerShell terminal, so these remaining writes require that terminal.

## Browser checks and public copy

Chrome displayed the public dashboard with three agents, one release, and three decisions. Responsive viewport checks at 375, 768, and 1440 CSS pixels found no horizontal overflow. The tested profile's console says MetaMask could not set the global provider because another extension had already installed a getter-only `window.ethereum`; the app context saw no provider. No source code assignment to `window.ethereum` was found. Wallet connection and signing remain unverified. The deployed sidebar still contains the stale sentence “V2 is not live until a V2 contract address is configured,” even while displaying live state; the local source copy is corrected, but no Vercel deployment credential is available to publish that copy.

## Event-tracing safety challenge lifecycle — verified 2026-10-21

This section supersedes the earlier preflight note that said the safety challenge had not started. The V2 contract was not redeployed. All transactions below target StudioNet contract `0x367C2B9f8B52EEd57977B84c458eaD4c3105E718` and were reported FINALIZED / SUCCESS by the StudioNet Explorer; independent GenLayerJS receipt checks and latest-final reads were completed for the lifecycle. Explorer transaction value is 0 GEN; settled protocol fees were not exposed, so total fees are unknown.

1. **Affected consumer registered:** [`0x28dda8c481db53abf235f8c0d623ccc1448c1cd074272ac20001f9c4f680776b`](https://explorer-studio.genlayer.com/tx/0x28dda8c481db53abf235f8c0d623ccc1448c1cd074272ac20001f9c4f680776b), nonce 3038. Latest-final read confirms active `eventtrace-live-20261021`, charter v1, critical dependency `GET /events/{event_id}`, guarantees stable event ID and payload preservation.
2. **Release registered:** [`0x51ab176ab86748291787e3a55190ac98a8667c38b63b1c48fb39b630afc650de`](https://explorer-studio.genlayer.com/tx/0x51ab176ab86748291787e3a55190ac98a8667c38b63b1c48fb39b630afc650de), nonce 3039. Latest-final read verifies active release `eventtrace-v2-20261021`, version 2.1.0, baseline hash `50bba339dd3124322343d134c470ffdfc265002c4eecd2e749520bf53b4faf8c`, candidate hash `81d120a96bfc594e0289e850b97a1fec27b5260e3c377d89c040e29bde4811ed`, and evidence commitment.
3. **Initial adjudication:** [`0x7f0ceaa5fd391d44d1e71890433000149a427803e07ecf0ac55a0b7883f7f496`](https://explorer-studio.genlayer.com/tx/0x7f0ceaa5fd391d44d1e71890433000149a427803e07ecf0ac55a0b7883f7f496), nonce 3040, produced a genuine `GENLAYER_INDEPENDENT_CONSENSUS` approval at revision 1 (LOW risk), passport `9d739f57b9b8ac5d6624d50396088efd3b511e4f494db0bca0fc84fef24aa786`. The evidence profile verified the pinned synthetic compatibility fixture.
4. **Safety challenge opened:** [`0x4778b15ea4ccc12da2af3ebd829710b78e9437053f3b9d20292a20a0fa3d960f`](https://explorer-studio.genlayer.com/tx/0x4778b15ea4ccc12da2af3ebd829710b78e9437053f3b9d20292a20a0fa3d960f), nonce 3041. The independent screen marked the strict-client evidence credible; its exact source SHA-256 `947ad0040e20bfc997e0254f3c5acaca569599a7f2b22a9a62a7626b2e48f7d1` was verified. The event-tracing authorization became `SAFETY_CHALLENGE_PENDING`; Analytics remained `ALLOW` at revision 2.
5. **Publisher response recorded:** [`0xfa986d45c1dfc5773cb13ab374180e8bc129ee270ae0027ab8c2baacb7329e62`](https://explorer-studio.genlayer.com/tx/0xfa986d45c1dfc5773cb13ab374180e8bc129ee270ae0027ab8c2baacb7329e62), nonce 3042. The response acknowledged the strict-schema failure and made no claims about production consumers. Its source SHA-256 `9d1367b4a320ea98c7fdf03dddb6c6e4c1c40b28c66c0c4abe90f0a6c337b6f8` was later verified on chain.
6. **Challenge resolved:** [`0x3ec964e9d026318c1d9c725f83ed6d5d87a0ca5d3ea38429be1b856f8c13937e`](https://explorer-studio.genlayer.com/tx/0x3ec964e9d026318c1d9c725f83ed6d5d87a0ca5d3ea38429be1b856f8c13937e), nonce 3043, rotation count 1, returned resolution hash `a197579c69779bd8ddfdc341d00355c8450664b47ef32e9ac8f3251915e316b6`. Validators returned `REVIEW_REQUIRED`, MEDIUM risk, `evidence_sufficient: false`. All three sources (initial fixture, counterevidence, response) were independently retrieved and marked VERIFIED. Their conclusion was that strict consumers could break, but the synthetic evidence did not establish that the registered consumer rejects unknown properties.
7. **Fresh adjudication:** [`0x1568c7b546c075ee01b3e8d777781489173989e273a59adcb91f300e825f9198`](https://explorer-studio.genlayer.com/tx/0x1568c7b546c075ee01b3e8d777781489173989e273a59adcb91f300e825f9198), nonce 3044, rotation count 1. Revision 2 is `REVIEW_REQUIRED`, MEDIUM risk, with passport `5609a8732ec63b7a16890a365458bfff05881fa085686f9b59f90f1f518fead9`; its `previous_passport_hash` links to revision 1's approval passport. The authorization is `allow: false`, `REVIEW_REQUIRED`. Revision 1 remains available and verifiable; it is not currently authorized.

### Watchtower and CI gate

The read-only Watchtower emitted the actual latest-final state transitions for the event-tracing pair: `ALLOW` revision 1 → `SAFETY_CHALLENGE_PENDING` → `REASSESSMENT_REQUIRED` → `REVIEW_REQUIRED` revision 2. It also observed the unaffected Analytics pair at `ALLOW` revision 2. The observer encountered a StudioNet limit of 500 requests/hour and a transient `READ_ERROR`; subsequent reads recovered. Polling was stopped to avoid additional load. The state observations are summarized in `v2-live.json`.

The live read-only CI gate was then run for the event-tracing pair. It returned the contract's latest-final `REVIEW_REQUIRED` record with `allow: false` and exited with code 1, demonstrating a real deployment-gate rejection. No transaction was submitted by the gate.

### Current result and remaining condition

The safety-challenge lifecycle is complete, but this release is **not authorized**: current state is `REVIEW_REQUIRED`. The original approval is preserved as historical revision 1, and the new passport history correctly links revision 2 to it. Analytics remained unaffected and authorized.

The evidence is a publisher-controlled synthetic strict-client test, not production telemetry or proof that the registered client uses a strict schema. To resolve the product risk, obtain genuine evidence of the affected consumer's response schema or update the release to make tracing metadata opt-in / preserve a legacy response shape, then register and adjudicate that new release. No such production evidence or implementation change was supplied or asserted here. The existing candidate must remain blocked by the CI gate until a later finalized authorization permits it.



## Final production frontend acceptance — 2026-10-21

**This section supersedes the older 2026-10-20 public frontend snapshot and deployment note above.** The production URL [https://deltaproof-v2.vercel.app/v2/](https://deltaproof-v2.vercel.app/v2/) is served by Vercel deployment `dpl_51RTQ41JrmTegWhh4gY3bJhk25Dh` in the existing `deltaproof-v2` project. The served CSS asset is `/v2/assets/index-DPNfKmjg.css`; browser inspection confirmed its card `pre` blocks use `pre-wrap` and `overflow-wrap:anywhere`. An earlier dashboard read during this pass displayed 4 agents, 2 releases, and 4 decisions. After the read-heavy section sweep, the latest screenshots showed `checking RPC` / `No live value loaded` as the StudioNet request limit was reached; this read failure is not interpreted as an authorization result.

All eight V2 sections were opened at each exact viewport width 375px, 768px, and 1440px. No document-level horizontal overflow occurred; cards, checked form controls, and buttons remained in bounds. The 375px navigation rail scrolls horizontally inside its own container. Screenshots were captured during the browser session. No full authorization-pair matrix was re-queried in this frontend pass; use the immediately preceding latest-final records above for recorded decision states.

Wallet acceptance remains incomplete. The in-app browser exposed no `window.ethereum`, and the separate Chrome extension tab could not be activated in this automation session. No connection, signature, or transaction was attempted. The clean single-wallet profile checks remain unverified. No contract redeployment or paid StudioNet transaction was submitted for this frontend pass.


The last browser screenshots after the sweep show the RPC checking state and empty-value placeholders. A fresh post-recovery read was not available in this pass; the 4/2/4 result is the earlier successful dashboard observation, not a claim that the throttled read succeeded.
