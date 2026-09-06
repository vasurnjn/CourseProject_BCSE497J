import axios from 'axios';

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');
  
const api = axios.create({ baseURL: API_BASE, timeout: 60000 });

export const analyzeGithub = (url) => api.post('/analyze/github', { url });
export const analyzeUpload = (file) => {
  const form = new FormData();
  form.append('project', file);
  return api.post('/analyze/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
};
export const getJobStatus = (jobId) => api.get(`/analyze/status/${jobId}`);
export const getProject = (id) => api.get(`/projects/${id}`);
export const getGraph = (id) => api.get(`/projects/${id}/graph`);
export const getStatistics = (id) => api.get(`/projects/${id}/statistics`);
export const getCycles = (id) => api.get(`/projects/${id}/cycles`);
export const getUnusedDependencies = (id) => api.get(`/projects/${id}/unused-dependencies`);
export const getNode = (projectId, nodeId) => api.get(`/projects/${projectId}/node/${encodeURIComponent(nodeId)}`);
export const getImpact = (projectId, nodeId) => api.get(`/projects/${projectId}/impact/${encodeURIComponent(nodeId)}`);
