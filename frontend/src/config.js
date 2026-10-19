export const CHAIN = Object.freeze({
  name: 'GenLayer StudioNet', chainId: 61999, hexId: '0xf22f',
  rpcUrls: ['https://studio.genlayer.com/api'],
  blockExplorerUrls: ['https://explorer-studio.genlayer.com'], nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
});
export const ADDRESS = (import.meta.env?.VITE_CONTRACT_ADDRESS || '').trim();
export const HAS_CONTRACT = /^0x[a-fA-F0-9]{40}$/.test(ADDRESS);
export const EXPLORER = 'https://explorer-studio.genlayer.com';
