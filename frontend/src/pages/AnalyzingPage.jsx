import { useEffect, useState } from 'react';
import { getJobStatus } from '../services/api';
import { GitBranch, CheckCircle, AlertCircle } from 'lucide-react';

const STAGES = [
  'Preparing repository',
  'Cloning repository',
  'Scanning files',
  'Parsing source code',
  'Building dependency graph',
  'Detecting circular dependencies',
  'Analyzing unused dependencies',
  'Calculating metrics',
  'Finalizing analysis',
  'Complete'
];

export default function AnalyzingPage({ jobInfo, onComplete, onError }) {
  const [status, setStatus] = useState({ stage: 'Preparing repository', progress: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!jobInfo?.jobId) return;
    let interval;
    let done = false;

    async function poll() {
      try {
        const res = await getJobStatus(jobInfo.jobId);
        const data = res.data;
        setStatus(data);
        if (data.status === 'complete') {
          done = true;
          clearInterval(interval);
          setTimeout(() => onComplete(data.projectId), 800);
        } else if (data.status === 'error') {
          done = true;
          clearInterval(interval);
          setError(data.error || 'Analysis failed');
        }
      } catch {
        if (!done) setError('Lost connection to server');
      }
    }

    poll();
    interval = setInterval(poll, 1500);
    return () => clearInterval(interval);
  }, [jobInfo]);

  const stageIndex = STAGES.indexOf(status.stage);
  const progress = status.progress || 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e2e2f0] flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <GitBranch size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-semibold">Analyzing Repository</h1>
            <p className="text-xs text-[#6b7280]">This may take a few moments</p>
          </div>
        </div>

        {error ? (
          <div className="bg-[#13131a] border border-red-500/30 rounded-2xl p-8 text-center">
            <AlertCircle size={32} className="text-red-400 mx-auto mb-4" />
            <p className="text-red-400 font-medium mb-2">Analysis Failed</p>
            <p className="text-sm text-[#6b7280] mb-6">{error}</p>
            <button onClick={onError} className="px-6 py-2 bg-[#2a2a3a] hover:bg-[#3a3a4a] rounded-lg text-sm transition-colors">Go Back</button>
          </div>
        ) : (
          <div className="bg-[#13131a] border border-[#2a2a3a] rounded-2xl p-8">
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#a0a0b0]">{status.stage}</span>
                <span className="text-indigo-400 font-medium">{progress}%</span>
              </div>
              <div className="h-2 bg-[#0a0a0f] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Stage list */}
            <div className="space-y-2.5">
              {STAGES.filter(s => s !== 'Complete').map((stage, i) => {
                const done = stageIndex > i || progress === 100;
                const active = STAGES[stageIndex] === stage;
                return (
                  <div key={stage} className={`flex items-center gap-3 text-sm transition-colors ${
                    done ? 'text-[#e2e2f0]' : active ? 'text-indigo-400' : 'text-[#4a4a5a]'
                  }`}>
                    {done ? (
                      <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                    ) : active ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-[#3a3a4a] shrink-0" />
                    )}
                    {stage}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
