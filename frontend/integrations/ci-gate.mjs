#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';

export const CHAIN_ID = 61999;

/** Read latest finalized V2 authorization; fail closed on errors or non-booleans. */
export async function checkAuthorization({ client, address, agentId, releaseId }) {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address || '')) throw new Error('Invalid V2 contract address');
  if (!agentId || !releaseId) throw new Error('Agent identity and release identity are required');
  const authorized = await client.readContract({
    address,
    functionName: 'is_authorized',
    args: [releaseId, agentId],
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  });
  if (typeof authorized !== 'boolean') throw new Error('Authorization read returned an invalid value');
  return { allow: authorized, agentId, releaseId, chainId: CHAIN_ID, state: 'LATEST_FINAL' };
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
