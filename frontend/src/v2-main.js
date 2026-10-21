import { createWalletController } from './wallet.js';
import { CHAIN, EXPLORER } from './config.js';
import { V2_ADDRESS, V2_CONFIGURED, v2Read, v2Write, v2Track } from './v2-api.js';
import { buildV2WriteArgs, getV2Method } from './v2-forms.js';
import './v2.css';

const app = document.querySelector('#v2-app');
const PENDING_KEY = 'deltaproof.v2.pending-tx';
const state = { page: 'overview', wallet: null, overview: null, agents: [], releases: [], error: '', notice: '', busy: false,
  pending: localStorage.getItem(PENDING_KEY) || '', pendingStatus: '', selected: null, safetyRecord: null, appealRecord: null, impact: null };
const wallet = createWalletController({ onChange: () => render() });
state.wallet = wallet.state;
const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const jsonPretty = x => esc(JSON.stringify(x, null, 2));
const short = x => x ? `${x.slice(0, 8)}…${x.slice(-6)}` : '—';
function configuredNote() { return !V2_CONFIGURED ? 'V2 contract address not configured' : state.overview ? `StudioNet · chain ${CHAIN.chainId} · latest-final reads live` : state.error ? `StudioNet · chain ${CHAIN.chainId} · read error` : `StudioNet · chain ${CHAIN.chainId} · checking RPC`; }
const nav = [['overview','Protocol'],['agents','Agent registry'],['releases','Releases'],['gate','Authorization gate'],['safety','Safety & appeals'],['passport','Passports'],['integration','CI/CD'],['docs','Protocol guide']];

function button(action, label, cls='secondary') { return `<button class="${cls}" data-action="${esc(action)}">${label}</button>`; }
function field(label, name, placeholder='', type='text') { return `<label class="field"><span>${esc(label)}</span><input name="${esc(name)}" type="${type}" placeholder="${esc(placeholder)}" required /></label>`; }
function area(label, name, placeholder, rows=7) { return `<label class="field"><span>${esc(label)}</span><textarea name="${esc(name)}" rows="${rows}" placeholder="${esc(placeholder)}" required></textarea></label>`; }
function form(action, title, body, submit='Submit') { return `<form data-form="${esc(action)}" class="card form-card"><h3>${esc(title)}</h3>${body}<button class="primary" ${state.busy?'disabled':''}>${state.busy?'Working…':esc(submit)} <b>↗</b></button></form>`; }
function rows(records, empty) { return records?.length ? `<div class="record-list">${records.map(record => `<button class="record" data-record="${esc(record.id)}"><span><b>${esc(record.name || record.id)}</b><small>${esc(record.id)} · ${esc(record.status || record.version || '')}</small></span><i>↗</i></button>`).join('')}</div>` : `<div class="empty"><b>${esc(empty)}</b><span>There are no matching live records in the configured contract.</span></div>`; }
function shell(content) {
  const walletChip = wallet.state.address ? `<button class="wallet-chip" data-action="wallet-menu">${esc(short(wallet.state.address))}<span>⌄</span></button>` : `<button class="primary connect" data-action="connect">Connect wallet</button>`;
  return `<header class="topbar"><a class="brand" href="/v2/"><span class="brand-mark">Δ</span><span>DeltaProof<small>V2 · AGENT UPGRADE COURT</small></span></a><div class="top-actions"><span class="network"><i class="${V2_CONFIGURED&&state.overview?'online':'offline'}"></i>${esc(configuredNote())}</span>${walletChip}</div></header>
  ${wallet.state.menuOpen ? `<div class="wallet-menu"><code>${esc(wallet.state.address)}</code>${button('copy','Copy address')}${button('switch',wallet.state.chainId===CHAIN.chainId?'On StudioNet':'Switch to StudioNet')}${button('disconnect','Disconnect site session')}</div>`:''}
  <div class="layout"><aside class="sidebar"><div class="side-label">COURTROOM</div>${nav.map(([id,label],i)=>`<button data-page="${id}" class="nav-item ${state.page===id?'active':''}"><span>${String(i+1).padStart(2,'0')}</span>${esc(label)}</button>`).join('')}<div class="side-foot"><b>Fail closed by default.</b><p>Only explicit approvals in finalized contract state authorize an upgrade. Missing, stale, disputed, or frozen decisions remain denied. Reads use the configured StudioNet V2 contract.</p><a href="${EXPLORER}" target="_blank" rel="noreferrer">StudioNet explorer ↗</a></div></aside>
  <main class="main"><div class="notice-row">${state.error?`<div class="alert error" role="alert">${esc(state.error)} ${button('dismiss','×')}</div>`:''}${state.notice?`<div class="alert success" role="status">${esc(state.notice)} ${button('dismiss','×')}</div>`:''}${state.pending?`<div class="alert pending"><span>${esc(state.pendingStatus||'Transaction submitted; finality not yet verified')}</span><code>${esc(state.pending)}</code>${button('resume','Check finality')}</div>`:''}</div>${content}</main></div>`;
}

