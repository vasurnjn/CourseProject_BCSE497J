import { detectCycles } from '../backend/src/algorithms/cycleDetection.js';
import { computeImpact } from '../backend/src/algorithms/impactAnalysis.js';

describe('Cycle Detection (Tarjan\'s SCC)', () => {
  test('detects simple cycle A->B->C->A', () => {
    const graph = {
      nodes: [
        { id: 'A', type: 'file' },
        { id: 'B', type: 'file' },
        { id: 'C', type: 'file' },
      ],
      edges: [
        { source: 'A', target: 'B', type: 'IMPORTS' },
        { source: 'B', target: 'C', type: 'IMPORTS' },
        { source: 'C', target: 'A', type: 'IMPORTS' },
      ]
    };
    const cycles = detectCycles(graph);
    expect(cycles.length).toBeGreaterThan(0);
    expect(cycles[0].nodes.length).toBe(3);
  });

  test('no cycle in linear dependency chain', () => {
    const graph = {
      nodes: [{ id: 'A', type: 'file' }, { id: 'B', type: 'file' }, { id: 'C', type: 'file' }],
      edges: [
        { source: 'A', target: 'B', type: 'IMPORTS' },
        { source: 'B', target: 'C', type: 'IMPORTS' },
      ]
    };
    const cycles = detectCycles(graph);
    expect(cycles.length).toBe(0);
  });
});

describe('Impact Analysis', () => {
  test('computes direct impact', () => {
    const graph = {
      nodes: [{ id: 'A' }, { id: 'B' }, { id: 'C' }],
      edges: [
        { source: 'A', target: 'B', type: 'IMPORTS' },
        { source: 'C', target: 'B', type: 'IMPORTS' },
      ]
    };
    const impact = computeImpact(graph, 'B');
    expect(impact.directImpact).toContain('A');
    expect(impact.directImpact).toContain('C');
  });

  test('computes indirect impact', () => {
    const graph = {
      nodes: [{ id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }],
      edges: [
        { source: 'A', target: 'B' },
        { source: 'C', target: 'A' },
        { source: 'D', target: 'C' },
      ]
    };
    const impact = computeImpact(graph, 'B');
    expect(impact.directImpact).toContain('A');
    expect(impact.indirectImpact).toContain('C');
    expect(impact.indirectImpact).toContain('D');
  });
});
