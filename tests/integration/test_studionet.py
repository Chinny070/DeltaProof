"""Actual GenVM/Studio integration gates. Never counted in offline totals.

Run after configuring StudioNet account and gltest:
  DELTAPROOF_LIVE_TESTS=1 gltest tests/integration -v -s --network studionet
"""
import json
import os
import pytest

pytestmark = pytest.mark.skipif(os.getenv('DELTAPROOF_LIVE_TESTS') != '1', reason='requires real StudioNet')


def test_deploy_deterministic_certificate():
    from gltest import get_contract_factory
    from gltest.assertions import tx_execution_succeeded

    factory = get_contract_factory('DeltaProof')
    contract = factory.deploy(args=[])
    assert contract.get_protocol().call() == 'deltaproof/1.0'
    baseline = json.dumps({'endpoints':[{'method':'GET','path':'/status','request_required':[],
                                     'response_required':['ok'],'behavior':'Returns status'}]})
    candidate = json.dumps({'endpoints':[{'method':'GET','path':'/status','request_required':[],
                                     'response_required':['ok'],'behavior':'Returns status'},
                                     {'method':'POST','path':'/refresh','request_required':[],
                                     'response_required':['queued'],'behavior':'Queues refresh'}]})
    tx = contract.register_release(args=['Integration Example','v1','v2',baseline,candidate,
             'https://example.com/before','https://example.com/after']).transact()
    assert tx_execution_succeeded(tx)
    entries = contract.list_releases(args=[0,20]).call()
    assert len(entries) == 1
    rid=entries[0]['id']
    tx = contract.evaluate_release(args=[rid]).transact()
    assert tx_execution_succeeded(tx)
    record=contract.get_release(args=[rid]).call()
    assert record['outcome']=='COMPATIBLE'
    assert record['mode']=='DETERMINISTIC'
    assert contract.verify_certificate(args=[rid, record['certificate']]).call() is True
    assert contract.verify_certificate(args=[rid, '0'*64]).call() is False
