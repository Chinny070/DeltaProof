# Verification matrix

| Gate | Current source package status | Required next proof |
| --- | --- | --- |
| Python syntax | PASS (`compileall`) | Recheck after GenVM adaptations |
| Offline contract tests | PASS (87 tests) | Direct GenVM/real validator testing |
| Wallet + parity JS | PASS (26 Node tests) | Injected EIP-1193 browser smoke tests |
| JS syntax | PASS (`node --check`) | Actual npm install, bundle/build and browser |
| GenVM lint / type/layout | NOT RUN (tools unavailable) | `genvm-lint check contracts/deltaproof.py --json` |
| SDK dependencies | NOT INSTALLED (npm DNS unavailable) | `npm install` / `npm run build` |
| StudioNet deployment | NOT DEPLOYED | Contract address, source SHA, deployment tx |
| Live validator proof | NOT RUN | Semantic leader/validator runs and consensus receipts |
| Real wallet signing | NOT RUN | Different wallets, chain switch, copy, site disconnect |
| Public frontend | NOT DEPLOYED | Vercel URL, mobile and refresh smoke tests |
| Source pushed to GitHub | NOT PUSHED | GitHub permission required for `Chinny070/DeltaProof` |

`pytest` tests use a lightweight `genlayer` stand-in to test contract logic. They are **not** GenVM execution, deployment or a substitute for the Equivalence Principle running on network validators.
