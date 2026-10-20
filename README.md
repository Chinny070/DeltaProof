# DeltaProof

**Prove the upgrade.** A GenLayer-native release-verification protocol for bounded, issuer-published API interfaces.

DeltaProof is **not** a software testing oracle. It checks declared compatibility: machine-verifiable changes are evaluated deterministically; ambiguous behavioral guarantees are judged by independent GenLayer validators. The proof is an immutable, on-chain, digest-bound statement **about the issuer-submitted snapshots**. It does not verify that deployed services implement those claims.

## What is implemented

- One GenLayer Intelligent Contract (`contracts/deltaproof.py`) with immutable release records, canonical JSON snapshots, fingerprinted provenance, deterministic structural rules, independent semantic validator evaluation, four outcome classes and SHA-256 certificate verification.
- One responsive frontend (`frontend/`) with release creation, local structural diff preview, live registry, release inspection, permissionless evaluation, and certificate verification. It reads only from the configured contract and does not use mock chain data.
- Injected EIP-1193 wallet: connect, copy address, disconnect from **site session**, silent authorized-session restore on refresh, accounts/chain listeners, and wrong-network switch/add for StudioNet 61999.
- Finalization-aware GenLayer SDK transaction handling. Transactions are not reported successful until both finalized and successfully executed; pending hashes survive refresh for tracking, not blind retries.
- 87 offline Python tests including 100 structural parity fixtures; 30 Node JS tests; optional real StudioNet integration test; GitHub Actions pipeline.
- Documentation: architecture, threat model, verification guide, protocol, deployment, Codex handoff.

## Current verification status

**The Intelligent Contract is deployed and its read-only interface is verified on StudioNet.** The frontend is pinned to `genlayer-js@1.1.8`, the stable SDK line used with StudioNet chain 61999. The deployed address is [`0x50D7C07A081A56dBd30fB3a244C11A8105E4faA6`](https://explorer-studio.genlayer.com/address/0x50D7C07A081A56dBd30fB3a244C11A8105E4faA6); its deployment transaction [`0x38d85b62148f0538bd672f60d5150e31a54d6edc96f326b313cf08341e409535`](https://explorer-studio.genlayer.com/tx/0x38d85b62148f0538bd672f60d5150e31a54d6edc96f326b313cf08341e409535) finalized with execution result `SUCCESS`. The exact deployed source matches SHA-256 `f0f8ccef0263aca4cf0d8553ae117d3fdf0f80bc895b547c691c933f81c2d240`. Read-only `get_protocol`, `get_overview`, and `list_releases(0, 20)` calls succeeded. The public [Vercel app](https://deltaproof-ebon.vercel.app) is READY and its live contract reads show the empty registry. The explorer does not expose protocol fee settlement; its displayed transaction value is 0 GEN, which is not a total-fee measurement. Paid register/evaluate tests remain pending separate approval.

## Quick start

Requirements: Node 22+, Python 3.12+, npm, and (for live tests) the GenLayer CLI and `genlayer-test`.

```bash
python -m pip install pytest
python -m pytest -q tests/test_contract.py tests/test_parity.py
cd frontend
npm ci
npm test
npm run build
npm run dev
```

The verified StudioNet address is the frontend default; `VITE_CONTRACT_ADDRESS` can override it for another deployment. For local development, create `frontend/.env.local` using `frontend/.env.example` if you need an override, and restart the app. All on-chain data must be real.

Production frontend build:

```bash
cd frontend
npm run build
# static output: frontend/dist
```

## Actual user journey

1. Connect injected wallet and switch to the exact StudioNet chain (61999).
2. Register a release with `project`, `from`, `to`, two HTTPS provenance labels and two bounded JSON snapshots (see below).
3. A write signs and submits using genlayer-js. Wait for finality, not only an optimistic status.
4. Anyone can evaluate a registered release. Hard structural breaks are determined by code. Otherwise each changed behavior is independently classified by GenLayer consensus.
5. Contract binds issuer, snapshots, findings and outcome into a 64-character certificate SHA-256 digest.
6. Verifiers call `verify_certificate(id, digest)` against finalized storage.

## Snapshot schema

The two JSON strings use this intentionally narrow schema (not general OpenAPI):

```json
{
  "endpoints": [
    {
      "method": "GET",
      "path": "/v1/accounts/{id}",
      "request_required": ["id"],
      "response_required": ["balance"],
      "behavior": "Balance is returned in integer cents."
    }
  ]
}
```

Maximums: 10,000 characters per snapshot, 12 endpoints, 16 required fields per list, 800 characters per behavior, 6 changed behaviors per release. All input restrictions are enforced **by the contract**, not only by the browser.

Rules: removed endpoints, new required request fields and removed required response fields cause a deterministic `BREAKING`. If none of those is found, changes to `behavior` require independent GenLayer evaluation. No behavior differences yield `COMPATIBLE` deterministically. Semantic outcomes are `COMPATIBLE`, `MIGRATION_REQUIRED`, `BREAKING`, or `INCONCLUSIVE`. Inconclusive is fail-closed; no auto-green.

**Important**: the presence of a `BREAKING` structural violation deliberately short-circuits semantic analysis, since the final disposition is already fixed. Its certificate records `DETERMINISTIC`, not `GENLAYER_CONSENSUS`.

## Methods

| Method | Kind | Description |
| --- | --- | --- |
| `register_release(project, base_version, candidate_version, baseline_json, candidate_json, baseline_url, candidate_url)` | write | Freeze inputs and provenance, return 32-character release ID |
| `evaluate_release(release_id)` | write | Issue at most one final attestation, return digest |
| `get_protocol()` | view | Protocol version |
| `get_overview()` | view | Live per-deployment counts |
| `list_releases(offset, limit)` | view | Bounded paginated list (max 20) |
| `get_release(release_id)` | view | Full frozen record and result |
| `verify_certificate(release_id, digest)` | view | Recompute commitment and compare stored digest |

## Operational / security notes

This remains a **prototype** until paid live consensus scenarios and public frontend smoke tests complete. The contract has no admin takeover, mutable release or private central database. The issuer controls input snapshots, not verdict logic. Threat model and residual risks: [`docs/SECURITY.md`](docs/SECURITY.md). Deployment record and remaining live test plan: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md), [`deployments/studionet.json`](deployments/studionet.json). Codex work: [`DELTA_CODEX_FINISH_PROMPT.md`](DELTA_CODEX_FINISH_PROMPT.md).

## Dependencies / references

The frontend targets `genlayer-js@1.1.8` with StudioNet chain 61999. GenLayer's v2.0 release candidate is for Studio-dev chain 61997; do not combine it with StudioNet. The v1 SDK estimates consensus transaction gas and gas price when `writeContract` is called. Confirm the signed transaction's actual fee and final receipt on the live network before shipping. See the official [GenLayer JS reference](https://docs.genlayer.com/api-references/genlayer-js), [network configuration](https://docs.genlayer.com/developers/intelligent-contracts/deploying/network-configuration), [writing and finality](https://docs.genlayer.com/developers/decentralized-applications/writing-data), and [nondeterminism](https://docs.genlayer.com/developers/intelligent-contracts/features/non-determinism).

## Originality

DeltaProof analyzes compatibility of publisher-declared software interfaces and produces upgrade attestations. It does not use the KeyWitness property-dispute concept, terms negotiation, evidence roles, escrow, challenge bonds, or settlement. The benchmark informed the quality bar, not the implementation.
