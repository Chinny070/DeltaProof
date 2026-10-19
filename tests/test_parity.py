"""Cross-language structural parity: Python contract and JavaScript form preview.

No GenLayer runtime or npm dependency is required. Node runs the real frontend's
pure deriveStructural function and Python runs the real contract helper.
"""
import json
import random
import subprocess
from test_contract import endpoint


def test_contract_frontend_structural_parity(fixture):
    mod,_,_=fixture
    rnd=random.Random(61999)
    cases=[]
    paths=['/users','/balances','/transfers','/profiles','/receipts']
    for _ in range(100):
        old=[]
        for path in rnd.sample(paths, rnd.randrange(1,5)):
            old.append(endpoint(path=path,request=['id'],response=['code','data'],behavior='stable'))
        new=[]
        for e in old:
            if rnd.random()<.25:
                continue
            fresh=dict(e)
            if rnd.random()<.35:fresh['request_required']=['id','token']
            if rnd.random()<.35:fresh['response_required']=['code']
            if rnd.random()<.4:fresh['behavior']='renamed semantics'
            new.append(fresh)
        if rnd.random()<.4:new.append(endpoint(method='POST',path='/updates'))
        if not new:new=[endpoint(method='POST',path='/fallback')]
        cases.append((old,new))
    script='''
import {deriveStructural} from './frontend/src/format.js';
let source='';
for await (const chunk of process.stdin) source += chunk;
const cases=JSON.parse(source);
console.log(JSON.stringify(cases.map(([old,n])=>deriveStructural({endpoints:old},{endpoints:n}))));
'''
    result=subprocess.run(['node','--input-type=module','-e',script],input=json.dumps(cases),
                          capture_output=True,text=True,check=True)
    actual=json.loads(result.stdout)
    for (old,new),js in zip(cases,actual):
        left={e['method']+' '+e['path']:e for e in old}
        right={e['method']+' '+e['path']:e for e in new}
        hard,semantic=mod._diff(left,right)
        assert sorted(hard)==sorted(js['hard'])
        assert sorted(s['key'] for s in semantic)==sorted(js['semantic'])
