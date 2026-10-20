#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';

export const CHAIN_ID = 61999;

/** Read machine-readable latest finalized V2 authorization; allow only literal true. */
export async function checkAuthorization({ client, address, agentId, releaseId }) {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address || '')) throw new Error('Invalid V2 contract address');
  if (!agentId || !releaseId) throw new Error('Agent identity and release identity are required');
  const authorized = await client.readContract({
    address,
    functionName: 'get_authorization',
    args: [releaseId, agentId],
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  });
  if (!authorized || typeof authorized !== 'object' || typeof authorized.allow !== 'boolean'
      || authorized.agent_id !== agentId || authorized.release_id !== releaseId
      || typeof authorized.status !== 'string' || typeof authorized.revision !== 'number'
      || (authorized.allow && authorized.status !== 'ALLOW') || (!authorized.allow && authorized.status === 'ALLOW')) {
    throw new Error('Authorization read returned an invalid value');
  }
  return { ...authorized, allow: authorized.allow === true, agentId, releaseId, chainId: CHAIN_ID, state: 'LATEST_FINAL' };
}

async function main() {
  const address = process.env.DELTAPROOF_V2_CONTRACT_ADDRESS;
  const agentId = process.env.DELTAPROOF_AGENT_ID;
  const releaseId = process.env.DELTAPROOF_RELEASE_ID;
  const client = createClient({ chain: studionet });
  try {
    const result = await checkAuthorization({ client, address, agentId, releaseId });
    process.stdout.write(JSON.stringify(result) + '\n');
    if (!result.allow) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(JSON.stringify({ allow: false, state: 'ERROR', reason: error?.message || String(error) }) + '\n');
    process.exitCode = 2;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
