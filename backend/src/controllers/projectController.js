import { getProject, listProjects, getImpactAnalysis } from '../services/analysisService.js';

export const projectController = {
  listProjects(req, res) {
    res.json(listProjects());
  },
  
  getProject(req, res) {
    const project = getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ id: project.id, name: project.name, createdAt: project.createdAt, metrics: project.metrics });
  },
  
  getGraph(req, res) {
    const project = getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project.graph);
  },
  
  getStatistics(req, res) {
    const project = getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ metrics: project.metrics, files: project.files.length });
  },
  
  getCycles(req, res) {
    const project = getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ cycles: project.cycles });
  },
  
  getUnusedDependencies(req, res) {
    const project = getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project.unusedDependencies);
  },
  
  getNode(req, res) {
    const project = getProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const nodeId = decodeURIComponent(req.params.nodeId);
    const node = project.graph.nodes.find(n => n.id === nodeId);
    if (!node) return res.status(404).json({ error: 'Node not found' });
    
    const deps = project.graph.edges.filter(e => e.source === nodeId).map(e => e.target);
    const dependents = project.graph.edges.filter(e => e.target === nodeId).map(e => e.source);
    
    res.json({ ...node, dependencies: deps, dependents });
  },
  
  getImpact(req, res) {
    const projectId = req.params.id;
    const nodeId = decodeURIComponent(req.params.nodeId);
    try {
      const impact = getImpactAnalysis(projectId, nodeId);
      res.json(impact);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }
};
