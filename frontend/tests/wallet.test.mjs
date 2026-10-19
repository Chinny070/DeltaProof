import test from 'node:test';
import assert from 'node:assert/strict';
import {createWalletController} from '../src/wallet.js';
const ACCOUNT='0x'+'a'.repeat(40);
class MemoryStorage{constructor(){this.map=new Map()}getItem(k){return this.map.get(k)||null}setItem(k,v){this.map.set(k,v)}removeItem(k){this.map.delete(k)}}
class Provider{
 constructor({chainId='0xf22f',accounts=[ACCOUNT],needsAdd=false}={}){this.chainId=chainId;this.accounts=accounts;this.needsAdd=needsAdd;this.events={};this.calls=[]}
 on(e,fn){this.events[e]=fn}removeListener(e,fn){if(this.events[e]===fn)delete this.events[e]}
 async request({method,params=[]}){this.calls.push(method);if(method==='eth_accounts'||method==='eth_requestAccounts')return this.accounts;
  if(method==='eth_chainId')return this.chainId;
  if(method==='wallet_switchEthereumChain'){if(this.needsAdd){this.needsAdd=false;throw Object.assign(new Error('Unrecognized chain'),{code:4902})};this.chainId=params[0].chainId;this.events.chainChanged?.(this.chainId);return null;}
  if(method==='wallet_addEthereumChain')return null;
  throw Error(`unexpected ${method}`);}
}
const ctl=(provider,storage=new MemoryStorage())=>({storage,wallet:createWalletController({storage,discovery:{ethereum:provider,addEventListener(){},removeEventListener(){},dispatchEvent(){} }})});
test('connect uses requestAccounts and stores session hint',async()=>{const p=new Provider();const {wallet,storage}=ctl(p);await wallet.connect();assert.equal(wallet.state.address,ACCOUNT);assert.equal(wallet.state.chainId,61999);assert.equal(storage.getItem('deltaproof.wallet.preferred.v1'),'injected');assert.ok(p.calls.includes('eth_requestAccounts'));});
test('restore silently checks authorized accounts without prompting',async()=>{const p=new Provider();const s=new MemoryStorage();const first=ctl(p,s);await first.wallet.connect();const second=ctl(p,s);await second.wallet.restore();assert.equal(second.wallet.state.address,ACCOUNT);assert.equal(p.calls.filter(m=>m==='eth_requestAccounts').length,1);});
test('disconnect clears site session and detaches listeners',async()=>{const p=new Provider();const {wallet,storage}=ctl(p);await wallet.connect();wallet.disconnect();assert.equal(wallet.state.address,'');assert.equal(storage.getItem('deltaproof.wallet.preferred.v1'),null);assert.equal(Object.keys(p.events).length,0);});
test('network switch moves to the right chain',async()=>{const p=new Provider({chainId:'0x1'});const {wallet}=ctl(p);await wallet.connect();assert.equal(wallet.state.chainId,1);await wallet.switchNetwork();assert.equal(wallet.state.chainId,61999);assert.ok(p.calls.includes('wallet_switchEthereumChain'));});
test('unknown chain uses wallet_addEthereumChain',async()=>{const p=new Provider({chainId:'0x1',needsAdd:true});const {wallet}=ctl(p);await wallet.connect();await wallet.switchNetwork();assert.ok(p.calls.includes('wallet_addEthereumChain'));assert.equal(wallet.state.chainId,61999);});
test('connect missing provider rejects explicitly',async()=>{const {wallet}=ctl(null);await assert.rejects(wallet.connect(),/No injected wallet/);});
test('account change reflected and hint cleared if disconnected by extension',async()=>{const p=new Provider();const {wallet,storage}=ctl(p);await wallet.connect();p.events.accountsChanged([]);assert.equal(wallet.state.address,'');assert.equal(storage.getItem('deltaproof.wallet.preferred.v1'),null);});
test('wrong network does not auto-sign or auto-switch',async()=>{const p=new Provider({chainId:'0x1'});const {wallet}=ctl(p);await wallet.connect();assert.equal(wallet.state.chainId,1);assert.equal(p.calls.includes('wallet_switchEthereumChain'),false);});

test('restore retains hint while EIP-6963-only provider has not announced',async()=>{
 const store=new MemoryStorage();store.setItem('deltaproof.wallet.preferred.v1','injected');
 const {wallet}=ctl(null,store);await wallet.restore();
 assert.equal(store.getItem('deltaproof.wallet.preferred.v1'),'injected');
 assert.equal(wallet.state.address,'');
});