function overviewPage() {
  const metrics = state.overview ? [['Agents',state.overview.agents],['Releases',state.overview.releases],['Decisions',state.overview.decisions]] : [['Agents','—'],['Releases','—'],['Decisions','—']];
  return `<section class="hero"><div class="eyebrow"><i></i> CONSUMER-SCOPED UPGRADE SAFETY</div><h1>Every agent gets<br/><em>its own upgrade verdict.</em></h1><p>DeltaProof commits agent dependencies and compatibility charters, asks independent GenLayer validators to assess changed behavior, then exposes a deterministic authorization gate.</p><div class="hero-actions">${button('refresh','↻ Refresh finalized state')}<span>${V2_CONFIGURED?'Connected to configured V2 address':'Read only preview · V2 deployment required'}</span></div></section>
  <div class="metrics">${metrics.map(([label,value])=>`<article class="metric card"><span>${label}</span><b>${esc(value)}</b><small>${state.overview?'StudioNet V2 contract':'No live value loaded'}</small></article>`).join('')}</div>
  <section class="grid-two"><article class="card"><div class="card-head"><div><span class="eyebrow">AGENTS</span><h2>Registered consumers</h2></div><button class="text-button" data-page="agents">Open registry ↗</button></div>${rows(state.agents,'No registered agents')}</article><article class="card"><div class="card-head"><div><span class="eyebrow">UPGRADES</span><h2>Release records</h2></div><button class="text-button" data-page="releases">Open releases ↗</button></div>${rows(state.releases,'No registered releases')}</article></section>
  <section class="callout card"><div class="orb">≃</div><div><span class="eyebrow">CONSENSUS PRINCIPLE</span><h2>Agreement on consequences, not prose.</h2><p>Leader and validator must agree on the decision, risk class, charter violations, and evidence sufficiency. Different explanations do not create a disagreement by themselves.</p></div></section>`;
}

function agentsPage() {
  return `<section class="page-heading"><div class="eyebrow"><i></i> AUTONOMOUS AGENT REGISTRY</div><h1>Register the policy before the upgrade.</h1><p>Agent identity, controller, route dependencies, guarantees, and risk tolerance become versioned on-chain state. Charter versions are immutable.</p></section><div class="grid-two align-start"><section class="card"><div class="card-head"><h2>Live agents</h2>${button('refresh','Refresh')}</div>${rows(state.agents,'No agents registered')}</section>
  ${form('register-agent','Create agent charter',`${field('Stable agent ID','agent_id','checkout-agent')}${field('Display name','name','Checkout Agent')}${area('Direct dependency routes','dependency_lines','POST /payments | critical | idempotent retries; safe retries\nGET /status | optional | availability',4)}${area('Required guarantees (one per line)','guarantees_lines','idempotent retries\nstable payment IDs',3)}${area('Unacceptable changes (one per line)','unacceptable_lines','duplicate charges\nmissing payment IDs',3)}${area('Required evidence kinds (one per line)','evidence_kinds_lines','independent-test',2)}<label class="field"><span>Maximum accepted risk</span><select name="risk_tolerance"><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></label><p class="form-hint">Dependency line format: METHOD /path | critical or optional | guarantee; guarantee. Charter versions are immutable.</p>`,'Register agent')}
  ${form('update-agent','Create next charter version',`${field('Agent ID','agent_id','checkout-agent')}${field('Expected config version','expected_config_version','1','number')}${area('Direct dependency routes','dependency_lines','POST /payments | critical | idempotent retries',3)}${area('Required guarantees','guarantees_lines','idempotent retries',2)}${area('Unacceptable changes','unacceptable_lines','duplicate charges',2)}${area('Required evidence kinds','evidence_kinds_lines','independent-test',2)}<label class="field"><span>Maximum accepted risk</span><select name="risk_tolerance"><option>LOW</option><option>MEDIUM</option><option>HIGH</option></select></label>`,'Save immutable charter version')}
  ${form('agent-status','Suspend or revoke an agent',`${field('Agent ID','agent_id','checkout-agent')}<label class="field"><span>Status</span><select name="status"><option> SUSPENDED</option><option>ACTIVE</option><option>REVOKED</option></select></label>`,'Update status')}
  </div>${state.selected?.kind==='agent'?`<section class="card detail"><div class="card-head"><h2>Agent record · ${esc(state.selected.id)}</h2>${button('clear-selection','Close')}</div><pre>${jsonPretty(state.selected.value)}</pre></section>`:''}`;
}

