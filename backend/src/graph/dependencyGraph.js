export class DependencyGraph {
  constructor() {
    this.nodes = new Map(); // id -> node
    this.edges = new Map(); // `${src}->${tgt}->${type}` -> edge
    this.adjacency = new Map(); // src -> Set of targets
    this.reverseAdjacency = new Map(); // tgt -> Set of sources
  }
  
  addNode(id, data) {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, { id, ...data });
      this.adjacency.set(id, new Set());
      this.reverseAdjacency.set(id, new Set());
    }
    return this;
  }
  
  addEdge(source, target, type, data = {}) {
    const key = `${source}->${target}->${type}`;
    if (this.edges.has(key)) return this;
    
    // Ensure nodes exist
    if (!this.nodes.has(source)) this.addNode(source, { label: source, type: 'file' });
    if (!this.nodes.has(target)) this.addNode(target, { label: target, type: 'file' });
    
    this.edges.set(key, { id: key, source, target, type, ...data });
    this.adjacency.get(source).add(target);
    this.reverseAdjacency.get(target).add(source);
    return this;
  }
  
  getNode(id) { return this.nodes.get(id); }
  getEdges() { return [...this.edges.values()]; }
  getNodes() { return [...this.nodes.values()]; }
  getDependencies(id) { return [...(this.adjacency.get(id) || [])]; }
  getDependents(id) { return [...(this.reverseAdjacency.get(id) || [])]; }
  
  toJSON() {
    const nodes = this.getNodes().map(n => ({
      ...n,
      inDegree: (this.reverseAdjacency.get(n.id) || new Set()).size,
      outDegree: (this.adjacency.get(n.id) || new Set()).size
    }));
    return { nodes, edges: this.getEdges() };
  }
}
