export const V2_METHODS = Object.freeze({
  'register-agent':'register_agent','update-agent':'update_agent','agent-status':'set_agent_status',
  'register-release':'register_release','adjudicate':'adjudicate','supersede':'supersede_release',
  'revoke-release':'revoke_release','freeze':'freeze_authorization','resolve-freeze':'resolve_freeze',
  'open-appeal':'open_appeal','respond-appeal':'respond_to_appeal','resolve-appeal':'resolve_appeal',
  'open-safety-challenge':'open_safety_challenge','respond-safety-challenge':'respond_to_safety_challenge',
  'resolve-safety-challenge':'resolve_safety_challenge',
  'reassess':'request_reassessment',
});

export function getV2Method(action) {
  const method = V2_METHODS[action];
  if (!method) throw Error(`Unknown V2 action: ${action}`);
  return method;
}

export function buildV2WriteArgs(action, data) {
  const str = name => String(data.get(name) ?? '');
  const jsonText = (name, label) => {
    const raw = str(name);
    try { JSON.parse(raw); } catch { throw Error(`${label} must be valid JSON text.`); }
    return raw;
  };
  const dependencyJson = () => {
    if (str('dependencies_json').trim()) return jsonText('dependencies_json','Dependencies');
    const items = str('dependency_lines').split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map((line,index)=>{
      const parts=line.split('|').map(value=>value.trim());
      if(parts.length!==3)throw Error(`Dependency line ${index+1} must be METHOD /path | critical or optional | guarantee; guarantee.`);
      const method=parts[0].split(/\s+/)[0]?.toUpperCase(),path=parts[0].split(/\s+/)[1];
      if(!['GET','POST','PUT','PATCH','DELETE'].includes(method)||!path?.startsWith('/')||!['critical','optional'].includes(parts[1].toLowerCase()))throw Error(`Dependency line ${index+1} has an invalid method, route or criticality.`);
      return {method,path,critical:parts[1].toLowerCase()==='critical',guarantees:parts[2]?parts[2].split(';').map(x=>x.trim()).filter(Boolean):[]};
    });
    if(!items.length)throw Error('Add at least one direct dependency route.');
    return JSON.stringify(items);
  };
  const charterJson = () => {
    if (str('charter_json').trim()) return jsonText('charter_json','Charter');
    const list=name=>str(name).split(/\r?\n/).map(value=>value.trim()).filter(Boolean);
    const risk=str('risk_tolerance').trim();
    if(!['LOW','MEDIUM','HIGH'].includes(risk))throw Error('Choose a LOW, MEDIUM or HIGH risk tolerance.');
    return JSON.stringify({guarantees:list('guarantees_lines'),unacceptable_changes:list('unacceptable_lines'),
      required_evidence_kinds:list('evidence_kinds_lines'),risk_tolerance:risk});
  };
  const snapshotJson=name=>{
    const legacy=name==='baseline'?'baseline_json':'candidate_json';
    if(str(legacy).trim())return jsonText(legacy,name==='baseline'?'Baseline':'Candidate');
    const items=str(`${name}_routes`).split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map((line,index)=>{
      const parts=line.split('|').map(value=>value.trim());
      if(parts.length<2||parts.length>4)throw Error(`${name} route line ${index+1} needs METHOD /path | behavior | optional request:field;field | optional response:field;field.`);
      const [method,path]=parts[0].split(/\s+/);
      if(!['GET','POST','PUT','PATCH','DELETE'].includes(method?.toUpperCase())||!path?.startsWith('/')||!parts[1])throw Error(`${name} route line ${index+1} has an invalid method, path or behavior.`);
      const endpoint={method:method.toUpperCase(),path,behavior:parts[1],request_required:[],response_required:[]};
      for(const option of parts.slice(2)){
        if(option.startsWith('request:'))endpoint.request_required=option.slice(8).split(';').map(x=>x.trim()).filter(Boolean);
        else if(option.startsWith('response:'))endpoint.response_required=option.slice(9).split(';').map(x=>x.trim()).filter(Boolean);
        else throw Error(`${name} route line ${index+1} has an unknown request:/response: field group.`);
      }
      return endpoint;
    });
    if(!items.length)throw Error(`Add at least one ${name} endpoint route.`);
    return JSON.stringify({endpoints:items});
  };
  if (action==='register-agent') return [str('agent_id'),str('name'),dependencyJson(),charterJson()];
  if (action==='update-agent') return [str('agent_id'),Number(str('expected_config_version')),dependencyJson(),charterJson()];
  if (action==='agent-status') return [str('agent_id'),str('status').trim()];
  if (action==='register-release') return [str('release_id'),str('name'),str('version'),snapshotJson('baseline'),snapshotJson('candidate'),jsonText('evidence_json','Evidence')];
  if (action==='adjudicate') return [str('release_id'),str('agent_id')];
  if (action==='supersede') return [str('release_id'),str('replacement_id')];
  if (action==='revoke-release') return [str('release_id'),str('reason')];
  if (action==='freeze') return [str('release_id'),str('agent_id'),str('reason'),Number(str('duration_seconds'))];
  if (action==='resolve-freeze') return [str('release_id'),str('agent_id')];
  if (action==='open-appeal') return [str('release_id'),str('agent_id'),jsonText('counterevidence_json','Counterevidence')];
  if (action==='respond-appeal') return [str('release_id'),str('agent_id'),jsonText('response_evidence_json','Response evidence')];
  if (action==='resolve-appeal') return [str('release_id'),str('agent_id')];
  if (action==='open-safety-challenge') return [str('release_id'),str('agent_id'),jsonText('counterevidence_json','Counterevidence')];
  if (action==='respond-safety-challenge') return [str('release_id'),str('agent_id'),jsonText('response_evidence_json','Response evidence')];
  if (action==='resolve-safety-challenge') return [str('release_id'),str('agent_id')];
  if (action==='reassess') return [str('release_id'),str('agent_id'),str('reason')];
  throw Error('Unknown V2 action');
}