function releasesPage() {
  const blank = '[]';
  return `<section class="page-heading"><div class="eyebrow"><i></i> RELEASE LIFECYCLE</div><h1>Commit inputs. Evaluate per consumer.</h1><p>Specifications are bounded JSON snapshots. Evidence entries are content hashes and provenance labels; the contract does not claim to fetch or authenticate their URLs.</p></section><div class="grid-two align-start"><section class="card"><div class="card-head"><h2>Finalized release records</h2>${button('refresh','Refresh')}</div>${rows(state.releases,'No releases registered')}</section>
  ${form('register-release','Build and register release snapshots',`${field('Unique release ID','release_id','payments-2.0.0')}${field('Release name','name','Payments API')}${field('Version','version','2.0.0')}${area('Baseline endpoints','baseline_routes','POST /payments | Creates an idempotent payment | request:idempotency_key;amount | response:id;status\nGET /status | Returns service status',4)}${area('Candidate endpoints','candidate_routes','POST /payments | Creates a payment and safely handles retries | request:idempotency_key;amount | response:id;status\nGET /status | Returns service status',4)}${area('Publisher evidence commitments JSON','evidence_json',blank,4)}<p class="form-hint">Route line format: METHOD /path | behavior | optional request:field;field | optional response:field;field. Evidence contents are fetched and inspected by validators during adjudication.</p>`,'Register release')}
  ${form('adjudicate','Request per-agent adjudication',`${field('Release ID','release_id','payments-2.0.0')}${field('Agent ID','agent_id','checkout-agent')}`,'Run GenLayer adjudication')}
  ${form('decision-inspection','Inspect dependency impact',`${field('Release ID','release_id','payments-2.0.0')}${field('Agent ID','agent_id','checkout-agent')}`,'Load finalized impact')}
    ${form('supersede','Supersede a release',`${field('Existing release ID','release_id','payments-2.0.0')}${field('Replacement release ID','replacement_id','payments-2.0.1')}`,'Supersede release')}
    ${form('revoke-release','Publisher revocation',`${field('Release ID','release_id','payments-2.0.0')}${field('Reason','reason','Withdrawn by publisher')}`,'Revoke release')}
  </div>${state.impact?`<section class="card impact-card"><div class="card-head"><div><span class="eyebrow">FINALIZED DEPENDENCY IMPACT</span><h2>${esc(state.impact.decision)} · ${esc(state.impact.risk)}</h2></div><span class="impact-mode">${esc(state.impact.mode)}</span></div><p>${esc(state.impact.reason)}</p><div class="impact-routes">${state.impact.impacted_dependencies?.length?state.impact.impacted_dependencies.map(dep=>`<article><b>${esc(dep.method)} ${esc(dep.path)}</b><span>${dep.critical?'Critical dependency':'Optional dependency'}</span><small>${esc((dep.guarantees||[]).join(' · ')||'No guarantee labels')}</small></article>`).join(''):'<div class="empty"><b>No registered direct dependency was affected.</b><span>This display is the finalized contract result.</span></div>'}</div><details><summary>Evidence and certificate details</summary><pre>${jsonPretty(state.impact)}</pre></details></section>`:''}${state.selected?.kind==='release'?`<section class="card detail"><div class="card-head"><h2>Release record · ${esc(state.selected.id)}</h2>${button('clear-selection','Close')}</div><pre>${jsonPretty(state.selected.value)}</pre></section>`:''}`;
}

