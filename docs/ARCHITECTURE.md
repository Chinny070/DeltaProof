# DeltaProof architecture and consensus model

## Objective and boundaries

Use GenLayer for **normative interpretation** of bounded API behavior text. Everything that can be expressed as a reliable syntactic rule belongs outside the LLM. DeltaProof analyzes a publisher's *declared interface*; it never claims to have executed the API, audited its source code or authenticated its provenance URL.

```
Issuer (EIP-1193 wallet)
   | signed registration
   v
GenLayer contract
   | canonicalize old/new endpoint snapshots
   | SHA-256 canonical snapshots, immutable issuer + version binding
   | derive endpoint structural changes
   +-- hard breaking changes? ---> BREAKING (DETERMINISTIC)
   +-- no behavior changes? ----> COMPATIBLE (DETERMINISTIC)
   +-- behavior changes --------> independent leader and validator LLM classifications
                                      | consequential risk-vector consensus
                                      v
                                  COMPATIBLE / MIGRATION_REQUIRED /
                                  BREAKING / INCONCLUSIVE
   |
   v
Attestation hash (issuer, versions, source labels, snapshot hashes, risk fields, mode)
   |
   v
Public frontend reads finalized contract state; independent verifier recomputes binding.
```

## Detailed transition rules

- `NOT_REGISTERED` -> `REGISTERED`: anyone signs `register_release`. All strings and JSON snapshots are validated, canonicalized and fingerprinted. Release ID is unique per issuer/project/versions/snapshot digests; duplicate registration is rejected.
- `REGISTERED` -> `ATTESTED`: anyone calls `evaluate_release` exactly once, capturing a snapshot-bound judgment; no admin approval. The method cannot be invoked again on the same release.
- There is **no re-evaluation state and no late mutation**. Incorrect publisher inputs require a new release, not overwriting history.
- `ATTESTED` is final application state only after the consensus transaction succeeds. Protocol appeals/finality are GenLayer-level behavior; frontend waits for finality before claiming success.

## Compatibility semantics

Assume the caller relies on the *declared* old endpoint contract. Three non-negotiable structural regressions are recognized:

1. Endpoint method/path removed.
2. Newly required request input field for an existing endpoint.
3. Previously required output field removed from an existing endpoint.

Other additions are not treated as breaking by syntax alone. The documentation may still be lying or incomplete; those are **out-of-scope** until sources can be verified independently.

Changed `behavior` text requires AI because it can represent a changed retry guarantee, return semantics, side effects, rate-limit guarantees or ordering changes. This is what a fixed enum parser cannot decide reliably. Up to six changed behaviors are sent to the model, bounded to 800 characters each.

## Custom equivalence principle

The leader returns JSON `{ "risks": [ ... ], "reason": "..." }` and a validator **reruns the same assessment independently** using its own LLM. `reason` can differ; the validator agrees only if the classification vector of length N, one risk per change in deterministic sorted order, exactly matches. `COMPATIBLE` requires explicit agreement on every changed behavior; a mismatched or invalid result rejects the round (no certificate). Risk order is breaking, inconclusive, migration needed, then compatible.

The contract does not simply check that the leader's JSON parses, does not trust one model's score, and does not permit a forged `COMPATIBLE` verdict to pass based on well-formedness alone. The trade-off is increased leader rotation and non-finalized writes when reasonable models disagree. See `docs/SECURITY.md` for the remaining failure modes.

## Contract storage / bounded growth

- `releases: TreeMap[str,str]` stores canonical JSON for each immutable record.
- `release_ids: TreeMap[str,str]` maps 1-indexed insertion positions to release IDs.
- `total`, `finalized` are bounded counters.
- `list_releases(offset,limit)` caps reads at 20. For very large deployments, introduce event indexing to avoid copying large records to the browser.

## UI / trust boundary

- Browser reads: GenLayer SDK with `LATEST_FINAL`; no optimistic fake records.
- Browser writes: connected injected provider, matching StudioNet, fee estimate, signed transaction, finalization + execution-result check.
- Site disconnect only forgets a local connection hint. Browser extensions hold their own authorization state.
- Pending transaction hashes survive reload. UI resumes status checks but never blindly resubmits an unknown-outcome write.
- Form validation is convenience; contract repeats every material check against direct RPC callers.
- Browser cannot access the issuer's private key and contains no secret API token.
