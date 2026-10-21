# DeltaProof V2 StudioNet deployment and verification

## Current verified deployment

- Network: GenLayer StudioNet, chain `61999`, RPC `https://studio.genlayer.com/api`.
- Contract: `DeltaProofV2` at [`0xEf72A2db4EbeD151273B137D8a741e4C537415f9`](https://explorer-studio.genlayer.com/address/0xef72a2db4ebed151273b137d8a741e4c537415f9).
- Deployment transaction: [`0xa40625af8b4a3b0ad83564e30f22cd149d399e7cd229dcf6189791662e41518e`](https://explorer-studio.genlayer.com/tx/0xa40625af8b4a3b0ad83564e30f22cd149d399e7cd229dcf6189791662e41518e), independently retrieved as `FINALIZED`, `MAJORITY_AGREE`, successful GenVM execution, five agreeing validator votes.
- Deployed source SHA-256: `98c783f80a04caccab8077f55c6de8ee1ff792afb0c47594c26e4dcb92ec13ab` (80,174 UTF-8 bytes), matching source commit [`f74a37a053c2c14278221e17632cd26fca038e4c`](https://github.com/Chinny070/DeltaProof/commit/f74a37a053c2c14278221e17632cd26fca038e4c).
- Read-only latest-final calls returned protocol `deltaproof/2.0`, a 34-method schema, and an overview of 0 agents, 0 releases, and 0 decisions. This is a fresh contract. No prior application records were migrated.
- Receipt gas limit: `3135`. The receipt did not expose a settled protocol fee; transaction value and a same-value pre/post wallet balance reading do not establish the fee paid. No fee amount is claimed.
- Full reproducible proof is in [`proofs/v2-deployment-2026-10-21.json`](proofs/v2-deployment-2026-10-21.json).

### Previous V2 deployment and lifecycle history

The previous contract `0x367C2B9f8B52EEd57977B84c458eaD4c3105E718` (deployment transaction `0x1578c201d04155f61bf16594bdc0b663aacdf9c28be08b71b4ef07d0755a218e`) remains deployed and retains its historical registration, adjudication, appeal, freeze, and safety-challenge records. Those records are preserved in [`proofs/v2-live.md`](proofs/v2-live.md), [`proofs/v2-live.json`](proofs/v2-live.json), and [`proofs/v2-final-audit-2026-10-21.json`](proofs/v2-final-audit-2026-10-21.json); they do not describe current state on the new address.

## Frontend configuration

V2 browser code reads only `VITE_DELTAPROOF_V2_ADDRESS`. The exact production target is:

```text
VITE_DELTAPROOF_V2_ADDRESS=0xEf72A2db4EbeD151273B137D8a741e4C537415f9
StudioNet chain ID=61999
RPC=https://studio.genlayer.com/api
```

For a local Vite build, copy the V2 value from `frontend/.env.example` into `frontend/.env.local`, or set it in the shell before `npm run build`. Do not substitute V1's `VITE_CONTRACT_ADDRESS`. The existing V1 root app and project remain separate.

The existing `deltaproof-v2` project was updated and published to production deployment `dpl_5rFm7X1Tdj9DYfAfUhHRJGpmcqZC` at [https://deltaproof-v2.vercel.app/v2/](https://deltaproof-v2.vercel.app/v2/). Its served JavaScript asset was verified: it contains the new contract address and not the previous one. Chrome showed latest-final counts of 0 agents, 0 releases, and 0 decisions. Vercel reports `vercel_authentication` deployment protection, so anonymous reviewer access is not verified.

## Repeatable read-only V2 runtime check

From `frontend/`, select an existing pair and run the three-call latest-final smoke. This checks the protocol, overview schema, and exact authorization identity without signing or submitting:

```powershell
$env:VITE_DELTAPROOF_V2_ADDRESS = '0xEf72A2db4EbeD151273B137D8a741e4C537415f9'
$env:DELTAPROOF_V2_AGENT_ID = 'eventtrace-live-20261021'
$env:DELTAPROOF_V2_RELEASE_ID = 'eventtrace-v2-20261021'
npm run test:v2:runtime
```

An RPC failure prints `READ_ERROR`, not DENY. This command is not a write test. The repository's gated StudioNet `gltest` file remains a separate runtime suite; importing it is deferred until the live gate is enabled so a clean offline checkout can collect tests without installing `gltest`.

For a fuller, sequential read-only audit of deployed contract source bytes, four representative finalized receipts, the overview and four recorded pair authorizations, run `npm run audit:v2:live` from `frontend/`. It makes ten read operations, no writes. Its output compares the deployed source hash to the deployment record and to the current branch file; preserve the result as a dated audit artifact before updating the live proof. Stop if StudioNet returns a rate-limit or RPC error; do not interpret that as an authorization state.

## Historical lifecycle outcomes

- Checkout: deterministic `BLOCKED` due the newly required `currency` request field.
- Analytics: revision 2 `APPROVED` / `ALLOW` after targeted freeze resolution and fresh adjudication.
- Refund: semantic `BLOCKED`; its evidence-backed appeal resolved `UPHELD` and the pair stayed blocked.
- Event tracing: revision 1 was historically `APPROVED`; a safety challenge resolved `REVIEW_REQUIRED`, and revision 2 remained denied. The supporting tests are synthetic publisher-controlled fixtures, not production consumer evidence.

The lifecycle states above belong to the previous contract. The fresh current contract returns no decision for those IDs until they are registered and adjudicated on its address. Do not treat a prior approval or dashboard count as current authorization. Query latest-final `get_authorization(release_id, agent_id)` against the current address before making a release decision.
