import { scanSourceFiles } from '../analyzers/scanner.js';
import { parseFile } from '../parsers/index.js';
import { DependencyGraph } from '../graph/dependencyGraph.js';
import { detectCycles } from '../algorithms/cycleDetection.js';
import { analyzeUnusedDependencies } from '../algorithms/unusedDependencies.js';
import { computeImpact } from '../algorithms/impactAnalysis.js';
import path from 'path';
import fs from 'fs';

// In-memory project store (in production would use a database)
const projects = new Map();

export function getProject(id) { return projects.get(id); }
export function listProjects() { return [...projects.values()].map(p => ({ id: p.id, name: p.name, createdAt: p.createdAt })); }

export async function analyzeProject(projectId, rootDir, projectName, onProgress) {
  const report = progress => onProgress?.(progress);
  
  report({ stage: 'Scanning files', progress: 5 });
  const files = scanSourceFiles(rootDir);
  
  if (files.length === 0) {
    throw new Error('No supported source files found in the project.');
  }
  
  report({ stage: 'Parsing source code', progress: 20 });
  const parsedFiles = [];
  for (let i = 0; i < files.length; i++) {
    const fileInfo = files[i];
    const parsed = parseFile(fileInfo, files);
    parsedFiles.push({ ...fileInfo, ...parsed });
    if (i % 10 === 0) report({ stage: 'Parsing source code', progress: 20 + Math.floor((i / files.length) * 30) });
  }
  
  report({ stage: 'Building dependency graph', progress: 55 });
  const graph = new DependencyGraph();
  
  // Add all files as nodes
  for (const file of parsedFiles) {
    graph.addNode(file.path, {
      label: path.basename(file.path),
      type: 'file',
      language: file.language,
      path: file.path,
      lineCount: file.lineCount,
      size: file.size,
      functions: file.functions || [],
      classes: file.classes || [],
      exports: file.exports || []
    });
  }
  
  // Add edges from dependencies
  const allEdges = [];
  for (const file of parsedFiles) {
    for (const dep of (file.dependencies || [])) {
      if (dep.type !== 'EXTENDS' || !dep.isClassName) {
        graph.addEdge(dep.source, dep.target, dep.type, { importSource: dep.importSource });
        allEdges.push(dep);
      }
    }
  }
  
  // Add external package nodes
  const externalPackages = new Map();
  for (const file of parsedFiles) {
    for (const pkg of (file.externalDependencies || [])) {
      if (!externalPackages.has(pkg)) {
        externalPackages.set(pkg, { usedBy: [] });
        graph.addNode(`external:${pkg}`, { label: pkg, type: 'external', path: `external:${pkg}` });
      }
      externalPackages.get(pkg).usedBy.push(file.path);
      graph.addEdge(file.path, `external:${pkg}`, 'DEPENDS_ON');
    }
  }
  
  report({ stage: 'Detecting circular dependencies', progress: 65 });
  const graphJSON = graph.toJSON();
  const cycles = detectCycles(graphJSON);
  
  report({ stage: 'Analyzing unused dependencies', progress: 75 });
  const unusedDeps = analyzeUnusedDependencies(rootDir, parsedFiles);
  
  report({ stage: 'Calculating metrics', progress: 85 });
  const metrics = calculateMetrics(parsedFiles, graphJSON, cycles, unusedDeps);
  
  report({ stage: 'Finalizing analysis', progress: 95 });
  
  const project = {
    id: projectId,
    name: projectName,
    rootDir,
    createdAt: new Date().toISOString(),
    files: parsedFiles.map(f => ({
      path: f.path,
      language: f.language,
      lineCount: f.lineCount,
      size: f.size,
      functions: f.functions,
      classes: f.classes,
      imports: f.imports,
      exports: f.exports
    })),
    graph: graphJSON,
    cycles,
    unusedDependencies: unusedDeps,
    metrics
  };
  
  projects.set(projectId, project);
  report({ stage: 'Complete', progress: 100 });
  return project;
}

export function getImpactAnalysis(projectId, nodeId) {
  const project = projects.get(projectId);
  if (!project) throw new Error('Project not found');
  return computeImpact(project.graph, nodeId);
}

function calculateMetrics(parsedFiles, graph, cycles, unusedDeps) {
  const languages = {};
  let totalLines = 0;
  let totalFunctions = 0;
  let totalClasses = 0;
  
  for (const f of parsedFiles) {
    languages[f.language] = (languages[f.language] || 0) + 1;
    totalLines += f.lineCount || 0;
    totalFunctions += (f.functions || []).length;
    totalClasses += (f.classes || []).length;
  }
  
  const internalEdges = graph.edges.filter(e => e.type === 'IMPORTS' || e.type === 'DEPENDS_ON' && !e.target?.startsWith('external:'));
  const externalEdges = graph.edges.filter(e => e.target?.startsWith('external:'));
  const externalNodes = graph.nodes.filter(n => n.type === 'external');
  
  const nodeDegrees = graph.nodes.map(n => ({ id: n.id, inDegree: n.inDegree, outDegree: n.outDegree, degree: n.inDegree + n.outDegree }));
  const highlyConnected = nodeDegrees.sort((a, b) => b.degree - a.degree).slice(0, 10);
  
  return {
    totalFiles: parsedFiles.length,
    totalClasses,
    totalFunctions,
    totalDependencies: graph.edges.length,
    internalDependencies: internalEdges.length,
    externalDependencies: externalNodes.length,
    circularDependencies: cycles.length,
    unusedDependencies: (unusedDeps.unused || []).length,
    totalLines,
    languages,
    highlyConnected
  };
}
