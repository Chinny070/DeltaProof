# DeltaProof V2 StudioNet deployment and verification

## Verified deployment record

- Network: GenLayer StudioNet, chain `61999`, RPC `https://studio.genlayer.com/api`.
- Contract: `DeltaProofV2` at [`0x367C2B9f8B52EEd57977B84c458eaD4c3105E718`](https://explorer-studio.genlayer.com/address/0x367C2B9f8B52EEd57977B84c458eaD4c3105E718).
- Deployment transaction: [`0x1578c201d04155f61bf16594bdc0b663aacdf9c28be08b71b4ef07d0755a218e`](https://explorer-studio.genlayer.com/tx/0x1578c201d04155f61bf16594bdc0b663aacdf9c28be08b71b4ef07d0755a218e), recorded `FINALIZED`, `MAJORITY_AGREE`, successful execution.
- Deployed source SHA-256: `72f114e73c91f34a10de53f2715323c87b3048fe830c6d32492cdd00cf5285c0`. A search of local history found the exact source bytes at commit [`aee912c0635d6ca3b5782e97da2db733f9a20d6a`](https://github.com/Chinny070/DeltaProof/commit/aee912c0635d6ca3b5782e97da2db733f9a20d6a). This establishes historical source correspondence; it does not mean the current branch source is deployed.
- Current branch source SHA-256: `98c783f80a04caccab8077f55c6de8ee1ff792afb0c47594c26e4dcb92ec13ab` (UTF-8 source normalized to LF). It differs from the deployed hash because the file has changed since deployment. The current source includes the deterministic AND enforcement for charter-required evidence kinds; the deployed contract does not receive that correction until a separately authorized redeployment.
- The read-only audit on 2026-10-21 independently retrieved deployed contract code and checked four finalized receipts plus latest-final overview and four authorizations. Results are in [`proofs/v2-final-audit-2026-10-21.json`](proofs/v2-final-audit-2026-10-21.json). The recorded deployed-source hash matched retrieved bytes; current branch source did not match deployed bytes.

## Frontend configuration

V2 browser code reads only `VITE_DELTAPROOF_V2_ADDRESS`. The exact production target is:

```text
VITE_DELTAPROOF_V2_ADDRESS=0x367C2B9f8B52EEd57977B84c458eaD4c3105E718
StudioNet chain ID=61999
RPC=https://studio.genlayer.com/api
```

For a local Vite build, copy the V2 value from `frontend/.env.example` into `frontend/.env.local`, or set it in the shell before `npm run build`. Do not substitute V1's `VITE_CONTRACT_ADDRESS`. The existing V1 root app and project remain separate.

The latest Vercel deployment recorded in [`FRONTEND_ACCEPTANCE_V2.md`](FRONTEND_ACCEPTANCE_V2.md) is `dpl_51RTQ41JrmTegWhh4gY3bJhk25Dh`. A READY deployment and authenticated page load do not prove anonymous reviewer access: the `deltaproof-v2` project has SSO protection on non-custom domains. Do not disable project-wide protection without confirming its impact on preview deployments.

## Repeatable read-only V2 runtime check

From `frontend/`, select an existing pair and run the three-call latest-final smoke. This checks the protocol, overview schema, and exact authorization identity without signing or submitting:

```powershell
$env:VITE_DELTAPROOF_V2_ADDRESS = '0x367C2B9f8B52EEd57977B84c458eaD4c3105E718'
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

These states come from the proof snapshot, not a fresh RPC read during this review. Do not treat a prior approval or dashboard count as current authorization. Query latest-final `get_authorization(release_id, agent_id)` before making a current release decision.
