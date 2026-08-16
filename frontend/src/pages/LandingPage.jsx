import { useState, useRef } from 'react';
import { Github, Upload, Search, GitBranch, AlertCircle, Layers, Zap } from 'lucide-react';
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

  const features = [
    { icon: Layers, title: '3D Dependency Graph', desc: 'Interactive three-dimensional visualization of all module relationships' },
    { icon: GitBranch, title: 'Circular Dependency Detection', desc: "Tarjan's SCC algorithm detects circular dependencies automatically" },
    { icon: Zap, title: 'Change Impact Analysis', desc: 'Instantly see which components are affected by a change in any module' },
    { icon: Search, title: 'Graph Search & Filter', desc: 'Search nodes, filter by type, language, or relationship' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e2e2f0] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#2a2a3a] px-8 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
          <GitBranch size={16} className="text-white" />
        </div>
        <span className="font-semibold text-sm tracking-wide">DepViz</span>
        <span className="ml-auto text-xs text-[#6b7280] border border-[#2a2a3a] rounded px-2 py-1">B.Tech Project</span>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-indigo-400 border border-indigo-500/30 bg-indigo-500/10 rounded-full px-4 py-1.5 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
          Static Analysis · AST Parsing · 3D Visualization
        </div>

        <h1 className="text-4xl md:text-6xl font-bold text-center leading-tight mb-6 max-w-3xl">
          Interactive Software
          <span className="block bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Dependency Analysis
          </span>
        </h1>

        <p className="text-[#6b7280] text-lg text-center max-w-xl mb-12">
          Analyze any JavaScript or Python project. Extract dependencies, detect circular imports,
          and explore your software architecture in an interactive 3D graph.
        </p>

        {/* Input Card */}
        <div className="w-full max-w-lg bg-[#13131a] border border-[#2a2a3a] rounded-2xl p-8 shadow-2xl">
          {/* GitHub URL */}
          <form onSubmit={handleGithub} className="space-y-3">
            <label className="block text-sm font-medium text-[#a0a0b0]">
              GitHub Repository
            </label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-3 focus-within:border-indigo-500 transition-colors">
                <Github size={16} className="text-[#6b7280] shrink-0" />
                <input
                  type="text"
                  value={githubUrl}
                  onChange={e => { setGithubUrl(e.target.value); setError(''); }}
                  placeholder="https://github.com/user/project"
                  className="flex-1 bg-transparent py-2.5 text-sm outline-none text-[#e2e2f0] placeholder-[#4a4a5a]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              >
                {loading ? 'Starting...' : 'Analyze'}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[#2a2a3a]"></div>
            <span className="text-xs text-[#6b7280]">OR</span>
            <div className="flex-1 h-px bg-[#2a2a3a]"></div>
          </div>

          {/* Upload Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-[#2a2a3a] hover:border-[#3a3a4a]'
            }`}
          >
            <Upload size={24} className="mx-auto mb-3 text-[#6b7280]" />
            <p className="text-sm text-[#a0a0b0] mb-1">Drop your project ZIP here</p>
            <p className="text-xs text-[#6b7280]">or click to browse</p>
            <input ref={fileRef} type="file" accept=".zip" className="hidden" onChange={e => handleFile(e.target.files[0])} />
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl w-full">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-[#13131a] border border-[#2a2a3a] rounded-xl p-5 hover:border-indigo-500/50 transition-colors">
              <Icon size={20} className="text-indigo-400 mb-3" />
              <h3 className="text-sm font-semibold mb-1">{title}</h3>
              <p className="text-xs text-[#6b7280] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-[#2a2a3a] py-4 text-center text-xs text-[#6b7280]">
        Interactive Software Dependency Analysis and Visualization System · B.Tech Project
      </footer>
    </div>
  );
}
