import { CHAIN } from './config.js';

export const V2_ADDRESS = (import.meta.env?.VITE_DELTAPROOF_V2_ADDRESS || '').trim();
export const V2_CONFIGURED = /^0x[a-fA-F0-9]{40}$/.test(V2_ADDRESS);

let sdkPromise;
let clientPromise;
async function sdk() {
  sdkPromise ??= Promise.all([import('genlayer-js'), import('genlayer-js/chains'), import('genlayer-js/types')])
    .then(([core, chains, types]) => ({ ...core, ...types, studionet: chains.studionet }));
  return sdkPromise;
}
async function readClient() {
  clientPromise ??= sdk().then(({ createClient, studionet }) => createClient({ chain: studionet }));
  return clientPromise;
}
function configured() {
  if (!V2_CONFIGURED) throw Error('V2 is not deployed/configured. No live V2 contract address was provided.');
}

export async function v2Read(functionName, args = []) {
  configured();
  const [{ TransactionHashVariant }, client] = await Promise.all([sdk(), readClient()]);
  return client.readContract({ address: V2_ADDRESS, functionName, args,
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL });
}

export async function v2Write(wallet, functionName, args = [], onSubmitted = () => {}) {
  configured();
  if (!wallet.state.address || !wallet.state.provider) throw Error('Connect a wallet before signing.');
  if (wallet.state.chainId !== CHAIN.chainId) throw Error('Switch the wallet to StudioNet (chain 61999) first.');
  const { createClient, studionet, TransactionStatus, ExecutionResult } = await sdk();
  const client = createClient({ chain: studionet, account: wallet.state.address, provider: wallet.state.provider });
  await client.connect('studionet');
  const hash = await client.writeContract({ address: V2_ADDRESS, functionName, args });
  onSubmitted(hash);
  const receipt = await v2Track(hash);
  return { hash, receipt };
}

export async function v2Track(hash) {
  configured();
  const { createClient, studionet, TransactionStatus, ExecutionResult } = await sdk();
  const client = createClient({ chain: studionet });
  const receipt = await client.waitForTransactionReceipt({ hash, status: TransactionStatus.FINALIZED,
    interval: 3000, retries: 100, fullTransaction: true });
  if (receipt?.statusName !== 'FINALIZED' || receipt?.txExecutionResultName !== ExecutionResult.FINISHED_WITH_RETURN) {
    throw Error(`Transaction ${hash} did not successfully finalize: ${receipt?.statusName || 'unknown'} / ${receipt?.txExecutionResultName || 'unknown'}`);
  }
  return receipt;
}
