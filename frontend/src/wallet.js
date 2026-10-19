import { CHAIN } from './config.js';
const STORAGE_KEY = 'deltaproof.wallet.preferred.v1';
export function createWalletController({storage=window.localStorage, discovery=window, onChange=()=>{}}={}) {
  const state = { address:'', chainId:null, provider:null, error:'', loading:false, menuOpen:false, providers:[] };
  let listeners=[];
  const emit = () => onChange({...state});
  function attach(provider) {
    detach(); state.provider=provider;
    const accountsChanged = accounts => { state.address=accounts?.[0] || ''; if (!state.address) storage.removeItem(STORAGE_KEY); emit(); };
    const chainChanged = hex => { state.chainId=Number(hex); emit(); };
    provider.on?.('accountsChanged',accountsChanged); provider.on?.('chainChanged',chainChanged);
    listeners = [[provider,'accountsChanged',accountsChanged],[provider,'chainChanged',chainChanged]];
  }
  function detach() { for(const [p, event,fn] of listeners) p.removeListener?.(event,fn); listeners=[]; }
  function injected() { return state.provider || discovery.ethereum || state.providers[0]?.provider || null; }
  function discover() {
    const announce = event => {
      const info = event.detail;
      if (info?.provider && !state.providers.some(e=>e.info?.uuid === info.info?.uuid)) { state.providers.push(info); emit(); if (storage.getItem(STORAGE_KEY)==='injected' && !state.address) refresh(info.provider,false).catch(()=>{}); }
    };
    discovery.addEventListener?.('eip6963:announceProvider', announce);
    discovery.dispatchEvent?.(new Event('eip6963:requestProvider'));
    return () => discovery.removeEventListener?.('eip6963:announceProvider',announce);
  }
  async function refresh(provider=injected(), request=false) {
    if (!provider) throw Error('No injected wallet detected. Install a compatible wallet extension.');
    attach(provider);
    const accounts=await provider.request({method: request ? 'eth_requestAccounts':'eth_accounts'});
    state.address=accounts?.[0] || '';
    const chain=await provider.request({method:'eth_chainId'});
    state.chainId=Number(chain);
    if(state.address) storage.setItem(STORAGE_KEY,'injected');
    emit();return state.address;
  }
  async function connect(provider=injected()) {
    state.loading=true;state.error='';emit();
    try { return await refresh(provider,true); }
    catch(e) { state.error=e?.message||'Wallet connection failed';emit();throw e; }
    finally{state.loading=false;emit();}
  }
  async function restore() {
    if(storage.getItem(STORAGE_KEY)!=='injected')return;
    if (!injected()) return; // EIP-6963 provider may be announced asynchronously.
    try { await refresh(injected(),false); }
    catch { storage.removeItem(STORAGE_KEY); disconnect(); }
  }
  // This disconnects the site session, not the extension's underlying account permission.
  function disconnect(){detach();state.address='';state.chainId=null;state.provider=null;state.menuOpen=false;storage.removeItem(STORAGE_KEY);emit();}
  async function switchNetwork() {
    const provider=injected();if(!provider)throw Error('No wallet provider connected');
    try { await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:CHAIN.hexId}]}); }
    catch(e){
      if(e?.code!==4902 && e?.data?.originalError?.code!==4902)throw e;
      await provider.request({method:'wallet_addEthereumChain',params:[{chainId:CHAIN.hexId,chainName:CHAIN.name,
        rpcUrls:CHAIN.rpcUrls,nativeCurrency:CHAIN.nativeCurrency,blockExplorerUrls:CHAIN.blockExplorerUrls}]});
      await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:CHAIN.hexId}]});
    }
    state.chainId=Number(await provider.request({method:'eth_chainId'}));emit();
    if(state.chainId!==CHAIN.chainId)throw Error('Wallet has not switched to StudioNet');
  }
  return {state,connect,restore,disconnect,switchNetwork,discover,refresh};
}
