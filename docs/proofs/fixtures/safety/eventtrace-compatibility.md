# Synthetic compatibility fixture: optional event tracing metadata

This bounded fixture is synthetic acceptance-test material authored for DeltaProof. It is not production telemetry, a live API response, a third-party certification, or an assertion that a deployed service was tested.

## Test scope

Consumer route: `GET /events/{event_id}`.

The consumer charter requires the event identifier to remain stable and existing event payload fields to be preserved. The candidate upgrade adds optional `trace_id` and `delivery_region` response metadata. The required response fields remain `event_id`, `type`, and `payload`; no request fields are added.

## Synthetic test vectors

1. A standard event response contains the same `event_id`, `type`, and `payload` values as the baseline, plus optional `trace_id` and `delivery_region` values.
2. An archived event response contains the same `event_id`, `type`, and `payload` values as the baseline, plus the same optional metadata fields.
3. A legacy consumer that reads only `event_id`, `type`, and `payload` ignores the additional response fields and retains its prior parsing contract.

## Fixture conclusion

Within these synthetic test vectors, the additive tracing metadata does not remove or rename the chartered identifier or payload fields. The vectors support compatibility for this bounded candidate description only. They do not establish the behavior of any production API.

## Provenance and limits

The vectors are a publisher-controlled test fixture for the DeltaProof V2 safety-challenge workflow. They are deliberately bounded and deterministic so independent validators can retrieve the exact UTF-8 content, check its SHA-256 digest, and reason about the stated cases. The fixture is not independent evidence about a real service.

