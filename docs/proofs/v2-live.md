# DeltaProof V2 live proof

**Snapshot:** 2026-10-20 15:45:44 UTC  
**Network:** GenLayer StudioNet, chain 61999  
**Active V2 contract:** [`0x367C2B9f8B52EEd57977B84c458eaD4c3105E718`](https://explorer-studio.genlayer.com/address/0x367c2b9f8b52eed57977b84c458ead4c3105e718)  
**Deployment:** [`0x1578c201d04155f61bf16594bdc0b663aacdf9c28be08b71b4ef07d0755a218e`](https://explorer-studio.genlayer.com/tx/0x1578c201d04155f61bf16594bdc0b663aacdf9c28be08b71b4ef07d0755a218e), finalized with majority agreement. The embedded source SHA-256 is `72f114e73c91f34a10de53f2715323c87b3048fe830c6d32492cdd00cf5285c0`.

## Current finalized state

Fresh `genlayer-js@1.1.8` `LATEST_FINAL` calls returned protocol `deltaproof/2.0`, zero registered agents/releases/decisions, empty agent and release lists, and a structured `NO_DECISION` denial (`allow: false`) for an unknown pair. No application lifecycle records currently exist.

## Lifecycle execution status

No lifecycle transactions were submitted in this run. The configured wallet account exists, but `genlayer account show` reports it **locked** in the execution environment. The available browser session also has no injected wallet provider. The user's earlier wallet unlock occurred in a separate terminal/keychain session that this runner cannot access. No password or private key was requested or handled, and no transaction was submitted.

The next action is for the user to unlock the existing account in the accessible project terminal using:

```powershell
genlayer account unlock --account my-studionet-wallet
```

Enter the password only at the masked terminal prompt, never in chat. Once the signer is available to the execution environment, begin with one typed `register_agent` SDK write, capture its hash and final receipt, verify stored state, and only then continue. No retry is appropriate before resolving signer access.

The structured record is in [`v2-live.json`](v2-live.json). Deployment fee settlement was not exposed by the verified receipt; lifecycle fees remain not applicable because no lifecycle write was sent.
