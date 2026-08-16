import { useState } from 'react';
import LandingPage from './pages/LandingPage';
import AnalyzingPage from './pages/AnalyzingPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  const [page, setPage] = useState('landing');
  const [jobInfo, setJobInfo] = useState(null);
  const [projectId, setProjectId] = useState(null);

  function startAnalysis(info) {
    setJobInfo(info);
    setPage('analyzing');
  }

  function onComplete(pid) {
    setProjectId(pid);
    setPage('dashboard');
  }

  function goHome() {
    setPage('landing');
    setJobInfo(null);
    setProjectId(null);
  }

  if (page === 'landing') return <LandingPage onStart={startAnalysis} />;
  if (page === 'analyzing') return <AnalyzingPage jobInfo={jobInfo} onComplete={onComplete} onError={goHome} />;
  if (page === 'dashboard') return <DashboardPage projectId={projectId} onBack={goHome} />;
}
