# DeltaProof V2 CI gate

`ci-gate.mjs` queries V2's `is_authorized(release_id, agent_id)` view using GenLayerJS on StudioNet and `LATEST_FINAL`. It permits adoption only when the contract returns the literal boolean `true`; a `false`, malformed value, missing configuration, or RPC failure exits nonzero. The gate never signs or submits a transaction.

```powershell
$env:DELTAPROOF_V2_CONTRACT_ADDRESS = '0x<verified-v2-address>'
$env:DELTAPROOF_AGENT_ID = 'checkout-agent'
$env:DELTAPROOF_RELEASE_ID = 'payments-2.0.0'
node integrations/ci-gate.mjs
```

The address is intentionally required from deployment configuration. V1's address cannot be used because its ABI has no V2 authorization method. No live V2 address exists until a separately authorized deployment is completed. Every nonzero exit should be treated as a hard refusal.