function gatePage() {
  return `<section class="page-heading"><div class="eyebrow"><i></i> DETERMINISTIC AUTHORIZATION GATE</div><h1>Ask the contract before adopting.</h1><p>Authorization reads latest finalized state and fails closed when the agent, release, charter version, freeze, appeal, reassessment, or release status does not qualify.</p></section><div class="grid-two align-start">${form('check-authorization','Query the live adoption gate',`${field('Agent ID','agent_id','checkout-agent')}${field('Release ID','release_id','payments-2.0.0')}`,'Check authorization')}<section class="card result-panel"><span class="eyebrow">LATEST FINALIZED RESULT</span>${state.gateResult?`<div class="gate-result ${state.gateResult.allow?'allow':'deny'}"><b>${state.gateResult.allow?'ALLOW':'DENY'}</b><small>${esc(state.gateResult.reason||'Contract returned a boolean authorization decision.')}</small></div><pre>${jsonPretty(state.gateResult)}</pre>`:`<div class="empty"><b>No gate result yet</b><span>Enter an agent and release identity to query StudioNet.</span></div>`}</section></div>`;
}

function safetyPage() {
  return `<section class="page-heading"><div class="eyebrow"><i></i> SAFETY CENTER · TARGETED DISPUTES</div><h1>Challenge one approval. Keep the rest moving.</h1><p>Only the controller of an affected consumer can challenge its approved release pair. Challenges require 1–4 public evidence commitments whose contents independently match their SHA-256 digests. A pending challenge holds only that pair; timeout leaves it held for fresh adjudication.</p></section><section class="safety-steps"><div><b>01 · Submit proof</b><span>Use HTTPS evidence sources and a SHA-256 of the exact UTF-8 body.</span></div><div><b>02 · Publisher responds</b><span>The release publisher has 48 hours to submit counterevidence.</span></div><div><b>03 · Validators decide</b><span>Each validator retrieves the content and compares consequential findings.</span></div></section><div class="grid-two align-start">
    ${form('freeze','Freeze one release authorization',`${field('Release ID','release_id','payments-2.0.0')}${field('Agent ID','agent_id','checkout-agent')}${field('Reason','reason','New counterexample threatens retry safety')}${field('Duration (seconds, max 604800)','duration_seconds','3600','number')}`,'Freeze authorization')}
    ${form('resolve-freeze','Resolve or time out a freeze',`${field('Release ID','release_id','payments-2.0.0')}${field('Agent ID','agent_id','checkout-agent')}`,'Resolve freeze')}
    ${form('open-safety-challenge','Challenge an unsafe approval',`${field('Release ID','release_id','payments-2.0.0')}${field('Affected agent ID','agent_id','checkout-agent')}${area('Counterevidence JSON','counterevidence_json','[{"kind":"test-report","sha256":"<64 lowercase hex chars>","source":"https://publisher.example/report","provenance":"PUBLISHER"}]',5)}`,'Submit targeted challenge')}
    ${form('respond-safety-challenge','Publisher response to challenge',`${field('Release ID','release_id','payments-2.0.0')}${field('Affected agent ID','agent_id','checkout-agent')}${area('Response evidence JSON','response_evidence_json','[]',5)}`,'Submit response')}
    ${form('resolve-safety-challenge','Resolve safety challenge',`${field('Release ID','release_id','payments-2.0.0')}${field('Affected agent ID','agent_id','checkout-agent')}`,'Run validator review')}
    ${form('open-appeal','Appeal a blocked or review decision',`${field('Release ID','release_id','payments-2.0.0')}${field('Agent ID','agent_id','checkout-agent')}${area('Counterevidence JSON','counterevidence_json','[{"kind":"test-report","sha256":"<64 lowercase hex chars>","source":"https://publisher.example/report","provenance":"PUBLISHER"}]',5)}`,'Open appeal')}
    ${form('respond-appeal','Publisher response to appeal',`${field('Release ID','release_id','payments-2.0.0')}${field('Agent ID','agent_id','checkout-agent')}${area('Response evidence JSON','response_evidence_json','[]',5)}`,'Submit response')}
    ${form('resolve-appeal','Resolve appeal with validators',`${field('Release ID','release_id','payments-2.0.0')}${field('Agent ID','agent_id','checkout-agent')}`,'Resolve appeal')}
    ${form('appeal-case','Inspect appeal timeline',`${field('Release ID','release_id','payments-2.0.0')}${field('Agent ID','agent_id','checkout-agent')}`,'Load appeal')}
    ${form('reassess','Request Watchtower reassessment',`${field('Release ID','release_id','payments-2.0.0')}${field('Agent ID','agent_id','checkout-agent')}${field('Reason','reason','New public counterexample evidence')}`,'Request reassessment')}
    ${form('safety-case','Inspect challenge timeline',`${field('Release ID','release_id','payments-2.0.0')}${field('Affected agent ID','agent_id','checkout-agent')}`,'Load challenge')}
    <section class="card result-panel"><span class="eyebrow">SAFETY CHALLENGE RECORD</span>${state.safetyRecord?`<pre>${jsonPretty(state.safetyRecord)}</pre>`:`<div class="empty"><b>No challenge loaded</b><span>Load the current challenge to inspect evidence status, response deadline, outcome and resolution commitment.</span></div>`}</section>
    <section class="card result-panel"><span class="eyebrow">APPEAL TIMELINE</span>${state.appealRecord?`<pre>${jsonPretty(state.appealRecord)}</pre>`:`<div class="empty"><b>No appeal loaded</b><span>Load an application appeal to inspect its revision binding, response window, evidence profile and outcome.</span></div>`}</section>
  </div>`;
}

