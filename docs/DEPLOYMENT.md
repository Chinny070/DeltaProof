# StudioNet deployment and test checklist

## Network

- Network `GenLayer StudioNet`, chain ID `61999` (hex `0xf22f`)
- RPC `https://studio.genlayer.com/api`
- Explorer `https://explorer-studio.genlayer.com`
- Symbol `GEN`

Do not confuse with Studio Next / Studio Devnet chain ID 61997. Use matching `genlayer-js/chains` `studionet` definition.

## Verified deployment

DeltaProof is deployed to the stable GenLayer StudioNet (chain ID `61999`). The signer was `0xaffE15eEc45b68835cc9E5B4Ab85dD5deaE8e70b`.

- Contract: [`0x50D7C07A081A56dBd30fB3a244C11A8105E4faA6`](https://explorer-studio.genlayer.com/address/0x50D7C07A081A56dBd30fB3a244C11A8105E4faA6)
- Deployment transaction: [`0x38d85b62148f0538bd672f60d5150e31a54d6edc96f326b313cf08341e409535`](https://explorer-studio.genlayer.com/tx/0x38d85b62148f0538bd672f60d5150e31a54d6edc96f326b313cf08341e409535)
- Status: `FINALIZED`; GenVM execution `SUCCESS`; consensus `Accepted` in one round, five initial validators, zero rotations.
- Deployed source SHA-256: `f0f8ccef0263aca4cf0d8553ae117d3fdf0f80bc895b547c691c933f81c2d240` (matches `contracts/deltaproof.py` and source shown in the explorer deployment input).
- Read-only calls at `latest-final`: `get_protocol` returned `deltaproof/1.0`; `get_overview` returned `total: 0`, `finalized: 0`; `list_releases(0, 20)` returned `[]`.
- Fee record: transaction value shown as `0 GEN`; explorer showed no EVM gas limit and did not expose protocol fee settlement. The protocol fee is therefore recorded as unavailable, not zero.

Machine-readable evidence: [`deployments/studionet.json`](../deployments/studionet.json).

## Local prerequisites

1. Python 3.12+ and `pytest` for offline tests.
2. Node 22+ and npm. Install `frontend/` packages on a machine with npm connectivity.
3. GenLayer CLI, `genlayer-test`, GenVM linter; Docker only if choosing localnet rather than StudioNet.
4. A funded StudioNet wallet under **your own** control. Never paste its seed/private key into repository, terminal transcript, screenshots or ChatGPT.

The deployment was performed with the user's configured StudioNet signer after the user unlocked it locally. Never export or print a private key. The command used was `genlayer deploy --contract contracts/deltaproof.py --rpc https://studio.genlayer.com/api`. The deployment receipt and source were verified through StudioNet Explorer. Do not redeploy this contract.

## Paid live test status and plan

One paid application write was authorized and submitted. It finalized with consensus `Accepted` but GenVM execution `ERROR`, result `Rollback`, and message `specification too large or empty`. The CLI converted the two JSON snapshot arguments into maps before submission, while the contract method requires strings. The specifications themselves were 164 and 297 characters, within contract bounds. The exact hash and fee evidence are in [`proofs/live.md`](proofs/live.md). Read-only latest-final calls after the rollback still show `total: 0`, `finalized: 0`, and an empty registry. No follow-up write or retry has been submitted; further paid writes are paused until renewed user approval.

When live testing is authorized to resume, use the frontend/genlayer-js typed `writeContract` path for string JSON arguments. Do not use GenLayer CLI `--args` for these object-shaped strings; its installed parser JSON-decodes them into maps. Then retain evidence for:

1. Deterministic compatibility: unchanged/additive snapshot yields a deterministic `COMPATIBLE` record.
2. Deterministic breakage: removed endpoint, newly required request field, and removed required response field are each `BREAKING`.
3. Semantic compatibility: behavior-only change goes through `gl.vm.run_nondet_unsafe`, with independent validator evaluation; record the actual consensus label without predicting it.
4. Validator agreement: record leader and validator outcomes/dissent from Explorer or trace; verify disagreement fails closed and does not mint a `COMPATIBLE` certificate.
5. Certificate verification: query the actual certificate successfully, then verify a wrong digest returns false. Also confirm duplicate registration and second evaluation are rejected.
6. For every write, capture the real hash, `FINALIZED` status, execution result, validator/consensus evidence, and fees where exposed. Never retry a submitted transaction; resume tracking its hash.

The first application write failed as recorded above. The deployed contract remains reusable; no contract source modification or redeployment is warranted by this CLI serialization error.

## Frontend deployment preparation

The frontend defaults to the verified public contract address and allows a `VITE_CONTRACT_ADDRESS` override. It is deployed to [deltaproof-ebon.vercel.app](https://deltaproof-ebon.vercel.app) (Vercel deployment `dpl_8xfFce1pQpRBNSUqRkDm75cQvxGh`). The public page was checked against live StudioNet state and showed `CONNECTED`, zero totals, and an empty registry. The remaining frontend acceptance work is injected-wallet testing in MetaMask/Rabby at target widths, nested-route refresh, and interaction-focused console checks. Do not enable write testing until its separate transaction-spending approval is given.

## Security/finality reporting

The verified deployment details are recorded in `deployments/studionet.json`. Add a separate live test report only after paid consensus tests have been authorized and actually run; keep deployment evidence distinct from application transaction evidence.
