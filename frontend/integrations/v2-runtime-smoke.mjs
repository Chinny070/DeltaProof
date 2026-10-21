#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';

export const V2_DEPLOYMENT = Object.freeze({
  chainId: 61999,
  rpcUrl: 'https://studio.genlayer.com/api',
  address: '0x367C2B9f8B52EEd57977B84c458eaD4c3105E718',
  protocol: 'deltaproof/2.0',
});

export function validateV2RuntimeReads({ protocol, overview, authorization }, { agentId, releaseId }) {
  if (protocol !== V2_DEPLOYMENT.protocol) throw Error(`Unexpected V2 protocol: ${String(protocol)}`);
  if (!overview || overview.protocol !== V2_DEPLOYMENT.protocol
      || !['agents', 'releases', 'decisions'].every(key => Number.isSafeInteger(overview[key]) && overview[key] >= 0)) {
    throw Error('V2 get_overview returned an invalid finalized record.');
  }
  if (!authorization || typeof authorization !== 'object' || typeof authorization.allow !== 'boolean'
      || authorization.agent_id !== agentId || authorization.release_id !== releaseId
      || typeof authorization.status !== 'string' || !Number.isSafeInteger(authorization.revision)
      || (authorization.allow && authorization.status !== 'ALLOW')
      || (!authorization.allow && authorization.status === 'ALLOW')) {
    throw Error('V2 get_authorization returned an invalid pair-bound record.');
  }
  return { network: 'StudioNet', chainId: V2_DEPLOYMENT.chainId, address: V2_DEPLOYMENT.address,
    state: 'LATEST_FINAL', protocol, overview, authorization };
}

export async function runV2RuntimeSmoke({ client, agentId, releaseId }) {
  const read = (functionName, args = []) => client.readContract({
    address: V2_DEPLOYMENT.address,
    functionName,
    args,
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  });
  const [protocol, overview, authorization] = await Promise.all([
    read('get_protocol'),
    read('get_overview'),
    read('get_authorization', [releaseId, agentId]),
  ]);
  return validateV2RuntimeReads({ protocol, overview, authorization }, { agentId, releaseId });
}

async function main() {
  const address = (process.env.VITE_DELTAPROOF_V2_ADDRESS || '').trim();
  const agentId = (process.env.DELTAPROOF_V2_AGENT_ID || '').trim();
  const releaseId = (process.env.DELTAPROOF_V2_RELEASE_ID || '').trim();
  if (address.toLowerCase() !== V2_DEPLOYMENT.address.toLowerCase()) {
    throw Error(`Set VITE_DELTAPROOF_V2_ADDRESS to the verified StudioNet V2 address ${V2_DEPLOYMENT.address}.`);
  }
  if (!agentId || !releaseId) throw Error('Set DELTAPROOF_V2_AGENT_ID and DELTAPROOF_V2_RELEASE_ID to the exact pair to inspect.');
  if (studionet.id !== V2_DEPLOYMENT.chainId || studionet.rpcUrls.default.http[0] !== V2_DEPLOYMENT.rpcUrl) {
    throw Error('Installed GenLayerJS StudioNet target does not match chain 61999 RPC configuration.');
  }
  const client = createClient({ chain: studionet });
  const result = await runV2RuntimeSmoke({ client, agentId, releaseId });
  process.stdout.write(JSON.stringify(result, null, 2) + '\r\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    process.stderr.write(JSON.stringify({ state: 'READ_ERROR', reason: error?.message || String(error) }) + '\r\n');
    process.exitCode = 2;
  });
}
