export const V2_METHODS = Object.freeze({
  'register-agent':'register_agent','update-agent':'update_agent','agent-status':'set_agent_status',
  'register-release':'register_release','adjudicate':'adjudicate','supersede':'supersede_release',
  'revoke-release':'revoke_release','freeze':'freeze_authorization','resolve-freeze':'resolve_freeze',
  'open-appeal':'open_appeal','respond-appeal':'respond_to_appeal','resolve-appeal':'resolve_appeal',
  'reassess':'request_reassessment',
});

export function buildV2WriteArgs(action, data) {
  const str = name => String(data.get(name) ?? '');
  const jsonText = (name, label) => {
    const raw = str(name);
    try { JSON.parse(raw); } catch { throw Error(`${label} must be valid JSON text.`); }
    return raw;
  };
  if (action==='register-agent') return [str('agent_id'),str('name'),jsonText('dependencies_json','Dependencies'),jsonText('charter_json','Charter')];
  if (action==='update-agent') return [str('agent_id'),Number(str('expected_config_version')),jsonText('dependencies_json','Dependencies'),jsonText('charter_json','Charter')];
  if (action==='agent-status') return [str('agent_id'),str('status').trim()];
  if (action==='register-release') return [str('release_id'),str('name'),str('version'),jsonText('baseline_json','Baseline'),jsonText('candidate_json','Candidate'),jsonText('evidence_json','Evidence')];
  if (action==='adjudicate') return [str('release_id'),str('agent_id')];
  if (action==='supersede') return [str('release_id'),str('replacement_id')];
  if (action==='revoke-release') return [str('release_id'),str('reason')];
  if (action==='freeze') return [str('release_id'),str('agent_id'),str('reason'),Number(str('duration_seconds'))];
  if (action==='resolve-freeze') return [str('release_id'),str('agent_id')];
  if (action==='open-appeal') return [str('release_id'),str('agent_id'),jsonText('counterevidence_json','Counterevidence')];
  if (action==='respond-appeal') return [str('release_id'),str('agent_id'),jsonText('response_evidence_json','Response evidence')];
  if (action==='resolve-appeal') return [str('release_id'),str('agent_id')];
  if (action==='reassess') return [str('release_id'),str('agent_id'),str('reason')];
  throw Error('Unknown V2 action');
}
