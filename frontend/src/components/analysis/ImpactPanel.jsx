import { useState, useEffect } from 'react';
import { getGraph, getImpact } from '../../services/api';
import { Activity, Search, Zap, ArrowRight } from 'lucide-react';

export default function ImpactPanel({ projectId, onNodeSelect }) {
  const [nodes, setNodes] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getGraph(projectId).then(res => {
      setNodes((res.data.nodes || []).filter(n => n.type !== 'external'));
    });
  }, [projectId]);

  async function runImpact(node) {
    setSelectedNode(node);
    setLoading(true);
    try {
      const res = await getImpact(projectId, node.id);
      setImpact(res.data);
    } catch { setImpact(null); }
    setLoading(false);
  }

  const filtered = nodes.filter(n =>
    n.label?.toLowerCase().includes(search.toLowerCase()) ||
    n.id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full">
      {/* Node selector */}
      <div className="w-72 border-r border-[#2a2a3a] flex flex-col">
        <div className="p-4 border-b border-[#2a2a3a]">
          <div className="flex items-center gap-2 bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-3 py-2">
            <Search size={14} className="text-[#6b7280]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search modules..."
              className="flex-1 bg-transparent text-sm outline-none text-[#e2e2f0] placeholder-[#4a4a5a]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map(node => (
            <button
              key={node.id}
              onClick={() => runImpact(node)}
              className={`w-full text-left px-4 py-3 border-b border-[#1a1a24] hover:bg-[#13131a] transition-colors text-sm ${
                selectedNode?.id === node.id ? 'bg-indigo-600/20 text-indigo-400' : 'text-[#a0a0b0]'
              }`}
            >
              <div className="font-mono truncate">{node.label}</div>
              <div className="text-xs text-[#4a4a5a] truncate mt-0.5">{node.id}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Impact results */}
      <div className="flex-1 p-6 overflow-y-auto">
        {!selectedNode ? (
          <div className="flex items-center justify-center h-full text-[#6b7280] flex-col gap-3">
            <Activity size={32} className="text-[#3a3a5a]" />
            <p className="text-sm">Select a module to analyze its change impact</p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : impact ? (
          <div className="max-w-xl space-y-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium mb-1">
                <Zap size={14} /> Change Impact Analysis
              </div>
              <h2 className="text-xl font-semibold">{selectedNode.label}</h2>
              <p className="text-sm text-[#6b7280]">{selectedNode.id}</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#13131a] border border-[#2a2a3a] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{impact.directImpact.length}</div>
                <div className="text-xs text-[#6b7280] mt-1">Direct Impact</div>
              </div>
              <div className="bg-[#13131a] border border-[#2a2a3a] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-amber-400">{impact.indirectImpact.length}</div>
                <div className="text-xs text-[#6b7280] mt-1">Indirect Impact</div>
              </div>
              <div className="bg-[#13131a] border border-[#2a2a3a] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-indigo-400">{impact.impactRadius}</div>
                <div className="text-xs text-[#6b7280] mt-1">Impact Radius</div>
              </div>
            </div>

            {impact.directImpact.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 text-red-400">Direct Impact</h3>
                <div className="space-y-2">
                  {impact.directImpact.map(id => (
                    <div key={id} className="flex items-center gap-3 bg-[#13131a] border border-red-500/10 rounded-lg px-4 py-3">
                      <ArrowRight size={12} className="text-red-400" />
                      <span className="font-mono text-sm text-[#a0a0b0] flex-1 truncate">{id}</span>
                      <button onClick={() => onNodeSelect({ id, label: id.split('/').pop(), type: 'file' })} className="text-xs text-indigo-400 hover:text-indigo-300">View</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {impact.indirectImpact.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 text-amber-400">Indirect Impact</h3>
                <div className="space-y-2">
                  {impact.indirectImpact.map(id => (
                    <div key={id} className="flex items-center gap-3 bg-[#13131a] border border-amber-500/10 rounded-lg px-4 py-3">
                      <ArrowRight size={12} className="text-amber-400" />
                      <span className="font-mono text-sm text-[#a0a0b0] flex-1 truncate">{id}</span>
                      <button onClick={() => onNodeSelect({ id, label: id.split('/').pop(), type: 'file' })} className="text-xs text-indigo-400 hover:text-indigo-300">View</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {impact.directImpact.length === 0 && impact.indirectImpact.length === 0 && (
              <div className="bg-[#13131a] border border-emerald-500/20 rounded-xl p-6 text-center">
                <p className="text-emerald-400 font-medium">No downstream dependents</p>
                <p className="text-sm text-[#6b7280] mt-1">Changing this module won't directly affect other modules</p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
