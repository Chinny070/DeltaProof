# Synthetic safety counterevidence: strict legacy event consumers

This is new, publisher-controlled synthetic counterevidence for the DeltaProof event tracing candidate. It is not production telemetry, a live API capture, a third-party report, or evidence that a real consumer currently uses this schema.

## Reproducible compatibility check

A consumer with a strict JSON Schema that disallows unspecified response properties accepts the baseline event response but rejects the candidate response after the candidate adds optional `trace_id` and `delivery_region`. The contract’s initial independent decision itself identified strict schema validation as a migration risk to investigate.

The exact bounded vectors are:

- Baseline: `{"event_id":"evt_1001","type":"payment.settled","payload":{"payment_id":"p_1001","amount":42}}`
- Candidate: the same event fields plus `"trace_id":"trace_7f3a"` and `"delivery_region":"eu-west"`.
- Schema: require `event_id`, `type`, and `payload`; set `additionalProperties: false`.

Executed locally with Ajv JSON Schema validation: baseline accepted; candidate rejected; the rejected additional properties were `delivery_region` and `trace_id`. This is a synthetic adversarial-client test, not a claim about an actual deployed consumer.

## Reproduce

From `frontend/` in the pinned DeltaProof revision, run the following with the installed Ajv dependency:

```js
import Ajv from 'ajv';
import assert from 'node:assert/strict';
const ajv = new Ajv({ allErrors: true });
const schema = { type: 'object', additionalProperties: false, required: ['event_id', 'type', 'payload'], properties: { event_id: { type: 'string' }, type: { type: 'string' }, payload: { type: 'object' } } };
const validate = ajv.compile(schema);
const baseline = { event_id: 'evt_1001', type: 'payment.settled', payload: { payment_id: 'p_1001', amount: 42 } };
const candidate = { ...baseline, trace_id: 'trace_7f3a', delivery_region: 'eu-west' };
assert.equal(validate(baseline), true);
assert.equal(validate(candidate), false);
assert.deepEqual(validate.errors.filter(e => e.keyword === 'additionalProperties').map(e => e.params.additionalProperty).sort(), ['delivery_region', 'trace_id']);
```

## Limits

This establishes a concrete compatibility failure for a strict legacy consumer model and supports targeted safety review of additive response fields. It does not prove that the registered event-tracing consumer requires strict property rejection, that a production endpoint emits these values, or that the original APPROVED decision must be overturned. Validators must independently assess the evidence against the registered charter and may uphold the approval.
