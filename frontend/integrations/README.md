# DeltaProof V2 CI gate

## Deployment target and latest-final runtime smoke

V2 is pinned to the current StudioNet deployment at `0xEf72A2db4EbeD151273B137D8a741e4C537415f9`, chain `61999`, RPC `https://studio.genlayer.com/api`, protocol `deltaproof/2.0`. Its verified contract source hash is `98c783f80a04caccab8077f55c6de8ee1ff792afb0c47594c26e4dcb92ec13ab` (deployed source corresponding to commit `f74a37a053c2c14278221e17632cd26fca038e4c`). It currently has four registered agents, two releases, and four decisions. Earlier lifecycle transactions for `0x367C2B9f8B52EEd57977B84c458eaD4c3105E718` are historical and kept separate. The browser build reads `VITE_DELTAPROOF_V2_ADDRESS`; do not use the V1 `VITE_CONTRACT_ADDRESS` value as the V2 address. A sample environment file is [`../.env.example`](../.env.example).

From PowerShell, set the exact address and an existing pair, then run the read-only smoke check:

```powershell
$env:VITE_DELTAPROOF_V2_ADDRESS = '0xEf72A2db4EbeD151273B137D8a741e4C537415f9'
$env:DELTAPROOF_V2_AGENT_ID = 'eventtrace-live-20261021'
$env:DELTAPROOF_V2_RELEASE_ID = 'eventtrace-v2-20261021'
npm run test:v2:runtime
```

The smoke check makes three latest-final reads (`get_protocol`, `get_overview`, and the exact pair's `get_authorization`). It sends no transaction. An RPC failure is reported as `READ_ERROR`, never as a contract denial. Offline behavior is covered by `v2-runtime-smoke.test.mjs`; the command above is a separate live runtime check and requires network access.

`ci-gate.mjs` queries V2's structured `get_authorization(release_id, agent_id)` view using GenLayerJS on StudioNet and `LATEST_FINAL`. It permits adoption only when the returned record is structurally valid and `allow` is the literal boolean `true`; a pending challenge, freeze, appeal, stale configuration, denial, malformed value, missing configuration, or RPC failure exits nonzero. The gate never signs or submits a transaction.

```powershell
$env:DELTAPROOF_V2_CONTRACT_ADDRESS = '0x<verified-v2-address>'
$env:DELTAPROOF_AGENT_ID = 'checkout-agent'
$env:DELTAPROOF_RELEASE_ID = 'payments-2.0.0'
node integrations/ci-gate.mjs
```

The address is intentionally required from deployment configuration. V1's address cannot be used because its ABI has no V2 authorization method. The current verified V2 StudioNet address is `0xEf72A2db4EbeD151273B137D8a741e4C537415f9`. Every nonzero exit should be treated as a hard refusal.

The `live-*.mjs` lifecycle scripts are explicitly pinned to the current V2 address and skip already finalized fixture records. Do not rerun write steps unless there is fresh authorization for the specific transaction; do not repeat completed lifecycle transactions. Current lifecycle hashes and outcomes are in [`../../docs/proofs/v2-live-current-2026-10-21.md`](../../docs/proofs/v2-live-current-2026-10-21.md). The earlier lifecycle proofs on the superseded address remain historical.

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
