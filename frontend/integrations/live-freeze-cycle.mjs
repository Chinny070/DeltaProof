import { createRequire } from 'node:module';
import { join } from 'node:path';
import { createAccount, createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { TransactionHashVariant, TransactionStatus } from 'genlayer-js/types';

const address='0x367C2B9f8B52EEd57977B84c458eaD4c3105E718';
const signer='0xaffe15eec45b68835cc9e5b4ab85dd5deae8e70b';
const accountName='my-studionet-wallet';
const releaseId='v2api-20261020';
const agentId='analytics-live-20261020';
function parse(name){const i=process.argv.indexOf(name);return i<0?null:process.argv[i+1];}
function keytar(){if(!process.env.APPDATA)throw Error('APPDATA unavailable');return createRequire(import.meta.url)(join(process.env.APPDATA,'npm','node_modules','genlayer','node_modules','keytar'));}
async function main(){
 const step=parse('--step');
 if(!['freeze','resolve-freeze','reassess'].includes(step))throw Error('Use --step freeze, resolve-freeze, or reassess.');
 if(process.argv.includes('--preflight')){console.log(JSON.stringify({network:'studionet',chainId:61999,address,releaseId,agentId,step,transactionSent:false}));return;}
 const secret=await keytar().getPassword('genlayer-cli',`account:${accountName}`);
 if(!secret)throw Error('Wallet is not unlocked in this terminal. Unlock with genlayer account unlock --account my-studionet-wallet.');
 const account=createAccount(secret); if(account.address.toLowerCase()!==signer)throw Error('Active account does not match authorized signer.');
 const client=createClient({chain:studionet,account});
 const read=async(functionName,args=[])=>client.readContract({address,functionName,args,transactionHashVariant:TransactionHashVariant.LATEST_FINAL});
 const [release,agent,decision,before]=await Promise.all([read('get_release',[releaseId]),read('get_agent',[agentId]),read('get_decision',[releaseId,agentId]),read('get_authorization',[releaseId,agentId])]);
 if(release?.status!=='ACTIVE'||agent?.status!=='ACTIVE'||agent?.controller?.toLowerCase()!==signer)throw Error('Latest-final release, active agent, or controller does not match. No write sent.');
 if(step==='freeze'&&(decision?.decision!=='APPROVED'||before?.allow!==true||before.status!=='ALLOW'))throw Error(`Freeze fixture is not currently eligible/authorized: ${JSON.stringify(before)}`);
 if(step==='resolve-freeze'&&before.status!=='FROZEN')throw Error(`Expected FROZEN state; got ${before.status}.`);
 if(step==='reassess'&&before.status!=='REASSESSMENT_REQUIRED')throw Error(`Expected REASSESSMENT_REQUIRED; got ${before.status}.`);
 const peers=['checkout-live-20261020','refund-live-20261020'];
 const peerBefore={}; for(const peer of peers) peerBefore[peer]=await read('get_authorization',[releaseId,peer]);
 let fn,args;
 if(step==='freeze'){fn='freeze_authorization';args=[releaseId,agentId,'Authorized targeted live freeze lifecycle verification',1800];}
 else if(step==='resolve-freeze'){fn='resolve_freeze';args=[releaseId,agentId];}
 else {fn='adjudicate';args=[releaseId,agentId];}
 console.log(`SUBMITTING=${JSON.stringify({network:'studionet',chainId:61999,address,signer,method:fn,args})}`);
 const hash=await client.writeContract({address,functionName:fn,args,value:0n}); console.log(`TRANSACTION_HASH=${hash}`);
 const receipt=await client.waitForTransactionReceipt({hash,status:TransactionStatus.FINALIZED,interval:3000,retries:200,fullTransaction:true});
 const votes=receipt?.last_round?.validator_votes_name??[];
 const successful=(receipt?.consensus_data?.validators??[]).filter(v=>v?.vote==='agree'&&v?.execution_result==='SUCCESS').length;
 console.log(`RECEIPT=${JSON.stringify({hash:receipt?.hash,status:receipt?.statusName,consensus:receipt?.result_name,rounds:receipt?.num_of_rounds,votes,successfulValidatorExecutions:successful,executionHash:receipt?.tx_execution_hash,gasLimit:receipt?.gaslimit,nonce:receipt?.nonce})}`);
 if(receipt?.statusName!=='FINALIZED'||receipt?.result_name!=='MAJORITY_AGREE'||votes.filter(v=>v==='AGREE').length<3||successful<2)throw Error('Finalized write lacks successful majority evidence; stop and inspect.');
 const after=await read('get_authorization',[releaseId,agentId]);
 const peerAfter={}; for(const peer of peers) peerAfter[peer]=await read('get_authorization',[releaseId,peer]);
 if(step==='freeze'&&after.status!=='FROZEN')throw Error(`Expected targeted FROZEN authorization, got ${after.status}.`);
 if(step==='resolve-freeze'&&after.status!=='REASSESSMENT_REQUIRED')throw Error(`Expected reassessment hold after freeze resolution, got ${after.status}.`);
 if(step==='reassess'){
   const current=await read('get_decision',[releaseId,agentId]);
   const old=await read('get_decision_revision',[releaseId,agentId,current.revision-1]);
   const oldPassport=old.passport_hash;
   const oldPassportValid=await read('verify_passport',[releaseId,agentId,oldPassport]);
   if(current.revision!==decision.revision+1||current.passport.previous_passport_hash!==oldPassport||!oldPassportValid)throw Error('Fresh revision/history/passport chain did not match. Stop and inspect.');
 }
 for(const peer of peers){const a=peerBefore[peer],b=peerAfter[peer];if(a.allow!==b.allow||a.status!==b.status||a.revision!==b.revision||a.passport_hash!==b.passport_hash)throw Error(`Unaffected pair changed during targeted operation: ${peer}`);}
 let events=[]; if(step==='freeze'||step==='resolve-freeze')for(let n=1;n<=64;n++){try{events.push(await read('get_freeze_event',[n]));}catch{break;}}
 console.log(`VERIFIED_LATEST_FINAL=${JSON.stringify({step,authorization:after,unaffectedPeers:peerAfter,freezeEvents:events})}`);
}
main().catch(e=>{console.error(`LIVE_FREEZE_CYCLE_FAILED=${e?.message??String(e)}`);process.exitCode=1;});
