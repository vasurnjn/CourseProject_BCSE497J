import { Files, Code2, Braces, GitBranch, AlertTriangle, Package, Layers, Activity } from 'lucide-react';

function MetricCard({ icon: Icon, label, value, sublabel, color = 'indigo', onClick }) {
  const colors = {
    indigo: 'text-indigo-400 bg-indigo-500/10',
    violet: 'text-violet-400 bg-violet-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    red: 'text-red-400 bg-red-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
  };
  return (
    <div
      onClick={onClick}
      className={`bg-[#13131a] border border-[#2a2a3a] rounded-xl p-5 ${onClick ? 'cursor-pointer hover:border-indigo-500/50 transition-colors' : ''}`}
    >
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <div className="text-2xl font-bold mb-0.5">{value ?? '—'}</div>
      <div className="text-sm text-[#6b7280]">{label}</div>
      {sublabel && <div className="text-xs text-[#4a4a5a] mt-1">{sublabel}</div>}
    </div>
  );
}

export default function MetricsGrid({ metrics, onTabChange }) {
  if (!metrics) return <div className="text-[#6b7280]">No metrics available</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Project Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard icon={Files} label="Total Files" value={metrics.totalFiles} color="indigo" />
          <MetricCard icon={Code2} label="Total Classes" value={metrics.totalClasses} color="violet" />
          <MetricCard icon={Activity} label="Total Functions" value={metrics.totalFunctions} color="blue" />
          <MetricCard icon={Layers} label="Lines of Code" value={metrics.totalLines?.toLocaleString()} color="emerald" />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Dependencies</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard icon={GitBranch} label="Total Dependencies" value={metrics.totalDependencies} color="indigo" />
          <MetricCard icon={Package} label="External Packages" value={metrics.externalDependencies} color="violet" />
          <MetricCard icon={AlertTriangle} label="Circular Deps" value={metrics.circularDependencies} color={metrics.circularDependencies > 0 ? 'red' : 'emerald'} onClick={() => onTabChange('cycles')} />
          <MetricCard icon={Package} label="Unused Deps" value={metrics.unusedDependencies} color={metrics.unusedDependencies > 0 ? 'amber' : 'emerald'} onClick={() => onTabChange('unused')} />
        </div>
      </div>

      {metrics.languages && Object.keys(metrics.languages).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Languages</h2>
          <div className="bg-[#13131a] border border-[#2a2a3a] rounded-xl p-5">
            <div className="space-y-3">
              {Object.entries(metrics.languages).map(([lang, count]) => {
                const total = Object.values(metrics.languages).reduce((a, b) => a + b, 0);
                const pct = Math.round((count / total) * 100);
                const colors = { javascript: '#f59e0b', typescript: '#3b82f6', python: '#10b981', java: '#ef4444' };
                return (
                  <div key={lang}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize">{lang}</span>
                      <span className="text-[#6b7280]">{count} files ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-[#2a2a3a] rounded-full">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: colors[lang] || '#6366f1' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {metrics.highlyConnected && metrics.highlyConnected.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Most Connected Nodes</h2>
          <div className="bg-[#13131a] border border-[#2a2a3a] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2a2a3a]">
                  <th className="text-left px-4 py-3 text-[#6b7280] font-medium">Module</th>
                  <th className="text-right px-4 py-3 text-[#6b7280] font-medium">In</th>
                  <th className="text-right px-4 py-3 text-[#6b7280] font-medium">Out</th>
                  <th className="text-right px-4 py-3 text-[#6b7280] font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {metrics.highlyConnected.map((n, i) => (
                  <tr key={n.id} className="border-b border-[#1a1a24] hover:bg-[#1a1a24]">
                    <td className="px-4 py-2.5 font-mono text-xs text-[#a0a0b0]">{n.id.replace('external:', '[ext] ')}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-400">{n.inDegree}</td>
                    <td className="px-4 py-2.5 text-right text-indigo-400">{n.outDegree}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{n.degree}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
