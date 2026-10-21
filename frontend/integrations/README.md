# DeltaProof V2 CI gate

`ci-gate.mjs` queries V2's structured `get_authorization(release_id, agent_id)` view using GenLayerJS on StudioNet and `LATEST_FINAL`. It permits adoption only when the returned record is structurally valid and `allow` is the literal boolean `true`; a pending challenge, freeze, appeal, stale configuration, denial, malformed value, missing configuration, or RPC failure exits nonzero. The gate never signs or submits a transaction.

```powershell
$env:DELTAPROOF_V2_CONTRACT_ADDRESS = '0x<verified-v2-address>'
$env:DELTAPROOF_AGENT_ID = 'checkout-agent'
$env:DELTAPROOF_RELEASE_ID = 'payments-2.0.0'
node integrations/ci-gate.mjs
```

The address is intentionally required from deployment configuration. V1's address cannot be used because its ABI has no V2 authorization method. The verified V2 StudioNet address is `0x367C2B9f8B52EEd57977B84c458eaD4c3105E718`. Every nonzero exit should be treated as a hard refusal.

## Read-only Watchtower observer

`watchtower.mjs` polls up to 100 configured agent-release pairs against `get_authorization` at `LATEST_FINAL`, emits a JSON line on initial state and every state/revision/passport change, and emits fail-closed `READ_ERROR` records on RPC or schema failures. It is a read-only observer: it does not hold keys, write transactions, freeze contracts, or spend GEN. A consumer's authorized operator reviews an alert and signs an appropriate safety challenge or reassessment separately.

```powershell
$env:DELTAPROOF_V2_CONTRACT_ADDRESS = '0x<verified-v2-address>'
$env:DELTAPROOF_WATCH_TARGETS = '[{"agentId":"checkout-agent","releaseId":"payments-2.0.0","address":"0x<verified-v2-address>"}]'
$env:DELTAPROOF_WATCH_INTERVAL_MS = '30000'
node integrations/watchtower.mjs
```

Polling respects the observed StudioNet RPC allowance of 500 requests per hour. By default, Watchtower reserves 400 requests/hour for the dashboard, CI, and other clients, leaving a budget of 100 read requests/hour for all Watchtower processes. The poll interval is calculated from the target count and available budget (72 seconds for two targets with the default reserve) and never falls below 15 seconds. A shared rolling-hour budget file coordinates Watchtower processes on the same machine; set `DELTAPROOF_WATCH_BUDGET_FILE` to a shared path if processes run under separate working directories.

Set `DELTAPROOF_WATCH_RPC_LIMIT_PER_HOUR` and `DELTAPROOF_WATCH_OTHER_PROCESS_REQUESTS_PER_HOUR` to values appropriate to observed account-wide traffic. Other processes are accounted for through the operator-configured reserve, because they do not share Watchtower's local budget file. On RPC errors, including HTTP 429, the observer emits `RPC_READ_ERROR` without an authorization status or allow field, stops the current target sweep, honors Retry-After when supplied, and increases the polling delay with jitter. It retains the last good authorization record and emits a separate `RPC_RECOVERED` health event when reads resume; only changed latest-final contract records are emitted as `AUTHORIZATION_STATE` transitions.

Pipe stdout JSON lines into the organization's existing log/alert service. The observer cannot establish semantic safety on its own and does not replace validator adjudication. Existing historical logs are retained as captured; old `READ_ERROR` rows predate this distinction and must not be interpreted as chain transitions.
