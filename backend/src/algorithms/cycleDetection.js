// Tarjan's algorithm for Strongly Connected Components
export function detectCycles(graph) {
  const nodes = graph.nodes.filter(n => n.type !== 'external');
  const edges = graph.edges.filter(e => !e.target.startsWith('external:'));
  
  // Build adjacency list
  const adj = new Map();
  for (const node of nodes) adj.set(node.id, []);
  for (const edge of edges) {
    if (adj.has(edge.source)) adj.get(edge.source).push(edge.target);
  }
  
  const index = new Map();
  const lowlink = new Map();
  const onStack = new Map();
  const stack = [];
  const sccs = [];
  let idx = 0;
  
  function strongconnect(v) {
    index.set(v, idx);
    lowlink.set(v, idx);
    idx++;
    stack.push(v);
    onStack.set(v, true);
    
    for (const w of (adj.get(v) || [])) {
      if (!index.has(w)) {
        strongconnect(w);
        lowlink.set(v, Math.min(lowlink.get(v), lowlink.get(w)));
      } else if (onStack.get(w)) {
        lowlink.set(v, Math.min(lowlink.get(v), index.get(w)));
      }
    }
    
    if (lowlink.get(v) === index.get(v)) {
      const scc = [];
      let w;
      do {
        w = stack.pop();
        onStack.set(w, false);
        scc.push(w);
      } while (w !== v);
      if (scc.length > 1) sccs.push(scc);
    }
  }
  
  for (const node of nodes) {
    if (!index.has(node.id)) strongconnect(node.id);
  }
  
  return sccs.map((scc, i) => ({ id: i, nodes: scc, size: scc.length }));
}
