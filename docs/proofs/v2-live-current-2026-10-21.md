# DeltaProof V2 current StudioNet lifecycle evidence

**Network:** GenLayer StudioNet, chain 61999  
**Contract:** [`0xEf72A2db4EbeD151273B137D8a741e4C537415f9`](https://explorer-studio.genlayer.com/address/0xef72a2db4ebed151273b137d8a741e4c537415f9)  
**Deployment:** [`0xa40625af8b4a3b0ad83564e30f22cd149d399e7cd229dcf6189791662e41518e`](https://explorer-studio.genlayer.com/tx/0xa40625af8b4a3b0ad83564e30f22cd149d399e7cd229dcf6189791662e41518e)  
**Signer:** `0xaffE15eec45b68835cc9E5B4Ab85dD5deaE8e70b`

This report records transactions executed against the current deployment. Each listed transaction was supplied in the StudioNet explorer record as `FINALIZED`, consensus `Accepted`, with successful GenVM execution. The transaction value shown as `0 GEN` is not a fee measurement; settled protocol fees were not independently available. Do not infer a zero fee.

## Current records and lifecycle

| Lifecycle action | Transaction hash | Finalized result |
| --- | --- | --- |
| Register Checkout consumer | `0xecfcf0b8fd5d21728153c0294c6d381ee81cd2ff37d4ca6dd4aa35e5c24a5cae` | Registered `checkout-live-20261020` |
| Register Analytics consumer | `0x7149bf8be55f2ae9abcba8c5906b4551b54aec24b46ba580378b60059575a3ef` | Registered `analytics-live-20261020` |
| Register Refund consumer | `0x03c67e15ad6c786c4bd5ef85a3e6809cecd7002fc603990bf6a9b89f63d4c14b` | Registered `refund-live-20261020` |
| Register EventTrace consumer | `0x436148a09e93b54a5a5cd009e3d06a6bfc3a5edf7ad8ee112932cf2e08d5bde9` | Registered `eventtrace-live-20261021` |
| Register API release | `0xc3b6b4441ab12d4a1b6a4b7d24f592e525f3fe0851d2089105fe859c47873193` | Registered `v2api-20261020` |
| Register EventTrace release | `0x68bc2245a04785d8a0f1161a957db43f24544f942f9051db62b2e968a09ed844` | Registered `eventtrace-v2-20261021` |
| Checkout deterministic adjudication | `0x10b143e7b1805822069135fbba588ec96aea6568cc3612ee11f1fda149cca966` | `BLOCKED` |
| Analytics adjudication | `0x6b4f5c9e98bb57b1ae2584a7ba7efb629e7ac9d81be33d3b0f5a2a48408697c2` | Revision 1 `APPROVED`; later freeze required a fresh decision |
| Target Analytics freeze | `0x769306345bed876d69b5a897cb8897e319b6aa3a5a08cd29aef40ae66b04a986` | Finalized targeted freeze |
| Resolve Analytics freeze | `0x1a8ea7efbbc8e9ccd9a60b74af8fd5147a28e6d3ca8cf018f2716ffe9316896a` | Required reassessment |
| Analytics reassessment | `0xb5ed7eaa73cd8dc18be058d46c0ba1dafcd23629bbfd9cee7fad7854cad6fa0f` | Revision 2 `APPROVED`; latest-final authorization `ALLOW` |
| Refund semantic adjudication | `0x99a665c59ae973afe674831313635db508ba9f1b40c2afc0ca254becf7e9bd67` | `BLOCKED`, high risk; validator consensus; evidence digest verified |
| Refund appeal opened | `0x1a44acd94fa1af6246a5ed5dc849310ce06ee671b33b09672365d4d597ba5446` | Accepted |
| Refund appeal response | `0x1cef6a238c52949429666ffc86e5ef6926fab326d7b31a233690ad603a7e72da` | Accepted |
| Refund appeal resolved | `0x61ee795b0ecc3c2e25fcc5eb9d350ca12c9837d4a97db52f669cf43fa3a81852` | `UPHELD`; remains `BLOCKED`; evidence retrieved and digest checked |
| EventTrace semantic adjudication | `0x2b0d41ade8555eb8dad2541e0c0c25f19cf16cf795bd16318dbda2c132614411` | Revision 1 `APPROVED`; publisher-controlled synthetic fixture |
| EventTrace safety challenge opened | `0x93dceac0db06dc2c2ca6cea9734939315d3137ddce71f0cdcd6bc9d8171749a4` | `SAFETY_CHALLENGE_PENDING`; targeted authorization hold |
| EventTrace publisher response | `0xa8df0b635ab13062f05a69de0f7d8ac79a2c30e0671d6ab44d1b255d2cf0edc9` | Accepted |
| EventTrace safety challenge resolved | `0xbb00ec455eb6522fccb3f822c761ad1f2c5e3f88dd79290a78e68638edddf75c` | `REVIEW_REQUIRED`; evidence insufficient to restore approval |
| EventTrace reassessment | Transaction hash not captured in this report | Latest-final record revision 2 `REVIEW_REQUIRED` |

All transaction hashes link to StudioNet transaction records using `https://explorer-studio.genlayer.com/tx/<hash>`.

## Latest-final authorization snapshot

The latest-final dashboard and pair-specific gate reads in this acceptance run showed four agents, two releases, and four decisions:

| Agent | Release | Latest-final gate state |
| --- | --- | --- |
| `checkout-live-20261020` | `v2api-20261020` | `BLOCKED` |
| `analytics-live-20261020` | `v2api-20261020` | `ALLOW` at revision 2 |
| `refund-live-20261020` | `v2api-20261020` | `BLOCKED` after appeal upheld |
| `eventtrace-live-20261021` | `eventtrace-v2-20261021` | `REVIEW_REQUIRED` at revision 2 |

These are pair-scoped latest-final values, not blanket statements about every release. A past `APPROVED` decision does not guarantee current authorization after a freeze, challenge, dispute, stale charter, or later revision. Recheck the contract gate before relying on a result. The event-tracing reassessment receipt hash was not retained in the available run record, so this report does not guess or publish one.

## Evidence and execution limits

- Live transactions above demonstrate actual StudioNet/GenVM execution and validator consensus where semantic evaluation ran. They are not offline unit-test results.
- Synthetic EventTrace inputs are publisher-controlled fixtures, not evidence of production consumer behavior.
- A matching SHA-256 demonstrates byte integrity against the submitted commitment; it does not prove the source is truthful, independent, or representative.
- StudioNet transaction `value: 0 GEN` is not evidence that execution had no protocol fee. Fees were not reliably captured.
- Automated `gltest` runtime execution remains separately unverified. Offline contract tests use a lightweight harness.
- This current report supersedes the current-state interpretation of [`v2-live.md`](v2-live.md) and [`v2-live.json`](v2-live.json), which remain preserved as historical records for the earlier contract address.
