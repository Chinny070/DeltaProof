import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/v2-main.js', import.meta.url), 'utf8');

test('V2 guide describes deployed StudioNet state without stale preview claims', () => {
  assert.match(source, /connected to the deployed StudioNet contract/i);
  assert.match(source, /Live records elsewhere in the app come from finalized contract reads/i);
  assert.doesNotMatch(source, /un-deployed development branch|No V2 address configured in this development workspace/i);
});

test('evidence guidance distinguishes digest integrity from source authenticity', () => {
  assert.match(source, /Validators retrieve bounded evidence content and verify its digest/i);
  assert.match(source, /provenance labels do not prove source authenticity or truth/i);
  assert.doesNotMatch(source, /the contract does not claim to fetch or authenticate their URLs/i);
});
