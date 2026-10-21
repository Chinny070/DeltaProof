export function gateResultMatchesQuery(result, query) {
  return Boolean(
    result && query &&
    result.agent_id === query.agentId &&
    result.release_id === query.releaseId &&
    result.agentId === query.agentId &&
    result.releaseId === query.releaseId
  );
}
