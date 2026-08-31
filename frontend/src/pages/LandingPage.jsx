import { useState, useRef } from 'react';
import { Github, Upload, AlertCircle, Box, Code2, Shield } from 'lucide-react';
import { analyzeGithub, analyzeUpload } from '../services/api';

export default function LandingPage({ onStart }) {
  const [githubUrl, setGithubUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  async function handleGithub(e) {
    e.preventDefault();
    if (!githubUrl.trim()) return setError('Please enter a GitHub URL');
    const githubRegex = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+/;
    if (!githubRegex.test(githubUrl)) return setError('Please enter a valid GitHub URL');
    setError('');
    setLoading(true);
    try {
      const res = await analyzeGithub(githubUrl);
      onStart(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start analysis');
    } finally {
      setLoading(false);
    }
  }

  async function handleFile(file) {
    if (!file) return;
    if (!file.name.endsWith('.zip')) return setError('Please upload a ZIP file');
    setError('');
    setLoading(true);
    try {
      const res = await analyzeUpload(file);
      onStart(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }

  return (
    <div className="min-h-screen bg-[#000000] text-[#ededed] flex flex-col font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] px-8 py-4 flex items-center gap-3 bg-[#0a0a0a]">
        <div className="w-6 h-6 rounded bg-[#ffffff] flex items-center justify-center">
          <Box size={14} className="text-[#000000]" />
        </div>
        <span className="font-semibold text-sm tracking-tight text-[#ffffff]">Software Architecture Visualization</span>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 relative">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] opacity-50 z-0 pointer-events-none"></div>
        
        <div className="z-10 w-full max-w-2xl mx-auto flex flex-col items-center">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-center mb-4 text-[#ffffff]">
            Interactive Software Dependency Analysis & Visualization System
          </h1>
          <p className="text-[#a1a1aa] text-center max-w-md mb-10 text-sm leading-relaxed">
            Perform static code analysis to extract module dependencies and interactively explore software architecture.
          </p>

          {/* Core Input UI */}
          <div className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 shadow-2xl">
            <form onSubmit={handleGithub} className="mb-6">
              <label className="block text-xs font-medium text-[#71717a] mb-2 uppercase tracking-wider">
                Import Repository
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex items-center gap-3 bg-[#000000] border border-[#27272a] focus-within:border-[#52525b] transition-colors rounded-lg px-3 py-1">
                  <Github size={16} className="text-[#71717a]" />
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={e => { setGithubUrl(e.target.value); setError(''); }}
                    placeholder="https://github.com/organization/repository"
                    className="flex-1 bg-transparent py-1.5 text-sm outline-none text-[#ededed] placeholder-[#52525b]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-[#ededed] hover:bg-[#ffffff] text-[#000000] disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
                >
                  {loading ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>
            </form>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-[#1a1a1a]"></div>
              <span className="text-xs text-[#52525b] uppercase tracking-wider font-medium">Or</span>
              <div className="flex-1 h-px bg-[#1a1a1a]"></div>
            </div>

            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                dragOver ? 'border-[#ededed] bg-[#1a1a1a]' : 'border-[#27272a] hover:border-[#52525b] hover:bg-[#0a0a0a]'
              }`}
            >
              <Upload size={20} className="mx-auto mb-2 text-[#71717a]" />
              <p className="text-sm text-[#a1a1aa] font-medium">Upload local workspace</p>
              <p className="text-xs text-[#52525b] mt-1">.zip archive containing source files</p>
              <input ref={fileRef} type="file" accept=".zip" className="hidden" onChange={e => handleFile(e.target.files[0])} />
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 text-red-400 text-sm bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
                <AlertCircle size={14} />
                {error}
              </div>
            )}
          </div>
          
          {/* Subtle Capabilities List */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-xs text-[#71717a] font-medium">
            <span className="flex items-center gap-2"><Code2 size={14} /> Abstract Syntax Parsing</span>
            <span className="flex items-center gap-2"><Box size={14} /> Directed Graph Construction</span>
            <span className="flex items-center gap-2"><Shield size={14} /> Health Auditing</span>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-[#52525b] bg-[#000000]">
        Software Dependency Analysis & Visualization System
      </footer>
    </div>
  );
}
