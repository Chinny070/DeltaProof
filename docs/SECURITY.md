# DeltaProof threat model and current limitations

## Protected assets

1. Immutability of publisher-submitted release snapshots and their version bindings.
2. Correctness of structural checks under the documented narrow schema.
3. Authenticity of GenLayer consensus **classification process**, subject to protocol assumptions.
4. Finalized certificate integrity; no unauthorized update or certificate forgery through public methods.
5. Wallet privacy: no key custody, no automatic signing, no silent account-authorization request on refresh.

## Threats and mitigations

| Attack/failure | Mitigation | Residual risk |
| --- | --- | --- |
| Malicious spec pretends to be a system instruction | Treat quoted JSON as untrusted; escape angle brackets in fenced body; structure and class of model answer constrained | LLMs can still be influenced by adversarial text; not a formal guarantee |
| Leader invents a green verdict | Validator independently calls its LLM; must agree with exact risk vector | Different models can still make the same wrong judgment; equivalence does not prove truth |
| Leader returns prose, unsupported risk or wrong number of risks | Strict exact shape + length validation, invalid rounds reject | Repeated refusal may hurt liveness |
| Model difference on an ambiguous behavior | Validator refuses mismatched consequential classification | Leader rotations/appeals may be costly; no guaranteed consensus |
| One party rewrites a hosted spec URL | Contract commits issuer-submitted canonical JSON, not mutable URL content | URL is provenance **label**, not independently fetched/verified authority |
| Duplicate transaction submission | Same release ID rejected when identical; frontend tracks submitted tx hash | Different snapshots or versions are distinct records; malicious spam still costs fees |
| Non-owner tries to change an old record | No mutation function exists; evaluation transitions only registered -> attested | Permissionless analysis may spend fees for third parties; intended behavior |
| Oversized JSON, huge input, malformed schema | 10k chars/snapshot, <=12 endpoints, <=16 fields/list, strict fields and duplicate-key checks per endpoint | Total records unbounded (paid on-chain storage; spam economics depend on chain fees) |
| Fake UI success from accepted transaction | UI uses `waitForFinalization` plus `isSuccessful` | Live SDK behavior on target deployment must be checked |
| Wrong network injected wallet | Explicit chain-check and switch/add EIP-1193 flow before signing | Chain-add/switch may be rejected by extension; user needs wallet support |
| App refresh causes repeat prompt or duplicate tx | Restore with `eth_accounts`, never `eth_requestAccounts`; pending hash persisted | Wallet's own permission can be revoked; chain RPC can remain unavailable |
| Cross-site scripting from names, descriptions or API URLs | Escape HTML for rendered user content; React-like HTML concatenation always uses `esc` | DOM-based security must be re-reviewed after UI edits |

## Known protocol limitations (must not be hidden in demos)

- An attestation says whether **declared** new endpoints appear compatible with **declared** previous endpoints. It is not verification of live API functionality, customer-specific dependencies, semantic version correctness, package signatures or authorship.
- HTTPS references are not fetched or cryptographically authenticated. Future capability could require artifact signed provenance, content-addressed object stores and independent source-fetch consensus.
- The narrow schema does not support general OpenAPI / Swagger and cannot infer all possible application-breaking changes.
- Strict risk equality can fail on reasonable but differently phrased judgments. Independent model labels are deliberately not weakened just to issue an apparently green certificate.
- No economic escrow, token custody, paid incentives, privileged administrator or re-evaluation exists.
- No live GenVM compilation, network deployment or true multi-validator observations are claimed in the source package. These are release blockers.
- Historical `get_release` bytes include full snapshots, so all submitted data is public and permanent. Never include API secrets or private customer data.
- `@gl.public.view` certificate verification does not independently prove that the chain itself is authentic; callers must verify the correct chain/address and finalized state.

## Release gate

No production claim until: `genvm-lint` green, SDK version/rpc compatibility confirmed, at least one successful live deterministic and semantic run, deliberate validator disagreement case observed, real wallet flows on desktop/mobile verified, full transaction traces and explorer links recorded, source SHA tied to verified deployment.
