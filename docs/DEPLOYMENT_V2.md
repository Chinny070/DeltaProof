# DeltaProof V2 StudioNet deployment and live verification

## Active deployment

- Network: GenLayer StudioNet, chain `61999`, RPC `https://studio.genlayer.com/api`.
- Corrected active contract: `DeltaProofV2` at [`0x367C2B9f8B52EEd57977B84c458eaD4c3105E718`](https://explorer-studio.genlayer.com/address/0x367c2b9f8b52eed57977b84c458ead4c3105e718).
- Corrective deployment: [`0x1578c201d04155f61bf16594bdc0b663aacdf9c28be08b71b4ef07d0755a218e`](https://explorer-studio.genlayer.com/tx/0x1578c201d04155f61bf16594bdc0b663aacdf9c28be08b71b4ef07d0755a218e), finalized at `2026-10-20T14:37:50.508161Z`.
- Deployer: `0xaffE15eEc45b68835cc9E5B4Ab85dD5deaE8e70b`.
- Embedded deployed source: 79,729 bytes; SHA-256 `72f114e73c91f34a10de53f2715323c87b3048fe830c6d32492cdd00cf5285c0`, matching the corrected local source.
- Consensus: one round, `MAJORITY_AGREE`; three validators agreed and executed successfully, two idled after quorum. Execution hash: `0xac684ea0210461ecc6797cbc3a71f0d6ed82080026abda52555f545cd64c3211`.
- At initial deployment verification, SDK latest-final reads showed zero agents, releases, and decisions; `getContractSchema` returned all 34 declared methods. Current latest-final reads show three active agents, one active release, and three finalized decisions.
- Live CI gate probe for an unknown pair returned a correctly identity-bound `NO_DECISION` response: `allow: false`, pair IDs matched, `state: LATEST_FINAL`.
- Fee evidence: total GEN protocol fee is not exposed by the verified transaction response. It reports gas limit `2873`; this is not a measured fee and no total fee is claimed.

## Public V2 frontend

- Separate Vercel project: `deltaproof-v2` (`prj_vtqZt24tc6qClgetqnN3ytdcvaqE`).
- Production deployment: [`https://deltaproof-v2.vercel.app`](https://deltaproof-v2.vercel.app), deployment `dpl_BUxTvqsSqjq5GBZBNwxLaeGs7Zx4`.
- Built with `VITE_DELTAPROOF_V2_ADDRESS=0x367C2B9f8B52EEd57977B84c458eaD4c3105E718`.
- HTTP smoke: `/` and `/v2/` both returned 200; the V2 bundle contains the corrected contract address. Fresh Chrome inspection shows latest-final dashboard counts of three agents, one release, and three decisions. Responsive checks at 375, 768, and 1440 CSS pixels found no horizontal overflow.
- The existing V1 project and its production URL [`https://deltaproof-ebon.vercel.app`](https://deltaproof-ebon.vercel.app) remain unchanged and return the V1 title.

Wallet signing and live V2 write flows have not been browser-tested. Chrome console logs show MetaMask could not install its provider because another extension already defined a getter-only `window.ethereum`; the page sees no provider. This is a conflict in the tested browser profile, not an app-side assignment. The signer cache is available only in the user's PowerShell terminal; the separate runner cannot access it. See the timestamped [`V2 live proof`](proofs/v2-live.md) for receipts and remaining work.

The first deployment at `0x8addd2bC124C276130a8CAF4ED1341C7F42432a7` (transaction `0xdc6aff4084463b68b94e5e5c277dee266df4f1935d0c5437961b3ae9b7ca65a6`, source SHA-256 `20ee871691c4fd3ce5b44250d815082b4bf25bf38327a6b1f8b20607bf22b1f7`) was superseded after a live CI read exposed that `NO_DECISION` omitted the requested agent and release IDs. The corrected contract binds that denial to both IDs; the regression test passes. The old deployment remains immutable and must not be used by clients.

Agent and release registration confirm basic write finality and storage serialization. Checkout and Analytics deterministic adjudications and Refund semantic consensus are finalized. Analytics' targeted freeze and resolution finalized; latest-final state is revision 2 APPROVED / ALLOW. Refund's evidence-backed appeal finalized UPHELD; Refund remains BLOCKED. The safety challenge and injected-wallet interactions remain incomplete. The semantic adjudication and appeal-resolution receipts both report the same `tx_execution_hash`; the receipts were independently fetched and the protocol meaning of this repeated field remains unexplained.

## Next live verification steps

Use the corrected active address only. Use GenLayer JS SDK typed `writeContract` arguments rather than CLI `--args` for JSON text parameters; the V1 incident showed that the CLI can decode object-shaped JSON strings into maps. For each write, record the hash, wait for `FINALIZED`, check execution success separately, and read latest-final state before continuing. If an outcome is unknown, reconcile that hash before considering any retry.

1. Use the guarded safety runner from the user's unlocked PowerShell wallet, one action at a time: register a distinct affected agent and release, adjudicate, then only if the real decision is APPROVED publish new counterevidence and continue the challenge.
2. Keep the read-only Watchtower running and retain JSONL observations. It currently records only the new pair's initial `NO_DECISION`; no challenge transition has been observed.
3. Run the live CI gate before, during, and after the challenge against actual finalized state. The current pre-registration baseline is `NO_DECISION`, deny, exit code 1.
4. Test MetaMask or Rabby in a profile with a working provider injection and verify connect/disconnect/copy/persistence/network/account changes, writes, finality, and failure UI.
5. Run the gated V2 GenVM StudioNet integration test when available; lint/typecheck and harness tests do not replace runtime execution.

## Contract controls

Appeals retrieve and digest-check counterevidence, publisher responses, and original release evidence on leader and validators. A hash-only appeal cannot overturn. Approved pairs use a separate safety challenge: only the affected consumer controller can submit within seven days, with 1–4 verified sources; validators screen for new, relevant evidence before opening a targeted hold. The publisher has a two-day response window. Challenges are capped at two per pair. Missing, inconclusive, blocked, or timed-out evidence does not restore a stale approval; fresh adjudication is required. `get_authorization` is fail-closed. The read-only Watchtower polls bounded latest-final pairs and never signs or writes.

Offline tests and static lint/typecheck do not replace real validator-driven lifecycle verification. See [`V2_STATUS.md`](V2_STATUS.md) and [`studionet-v2.json`](../deployments/studionet-v2.json) for the current status and evidence.

