# Benchmark: engineering disciplines, not a cloned idea

KeyWitness (`Hemmy1417/KeyWitness`) demonstrates a high bar for GenLayer use: real AI-dependent decisions, explicit agreement conditions, deterministic consequences, documented security assumptions, parity/mutation tests and archived live consensus proofs.

DeltaProof is not a property dispute or an evidence/escrow app. It targets a distinct problem: versioned interface compatibility and proof-of-upgrade semantics for software and AI integrations.

| Dimension | DeltaProof strategy | Proof status |
| --- | --- | --- |
| GenLayer necessity | Independent semantic reasoning over changed API behavioral guarantees | Contract logic built; live proof outstanding |
| Deterministic scope | Removed method/path, newly required inputs, dropped required outputs | 87 offline Python tests (including one 100-scenario parity gate) total |
| Consensus model | Validator reruns model on frozen snapshots; consequential risk vectors must match | Mocked consensus tested; real GenVM missing |
| Evidence binding | Canonical snapshots + hashes; issuer/source/version provenance labels | Hash tamper testing passed |
| State machine | `REGISTERED` -> `ATTESTED` only once | Tests passed |
| Frontend | Bright, original responsive interface; live registry and verification | npm clean install and production build pass; 375/768/1440 px preview checked |
| Wallet | Connect, copy, session disconnect, persistence, network-switch/add | 30 Node tests passed; extension-based browser checks still missing |
| Verifiable deployment | Transaction receipts and screenshots, explorer parity, contract source hash | Not yet available |

No one can guarantee a higher judge score from code or test counts alone. DeltaProof should be submitted only with authentic, independently reviewable live evidence.
