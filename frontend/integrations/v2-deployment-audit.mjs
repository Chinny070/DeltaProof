#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';
import { V2_DEPLOYMENT } from './v2-runtime-smoke.mjs';
import { requireSuccessfulV2Finality } from '../src/v2-api.js';

export const DEPLOYED_SOURCE_SHA256 = '98c783f80a04caccab8077f55c6de8ee1ff792afb0c47594c26e4dcb92ec13ab';
export const SOURCE_COMMIT = 'f74a37a053c2c14278221e17632cd26fca038e4c';
export const REPRESENTATIVE_TRANSACTIONS = Object.freeze([
  { label: 'current-deployment', hash: '0xa40625af8b4a3b0ad83564e30f22cd149d399e7cd229dcf6189791662e41518e',
    contract_address: '0xEf72A2db4EbeD151273B137D8a741e4C537415f9' },
  { label: 'historical-semantic-refund-adjudication', hash: '0xa94d0375e5b09e4949af6a7aefaa236cafef17928bb9bbd0c417c8b11a61e81c',
    contract_address: '0x367C2B9f8B52EEd57977B84c458eaD4c3105E718' },
  { label: 'historical-safety-challenge-resolution', hash: '0x3ec964e9d026318c1d9c725f83ed6d5d87a0ca5d3ea38429be1b856f8c13937e',
    contract_address: '0x367C2B9f8B52EEd57977B84c458eaD4c3105E718' },
  { label: 'historical-eventtrace-final-adjudication', hash: '0x1568c7b546c075ee01b3e8d777781489173989e273a59adcb91f300e825f9198',
    contract_address: '0x367C2B9f8B52EEd57977B84c458eaD4c3105E718' },
]);
export const PAIRS = Object.freeze([
  { release_id: 'v2api-20261020', agent_id: 'checkout-live-20261020' },
  { release_id: 'v2api-20261020', agent_id: 'analytics-live-20261020' },
  { release_id: 'v2api-20261020', agent_id: 'refund-live-20261020' },
  { release_id: 'eventtrace-v2-20261021', agent_id: 'eventtrace-live-20261021' },
]);

export async function auditV2Deployment({ client, localSourceBytes }) {
  const deployedSource = await client.getContractCode(V2_DEPLOYMENT.address);
  const deployedSourceHash = createHash('sha256').update(deployedSource, 'utf8').digest('hex');
  // Normalize CRLF checkouts so the source hash identifies contract text, not OS line endings.
  const normalizedLocalSource = localSourceBytes.toString('utf8').replace(/\r\n/g, '\n');
  const localSourceHash = createHash('sha256').update(normalizedLocalSource, 'utf8').digest('hex');
  const transactions = [];
  for (const item of REPRESENTATIVE_TRANSACTIONS) {
    const receipt = await client.waitForTransactionReceipt({ hash: item.hash,
      status: 'FINALIZED', interval: 1000, retries: 0, fullTransaction: true });
    requireSuccessfulV2Finality(item.hash, receipt);
    const rawLeaders = receipt.consensus_data?.leader_receipt;
    const leaders = (Array.isArray(rawLeaders) ? rawLeaders : rawLeaders ? [rawLeaders] : [])
      .map(leader => ({ execution_result: leader.execution_result,
        error_description: leader.genvm_result?.error_description ?? null,
        raw_error: leader.genvm_result?.raw_error ?? null }));
    transactions.push({ label: item.label, hash: item.hash, contract_address: item.contract_address,
      status: receipt.statusName ?? receipt.status_name ?? receipt.status,
      consensus: receipt.result_name ?? receipt.resultName ?? null,
      tx_execution_hash: receipt.tx_execution_hash ?? receipt.txExecutionHash ?? null,
      leaders });
  }
  const read = (functionName, args = []) => client.readContract({ address: V2_DEPLOYMENT.address,
    functionName, args, transactionHashVariant: TransactionHashVariant.LATEST_FINAL });
  const overview = await read('get_overview');
  const authorizations = [];
  for (const pair of PAIRS) {
    const value = await read('get_authorization', [pair.release_id, pair.agent_id]);
    if (!value || value.release_id !== pair.release_id || value.agent_id !== pair.agent_id
        || typeof value.allow !== 'boolean' || typeof value.status !== 'string') {
      throw Error(`Malformed latest-final authorization for ${pair.release_id}/${pair.agent_id}`);
    }
    authorizations.push(value);
  }
  return {
    network: 'StudioNet', chain_id: studionet.id, rpc_url: studionet.rpcUrls.default.http[0],
    contract_address: V2_DEPLOYMENT.address,
    source: { deployed_sha256: deployedSourceHash, recorded_deployment_sha256: DEPLOYED_SOURCE_SHA256,
      deployed_hash_matches_record: deployedSourceHash === DEPLOYED_SOURCE_SHA256,
      deployed_source_commit: SOURCE_COMMIT, local_branch_sha256: localSourceHash,
      local_matches_deployed: localSourceHash === deployedSourceHash },
    representative_transactions: transactions,
    latest_final: { overview, authorizations },
  };
}

async function main() {
  if (studionet.id !== V2_DEPLOYMENT.chainId || studionet.rpcUrls.default.http[0] !== V2_DEPLOYMENT.rpcUrl) {
    throw Error('SDK StudioNet configuration does not match chain 61999 and the configured RPC.');
  }
  const localSourceBytes = await readFile(new URL('../../contracts/deltaproof_v2.py', import.meta.url));
  const client = createClient({ chain: studionet });
  process.stdout.write(JSON.stringify(await auditV2Deployment({ client, localSourceBytes }), null, 2) + '\r\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    process.stderr.write(JSON.stringify({ state: 'AUDIT_ERROR', reason: error?.message || String(error) }) + '\r\n');
    process.exitCode = 2;
  });
}