function passportPage() {
  return `<section class="page-heading"><div class="eyebrow"><i></i> PORTABLE RELEASE PASSPORT</div><h1>Verify a consumer-bound decision.</h1><p>A passport commits the publisher, snapshots, evidence, agent, configuration and charter versions, consensus result, revision, and prior passport. Historical integrity does not imply current authorization.</p></section><div class="grid-two align-start">${form('passport','Load a passport',`${field('Release ID','release_id','payments-2.0.0')}${field('Agent ID','agent_id','checkout-agent')}`,'Read passport')}<section class="card result-panel"><span class="eyebrow">PASSPORT</span>${state.passport?`<pre>${jsonPretty(state.passport)}</pre>`:`<div class="empty"><b>No passport loaded</b><span>Read a finalized decision and then verify its commitment.</span></div>`}</section></div>${state.passport?form('verify-passport','Verify the passport commitment',`${field('Release ID','release_id',state.passport.release_id)}${field('Agent ID','agent_id',state.passport.agent_id)}${field('Commitment SHA-256','commitment',state.passport.commitment)}`,'Verify on chain'):''}`;
}

function integrationPage() {
  return `<section class="page-heading"><div class="eyebrow"><i></i> DEVELOPER INTEGRATION · STUDIO NET ONLY</div><h1>Put the authorization query in CI.</h1><p>The gate uses GenLayerJS read-only access to the latest finalized state. RPC errors, malformed returns, and blocked authorizations all exit nonzero.</p></section><section class="card"><h2>PowerShell</h2><pre>$env:DELTAPROOF_V2_CONTRACT_ADDRESS = '&lt;verified V2 address&gt;'
$env:DELTAPROOF_AGENT_ID = 'checkout-agent'
$env:DELTAPROOF_RELEASE_ID = 'payments-2.0.0'
node integrations/ci-gate.mjs</pre><p>Run from the <code>frontend/</code> directory after <code>npm ci</code>. The gate never signs or sends a transaction. There is no V2 address configured in this development workspace.</p><div class="pill">RPC: https://studio.genlayer.com/api</div><div class="pill">Chain ID: 61999</div></section><section class="card"><h2>Structured decision schema</h2><pre>{ "allow": "&lt;boolean&gt;", "agentId": "&lt;id&gt;", "releaseId": "&lt;id&gt;", "chainId": 61999, "state": "LATEST_FINAL" }</pre><p>This is a type schema, not an observed contract result.</p></section>`;
}

