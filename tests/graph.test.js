import { DependencyGraph } from '../backend/src/graph/dependencyGraph.js';

describe('DependencyGraph', () => {
  test('adds nodes without duplicates', () => {
    const g = new DependencyGraph();
    g.addNode('a', { label: 'a', type: 'file' });
    g.addNode('a', { label: 'a', type: 'file' });
    expect(g.getNodes()).toHaveLength(1);
  });

  test('adds edges', () => {
    const g = new DependencyGraph();
    g.addEdge('a', 'b', 'IMPORTS');
    expect(g.getEdges()).toHaveLength(1);
  });

  test('prevents duplicate edges', () => {
    const g = new DependencyGraph();
    g.addEdge('a', 'b', 'IMPORTS');
    g.addEdge('a', 'b', 'IMPORTS');
    expect(g.getEdges()).toHaveLength(1);
  });

  test('tracks dependencies and dependents', () => {
    const g = new DependencyGraph();
    g.addEdge('a', 'b', 'IMPORTS');
    g.addEdge('b', 'c', 'IMPORTS');
    expect(g.getDependencies('a')).toContain('b');
    expect(g.getDependents('b')).toContain('a');
  });
});
