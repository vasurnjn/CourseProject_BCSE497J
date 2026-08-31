import { X, Zap, GitBranch, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function NodeInspector({ node, impactData, onImpactAnalysis, onClose, onNodeSelect, graph }) {
  if (!node) return null;

  const deps = node.dependencies || [];
  const dependents = node.dependents || [];
  const functions = node.functions || [];
  const classes = node.classes || [];

  return (
    <div className="w-64 border-l border-[#2a2a3a] bg-[#0d0d14] flex flex-col overflow-hidden shrink-0">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-[#2a2a3a]">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: { file: '#6366f1', external: '#f59e0b', class: '#10b981' }[node.type] || '#6366f1' }}
            />
            <span className="text-xs text-[#6b7280] capitalize">{node.type}</span>
          </div>
          <h3 className="font-semibold text-sm leading-tight truncate">{node.label}</h3>
          {node.language && <p className="text-xs text-[#6b7280] mt-0.5 capitalize">{node.language}</p>}
        </div>
        <button onClick={onClose} className="text-[#6b7280] hover:text-[#e2e2f0] ml-2 shrink-0">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Path */}
        {node.path && (
          <div>
            <div className="text-xs text-[#6b7280] mb-1">Path</div>
            <div className="font-mono text-xs text-[#a0a0b0] break-all bg-[#13131a] rounded px-2 py-1.5">{node.path}</div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          {node.lineCount != null && (
            <div className="bg-[#13131a] rounded-lg p-2.5">
              <div className="text-lg font-bold">{node.lineCount}</div>
              <div className="text-xs text-[#6b7280]">Lines</div>
            </div>
          )}
          <div className="bg-[#13131a] rounded-lg p-2.5">
            <div className="text-lg font-bold text-indigo-400">{deps.length}</div>
            <div className="text-xs text-[#6b7280]">Imports</div>
          </div>
          <div className="bg-[#13131a] rounded-lg p-2.5">
            <div className="text-lg font-bold text-emerald-400">{dependents.length}</div>
            <div className="text-xs text-[#6b7280]">Imported By</div>
          </div>
        </div>

        {/* Impact Analysis Button */}
        <button
          onClick={onImpactAnalysis}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg text-indigo-400 text-sm font-medium transition-colors"
        >
          <Zap size={14} /> Analyze Change Impact
        </button>

        {/* Impact Results */}
        {impactData && (
          <div className="bg-[#13131a] border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-3">
              <Zap size={14} /> Change Impact
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-[#6b7280] mb-1.5">Direct Impact ({impactData.directImpact.length})</div>
                {impactData.directImpact.length === 0 ? (
                  <div className="text-xs text-[#4a4a5a]">None</div>
                ) : (
                  <div className="space-y-1">
                    {impactData.directImpact.map(id => (
                      <button key={id} onClick={() => onNodeSelect(graph?.nodes.find(n => n.id === id) || { id, label: id.split('/').pop() })} className="flex items-center gap-1.5 text-xs text-[#a0a0b0] hover:text-indigo-400 transition-colors">
                        <ArrowUpRight size={10} className="text-red-400" />
                        <span className="truncate">{id.split('/').pop()}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs text-[#6b7280] mb-1.5">Indirect Impact ({impactData.indirectImpact.length})</div>
                {impactData.indirectImpact.length === 0 ? (
                  <div className="text-xs text-[#4a4a5a]">None</div>
                ) : (
                  <div className="space-y-1">
                    {impactData.indirectImpact.map(id => (
                      <button key={id} onClick={() => onNodeSelect(graph?.nodes.find(n => n.id === id) || { id, label: id.split('/').pop() })} className="flex items-center gap-1.5 text-xs text-[#a0a0b0] hover:text-indigo-400 transition-colors">
                        <ArrowDownRight size={10} className="text-amber-400" />
                        <span className="truncate">{id.split('/').pop()}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-xs text-[#6b7280] border-t border-[#2a2a3a] pt-2 mt-2">
                Impact radius: <span className="text-amber-400 font-medium">{impactData.impactRadius} components</span>
              </div>
            </div>
          </div>
        )}

        {/* Dependencies */}
        {deps.length > 0 && (
          <div>
            <div className="text-xs text-[#6b7280] mb-2">Imports ({deps.length})</div>
            <div className="space-y-1">
              {deps.slice(0, 15).map(d => (
                <div key={d} className="text-xs font-mono text-[#a0a0b0] bg-[#13131a] rounded px-2 py-1 truncate">{d.replace('external:', '[ext] ')}</div>
              ))}
              {deps.length > 15 && <div className="text-xs text-[#6b7280]">+{deps.length - 15} more</div>}
            </div>
          </div>
        )}

        {/* Dependents */}
        {dependents.length > 0 && (
          <div>
            <div className="text-xs text-[#6b7280] mb-2">Imported By ({dependents.length})</div>
            <div className="space-y-1">
              {dependents.slice(0, 15).map(d => (
                <div key={d} className="text-xs font-mono text-[#a0a0b0] bg-[#13131a] rounded px-2 py-1 truncate">{d}</div>
              ))}
              {dependents.length > 15 && <div className="text-xs text-[#6b7280]">+{dependents.length - 15} more</div>}
            </div>
          </div>
        )}

        {/* Functions */}
        {functions.length > 0 && (
          <div>
            <div className="text-xs text-[#6b7280] mb-2">Functions ({functions.length})</div>
            <div className="space-y-1">
              {functions.slice(0, 10).map((f, i) => (
                <div key={i} className="text-xs font-mono text-violet-400 bg-[#13131a] rounded px-2 py-1">{f.name}()</div>
              ))}
            </div>
          </div>
        )}

        {/* Classes */}
        {classes.length > 0 && (
          <div>
            <div className="text-xs text-[#6b7280] mb-2">Classes ({classes.length})</div>
            <div className="space-y-1">
              {classes.map((c, i) => (
                <div key={i} className="text-xs font-mono text-emerald-400 bg-[#13131a] rounded px-2 py-1">{c.name}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
