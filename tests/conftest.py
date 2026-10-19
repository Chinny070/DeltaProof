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
        self.nondet = types.SimpleNamespace(exec_prompt=self.prompt)
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
