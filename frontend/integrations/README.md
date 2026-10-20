# DeltaProof V2 CI gate

`ci-gate.mjs` queries V2's structured `get_authorization(release_id, agent_id)` view using GenLayerJS on StudioNet and `LATEST_FINAL`. It permits adoption only when the returned record is structurally valid and `allow` is the literal boolean `true`; a pending challenge, freeze, appeal, stale configuration, denial, malformed value, missing configuration, or RPC failure exits nonzero. The gate never signs or submits a transaction.

```powershell
$env:DELTAPROOF_V2_CONTRACT_ADDRESS = '0x<verified-v2-address>'
$env:DELTAPROOF_AGENT_ID = 'checkout-agent'
$env:DELTAPROOF_RELEASE_ID = 'payments-2.0.0'
node integrations/ci-gate.mjs
```

The address is intentionally required from deployment configuration. V1's address cannot be used because its ABI has no V2 authorization method. No live V2 address exists until a separately authorized deployment is completed. Every nonzero exit should be treated as a hard refusal.

## Read-only Watchtower observer

`watchtower.mjs` polls up to 100 configured agent-release pairs against `get_authorization` at `LATEST_FINAL`, emits a JSON line on initial state and every state/revision/passport change, and emits fail-closed `READ_ERROR` records on RPC or schema failures. It is a read-only observer: it does not hold keys, write transactions, freeze contracts, or spend GEN. A consumer's authorized operator reviews an alert and signs an appropriate safety challenge or reassessment separately.

```powershell
$env:DELTAPROOF_V2_CONTRACT_ADDRESS = '0x<verified-v2-address>'
$env:DELTAPROOF_WATCH_TARGETS = '[{"agentId":"checkout-agent","releaseId":"payments-2.0.0","address":"0x<verified-v2-address>"}]'
$env:DELTAPROOF_WATCH_INTERVAL_MS = '30000'
node integrations/watchtower.mjs
```

Polling is limited to once every 15 seconds or slower. Pipe stdout JSON lines into the organization's existing log/alert service. The observer cannot establish semantic safety on its own and does not replace validator adjudication.
