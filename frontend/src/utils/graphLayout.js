// Force-directed layout for 3D graph
export function computeLayout(nodes, edges, iterations = 150) {
  const positions = new Map();
  const N = nodes.length;
  
  if (N === 0) return positions;
  
  // Initialize positions on a sphere
  nodes.forEach((node, i) => {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / N);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const radius = Math.max(8, Math.sqrt(N) * 2);
    positions.set(node.id, {
      x: radius * Math.sin(phi) * Math.cos(theta),
      y: radius * Math.sin(phi) * Math.sin(theta),
      z: radius * Math.cos(phi)
    });
  });
  
  // Edge lookup
  const edgeSet = new Set(edges.map(e => `${e.source}->${e.target}`));
  const neighbors = new Map();
  nodes.forEach(n => neighbors.set(n.id, []));
  edges.forEach(e => {
    if (neighbors.has(e.source)) neighbors.get(e.source).push(e.target);
    if (neighbors.has(e.target)) neighbors.get(e.target).push(e.source);
  });
  
  const k = Math.sqrt((4 * Math.PI * Math.pow(Math.max(8, Math.sqrt(N) * 2), 2)) / N);
  
  for (let iter = 0; iter < iterations; iter++) {
    const temperature = Math.max(0.01, 1 - iter / iterations) * k;
    const forces = new Map();
    nodes.forEach(n => forces.set(n.id, { x: 0, y: 0, z: 0 }));
    
    // Repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const ni = nodes[i], nj = nodes[j];
        const pi = positions.get(ni.id), pj = positions.get(nj.id);
        const dx = pi.x - pj.x, dy = pi.y - pj.y, dz = pi.z - pj.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 0.01;
        const force = (k * k) / dist;
        const fi = forces.get(ni.id), fj = forces.get(nj.id);
        fi.x += (dx / dist) * force; fi.y += (dy / dist) * force; fi.z += (dz / dist) * force;
        fj.x -= (dx / dist) * force; fj.y -= (dy / dist) * force; fj.z -= (dz / dist) * force;
      }
    }
    
    // Attraction
    edges.forEach(edge => {
      const pi = positions.get(edge.source), pj = positions.get(edge.target);
      if (!pi || !pj) return;
      const dx = pj.x - pi.x, dy = pj.y - pi.y, dz = pj.z - pi.z;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz) || 0.01;
      const force = (dist * dist) / k;
      const fi = forces.get(edge.source), fj = forces.get(edge.target);
      if (fi) { fi.x += (dx / dist) * force; fi.y += (dy / dist) * force; fi.z += (dz / dist) * force; }
      if (fj) { fj.x -= (dx / dist) * force; fj.y -= (dy / dist) * force; fj.z -= (dz / dist) * force; }
    });
    
    // Apply
    nodes.forEach(n => {
      const p = positions.get(n.id);
      const f = forces.get(n.id);
      const len = Math.sqrt(f.x*f.x + f.y*f.y + f.z*f.z) || 1;
      const step = Math.min(temperature, len);
      p.x += (f.x / len) * step;
      p.y += (f.y / len) * step;
      p.z += (f.z / len) * step;
    });
  }
  
  return positions;
}
