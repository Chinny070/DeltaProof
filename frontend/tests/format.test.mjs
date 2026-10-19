import test from 'node:test';
import assert from 'node:assert/strict';
import {shorten,escapeHtml,validateDraft,deriveStructural,riskClass} from '../src/format.js';
const ep=(method='GET',path='/v1',request_required=['id'],response_required=['value'],behavior='returns value')=>({method,path,request_required,response_required,behavior});
const draft=(a,b)=>({project:'Test API',from:'v1',to:'v2',baseline_url:'https://example.org/spec/v1',candidate_url:'https://example.org/spec/v2',baseline_json:JSON.stringify({endpoints:a}),candidate_json:JSON.stringify({endpoints:b})});
test('formatting escapes arbitrary HTML and quotes',()=>assert.equal(escapeHtml('<img src="x" onerror=\'x\'>&'), '&lt;img src=&quot;x&quot; onerror=&#39;x&#39;&gt;&amp;'));
test('address truncation handles empty string',()=>assert.equal(shorten(''), '—'));
test('risk styles keep unknown neutral',()=>assert.equal(riskClass('UNSET'),'neutral'));
test('valid snapshots parse',()=>assert.equal(validateDraft(draft([ep()],[ep()])).length,2));
test('added endpoint does not introduce hard break',()=>assert.deepEqual(deriveStructural({endpoints:[ep()]},{endpoints:[ep(),ep('POST','/create')]}).hard,[]));
test('removed endpoint breaks',()=>assert.match(deriveStructural({endpoints:[ep()]},{endpoints:[]}).hard[0],/Removed/));
test('added request requirement breaks',()=>assert.equal(deriveStructural({endpoints:[ep()]},{endpoints:[ep('GET','/v1',['id','token'])]}).hard.length,1));
test('removed response requirement breaks',()=>assert.equal(deriveStructural({endpoints:[ep('GET','/v1',['id'],['value','nonce'])]},{endpoints:[ep()]}).hard.length,1));
test('description delta is semantic',()=>assert.equal(deriveStructural({endpoints:[ep()]},{endpoints:[ep('GET','/v1',['id'],['value'],'new behavior')]}).semantic.length,1));
for(const [label,mutate] of [
  ['empty project',d=>d.project=''],['same version',d=>d.to='v1'],
  ['HTTP URL',d=>d.baseline_url='http://example.org/x'],['invalid JSON',d=>d.baseline_json='{no'],
  ['too many endpoints',d=>d.baseline_json=JSON.stringify({endpoints:Array.from({length:13},(_,i)=>ep('GET',`/p${i}`))})],
  ['duplicate endpoint',d=>d.baseline_json=JSON.stringify({endpoints:[ep(),ep()]})],
  ['nonempty behavior required type',d=>d.baseline_json=JSON.stringify({endpoints:[{...ep(),behavior:12}]})],
  ['required fields must be array',d=>d.baseline_json=JSON.stringify({endpoints:[{...ep(),request_required:'id'}]})]
])test(`draft rejects ${label}`,()=>{const d=draft([ep()],[ep()]);mutate(d);assert.throws(()=>validateDraft(d));});
