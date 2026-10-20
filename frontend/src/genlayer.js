import { ADDRESS, HAS_CONTRACT, CHAIN } from './config.js';

// Keep the GenLayer client out of the initial UI bundle. The SDK loads when a
// real contract read, write, or pending-transaction check is requested.
let sdkPromise;
let readClientPromise;

function loadSdk() {
  sdkPromise ??= Promise.all([
    import('genlayer-js'),
    import('genlayer-js/chains'),
    import('genlayer-js/types'),
  ]).then(([sdk, chains, types]) => ({ ...sdk, ...types, studionet: chains.studionet }));
  return sdkPromise;
}

async function getReadClient() {
  readClientPromise ??= loadSdk().then(({ createClient, studionet }) => createClient({ chain: studionet }));
  return readClientPromise;
}

export function ensureDeployment() {
  if (!HAS_CONTRACT) throw Error('No deployed DeltaProof contract is configured. Set VITE_CONTRACT_ADDRESS after deployment.');
}

export async function callRead(functionName, args = []) {
  ensureDeployment();
  const [{ TransactionHashVariant }, client] = await Promise.all([loadSdk(), getReadClient()]);
  return client.readContract({
    address: ADDRESS,
    functionName,
    args,
    transactionHashVariant: TransactionHashVariant.LATEST_FINAL,
  });
}

export function requireSuccessfulFinality(hash, receipt) {
  if (!receipt || receipt.statusName !== 'FINALIZED' || receipt.txExecutionResultName !== 'FINISHED_WITH_RETURN') {
    throw Error(`Transaction ${hash} did not successfully finalize: ${receipt?.statusName || 'unknown'} / ${receipt?.txExecutionResultName || 'unknown'}`);
  }
  return receipt;
}

export async function trackTransaction(hash) {
  const [{ TransactionStatus }, client] = await Promise.all([loadSdk(), getReadClient()]);
  // Request the full GenLayer receipt; the SDK's simplified view renames statusName.
  const receipt = await client.waitForTransactionReceipt({ hash, status: TransactionStatus.FINALIZED, interval: 3000, retries: 100, fullTransaction: true });
  return requireSuccessfulFinality(hash, receipt);
}

export async function callWrite(wallet, functionName, args = [], onSubmitted = () => {}) {
  ensureDeployment();
  if (!wallet.state.address || !wallet.state.provider) throw Error('Connect a wallet to sign this transaction.');
  if (wallet.state.chainId !== CHAIN.chainId) throw Error('Switch your wallet to StudioNet first.');

  const { createClient, studionet } = await loadSdk();
  const client = createClient({ chain: studionet, account: wallet.state.address, provider: wallet.state.provider });
  await client.connect('studionet');

  const write = { address: ADDRESS, functionName, args };
  // Stable StudioNet SDK estimates the consensus transaction gas and gas price
  // inside writeContract. The v2 fee-profile API targets the separate 61997 RC.
  const hash = await client.writeContract(write);

  // Persist the hash before waiting. A timeout can be tracked later without resubmitting.
  onSubmitted(hash);
  const receipt = await trackTransaction(hash);
  return { hash, receipt };
}
