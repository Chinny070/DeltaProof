export const CHAIN = Object.freeze({
  name: 'GenLayer StudioNet', chainId: 61999, hexId: '0xf22f',
  rpcUrls: ['https://studio.genlayer.com/api'],
  blockExplorerUrls: ['https://explorer-studio.genlayer.com'], nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
});
// Public StudioNet deployment address. Ignore malformed build overrides.
const DEPLOYED_ADDRESS = '0x50D7C07A081A56dBd30fB3a244C11A8105E4faA6';
const ENV_ADDRESS = (import.meta.env?.VITE_CONTRACT_ADDRESS || '').trim();
export const ADDRESS = /^0x[a-fA-F0-9]{40}$/.test(ENV_ADDRESS) ? ENV_ADDRESS : DEPLOYED_ADDRESS;
export const HAS_CONTRACT = /^0x[a-fA-F0-9]{40}$/.test(ADDRESS);
export const EXPLORER = 'https://explorer-studio.genlayer.com';
