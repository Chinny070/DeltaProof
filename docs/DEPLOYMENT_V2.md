# DeltaProof V2 StudioNet deployment and live verification

## Active deployment

- Network: GenLayer StudioNet, chain `61999`, RPC `https://studio.genlayer.com/api`.
- Corrected active contract: `DeltaProofV2` at [`0x367C2B9f8B52EEd57977B84c458eaD4c3105E718`](https://explorer-studio.genlayer.com/address/0x367c2b9f8b52eed57977b84c458ead4c3105e718).
- Corrective deployment: [`0x1578c201d04155f61bf16594bdc0b663aacdf9c28be08b71b4ef07d0755a218e`](https://explorer-studio.genlayer.com/tx/0x1578c201d04155f61bf16594bdc0b663aacdf9c28be08b71b4ef07d0755a218e), finalized at `2026-10-20T14:37:50.508161Z`.
- Deployer: `0xaffE15eEc45b68835cc9E5B4Ab85dD5deaE8e70b`.
- Embedded deployed source: 79,729 bytes; SHA-256 `72f114e73c91f34a10de53f2715323c87b3048fe830c6d32492cdd00cf5285c0`, matching the corrected local source.
- Consensus: one round, `MAJORITY_AGREE`; three validators agreed and executed successfully, two idled after quorum. Execution hash: `0xac684ea0210461ecc6797cbc3a71f0d6ed82080026abda52555f545cd64c3211`.
- At initial deployment verification, SDK latest-final reads showed zero agents, releases, and decisions; `getContractSchema` returned all 34 declared methods. After live registrations, latest-final reads show three active agents, one active release, and zero decisions.
- Live CI gate probe for an unknown pair returned a correctly identity-bound `NO_DECISION` response: `allow: false`, pair IDs matched, `state: LATEST_FINAL`.
- Fee evidence: total GEN protocol fee is not exposed by the verified transaction response. It reports gas limit `2873`; this is not a measured fee and no total fee is claimed.

## Public V2 frontend

- Separate Vercel project: `deltaproof-v2` (`prj_vtqZt24tc6qClgetqnN3ytdcvaqE`).
- Production deployment: [`https://deltaproof-v2.vercel.app`](https://deltaproof-v2.vercel.app), deployment `dpl_BUxTvqsSqjq5GBZBNwxLaeGs7Zx4`.
- Built with `VITE_DELTAPROOF_V2_ADDRESS=0x367C2B9f8B52EEd57977B84c458eaD4c3105E718`.
- HTTP smoke: `/` and `/v2/` both returned 200; V2 title and JavaScript bundle loaded, and the V2 bundle contains the corrected address. The initial browser smoke preceded application registrations and showed zero agents, releases, and decisions. A refreshed browser read after those registrations has not been independently verified.
- The existing V1 project and its production URL [`https://deltaproof-ebon.vercel.app`](https://deltaproof-ebon.vercel.app) remain unchanged and return the V1 title.

Wallet signing and live V2 write flows have not been browser-tested; the public smoke verifies page load and real read-only state only. The user unlocked the configured account in the Codex terminal and submitted three agent registrations. Two transaction receipts (Checkout and Refund) are independently verified; all three agent records and charters are verified at latest-final state. The Analytics registration transaction hash remains uncaptured. See the timestamped [`V2 live proof`](proofs/v2-live.md) for receipts, state, and remaining work.

The first deployment at `0x8addd2bC124C276130a8CAF4ED1341C7F42432a7` (transaction `0xdc6aff4084463b68b94e5e5c277dee266df4f1935d0c5437961b3ae9b7ca65a6`, source SHA-256 `20ee871691c4fd3ce5b44250d815082b4bf25bf38327a6b1f8b20607bf22b1f7`) was superseded after a live CI read exposed that `NO_DECISION` omitted the requested agent and release IDs. The corrected contract binds that denial to both IDs; the regression test passes. The old deployment remains immutable and must not be used by clients.

Agent and release registration confirm basic write finality, storage serialization, and release commitment storage. The release has not yet been adjudicated; no semantic validator evaluation, appeal, safety challenge, freeze, passport, or CI allow-path write has been run.

## Next live verification steps

Use the corrected active address only. Use GenLayer JS SDK typed `writeContract` arguments rather than CLI `--args` for JSON text parameters; the V1 incident showed that the CLI can decode object-shaped JSON strings into maps. For each write, record the hash, wait for `FINALIZED`, check execution success separately, and read latest-final state before continuing. If an outcome is unknown, reconcile that hash before considering any retry.

1. Register Checkout Agent, Analytics Agent, and Refund Agent with separate controllers, dependency sets, and charters; verify finalized records.
2. Register bounded baseline/candidate snapshots with JSON text arguments as strings; verify release and source commitments.
3. Run compatible and structurally breaking deterministic scenarios, plus actual semantic assessments with validator receipt capture.
4. Check consumer-specific authorization and CI gate denial/allow paths. Run targeted freeze, verify unaffected pairs, and resolve under contract rules.
5. Submit public, digest-verifiable evidence for an approved-release safety challenge. Verify screening, targeted hold, publisher response, and resolution. Do not claim timeout behavior without observing the real deadline.
6. Submit an eligible evidence-backed appeal and publisher response; verify independent retrieval, validator re-adjudication, and actual outcome.
7. Verify reassessment, passports, valid/invalid commitments, Watchtower reads, and gate denials for frozen, disputed, revoked, stale, and unauthorized states.
8. Configure and publish the separate `/v2/` frontend against this active address. Preserve the V1 deployment and root frontend.

## Contract controls

Appeals retrieve and digest-check counterevidence, publisher responses, and original release evidence on leader and validators. A hash-only appeal cannot overturn. Approved pairs use a separate safety challenge: only the affected consumer controller can submit within seven days, with 1–4 verified sources; validators screen for new, relevant evidence before opening a targeted hold. The publisher has a two-day response window. Challenges are capped at two per pair. Missing, inconclusive, blocked, or timed-out evidence does not restore a stale approval; fresh adjudication is required. `get_authorization` is fail-closed. The read-only Watchtower polls bounded latest-final pairs and never signs or writes.

Offline tests and static lint/typecheck do not replace real validator-driven lifecycle verification. See [`V2_STATUS.md`](V2_STATUS.md) and [`studionet-v2.json`](../deployments/studionet-v2.json) for the current status and evidence.

