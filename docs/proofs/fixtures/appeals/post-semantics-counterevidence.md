# Appeal counterevidence: general HTTP POST semantics

This bounded quotation from the MDN Web Docs POST method reference says repeated identical POST requests can have additional effects, including creating duplicate records. It is relevant background showing that HTTP POST does not guarantee idempotency by itself.

Source: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/POST
Authoritative source maintained by MDN contributors. Retrieved 2026-10-20. This excerpt does not describe or verify DeltaProof's controlled refund API. It cannot negate that consumer's registered `idempotent refund requests` guarantee or the candidate fixture's explicit duplicate-refund behavior.

Quoted excerpt (18 words): “Successive identical POST requests may have additional effects, such as creating the same order several times.”

Use: appeal review context only. Do not treat this generic HTTP rule as evidence that the registered candidate is compatible.
