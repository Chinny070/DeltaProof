"""Lightweight contract execution harness. This tests rules, not a real GenVM consensus."""
import importlib.util
import pathlib
import sys
import types
import pytest


class UserError(Exception):
    pass


class Return:
    def __init__(self, calldata):
        self.calldata = calldata


class FakeTreeMap(dict):
    def __class_getitem__(cls, item):
        return cls


class FakeAddress:
    def __init__(self, value="0x" + "a" * 40):
        self.as_hex = value


class FakeGl:
    class Contract:
        pass

    def __init__(self):
        self.public = types.SimpleNamespace(write=lambda f:f, view=lambda f:f)
        self.vm = types.SimpleNamespace(UserError=UserError, Return=Return, run_nondet_unsafe=self.consensus)
        self.message = types.SimpleNamespace(sender_address=FakeAddress())
        self.answers = []
        self.web_bodies = {}
        self.nondet = types.SimpleNamespace(exec_prompt=self.prompt, web=types.SimpleNamespace(get=self.web_get))
        self.calls = 0
        self.prompts = []

    def prompt(self, prompt, response_format=None):
        self.calls += 1
        self.prompts.append(prompt)
        if not self.answers:
            raise UserError('No model result scripted')
        value = self.answers.pop(0)
        if isinstance(value, Exception):
            raise value
        return value

    def web_get(self, url):
        if url not in self.web_bodies:
            raise UserError('Offline test has no response for this evidence source')
        return types.SimpleNamespace(body=self.web_bodies[url])

    def consensus(self, leader, validator):
        result = leader()
        if not validator(Return(result)):
            raise UserError('Validator disagreement, not committed')
        return result


@pytest.fixture
def fixture():
    g = FakeGl()
    stub = types.ModuleType('genlayer')
    stub.gl = g
    stub.TreeMap = FakeTreeMap
    stub.u32 = int
    sys.modules['genlayer'] = stub
    path = pathlib.Path(__file__).parents[1] / 'contracts' / 'deltaproof.py'
    spec = importlib.util.spec_from_file_location('deltaproof_contract_test', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    instance = module.DeltaProof()
    instance.releases = FakeTreeMap()
    instance.release_ids = FakeTreeMap()
    yield module, instance, g
    sys.modules.pop('genlayer', None)


@pytest.fixture
def v2_fixture():
    g = FakeGl()
    stub = types.ModuleType('genlayer')
    stub.gl = g
    stub.TreeMap = FakeTreeMap
    stub.u32 = int
    sys.modules['genlayer'] = stub
    path = pathlib.Path(__file__).parents[1] / 'contracts' / 'deltaproof_v2.py'
    spec = importlib.util.spec_from_file_location('deltaproof_v2_test', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    instance = module.DeltaProofV2()
    for field in ('agents', 'charters', 'releases', 'release_state', 'release_state_history', 'decisions', 'decision_history', 'passports',
                  'appeals', 'appeal_history', 'safety_challenges', 'safety_challenge_history', 'safety_challenge_cycles',
                  'freezes', 'freeze_history', 'freeze_counts', 'reassessments',
                  'appeal_cycles', 'agent_ids', 'release_ids', 'agent_history'):
        setattr(instance, field, FakeTreeMap())
    yield module, instance, g
    sys.modules.pop('genlayer', None)
