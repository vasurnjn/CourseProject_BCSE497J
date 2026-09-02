import { Shield, ShieldAlert, CheckCircle, AlertTriangle, Zap, Code2, AlertCircle } from 'lucide-react';

export default function InsightsPanel({ insights, onNodeSelect }) {
  if (!insights) return null;

  const { score, strengths, weaknesses, refactoringCandidates, mostCritical, isolatedModules } = insights;
  
  let scoreColor = 'text-green-400';
  let ScoreIcon = Shield;
  if (score < 70) {
    scoreColor = 'text-yellow-400';
    ScoreIcon = AlertTriangle;
  }
  if (score < 40) {
    scoreColor = 'text-red-400';
    ScoreIcon = ShieldAlert;
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header / Score */}
        <div className="bg-[#13131a] border border-[#2a2a3a] rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0 relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="56" className="text-[#2a2a3a]" strokeWidth="12" fill="none" stroke="currentColor" />
              <circle
                cx="64" cy="64" r="56"
                className={scoreColor}
                strokeWidth="12"
                fill="none"
                stroke="currentColor"
                strokeDasharray="351.85"
                strokeDashoffset={351.85 - (351.85 * score) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold ${scoreColor}`}>{score}</span>
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-[#e2e2f0] flex items-center gap-2">
              <ScoreIcon className={scoreColor} />
              Architecture Health Score
            </h2>
            <p className="text-[#a0a0b0] mt-2 leading-relaxed">
              This score is deterministically calculated using static graph metrics. Points are deducted for high coupling (Fan-Out), circular dependencies, isolated modules, and unused code.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Strengths */}
          <div className="bg-[#13131a] border border-[#2a2a3a] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#e2e2f0] mb-4 flex items-center gap-2">
              <CheckCircle className="text-green-400" /> Architecture Strengths
            </h3>
            {strengths.length === 0 ? (
              <p className="text-[#6b7280] italic">No significant strengths detected.</p>
            ) : (
              <ul className="space-y-3">
                {strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-3 bg-[#1a1a24] p-3 rounded-lg border border-[#2a2a3a]">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 shrink-0" />
                    <span className="text-sm text-[#e2e2f0]">{str}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Weaknesses */}
          <div className="bg-[#13131a] border border-[#2a2a3a] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-[#e2e2f0] mb-4 flex items-center gap-2">
              <AlertCircle className="text-red-400" /> Areas for Improvement
            </h3>
            {weaknesses.length === 0 ? (
              <p className="text-[#6b7280] italic">No significant weaknesses detected. Great job!</p>
            ) : (
              <ul className="space-y-3">
                {weaknesses.map((wk, idx) => (
                  <li key={idx} className="flex flex-col gap-2 bg-[#2a1a1a] p-3 rounded-lg border border-red-900/30">
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />
                      <span className="text-sm text-[#e2e2f0]">{wk}</span>
                    </div>
                    {wk.startsWith('Dead Code:') && isolatedModules && isolatedModules.length > 0 && (
                      <div className="ml-4 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                        <ul className="space-y-1.5 mt-1">
                          {isolatedModules.map(mod => (
                            <li key={mod.id} className="flex items-center gap-2 text-xs text-[#a0a0b0]">
                              <span className="w-1 h-1 rounded-full bg-[#6b7280]" />
                              {mod.label}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Structural Insights */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-[#e2e2f0] flex items-center gap-2">
            <Zap className="text-yellow-400" /> Structural Analysis
          </h3>
          
          {mostCritical && (
            <div className="bg-[#13131a] border border-[#2a2a3a] rounded-xl p-5 hover:border-indigo-500/50 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-indigo-400 mb-1">Most Critical Module</h4>
                  <div className="flex items-center gap-2 text-lg text-[#e2e2f0] mb-2">
                    <Code2 size={18} className="text-[#6b7280]" />
                    {mostCritical.label}
                  </div>
                  
                  <div className="flex items-center gap-4 mb-3">
                    <div className="text-xs">
                      <span className="text-[#6b7280] mr-1">Fan-In:</span>
                      <span className="font-mono text-[#e2e2f0] bg-[#1a1a24] px-1.5 py-0.5 rounded">{mostCritical.fanIn}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-[#6b7280] mr-1">Fan-Out:</span>
                      <span className="font-mono text-[#e2e2f0] bg-[#1a1a24] px-1.5 py-0.5 rounded">{mostCritical.fanOut}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-[#6b7280] mr-1">Degree:</span>
                      <span className="font-mono text-[#e2e2f0] bg-[#1a1a24] px-1.5 py-0.5 rounded">{mostCritical.degree}</span>
                    </div>
                  </div>

                  <p className="text-sm text-[#a0a0b0]">{mostCritical.reason}</p>
                </div>
                {onNodeSelect && (
                  <button 
                    onClick={() => onNodeSelect({ id: mostCritical.id })}
                    className="px-3 py-1.5 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded text-xs font-medium transition-colors"
                  >
                    View in Graph
                  </button>
                )}
              </div>
            </div>
          )}

          {refactoringCandidates.map((candidate, idx) => (
            <div key={idx} className="bg-[#13131a] border border-[#2a2a3a] rounded-xl p-5 hover:border-amber-500/50 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-amber-500 mb-1">Refactoring Candidate</h4>
                  <div className="flex items-center gap-2 text-lg text-[#e2e2f0] mb-2">
                    <Code2 size={18} className="text-[#6b7280]" />
                    {candidate.label}
                  </div>
                  <p className="text-sm text-[#a0a0b0]">{candidate.reason}</p>
                </div>
                {onNodeSelect && (
                  <button 
                    onClick={() => onNodeSelect({ id: candidate.id })}
                    className="px-3 py-1.5 bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 rounded text-xs font-medium transition-colors"
                  >
                    View in Graph
                  </button>
                )}
              </div>
            </div>
          ))}

          {!mostCritical && refactoringCandidates.length === 0 && (
            <div className="bg-[#13131a] border border-[#2a2a3a] rounded-xl p-8 text-center text-[#6b7280]">
              No structural anomalies or critical bottlenecks detected.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
