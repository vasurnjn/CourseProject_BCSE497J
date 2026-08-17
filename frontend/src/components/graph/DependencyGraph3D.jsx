import { useEffect, useState, useMemo } from 'react';
import { getGraph, getNode, getImpact } from '../../services/api';
import NodeInspector from './NodeInspector';
import GraphControls from './GraphControls';
import { Search, X, Filter, Circle } from 'lucide-react';

const NODE_COLORS = {
  file: '#6366f1',
  external: '#f59e0b',
  class: '#10b981',
  function: '#8b5cf6'
};

export default function DependencyGraph3D({ projectId, initialSelectedNode, onNodeSelect }) {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(initialSelectedNode);
  const [nodeDetails, setNodeDetails] = useState(null);
  const [impactData, setImpactData] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ type: 'all', language: 'all', edgeType: 'all' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await getGraph(projectId);
        setGraphData(res.data);
      } catch (err) {
        console.error('Failed to load graph:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  async function handleNodeClick(node) {
    setSelectedNode(node);
    setImpactData(null);
    try {
      const res = await getNode(projectId, node.id);
      setNodeDetails(res.data);
    } catch {
      setNodeDetails(node);
    }
    onNodeSelect?.(node);
  }

  async function handleImpactAnalysis() {
    if (!selectedNode) return;
    try {
      const res = await getImpact(projectId, selectedNode.id);
      setImpactData(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  const filteredNodes = useMemo(() => {
    if (!graphData) return [];
    let nodes = graphData.nodes;
    if (filters.type !== 'all') nodes = nodes.filter(n => n.type === filters.type);
    if (filters.language !== 'all') nodes = nodes.filter(n => n.language === filters.language);
    if (search) {
      const q = search.toLowerCase();
      nodes = nodes.filter(n => n.label?.toLowerCase().includes(q) || n.id?.toLowerCase().includes(q));
    }
    return nodes;
  }, [graphData, filters, search]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map(n => n.id)), [filteredNodes]);

  const filteredEdges = useMemo(() => {
    if (!graphData) return [];
    return graphData.edges.filter(e => {
      if (!filteredNodeIds.has(e.source) || !filteredNodeIds.has(e.target)) return false;
      if (filters.edgeType !== 'all' && e.type !== filters.edgeType) return false;
      return true;
    });
  }, [graphData, filteredNodeIds, filters.edgeType]);

  const impactNodeIds = useMemo(() => {
    if (!impactData) return new Set();
    return new Set([impactData.nodeId, ...impactData.directImpact, ...impactData.indirectImpact]);
  }, [impactData]);

  const searchResults = useMemo(() => {
    if (!search || !graphData) return [];
    const q = search.toLowerCase();
    return graphData.nodes
      .filter(n => n.label?.toLowerCase().includes(q) || n.id?.toLowerCase().includes(q))
      .slice(0, 10);
  }, [search, graphData]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#6b7280] text-sm">Loading graph data...</p>
        </div>
      </div>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return <div className="flex-1 flex items-center justify-center text-[#6b7280]">No graph data available</div>;
  }

  return (
    <div className="flex h-full">
      {/* Main panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 p-4 border-b border-[#2a2a3a]">
          {/* Search */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-3 py-2 w-64">
              <Search size={14} className="text-[#6b7280]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search nodes..."
                className="flex-1 bg-transparent text-sm outline-none text-[#e2e2f0] placeholder-[#4a4a5a]"
              />
              {search && (
                <button onClick={() => setSearch('')}><X size={12} className="text-[#6b7280]" /></button>
              )}
            </div>
            {searchResults.length > 0 && search && (
              <div className="absolute top-full mt-1 left-0 w-64 bg-[#13131a] border border-[#2a2a3a] rounded-lg overflow-hidden shadow-xl z-20">
                {searchResults.map(node => (
                  <button
                    key={node.id}
                    onClick={() => { handleNodeClick(node); setSearch(''); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#1a1a24] transition-colors flex items-center gap-2"
                  >
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: NODE_COLORS[node.type] || '#6366f1' }} />
                    <span className="truncate">{node.label}</span>
                    <span className="text-[#6b7280] text-xs ml-auto">{node.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
              showFilters ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-[#13131a] border-[#2a2a3a] text-[#6b7280] hover:text-[#e2e2f0]'
            }`}
          >
            <Filter size={14} /> Filters
          </button>

          <div className="ml-auto text-xs text-[#6b7280] flex gap-3">
            <span><span className="text-[#e2e2f0]">{filteredNodes.length}</span> nodes</span>
            <span><span className="text-[#e2e2f0]">{filteredEdges.length}</span> edges</span>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Filter sidebar */}
          {showFilters && (
            <div className="w-56 border-r border-[#2a2a3a] p-4 bg-[#0d0d14] overflow-y-auto shrink-0">
              <GraphControls filters={filters} onChange={setFilters} graph={graphData} />
            </div>
          )}

          {/* Node list */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Legend */}
            <div className="flex gap-4 mb-4">
              {Object.entries(NODE_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-1.5 text-xs text-[#6b7280]">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="capitalize">{type}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {filteredNodes.map(node => {
                const isSelected = selectedNode?.id === node.id;
                const isImpacted = impactData ? impactNodeIds.has(node.id) : false;
                const isDimmed = impactData ? !impactNodeIds.has(node.id) : false;
                const color = NODE_COLORS[node.type] || '#6366f1';
                const edgeCount = graphData.edges.filter(e => e.source === node.id || e.target === node.id).length;

                return (
                  <button
                    key={node.id}
                    onClick={() => handleNodeClick(node)}
                    className={`text-left rounded-xl border px-3 py-2.5 transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : isImpacted
                        ? 'border-amber-500/50 bg-amber-500/5'
                        : isDimmed
                        ? 'border-[#1a1a24] bg-[#0d0d14] opacity-30'
                        : 'border-[#2a2a3a] bg-[#13131a] hover:border-[#3a3a5a]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-xs font-medium truncate">{node.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#4a4a5a]">
                      <span className="capitalize">{node.type}</span>
                      {node.language && <span>· {node.language}</span>}
                      {edgeCount > 0 && <span className="ml-auto">{edgeCount} edges</span>}
                    </div>
                  </button>
                );
              })}
            </div>

            {filteredNodes.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-[#6b7280]">
                <Circle size={24} className="mb-2 text-[#3a3a5a]" />
                <p className="text-sm">No nodes match the current filters</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Node Inspector */}
      {selectedNode && (
        <NodeInspector
          node={nodeDetails || selectedNode}
          impactData={impactData}
          onImpactAnalysis={handleImpactAnalysis}
          onClose={() => { setSelectedNode(null); setNodeDetails(null); setImpactData(null); }}
          onNodeSelect={handleNodeClick}
          graph={graphData}
        />
      )}
    </div>
  );
}
