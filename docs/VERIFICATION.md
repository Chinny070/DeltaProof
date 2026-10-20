# Verification status

Last locally verified: 2026-10-20. These checks do not imply contract deployment or live consensus.

| Gate | Result | Evidence / next proof |
| --- | --- | --- |
| Python syntax | PASS | `python -m compileall -q contracts tests` |
| Offline contract and parity tests | PASS: 87 | `python -m pytest -q tests/test_contract.py tests/test_parity.py` |
| Frontend tests | PASS: 30 | `node --test tests/*.test.mjs` |
| GenVM lint and schema | PASS: 3 checks | `genvm-lint check contracts/deltaproof.py --json`; linter advises a newer runner |
| Stable SDK compatibility | PASS for exported API surface | `genlayer-js@1.1.8`, StudioNet chain ID 61999, read/write, gas estimate, wallet connect, and finalized receipt APIs inspected locally |
| Production Vite build | PASS | Vite 7.3.7; 460 modules; 7.65 seconds; largest emitted chunk 408.30 kB; no chunk-size warning |
| Gltest integration harness | PASS to configure; integration SKIPPED | `python -m pytest -q tests/integration/test_studionet.py`; real test gated by `DELTAPROOF_LIVE_TESTS=1` |
| Actual GenVM direct/live execution | NOT VERIFIED | Requires runner/network execution; offline Python tests use a lightweight GenLayer stand-in |
| StudioNet deployment | NOT DEPLOYED | Contract address, deployment transaction and verified source digest remain absent |
| Real validator consensus | NOT RUN | Requires deployment and approved, funded signer transaction |
| Browser wallet acceptance | NOT RUN | Requires MetaMask/Rabby browser smoke tests against an actual deployment |
| Vercel production frontend | NOT DEPLOYED | Requires verified contract address and authorized Vercel project |
| GitHub source updates | PENDING | Current local fixes and lockfile need commit/push |

## SDK/network compatibility finding

`genlayer-js@2.0.0-rc.1` exposes fee estimation through Studio RPC method `sim_getFeeConfig`. A read-only call to StudioNet returned `Method not found`, and official GenLayer migration docs assign the v2 RC stack to Studio-dev chain 61997, separate from stable StudioNet 61999. The frontend is therefore pinned to stable `genlayer-js@1.1.8`, which exposes the `studionet` chain and the matching `readContract`, `writeContract`, `waitForTransactionReceipt`, and `TransactionStatus.FINALIZED` API. Its write path estimates the consensus transaction gas and gas price inside `writeContract`; no separate fee-profile simulation is claimed.

The installed Gltest runner is configured to use StudioNet but remains gated. The offline tests validate contract rules only; they do not prove serialization, deployment, actual independent validator execution, or live certificate reads.
