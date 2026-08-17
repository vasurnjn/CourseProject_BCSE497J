export default function GraphControls({ filters, onChange, graph }) {
  const languages = [...new Set(graph?.nodes.filter(n => n.language).map(n => n.language))];
  const edgeTypes = [...new Set(graph?.edges.map(e => e.type))];
  const nodeTypes = [...new Set(graph?.nodes.map(n => n.type))];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Filters</h3>
      
      <div>
        <label className="text-xs text-[#6b7280] mb-1.5 block">Node Type</label>
        <select
          value={filters.type}
          onChange={e => onChange({ ...filters, type: e.target.value })}
          className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm outline-none text-[#e2e2f0]"
        >
          <option value="all">All Types</option>
          {nodeTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs text-[#6b7280] mb-1.5 block">Language</label>
        <select
          value={filters.language}
          onChange={e => onChange({ ...filters, language: e.target.value })}
          className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm outline-none text-[#e2e2f0]"
        >
          <option value="all">All Languages</option>
          {languages.map(l => <option key={l} value={l} className="capitalize">{l}</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs text-[#6b7280] mb-1.5 block">Edge Type</label>
        <select
          value={filters.edgeType}
          onChange={e => onChange({ ...filters, edgeType: e.target.value })}
          className="w-full bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-3 py-2 text-sm outline-none text-[#e2e2f0]"
        >
          <option value="all">All Relationships</option>
          {edgeTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="flex gap-2">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-indigo-500"></div><span className="text-xs text-[#6b7280]">File</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span className="text-xs text-[#6b7280]">External</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-xs text-[#6b7280]">Class</span></div>
      </div>
    </div>
  );
}
