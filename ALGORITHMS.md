# Algorithms

## Circular Dependency Detection
Uses **Tarjan's Strongly Connected Components (SCC)** algorithm to identify cycles in the directed dependency graph.
Time Complexity: O(|V| + |E|)

## Change Impact Analysis
Uses **Breadth-First Search (BFS)** starting from a specific node to identify all downstream dependents (direct and indirect).
Time Complexity: O(|V| + |E|)

## 3D Graph Layout
Uses a custom **Force-Directed Layout** algorithm in 3D space:
- Repulsive forces between all nodes (Coulomb's Law)
- Attractive forces between connected nodes (Hooke's Law)
- Simulated annealing to stabilize positions
