# StudioNet deployment and test checklist

## Network

- Network `GenLayer StudioNet`, chain ID `61999` (hex `0xf22f`)
- RPC `https://studio.genlayer.com/api`
- Explorer `https://explorer-studio.genlayer.com`
- Symbol `GEN`

Do not confuse with Studio Next / Studio Devnet chain ID 61997. Use matching `genlayer-js/chains` `studionet` definition.

## Local prerequisites

1. Python 3.12+ and `pytest` for offline tests.
2. Node 22+ and npm. Install `frontend/` packages on a machine with npm connectivity.
3. GenLayer CLI, `genlayer-test`, GenVM linter; Docker only if choosing localnet rather than StudioNet.
4. A funded StudioNet wallet under **your own** control. Never paste its seed/private key into repository, terminal transcript, screenshots or ChatGPT.

The verified StudioNet account currently selected in this environment is locked. Before any deployment, unlock it through the user's secure OS wallet flow, verify `genlayer network info` reports chain `61999`, and confirm the public address with `genlayer account show`. Never export or print a private key. The installed stable CLI uses `genlayer deploy --contract contracts/deltaproof.py --rpc https://studio.genlayer.com/api`; its help does not expose a dry-run or fee-estimate command. The stable `genlayer-js@1.1.8` SDK estimates consensus transaction gas and `eth_gasPrice` as part of `writeContract`, while a read-only preflight returned 500,000 gas and 0 wei/gas (0 GEN outer transaction estimate) for the deployment payload. That RPC quote does not prove there are no protocol-level costs. Obtain explicit user approval before running the deploy command, and show the chain, public signer, measured quote, and fee limitation in the approval request.

## Step-by-step

```bash
python -m pytest -q tests/test_contract.py
python -m compileall -q contracts
# Install required official GenLayer tools per docs.
genvm-lint check contracts/deltaproof.py --json
# StudioNet read/write tools require your configured signer and network:
genlayer network set studionet
# Check current CLI syntax before executing:
genlayer deploy --help
# Deploy contracts/deltaproof.py with no constructor arguments.
```

Use **observed** output, not an invented address. After deployment:

1. Record real address and tx hash in `deployments/studionet.json`, with source hash from `sha256sum contracts/deltaproof.py`.
2. `gltest tests/integration/ -v -s --network studionet` with `DELTAPROOF_LIVE_TESTS=1` and correctly configured wallet signer. If the installed CLI has different syntax, document exact changes.
3. Confirm `get_protocol`, `get_overview`, `list_releases`, `get_release` against address and return types.
4. Create at least three genuine transactions with evidence: unchanged snapshot (`COMPATIBLE`, deterministic), removed required field (`BREAKING`, deterministic), behavioral change (validator-model consensus decision). Capture full hashes and final status/execution result.
5. Attempt direct RPC duplicate registration, unauthorized modification (should be impossible because no write method exists), invalid JSON, malformed behavior response, and mismatched certificate; record results.
6. For semantic consensus, capture each node's risk classifications or available consensus evidence, and verify that the independent validator is actually invoked. Fix any GenVM serialization/runner/provider issue rather than claiming tests are complete.
7. Set `frontend/.env.local` with `VITE_CONTRACT_ADDRESS=0x...` exactly. Run `npm ci`, `npm test`, `npm run build`, `npm run dev`.
8. Test wallet connect, copy, site disconnect, browser refresh restoration, manual switch from Ethereum mainnet to StudioNet, account change, rejected switch, and retry-free tx finality tracking.
9. Deploy static `frontend/dist` to Vercel/Netlify; Vercel root `frontend`, build `npm run build`, output `dist`. Set the same `VITE_CONTRACT_ADDRESS` environment variable in Production; build again after changing it.
10. Verify real public URL at 375px/768px/1440px widths, browser console clean, all tabs functional, no mocked data. Test nested URL reload. Document any remaining blockers.

## Fee estimation warning

The frontend currently calls `estimateTransactionFeesForWrite` for every write. This is suitable for development testing only, not an optimized production UX; the estimate may be costly or error depending on network policy. Codex should profile actual usage, check in reviewed fee policy values or integrate Transaction Kit, and keep accurate live fee estimates. Never hardcode an unmeasured fee preset.

## Security/finality reporting

Store `docs/proofs/live.md` and `docs/proofs/live.json` **only after** the actual transaction suite. A truthful partial report beats fictitious `78/78 live` numbers. Do not backfill fabricated addresses, screenshots or transaction hashes.
