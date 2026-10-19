import { createClient, isSuccessful } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant } from 'genlayer-js/types';
import { ADDRESS, HAS_CONTRACT, CHAIN } from './config.js';
export const readClient = createClient({chain:studionet});
export function ensureDeployment() {
  if(!HAS_CONTRACT)throw Error('No deployed DeltaProof contract is configured. Set VITE_CONTRACT_ADDRESS after deployment.');
}
export async function callRead(functionName,args=[]) {
  ensureDeployment();
  return readClient.readContract({address:ADDRESS,functionName,args,transactionHashVariant:TransactionHashVariant.LATEST_FINAL});
}
export async function callWrite(wallet,functionName,args=[],onSubmitted=()=>{}){
  ensureDeployment();
  if(!wallet.state.address || !wallet.state.provider)throw Error('Connect a wallet to sign this transaction.');
  if(wallet.state.chainId!==CHAIN.chainId)throw Error('Switch your wallet to StudioNet first.');
  const client=createClient({chain:studionet,account:wallet.state.address,provider:wallet.state.provider});
  await client.connect('studionet');
  const write={address:ADDRESS,functionName,args};
  // Development-time simulation: replace with a calibrated fee profile before production.
  const estimate=await client.estimateTransactionFeesForWrite(write);
  let hash;
  try {
    hash=await client.writeContract({...write,fees:{distribution:estimate.distribution,feeValue:estimate.feeValue}});
  } catch(error) {throw error;}
  onSubmitted(hash);
  // Never automatically re-submit a tx if this wait times out.
  const receipt=await readClient.waitForFinalization({hash});
  if(!isSuccessful(receipt))throw Error(`Transaction ${hash} failed: ${receipt.statusName||'unknown'} / ${receipt.txExecutionResultName||'unknown'}`);
  return {hash,receipt};
}
