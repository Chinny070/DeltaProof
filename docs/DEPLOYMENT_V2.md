# DeltaProof V2 StudioNet deployment preparation

Deployment is intentionally not performed by this branch task. The user authorized implementation and expressly withheld a V2 deployment authorization. Do not reuse an unlocked CLI session as permission to spend GEN.

## Fixed target

- Network: GenLayer StudioNet
- Chain ID: `61999`
- RPC: `https://studio.genlayer.com/api`
- Explorer: `https://explorer-studio.genlayer.com`
- Source: `contracts/deltaproof_v2.py`
- Contract name: `DeltaProofV2`
- V1 remains at `0x50D7C07A081A56dBd30F3a244C11A8105E4faA6` and must not be overwritten.

## Preparation checks

1. Review V2 source and checksum `contracts/deltaproof_v2.py`.
2. Confirm `genlayer account show` identifies the previously authorized public signer and that the wallet is unlocked by the existing local mechanism. Never send keys or recovery phrases to Codex.
3. Verify StudioNet chain ID and RPC through the configured CLI; do not select another network.
4. Run `genvm-lint check contracts/deltaproof_v2.py --json`, `genvm-lint typecheck contracts/deltaproof_v2.py`, `python -m pytest -q tests/test_contract.py tests/test_contract_v2.py tests/test_parity.py`, and `cd frontend; npm ci; npm run check`.
5. Ensure `deployments/studionet-v2.json` still says `NOT_DEPLOYED` until a real successful deployment receipt is captured.
6. Before any deployment transaction, obtain separate explicit user approval to submit one deployment on StudioNet with the public signer and spend limit/fee expectations addressed by the user.

## After separately authorized deployment

Use the normal GenLayer CLI deployment workflow with the verified local signer. Do not pass a private key as a command argument or environment value. Capture the returned tx hash, wait for `FINALIZED`, check execution is `FINISHED_WITH_RETURN`, verify the deployed source hash and address through official StudioNet RPC/explorer, and read `get_protocol`, `get_overview`, `list_agents`, `list_releases`, and a negative `is_authorized` case at `LATEST_FINAL`.

Set `VITE_DELTAPROOF_V2_ADDRESS` only to that verified address and build the separate `/v2/` frontend. Configure Vercel only after the V2 ABI has been verified. Do not point the V1 frontend at a V2 address.

Paid live registration, adjudication, appeal, safety-challenge, freeze, and reassessment transactions are separate operations and require separate user authorization. Record only actual finality, execution results, validator outcomes, and observable fees; never infer success from transaction submission alone.

## V2 upgrade gates added in this branch

Appeals now independently fetch and digest-check counterevidence, publisher responses and original release evidence before validators inspect the actual contents. Approved pairs use a distinct safety challenge route: the affected agent controller submits 1–4 verified sources within seven days; validators screen for credible, new, route-relevant content before opening the pair-specific authorization hold. The publisher gets up to 48 hours to respond. Unavailable evidence or timeout never restores the old approval; a fresh adjudication is required. Challenges are limited to two per agent-release pair. Machine-readable reads use `get_authorization`; the CI gate verifies its identity, status and boolean consistency. A read-only Watchtower observer polls up to 100 latest-final pairs and emits JSONL changes without holding credentials or submitting writes.

Offline tests and lint are not a GenVM execution proof. The installed environment exposes `gltest` configured for StudioNet and GenVM lint/typecheck, but live V2 execution requires a deployed V2 address and would write/pay. This branch intentionally does not deploy or submit that transaction. Current StudioNet storage serialization, `gl.nondet.web.get` evidence retrieval, timestamp behavior and model response types must be confirmed after separate deployment approval.