function docsPage() {
  const items = [
    ['State machines','Agent: ACTIVE → SUSPENDED/REVOKED. Release: ACTIVE → SUPERSEDED in separate mutable authorization state; the submitted release bytes remain immutable. Decision: absent → finalized revision; reassessment creates a linked new passport. Appeal: OPEN → RESOLVED, with timeout INCONCLUSIVE.'],
    ['Consensus equivalence','Leader and validator independently evaluate the same bounded input. They must agree on decision, risk, charter violations, and evidence sufficiency. Migration advice and explanation text may differ.'],
    ['Evidence limits','The leader and validators independently retrieve public source content and match its SHA-256 to the commitment. This confirms retrieved bytes, not source authenticity or truth. Unavailable, oversized, or mismatched evidence cannot approve a semantic change.'],
    ['Bounded work','At most 16 dependencies per agent, 20 API endpoints per release snapshot, 12 evidence commitments per submission, 16 required fields per direction, 8 semantic changes per adjudication, and 4,000 characters per fetched evidence source. Larger or unavailable evidence sets fail closed for review.'],
    ['Time and failure recovery','Freeze expiry and appeal deadlines use the transaction timestamp exposed to deterministic GenVM execution. Authorization is time-limited to 90 days. A Watchtower is an external keeper trigger; the contract does not run background tasks.'],
    ['Application boundary','An authorization gate cannot force an external service or agent to comply. Consumers must query the CI gate before adopting releases. GenLayer protocol appeals are distinct from application-level appeals.'],
  ];
  return `<section class="page-heading"><div class="eyebrow"><i></i> PROTOCOL GUIDE & LIMITS</div><h1>Specific claims, explicit boundaries.</h1><p>V2 is an un-deployed development branch. This page documents the current implementation and its limitations without presenting sample records as live protocol data.</p></section><div class="doc-stack">${items.map(([title,body])=>`<article class="card"><h2>${esc(title)}</h2><p>${esc(body)}</p></article>`).join('')}</div>`;
}

function render() {
  const page = state.page === 'agents' ? agentsPage() : state.page === 'releases' ? releasesPage() : state.page === 'gate' ? gatePage() : state.page === 'safety' ? safetyPage() : state.page === 'passport' ? passportPage() : state.page === 'integration' ? integrationPage() : state.page === 'docs' ? docsPage() : overviewPage();
  app.innerHTML = shell(page);
}

async function reload() {
  if (!V2_CONFIGURED) { state.overview = null; state.agents = []; state.releases = []; render(); return; }
  state.busy = true; render();
  try {
    const [overview, agents, releases] = await Promise.all([v2Read('get_overview'), v2Read('list_agents',[0,20]), v2Read('list_releases',[0,20])]);
    if (!overview || overview.protocol !== 'deltaproof/2.0' || !Array.isArray(agents) || !Array.isArray(releases)) throw Error('V2 contract returned an invalid live schema.');
    state.overview=overview;state.agents=agents;state.releases=releases;state.error='';
  } catch (error) { state.error=error?.message||String(error); }
  finally { state.busy=false;render(); }
}

async function runWrite(action, args) {
  if (!wallet.state.address) throw Error('Connect an authorized wallet before writing.');
  if (wallet.state.chainId !== CHAIN.chainId) throw Error('Switch the wallet to StudioNet before writing.');
  state.busy=true;state.error='';state.notice='';render();
  try {
    const {hash} = await v2Write(wallet, getV2Method(action), args, tx => { state.pending=tx;state.pendingStatus='Submitted — awaiting successful finality';localStorage.setItem(PENDING_KEY,tx);render(); });
    state.pending='';state.pendingStatus='';localStorage.removeItem(PENDING_KEY);state.notice=`Finalized successfully: ${hash}`;await reload();
  } catch(error) {
    const message=error?.message||String(error);state.error=message;
    if (message.includes('did not successfully finalize')) { state.pending='';state.pendingStatus='Finalized with failed execution';localStorage.removeItem(PENDING_KEY); }
  } finally { state.busy=false;render(); }
}

