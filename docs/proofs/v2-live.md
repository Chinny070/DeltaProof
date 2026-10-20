# DeltaProof V2 live proof

**Snapshot:** 2026-10-20 16:34:40 UTC  
**Network:** GenLayer StudioNet, chain 61999  
**Active V2 contract:** [`0x367C2B9f8B52EEd57977B84c458eaD4c3105E718`](https://explorer-studio.genlayer.com/address/0x367c2b9f8b52eed57977b84c458ead4c3105e718)  
**Deployment:** [`0x1578c201d04155f61bf16594bdc0b663aacdf9c28be08b71b4ef07d0755a218e`](https://explorer-studio.genlayer.com/tx/0x1578c201d04155f61bf16594bdc0b663aacdf9c28be08b71b4ef07d0755a218e), finalized with majority agreement. Embedded source SHA-256: `72f114e73c91f34a10de53f2715323c87b3048fe830c6d32492cdd00cf5285c0`.

## First application write: Checkout agent

The live `register_agent` call [`0xc4399b7b5e4df126d8319959e7f11ea527bb5c6325784260c16227a0784a87da`](https://explorer-studio.genlayer.com/tx/0xc4399b7b5e4df126d8319959e7f11ea527bb5c6325784260c16227a0784a87da) finalized and executed successfully. SDK latest-final receipt reports `FINALIZED`, `MAJORITY_AGREE`, one round, and execution hash `0x87418f0f7f01f18867f2b67a4ea38ca7604365895e8ee7024f0ebcaed402b29c`. Five validators revealed; three voted `AGREE` and two `IDLE` after quorum. The explorer reports `SUCCESS` and return value `46ee87d212ab89fa0df01a75d3630801ce03a7a830aa10c5f4c97bde226ae1a2`.

The submitted argument order and types matched `register_agent(agent_id, name, dependencies_json, charter_json)`; both JSON fields were strings. Latest-final reads verified the agent ID `checkout-live-20261020`, controller `0xaffE15eEc45b68835cc9E5B4Ab85dD5deaE8e70b`, `ACTIVE` status, config and charter version 1, the `/payment` critical dependency, and the exact charter contents. At that point, the overview reported one agent, zero releases, and zero decisions. The machine-readable details and complete arguments are in [`v2-live.json`](v2-live.json).

Fee evidence: the explorer shows transaction value `0 GEN`; the SDK receipt reports gas limit `2895`. Neither is a settled protocol fee, and the total fee was not exposed.

## Additional agent registrations

The Analytics and Refund fixture records are both present at `LATEST_FINAL`, with the expected controller, active status, version 1, dependency route, and stored charter. The latest overview reports three agents, zero releases, and zero decisions.

The Refund `register_agent` transaction [`0x383a51570302a088dc0c5a62548073d7ae81ced8865b83ad7885fbe11f52480e`](https://explorer-studio.genlayer.com/tx/0x383a51570302a088dc0c5a62548073d7ae81ced8865b83ad7885fbe11f52480e) was independently checked with GenLayerJS 1.1.8: `FINALIZED`, `MAJORITY_AGREE`, one round, execution hash `0x1f13bcaaf50a7d578bce6d53445a86b585cf184f0987a95ce22de9f23dd76bb1`. The five validator votes were `AGREE, AGREE, AGREE, IDLE, IDLE`; the three agreeing executions succeeded and two validators idled after quorum. Explorer execution is `SUCCESS`. Latest-final reads verified the Refund agent, `/refunds` dependency, and LOW risk charter. Its transaction value was `0 GEN`, gas limit `2913`; settled protocol fee was not exposed.

The Analytics record is independently verified in latest-final state, but its transaction hash was not included in the evidence provided and has not been captured by this SDK read. It is deliberately left unreported rather than inferred. Its on-chain creation timestamp is recorded in the JSON snapshot.

## Semantic test fixture preparation

A bounded synthetic scenario for the Refund consumer is pinned in GitHub commit [`6b3af4b0e8abe29c676c454596f29c1b6f24830f`](https://github.com/Chinny070/DeltaProof/commit/6b3af4b0e8abe29c676c454596f29c1b6f24830f). Its UTF-8 SHA-256 is `17014b71c97c5b08cda20058e7b68747a2c17930c9e9a1f37e30b02e0cefd6a9` (1,111 characters). The content is explicitly marked as a controlled synthetic scenario, not production telemetry. GitHub content was fetched at the pinned commit and its digest checked before use. Actual validator-side retrieval and digest verification have not yet been exercised.

## API release registration

The `register_release` call [`0xc34e2bdb8198415c48c16ffd4bd520b9cf81e0612f0e8bc1470640a930a4b92a`](https://explorer-studio.genlayer.com/tx/0xc34e2bdb8198415c48c16ffd4bd520b9cf81e0612f0e8bc1470640a930a4b92a) finalized with `MAJORITY_AGREE`; the SDK receipt has execution hash `0xa6741c743530674f89d18c38d9b6578d134920c1afcafddb82f25e31eec8a9d6`, one round, four `AGREE` votes and one `IDLE`. The explorer reports `SUCCESS`. Latest-final reads confirm the active release `v2api-20261020`, the authorized signer as publisher, and exact baseline, candidate, and evidence commitments. The overview now reports three agents, one release, and zero decisions.

Stored commitments: baseline `51caa0b45677efcf626910cf9e1b715d666bd904ea8e74ba298d9acfcf4c5c15`; candidate `1e39a3201847cf409b9bf4f7cf1d5dc2179c7f5e10e24140ff3a7319427ba30c`; evidence collection `7ca7f285d0c1bd846472eebcae4dc2f2bda799b182be791093d2688860b38bb7`. The release includes a critical Checkout request schema change, an unchanged Analytics route, and a Refund behavior change. These are controlled test specifications, not claims about a production service. The Refund evidence has not yet been retrieved by an adjudication.

The explorer shows value `0 GEN`; SDK receipt gas limit is `2920`. The settled protocol fee was not exposed.

## Remaining live lifecycle work

No deterministic or semantic decision, consumer-specific comparison, CI allow path, freeze, safety challenge, appeal, reassessment, passport, or Watchtower lifecycle has been executed yet. The release is registered but its evidence has not been validator-retrieved. The agent and release writes establish live signer-controlled storage and serialization; the independent command runner still cannot access the user's terminal OS-keychain entry. Subsequent writes should use the same typed SDK/keychain workflow and be reconciled hash-by-hash before continuing.

