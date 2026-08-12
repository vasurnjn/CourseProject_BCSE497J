export function computeImpact(graph, nodeId) {
  // Build reverse adjacency (who depends on this node)
  const reverseAdj = new Map();
  for (const node of graph.nodes) reverseAdj.set(node.id, []);
  for (const edge of graph.edges) {
    if (reverseAdj.has(edge.target)) reverseAdj.get(edge.target).push(edge.source);
  }
  
  if (!reverseAdj.has(nodeId)) {
    return { nodeId, directImpact: [], indirectImpact: [], totalAffected: 0 };
  }
  
  // BFS for direct and indirect
  const directImpact = [...reverseAdj.get(nodeId)];
  const visited = new Set([nodeId, ...directImpact]);
  const queue = [...directImpact];
  const indirectImpact = [];
  
  let depth = 0;
  while (queue.length > 0 && depth < 10) {
    const current = queue.shift();
    const dependents = reverseAdj.get(current) || [];
    for (const dep of dependents) {
      if (!visited.has(dep)) {
        visited.add(dep);
        indirectImpact.push(dep);
        queue.push(dep);
      }
    }
    depth++;
  }
  
  return {
    nodeId,
    directImpact,
    indirectImpact,
    totalAffected: directImpact.length + indirectImpact.length,
    impactRadius: directImpact.length + indirectImpact.length + 1 // include self
  };
}
