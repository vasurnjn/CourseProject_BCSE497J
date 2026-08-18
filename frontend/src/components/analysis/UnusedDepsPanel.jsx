import { useEffect, useState } from 'react';
import { getUnusedDependencies } from '../../services/api';
import { Package, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';

export default function UnusedDepsPanel({ projectId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUnusedDependencies(projectId).then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div className="p-6 text-[#6b7280]">Loading...</div>;
  if (!data) return <div className="p-6 text-[#6b7280]">No dependency data available</div>;

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex items-center gap-3 mb-6">
        <Package size={20} className="text-amber-400" />
        <h2 className="text-lg font-semibold">Dependency Analysis</h2>
      </div>

      {!data.hasPackageJson && (
        <div className="bg-[#13131a] border border-amber-500/20 rounded-xl p-4 mb-6 text-sm text-amber-400">
          No package.json found. Showing detected external dependencies.
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6 max-w-lg">
        <div className="bg-[#13131a] border border-[#2a2a3a] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{data.used?.length || 0}</div>
          <div className="text-xs text-[#6b7280] mt-1">Used</div>
        </div>
        <div className="bg-[#13131a] border border-[#2a2a3a] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{data.unused?.length || 0}</div>
          <div className="text-xs text-[#6b7280] mt-1">Unused</div>
        </div>
        <div className="bg-[#13131a] border border-[#2a2a3a] rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[#6b7280]">{data.unknown?.length || 0}</div>
          <div className="text-xs text-[#6b7280] mt-1">Unknown</div>
        </div>
      </div>

      <div className="space-y-6 max-w-2xl">
        {data.unused?.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
              <AlertTriangle size={14} /> Unused Dependencies
            </h3>
            <div className="space-y-2">
              {data.unused.map(pkg => (
                <div key={pkg} className="flex items-center gap-3 bg-[#13131a] border border-red-500/10 rounded-lg px-4 py-3">
                  <Package size={14} className="text-red-400 shrink-0" />
                  <span className="font-mono text-sm">{pkg}</span>
                  <span className="ml-auto text-xs text-red-400 bg-red-500/10 rounded px-2 py-0.5">Unused</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.used?.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
              <CheckCircle size={14} /> Used Dependencies
            </h3>
            <div className="space-y-2">
              {data.used.map(pkg => (
                <div key={pkg} className="flex items-center gap-3 bg-[#13131a] border border-emerald-500/10 rounded-lg px-4 py-3">
                  <Package size={14} className="text-emerald-400 shrink-0" />
                  <span className="font-mono text-sm">{pkg}</span>
                  <span className="ml-auto text-xs text-emerald-400 bg-emerald-500/10 rounded px-2 py-0.5">Used</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {data.unknown?.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-[#6b7280] mb-3 flex items-center gap-2">
              <HelpCircle size={14} /> Unknown Status
            </h3>
            <div className="space-y-2">
              {data.unknown.map(pkg => (
                <div key={pkg} className="flex items-center gap-3 bg-[#13131a] border border-[#2a2a3a] rounded-lg px-4 py-3">
                  <Package size={14} className="text-[#6b7280] shrink-0" />
                  <span className="font-mono text-sm">{pkg}</span>
                  <span className="ml-auto text-xs text-[#6b7280] bg-[#2a2a3a] rounded px-2 py-0.5">Unknown</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
