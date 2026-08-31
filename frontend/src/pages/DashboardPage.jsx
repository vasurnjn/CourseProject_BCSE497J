import { useState, useEffect } from 'react';
import { getProject, getStatistics, getCycles, getUnusedDependencies } from '../services/api';
import { BarChart2, GitBranch, AlertTriangle, Package, ArrowLeft, Layers, Activity, Lightbulb } from 'lucide-react';
import MetricsGrid from '../components/dashboard/MetricsGrid';
import DependencyGraph from '../components/graph/DependencyGraph';
import CyclePanel from '../components/analysis/CyclePanel';
import UnusedDepsPanel from '../components/analysis/UnusedDepsPanel';
import ImpactPanel from '../components/analysis/ImpactPanel';
import InsightsPanel from '../components/analysis/InsightsPanel';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'insights', label: 'Architecture Insights', icon: Lightbulb },
  { id: 'graph', label: 'Dependency Graph', icon: Layers },
  { id: 'cycles', label: 'Circular Deps', icon: GitBranch },
  { id: 'unused', label: 'Unused Deps', icon: Package },
  { id: 'impact', label: 'Impact Analysis', icon: Activity },
];

export default function DashboardPage({ projectId, onBack }) {
  const [tab, setTab] = useState('overview');
  const [project, setProject] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [projRes, statsRes] = await Promise.all([getProject(projectId), getStatistics(projectId)]);
        setProject(projRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  function handleNodeSelect(node) {
    setSelectedNode(node);
    setTab('graph');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e2e2f0] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#2a2a3a] px-6 py-3 flex items-center gap-4">
        <button onClick={onBack} className="flex items-center gap-2 text-[#6b7280] hover:text-[#e2e2f0] text-sm transition-colors">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="h-4 w-px bg-[#2a2a3a]"></div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <GitBranch size={12} className="text-white" />
          </div>
          <span className="font-medium text-sm">{project?.name || 'Project'}</span>
        </div>
        <div className="ml-auto flex items-center gap-4 text-xs text-[#6b7280]">
          {stats?.metrics?.insights?.score !== undefined && (
            <span className="flex items-center gap-1 font-semibold text-indigo-400">
              Health Score: {stats.metrics.insights.score}
            </span>
          )}
          <span>{stats?.metrics?.totalFiles || 0} files</span>
          <span>{stats?.metrics?.totalDependencies || 0} dependencies</span>
          <span>{stats?.metrics?.circularDependencies || 0} cycles</span>
        </div>
      </header>

      {/* Tab Nav */}
      <nav className="border-b border-[#2a2a3a] px-6 flex gap-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === id
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-[#6b7280] hover:text-[#a0a0b0]'
            }`}
          >
            <Icon size={14} />
            {label}
            {id === 'cycles' && (stats?.metrics?.circularDependencies || 0) > 0 && (
              <span className="bg-red-500/20 text-red-400 text-xs rounded-full px-1.5 py-0.5">
                {stats.metrics.circularDependencies}
              </span>
            )}
            {id === 'insights' && stats?.metrics?.insights?.score < 70 && (
              <span className="bg-yellow-500/20 text-yellow-400 text-xs rounded-full px-1.5 py-0.5">
                !
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {tab === 'overview' && (
          <div className="p-6 overflow-y-auto h-full">
            <MetricsGrid metrics={stats?.metrics} onTabChange={setTab} />
          </div>
        )}
        {tab === 'insights' && (
          <InsightsPanel insights={stats?.metrics?.insights} onNodeSelect={handleNodeSelect} />
        )}
        {tab === 'graph' && (
          <DependencyGraph
            projectId={projectId}
            initialSelectedNode={selectedNode}
            onNodeSelect={setSelectedNode}
          />
        )}
        {tab === 'cycles' && <CyclePanel projectId={projectId} onNodeSelect={handleNodeSelect} />}
        {tab === 'unused' && <UnusedDepsPanel projectId={projectId} />}
        {tab === 'impact' && <ImpactPanel projectId={projectId} onNodeSelect={handleNodeSelect} />}
      </main>
    </div>
  );
}
