export const shorten = (value, front=6, back=4) => value ? `${String(value).slice(0,front)}…${String(value).slice(-back)}` : '—';
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}
export const formatNumber = value => Number(value || 0).toLocaleString('en-US');
export const labels = { COMPATIBLE:'Compatible', MIGRATION_REQUIRED:'Migration required', BREAKING:'Breaking change', INCONCLUSIVE:'Inconclusive', REGISTERED:'Registered', ATTESTED:'Attested' };
export const riskClass = status => ({COMPATIBLE:'good',MIGRATION_REQUIRED:'warning',BREAKING:'bad',INCONCLUSIVE:'neutral'}[status] || 'neutral');
export function normalizeRelease(value) {
  if (!value || typeof value !== 'object' || !value.id) throw new Error('Unexpected release payload');
  return value;
}
export function validateDraft(form) {
  const required = ['project', 'from', 'to', 'baseline_url', 'candidate_url'];
  for (const field of required) if (!String(form[field] ?? '').trim()) throw Error(`Please fill in ${field.replace('_', ' ')}`);
  if (form.project.length > 80 || form.from.length > 45 || form.to.length > 45) throw Error('Project or version is too long');
  if (form.from === form.to) throw Error('Base and target versions must differ');
  for (const url of [form.baseline_url, form.candidate_url]) {
    if (url.length > 360 || !/^https:\/\/[^\s@/]+\/\S+/.test(url)) throw Error('Provide a full HTTPS specification URL');
  }
  const specs = [form.baseline_json, form.candidate_json];
  const parsed = specs.map((raw, n) => {
    if (typeof raw !== 'string' || raw.length > 10000) throw Error('Specification JSON is too long');
    let data;
    try { data = JSON.parse(raw); } catch { throw Error(`${n ? 'Target' : 'Baseline'} specification is not valid JSON`); }
    if (!data || Object.keys(data).length !== 1 || !Array.isArray(data.endpoints) || !data.endpoints.length || data.endpoints.length > 12)
      throw Error('Each specification must contain an endpoints array (1–12)');
    const keys = new Set();
    for (const e of data.endpoints) {
      if (!e || Object.keys(e).sort().join() !== 'behavior,method,path,request_required,response_required' || !['GET','POST','PUT','PATCH','DELETE'].includes(e.method) || typeof e.path !== 'string' || !e.path.startsWith('/') || e.path.length > 100 || typeof e.behavior !== 'string' || e.behavior.length > 800)
        throw Error('Each endpoint needs method, path, behavior, request_required and response_required');
      const key = e.method + ' ' + e.path;
      if (keys.has(key)) throw Error(`Duplicate endpoint ${key}`);
      keys.add(key);
      for (const k of ['request_required', 'response_required']) {
        if (!Array.isArray(e[k]) || e[k].length > 16 || e[k].some(f => typeof f !== 'string' || !f.trim() || f.length > 80) || new Set(e[k]).size !== e[k].length)
          throw Error(`Invalid ${k} list in ${key}`);
      }
    }
    return data;
  });
  const old = new Map(parsed[0].endpoints.map(e => [e.method+' '+e.path,e]));
  const updated = new Map(parsed[1].endpoints.map(e => [e.method+' '+e.path,e]));
  let changes = 0;
  for (const [key, oldE] of old) if (updated.has(key) && oldE.behavior !== updated.get(key).behavior) changes++;
  if (changes > 6) throw Error('Split release: maximum 6 behavior changes');
  return parsed;
}
export function deriveStructural(old, newer) {
  const before = new Map(old.endpoints.map(e=>[`${e.method} ${e.path}`,e]));
  const after = new Map(newer.endpoints.map(e=>[`${e.method} ${e.path}`,e]));
  const hard=[], semantic=[], added=[];
  for (const [key, prev] of before) {
    const next = after.get(key);
    if (!next) { hard.push(`Removed endpoint: ${key}`); continue; }
    for (const f of next.request_required.filter(v=>!prev.request_required.includes(v)).sort()) hard.push(`New required request field ${f} at ${key}`);
    for (const f of prev.response_required.filter(v=>!next.response_required.includes(v)).sort()) hard.push(`Removed required response field ${f} at ${key}`);
    if (prev.behavior !== next.behavior) semantic.push(key);
  }
  for (const key of after.keys()) if (!before.has(key)) added.push(key);
  return {hard,semantic,added};
}