async function action(name, node) {
  try {
    if(name==='connect') await wallet.connect();
    else if(name==='wallet-menu') { wallet.state.menuOpen=!wallet.state.menuOpen; }
    else if(name==='disconnect') wallet.disconnect();
    else if(name==='switch') await wallet.switchNetwork();
    else if(name==='copy') { await navigator.clipboard.writeText(wallet.state.address);state.notice='Wallet address copied.'; }
    else if(name==='dismiss') { state.error='';state.notice=''; }
    else if(name==='refresh') await reload();
    else if(name==='resume') { state.pendingStatus='Checking transaction finality';render();try{await v2Track(state.pending);state.notice='Transaction finalized successfully.';state.pending='';state.pendingStatus='';localStorage.removeItem(PENDING_KEY);await reload();}catch(error){const msg=error?.message||String(error);if(msg.includes('did not successfully finalize')){state.pending='';state.pendingStatus='Finalized with failed execution';localStorage.removeItem(PENDING_KEY);}else{state.pendingStatus='Still pending or unable to verify';}throw error;} }
    else if(name==='clear-selection') state.selected=null;
  } catch(error) { state.error=error?.message||String(error); }
  render();
}

app.addEventListener('click', async event => {
  const target=event.target.closest('[data-action],[data-page],[data-record]');if(!target)return;
  if(target.dataset.page){state.page=target.dataset.page;state.error='';state.notice='';render();window.scrollTo(0,0);return;}
  if(target.dataset.record){const agent=state.page==='agents'?state.agents.find(x=>x.id===target.dataset.record):null;try{state.selected=agent?{kind:'agent',id:agent.id,value:await v2Read('get_agent',[agent.id])}:{kind:'release',id:target.dataset.record,value:await v2Read('get_release',[target.dataset.record])};}catch(error){state.error=error?.message||String(error);}render();return;}
  if(target.dataset.action) await action(target.dataset.action,target);
});

app.addEventListener('submit', async event => {
  const formNode=event.target.closest('form[data-form]');if(!formNode)return;event.preventDefault();
  const actionName=formNode.dataset.form;const data=new FormData(formNode);
  try {
    if(actionName==='check-authorization') {
      state.busy=true;state.error='';state.gateResult=null;render();
      const agentId=String(data.get('agent_id')).trim(),releaseId=String(data.get('release_id')).trim();
      const result=await v2Read('get_authorization',[releaseId,agentId]);
      if(!result||typeof result.allow!=='boolean'||result.agent_id!==agentId||result.release_id!==releaseId)throw Error('Contract returned a malformed authorization value.');
      state.gateResult={...result,agentId,releaseId,state:'LATEST_FINAL'};
    } else if(actionName==='decision-inspection') {
      state.busy=true;state.error='';state.impact=null;render();
      state.impact=await v2Read('get_decision',[String(data.get('release_id')).trim(),String(data.get('agent_id')).trim()]);
    } else if(actionName==='passport') {
      state.busy=true;state.error='';state.passport=null;render();
      const releaseId=String(data.get('release_id')).trim(),agentId=String(data.get('agent_id')).trim();
      const result=await v2Read('get_passport',[releaseId,agentId]);
      state.passport={...result,release_id:releaseId,agent_id:agentId};
    } else if(actionName==='verify-passport') {
      state.busy=true;state.error='';render();
      const result=await v2Read('verify_passport',[String(data.get('release_id')).trim(),String(data.get('agent_id')).trim(),String(data.get('commitment')).trim()]);
      if(typeof result!=='boolean')throw Error('Contract returned a malformed verification value.');
      state.notice=result?'Passport commitment verified against the finalized contract.':'Passport verification failed.';
    } else if(actionName==='safety-case') {
      state.busy=true;state.error='';state.safetyRecord=null;render();
      state.safetyRecord=await v2Read('get_safety_challenge',[String(data.get('release_id')).trim(),String(data.get('agent_id')).trim()]);
    } else if(actionName==='appeal-case') {
      state.busy=true;state.error='';state.appealRecord=null;render();
      state.appealRecord=await v2Read('get_appeal',[String(data.get('release_id')).trim(),String(data.get('agent_id')).trim()]);
    } else {
      await runWrite(actionName,buildV2WriteArgs(actionName,data));
    }
  } catch(error) { state.error=error?.message||String(error); }
  finally { state.busy=false;render(); }
});

render();wallet.discover();wallet.restore().catch(()=>{});reload();

