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

The Refund appeal lifecycle is complete and upheld with all submitted evidence digests verified. No reassessment is indicated because the decision remains BLOCKED. The existing Analytics approval is unaffected and therefore is not eligible for a safety challenge; a separate genuinely approved affected pair would be required. Watchtower transition capture, CI rejection exercise, and injected-wallet browser acceptance remain outstanding. The prior browser console showed MetaMask failing to inject `window.ethereum` because the property was getter-only; wallet connection and signing remain unverified.

## Watchtower and CI gate latest-final verification

A fresh read-only GenLayerJS call at StudioNet `LATEST_FINAL` confirmed Checkout `BLOCKED` revision 1, Analytics `ALLOW` revision 2, and Refund `BLOCKED` revision 1. The Watchtower authorization poll returned the same three states and passport hashes. This records current snapshots; this poll did not observe a new state transition.

The CI gate was executed as a process for Refund using the configured V2 contract, release, and agent IDs. It returned the latest-final record with `allow: false`, status `BLOCKED`, revision 1, and process exit code `1`. This is an actual deployment-gate rejection. Analytics remains the live positive control at `ALLOW`, revision 2.

## Current assessment

PARTIAL. The V2 deployment, three consumer records, release, Checkout deterministic BLOCKED result, Refund semantic-consensus BLOCKED result, Analytics revision 2 APPROVED after targeted freeze and reassessment, passport history, targeted freeze resolution, unaffected Checkout/Refund authorizations, and evidence-backed Refund appeal UPHELD outcome are verified. The CI gate has produced a genuine nonzero rejection for Refund, and Watchtower latest-final snapshots match on-chain authorization state. A safety challenge is not eligible for the current unaffected Analytics approval. Capturing a Watchtower transition during a live state change and injected-wallet browser acceptance remain unverified.
