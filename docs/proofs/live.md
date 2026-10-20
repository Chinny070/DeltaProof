# StudioNet live test diagnosis

## Result

The first approved application write finalized but rolled back. No follow-up transaction or retry has been sent. Further paid testing is paused until the user approves resuming.

| Item | Verified value |
| --- | --- |
| Network | GenLayer StudioNet, chain ID 61999 |
| Contract | `0x50D7C07A081A56dBd30fB3a244C11A8105E4faA6` |
| Method | `register_release` |
| Transaction | [`0x561f6a78654804dc68a7453bd2d2657d8e61bb11f903a56ee460c36e0e93cc170`](https://explorer-studio.genlayer.com/tx/0x561f6a78654804dc68a7453bd2d2657d8e61bb11f903a56ee460c36e0e93cc170) |
| Status | `FINALIZED` |
| Consensus | `Accepted`; five initial validators; zero rotations |
| Execution | `ERROR`, result `Rollback` |
| Error | `specification too large or empty` |

## Cause

The deployed method has the seven-argument signature:

```text
register_release(str project, str base_version, str candidate_version,
                 str baseline_json, str candidate_json,
                 str baseline_url, str candidate_url)
```

The submitted order matched this signature. The specifications were valid JSON texts with lengths **164** and **297** characters, both within the contract's 2–10,000 character range. The two invalid arguments were positions 3 and 4: the CLI parsed the JSON text into JavaScript objects/maps before encoding calldata, but the contract requires the original JSON text as strings. The `_parse_spec` type/length guard therefore raised its combined “too large or empty” message on a type mismatch.

The installed GenLayer CLI `parseArg` implementation confirms the conversion: it invokes `JSON.parse(value)` and passes object/array results through `coerceValue`. The frontend's genlayer-js write path instead accepts typed JavaScript strings directly. The frontend now builds the register arguments explicitly and rejects decoded snapshot objects before submission. Use this SDK path for future tests; do not use CLI `--args` for object-shaped JSON strings.

## Offline reproduction and regression

The regression covers both sides of the failure: these exact strings parse and register when passed as strings; passing `json.loads(spec)` results as dictionaries reproduces `specification too large or empty`. Frontend tests assert the snapshot arguments stay strings at positions 3 and 4 with lengths 164 and 297.

Test result: **PASS**. `python -m pytest -q tests/test_contract.py tests/test_parity.py` passed 88 tests; `npm test` passed 32 tests; `npm run build` succeeded with 460 modules transformed.

## State and fees

Read-only SDK calls using `LATEST_FINAL` after the failed write returned protocol `deltaproof/1.0`, overview totals `total: 0`, `finalized: 0`, and an empty `list_releases(0, 20)`. This confirms the rollback did not alter the finalized registry.

The explorer shows transaction value `0 GEN`, no EVM gas limit, and does not expose protocol fee settlement. The actual protocol fee is unknown from available evidence; zero transaction value does not mean zero total fees.

## Reuse

No defect in the deployed contract is indicated. Its source remains unchanged and its finalized state remains empty. The existing contract can be reused with the typed SDK string serialization. No redeployment or replacement transaction is authorized by this diagnosis request.

Machine-readable evidence: [`live.json`](live.json). Deployment source and network metadata: [`../../deployments/studionet.json`](../../deployments/studionet.json).
