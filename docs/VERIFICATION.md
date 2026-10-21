# Verification status

> This page is the dated V1 verification record and is not the current V2 acceptance report. For V2, use [`V2_STATUS.md`](V2_STATUS.md), [`DEPLOYMENT_V2.md`](DEPLOYMENT_V2.md), and the read-only latest-final audit [`proofs/v2-final-audit-2026-10-21.json`](proofs/v2-final-audit-2026-10-21.json). Older V2 text in this file's history is not a substitute for those records.

Last verified: 2026-10-20.

| Gate | Result | Evidence / next proof |
| --- | --- | --- |
| Python syntax | PASS | `python -m compileall -q contracts tests` |
| Offline contract and parity tests | PASS: 88 | Includes regression reproducing CLI map coercion and validating corrected string payloads |
| Frontend tests | PASS: 32 | Includes register argument order/type regression |
| GenVM lint and schema | PASS: 3 checks | `genvm-lint check contracts/deltaproof.py --json`; linter advises a newer runner |
| Stable SDK compatibility | PASS for exported API surface | `genlayer-js@1.1.8`, StudioNet chain ID 61999, read/write, gas estimate, wallet connect, and finalized receipt APIs inspected locally |
| Production Vite build | PASS | Vite 7.3.7; 460 modules; 5.05 seconds; largest emitted chunk 329.83 kB; deployed address included |
| Gltest integration harness | PASS to configure; integration SKIPPED | `python -m pytest -q tests/integration/test_studionet.py`; real test gated by `DELTAPROOF_LIVE_TESTS=1` |
| Actual GenVM direct/live execution | NOT VERIFIED | Requires runner/network execution; offline Python tests use a lightweight GenLayer stand-in |
| StudioNet deployment | PASS | [`deployments/studionet.json`](../deployments/studionet.json); finalized transaction, successful GenVM execution, address and exact source digest verified in Explorer |
| StudioNet read-only contract calls | PASS | Stable SDK at `latest-final`: `get_protocol`, `get_overview`, and `list_releases(0, 20)` returned expected empty-state values |
| First paid application attempt | FINALIZED ROLLBACK | [`proofs/live.md`](proofs/live.md); CLI decoded JSON text specs into maps; no successful register/evaluate or certificate tests; further writes paused |
| Browser wallet acceptance | NOT RUN | Requires MetaMask/Rabby browser smoke tests against an actual deployment |
| Vercel production frontend | PASS | [deltaproof-ebon.vercel.app](https://deltaproof-ebon.vercel.app), deployment `dpl_8xfFce1pQpRBNSUqRkDm75cQvxGh`; public UI connected to StudioNet and reads zero totals/empty registry |
| GitHub deployment record | PASS | Deployment record pushed in commit `ed6506caaf217f8fa5ac7fb9ccbb68ed92517158` |

## SDK/network compatibility finding

`genlayer-js@2.0.0-rc.1` exposes fee estimation through Studio RPC method `sim_getFeeConfig`. A read-only call to StudioNet returned `Method not found`, and official GenLayer migration docs assign the v2 RC stack to Studio-dev chain 61997, separate from stable StudioNet 61999. The frontend is therefore pinned to stable `genlayer-js@1.1.8`, which exposes the `studionet` chain and the matching `readContract`, `writeContract`, `waitForTransactionReceipt`, and `TransactionStatus.FINALIZED` API. Its write path estimates the consensus transaction gas and gas price inside `writeContract`; no separate fee-profile simulation is claimed.

The installed Gltest runner is configured to use StudioNet but the paid integration test remains gated. Offline tests validate contract rules only. Deployment succeeded with one consensus round; Explorer recorded five initial validators, four agreeing validator results and one idle result for the deployment transaction. That deployment does not exercise semantic validator judgment. The first authorized application registration finalized with an execution rollback because the GenLayer CLI `--args` parser converted both JSON text specifications into maps; the method expects strings. The submitted texts were 164 and 297 characters, within bounds. Latest-final read-only calls after rollback still return zero releases and zero finalized evaluations. No certificate has been created or verified. Further paid writes are paused pending renewed approval.

The frontend now builds register calldata through a typed argument helper and tests that snapshot payloads remain strings in positions 3 and 4. Use that genlayer-js route for string JSON arguments; the installed CLI `--args` parser is unsuitable for those arguments.

## Verified deployment details

- Contract: `0x50D7C07A081A56dBd30fB3a244C11A8105E4faA6`
- Transaction: `0x38d85b62148f0538bd672f60d5150e31a54d6edc96f326b313cf08341e409535`
- Receipt: `FINALIZED`, GenVM `SUCCESS`, consensus `Accepted`; one round, five initial validators, zero rotations.
- Deployed source SHA-256: `f0f8ccef0263aca4cf0d8553ae117d3fdf0f80bc895b547c691c933f81c2d240`, matching the checked-out contract and source displayed in transaction input.
- Explorer showed transaction value `0 GEN` and no EVM gas limit. It did not show protocol-fee settlement, so total deployment fees are unknown from this evidence.
- Read calls returned protocol `deltaproof/1.0`, overview `{total: 0, finalized: 0}`, and an empty first page.

Explorer evidence: [deployment receipt](https://explorer-studio.genlayer.com/tx/0x38d85b62148f0538bd672f60d5150e31a54d6edc96f326b313cf08341e409535), [contract record](https://explorer-studio.genlayer.com/address/0x50D7C07A081A56dBd30fB3a244C11A8105E4faA6).
