# DeltaProof V2 StudioNet deployment and live verification

## Verified deployment

- Network: GenLayer StudioNet, chain `61999`, RPC `https://studio.genlayer.com/api`.
- Contract: `DeltaProofV2` at [`0x8addd2bC124C276130a8CAF4ED1341C7F42432a7`](https://explorer-studio.genlayer.com/address/0x8addd2bc124c276130a8caf4ed1341c7f42432a7).
- Deployment transaction: [`0xdc6aff4084463b68b94e5e5c277dee266df4f1935d0c5437961b3ae9b7ca65a6`](https://explorer-studio.genlayer.com/tx/0xdc6aff4084463b68b94e5e5c277dee266df4f1935d0c5437961b3ae9b7ca65a6), finalized at `2026-10-20T14:15:24.900101Z`.
- Deployer: `0xaffE15eEc45b68835cc9E5B4Ab85dD5deaE8e70b`.
- The source embedded in the finalized transaction is 79,661 bytes and hashes to `20ee871691c4fd3ce5b44250d815082b4bf25bf38327a6b1f8b20607bf22b1f7`, matching the authorized local source.
- Consensus: one round, `MAJORITY_AGREE`; three validators agreed and executed successfully, two were idle after quorum. Execution hash: `0x5fe0b7206223e8360078bc9d1aac1c0a966fb8d20b38ca61ae4f916b2d5bc49d`.
- Verified SDK latest-final reads: `get_protocol()` returned `deltaproof/2.0`; `get_overview()` returned zero agents, releases, and decisions; `list_agents(0, 10)` returned `[]`.
- Fee evidence: total GEN protocol fee is not exposed in the transaction response. The transaction reports gas limit `2861`; this is not a measured fee, and no fee total is claimed.

The GenLayer CLI `code` and `schema` commands reported that this address was not found, while the GenLayer JS SDK's latest-final contract reads succeeded. This interface discrepancy remains unresolved. The embedded transaction source and working read calls establish source and basic read behavior, but do not substitute for full ABI or lifecycle verification.

The deployment is not a production-readiness claim. No V2 application registration, evaluation, semantic adjudication, appeal, challenge, freeze, passport, or CI gate transaction has been run yet. No lifecycle result is inferred from the deployment consensus.

### Corrective deployment required

A live read-only call to `get_authorization("unknown-release", "unknown-agent")` returned a fail-closed `NO_DECISION` value without echoing `release_id` or `agent_id`. The real `frontend/integrations/ci-gate.mjs` correctly rejected this as an unbound/malformed response (`Authorization read returned an invalid value`) instead of treating it as a structured denial. This is a genuine interface defect in the deployed immutable source. The contract now returns both requested identifiers for the no-decision case; regression test `test_no_decision_authorization_is_identity_bound_and_machine_readable` passes, and the corrected source SHA-256 is `72f114e73c91f34a10de53f2715323c87b3048fe830c6d32492cdd00cf5285c0`. A corrective deployment is required before any lifecycle write, CI gate acceptance, or V2 frontend configuration. The already deployed address remains the original source and must not be represented as containing the fix.

## Next live verification steps

Use only StudioNet and the verified contract address. Use the GenLayer JS SDK's typed `writeContract` arguments rather than CLI `--args` for JSON text parameters; the V1 incident showed that the CLI may decode object-shaped JSON strings into maps. For every write, retain its hash, wait for `FINALIZED`, check execution success separately, and query latest-final state before continuing. If a write outcome is unknown, reconcile that hash before any retry.

1. Register Checkout Agent, Analytics Agent, and Refund Agent with separate controllers, dependency sets, and charters. Verify each finalized agent record.
2. Register bounded baseline/candidate snapshots with correct string argument types. Verify release and source commitments.
3. Run deterministic compatible and structurally breaking cases, followed by real semantic assessments and validator receipt capture.
4. Check pair-specific authorization and the fail-closed CI gate. Run a targeted freeze and verify unaffected pairs remain authorized; resolve using the contract rules.
5. Submit public, digest-verifiable evidence for a safety challenge against an approved pair. Verify screening, hold, response, and resolution. Do not claim timeout behavior without observing the real deadline.
6. Submit an eligible appeal with retrievable counterevidence and publisher response; verify validator re-adjudication and record the actual outcome.
7. Verify reassessment requirements, passports, positive and negative commitments, Watchtower reads, and CI gate denial paths.
8. Configure and publish the separate `/v2/` frontend only against this verified address after ABI checks. Preserve the V1 deployment and root frontend.

## Contract changes and gates

Appeals retrieve and digest-check counterevidence, publisher responses, and original release evidence on leader and validators. A hash-only appeal cannot overturn. Approved pairs use a separate safety-challenge path: only the affected consumer controller can submit within seven days, with 1–4 verified sources; validators must screen evidence as new and relevant before the pair-specific hold opens. The publisher has a two-day response window. Challenges are capped at two per pair. Missing, inconclusive, blocked, or timed-out evidence does not restore a stale approval; fresh adjudication is required. Machine-readable `get_authorization` is fail-closed. The read-only Watchtower polls bounded latest-final pairs and never signs or writes.

Offline tests and static lint/typecheck are not a substitute for actual validator-driven lifecycle verification. See [`V2_STATUS.md`](V2_STATUS.md) and [`deployments/studionet-v2.json`](../deployments/studionet-v2.json) for machine-readable state and known limitations.
