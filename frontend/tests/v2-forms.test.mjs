import test from 'node:test';
import assert from 'node:assert/strict';
import { buildV2WriteArgs, V2_METHODS } from '../src/v2-forms.js';

const data = values => ({ get: name => values[name] });

test('V2 release form preserves JSON specifications as strings in contract order', () => {
  const baseline='{"endpoints":[]}';const candidate='{"endpoints":[{"method":"GET"}]}';const evidence='[]';
  const args=buildV2WriteArgs('register-release',data({release_id:'payment-v2',name:'Payments',version:'2.0',baseline_json:baseline,candidate_json:candidate,evidence_json:evidence}));
  assert.deepEqual(args,['payment-v2','Payments','2.0',baseline,candidate,evidence]);
  assert.equal(typeof args[3],'string');assert.equal(typeof args[4],'string');assert.equal(typeof args[5],'string');
  assert.equal(V2_METHODS['register-release'],'register_release');
});

test('V2 agent registration and semantic action match declared ABI argument order', () => {
  const args=buildV2WriteArgs('register-agent',data({agent_id:'checkout',name:'Checkout',dependencies_json:'[]',charter_json:'{}'}));
  assert.deepEqual(args,['checkout','Checkout','[]','{}']);
  assert.equal(V2_METHODS.adjudicate,'adjudicate');
  assert.deepEqual(buildV2WriteArgs('adjudicate',data({release_id:'payment-v2',agent_id:'checkout'})),['payment-v2','checkout']);
});

test('V2 safety methods preserve numeric duration and string JSON evidence', () => {
  assert.deepEqual(buildV2WriteArgs('freeze',data({release_id:'payment-v2',agent_id:'checkout',reason:'incident',duration_seconds:'3600'})),['payment-v2','checkout','incident',3600]);
  assert.deepEqual(buildV2WriteArgs('open-appeal',data({release_id:'payment-v2',agent_id:'checkout',counterevidence_json:'[]'})),['payment-v2','checkout','[]']);
});

test('V2 forms reject malformed JSON before transaction construction', () => {
  assert.throws(()=>buildV2WriteArgs('register-release',data({release_id:'r',name:'n',version:'1',baseline_json:'{',candidate_json:'{}',evidence_json:'[]'})),/Baseline must be valid JSON/);
  assert.throws(()=>buildV2WriteArgs('unrecognized',data({})),/Unknown V2 action/);
});
