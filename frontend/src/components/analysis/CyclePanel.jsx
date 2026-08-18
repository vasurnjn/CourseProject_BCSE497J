import { useEffect, useState } from 'react';
import { getCycles } from '../../services/api';
import { AlertTriangle, ChevronRight } from 'lucide-react';

export default function CyclePanel({ projectId, onNodeSelect }) {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getCycles(projectId).then(res => {
      setCycles(res.data.cycles || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div className="p-6 text-[#6b7280]">Loading...</div>;

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle size={20} className="text-red-400" />
        <h2 className="text-lg font-semibold">Circular Dependencies</h2>
        {cycles.length > 0 && (
          <span className="bg-red-500/20 text-red-400 text-xs rounded-full px-2 py-0.5">{cycles.length} detected</span>
        )}
      </div>

      {cycles.length === 0 ? (
        <div className="bg-[#13131a] border border-emerald-500/20 rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle size={20} className="text-emerald-400" />
          </div>
          <p className="text-emerald-400 font-medium">No circular dependencies detected</p>
          <p className="text-sm text-[#6b7280] mt-1">Your project has clean dependency structure</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl">
          <p className="text-sm text-[#6b7280] mb-4">
            Circular dependencies detected using Tarjan's Strongly Connected Components algorithm.
            These create tight coupling and can cause issues with module loading.
          </p>
          {cycles.map((cycle, i) => (
            <div
              key={i}
              onClick={() => setSelected(selected === i ? null : i)}
              className={`bg-[#13131a] border rounded-xl overflow-hidden cursor-pointer transition-colors ${
                selected === i ? 'border-red-500/50' : 'border-[#2a2a3a] hover:border-[#3a3a4a]'
              }`}
            >
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                    <span className="text-red-400 text-xs font-bold">{i + 1}</span>
                  </div>
                  <span className="text-sm font-medium">Cycle — {cycle.size} modules</span>
                </div>
                <ChevronRight size={14} className={`text-[#6b7280] transition-transform ${selected === i ? 'rotate-90' : ''}`} />
              </div>
              {selected === i && (
                <div className="px-4 pb-4 border-t border-[#2a2a3a] pt-3">
                  <div className="space-y-2">
                    {cycle.nodes.map((nodeId, j) => (
                      <div key={nodeId} className="flex items-center gap-2">
                        <button
                          onClick={e => { e.stopPropagation(); onNodeSelect({ id: nodeId, label: nodeId.split('/').pop(), type: 'file' }); }}
                          className="text-sm font-mono text-indigo-400 hover:text-indigo-300 transition-colors text-left"
                        >
                          {nodeId}
                        </button>
                        {j < cycle.nodes.length - 1 && (
                          <div className="text-[#6b7280] text-xs ml-auto">↓</div>
                        )}
                      </div>
                    ))}
                    <div className="text-xs text-red-400 mt-2">↑ cycles back to {cycle.nodes[0]}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
