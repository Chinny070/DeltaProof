# DeltaProof controlled semantic test fixture

Fixture version: 1
Purpose: exercise bounded GenLayer semantic evaluation for the registered Refund consumer.

This file describes a synthetic compatibility scenario created for DeltaProof testing. It is not production telemetry, a third-party certification, or a claim that a live refund API has been observed.

Baseline behavior: `POST /refunds` accepts an idempotency key. Repeating the same request with the same key is specified to refer to the same refund operation and must not create a duplicate refund.

Candidate behavior under review: retrying the same refund request may create another refund operation, even when the idempotency key is unchanged.

Relevant registered guarantee: `idempotent refund requests`.
Relevant unacceptable change: `retries may issue duplicate refunds`.

The fixture intentionally supplies a clearly labeled scenario for validator reasoning. A decision based on this fixture demonstrates GenLayer execution and consensus over the committed scenario only; it does not establish the behavior of an external production service.

