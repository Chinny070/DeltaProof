import test from 'node:test';
import assert from 'node:assert/strict';
import { buildV2WriteArgs, getV2Method, V2_METHODS } from '../src/v2-forms.js';

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

test('V2 safety challenge flow preserves contract method names and commitment JSON strings', () => {
  const payload='[{"kind":"test-report","sha256":"'+'a'.repeat(64)+'","source":"https://evidence.example/report","provenance":"PUBLISHER"}]';
  assert.equal(V2_METHODS['open-safety-challenge'],'open_safety_challenge');
  assert.equal(getV2Method('open-safety-challenge'),'open_safety_challenge');
  assert.deepEqual(buildV2WriteArgs('open-safety-challenge',data({release_id:'r1',agent_id:'a1',counterevidence_json:payload})),['r1','a1',payload]);
  assert.deepEqual(buildV2WriteArgs('respond-safety-challenge',data({release_id:'r1',agent_id:'a1',response_evidence_json:'[]'})),['r1','a1','[]']);
  assert.deepEqual(buildV2WriteArgs('resolve-safety-challenge',data({release_id:'r1',agent_id:'a1'})),['r1','a1']);
});

test('unknown V2 write actions cannot reach the wallet submission path', () => {
  assert.throws(()=>getV2Method('typo-action'),/Unknown V2 action/);
});

test('guided charter workflow constructs bounded ABI JSON from route and policy lines', () => {
  const args=buildV2WriteArgs('register-agent',data({agent_id:'checkout',name:'Checkout',
    dependency_lines:'POST /payments | critical | idempotent retries; safe retries',
    guarantees_lines:'idempotent retries\nstable payment IDs',unacceptable_lines:'duplicate charges',
    evidence_kinds_lines:'independent-test',risk_tolerance:'LOW'}));
  assert.deepEqual(JSON.parse(args[2]),[{method:'POST',path:'/payments',critical:true,guarantees:['idempotent retries','safe retries']}]);
  assert.deepEqual(JSON.parse(args[3]),{guarantees:['idempotent retries','stable payment IDs'],unacceptable_changes:['duplicate charges'],required_evidence_kinds:['independent-test'],risk_tolerance:'LOW'});
  assert.throws(()=>buildV2WriteArgs('register-agent',data({agent_id:'x',name:'X',dependency_lines:'not a route',risk_tolerance:'LOW'})),/Dependency line 1/);
});

test('guided release workflow constructs baseline and candidate endpoint snapshots', () => {
  const args=buildV2WriteArgs('register-release',data({release_id:'r',name:'Payments',version:'2',
    baseline_routes:'POST /payments | Creates a payment | request:key;amount | response:id',
    candidate_routes:'POST /payments | Safely retries a payment | request:key;amount | response:id;status',evidence_json:'[]'}));
  assert.deepEqual(JSON.parse(args[3]),{endpoints:[{method:'POST',path:'/payments',behavior:'Creates a payment',request_required:['key','amount'],response_required:['id']}]});
  assert.deepEqual(JSON.parse(args[4]),{endpoints:[{method:'POST',path:'/payments',behavior:'Safely retries a payment',request_required:['key','amount'],response_required:['id','status']}]});
});

test('V2 forms reject malformed JSON before transaction construction', () => {
  assert.throws(()=>buildV2WriteArgs('register-release',data({release_id:'r',name:'n',version:'1',baseline_json:'{',candidate_json:'{}',evidence_json:'[]'})),/Baseline must be valid JSON/);
  assert.throws(()=>buildV2WriteArgs('unrecognized',data({})),/Unknown V2 action/);
});
