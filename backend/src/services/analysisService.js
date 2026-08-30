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

function loadAliases(rootDir) {
  const aliases = [];
  try {
    for (const file of ['tsconfig.json', 'jsconfig.json']) {
      const configPath = path.join(rootDir, file);
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, 'utf8');
        const clean = raw.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
        const config = JSON.parse(clean);
        const paths = config?.compilerOptions?.paths;
        let baseUrl = config?.compilerOptions?.baseUrl || '.';
        
        if (paths) {
          for (const [key, values] of Object.entries(paths)) {
            if (values.length > 0) {
              let prefix = key.replace('/*', '/');
              if (prefix === '*') prefix = '';
              
              let target = path.join(baseUrl, values[0].replace('/*', '/')).replace(/\\/g, '/');
              if (target === '.' || target === './') target = '';
              else if (target.startsWith('./')) target = target.slice(2);
              if (target && !target.endsWith('/')) target += '/';
              
              aliases.push({ prefix, target });
            }
          }
        }
        break;
      }
    }
  } catch (err) {}
  
  // Common defaults
  if (aliases.length === 0) {
    aliases.push({ prefix: '~/', target: 'src/' });
    aliases.push({ prefix: '@/', target: 'src/' });
  }
  
  aliases.sort((a, b) => b.prefix.length - a.prefix.length);
  return aliases;
}

export async function analyzeProject(projectId, rootDir, projectName, onProgress) {
  const report = progress => onProgress?.(progress);
  
  report({ stage: 'Scanning files', progress: 5 });
  const files = scanSourceFiles(rootDir);
  
  if (files.length === 0) {
    throw new Error('No supported source files found in the project.');
  }
  
  const aliases = loadAliases(rootDir);

  report({ stage: 'Parsing source code', progress: 20 });
  const parsedFiles = [];
  for (let i = 0; i < files.length; i++) {
    const fileInfo = files[i];
    const parsed = parseFile(fileInfo, files, aliases);
    parsedFiles.push({ ...fileInfo, ...parsed });
    if (i % 10 === 0) report({ stage: 'Parsing source code', progress: 20 + Math.floor((i / files.length) * 30) });
    
    // Yield to the event loop every 50 files to prevent blocking
    if (i % 50 === 0) {
      await new Promise(resolve => setImmediate(resolve));
    }
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

function calculateInsights(parsedFiles, graph, cycles, unusedDeps) {
  let score = 100;
  const strengths = [];
  const weaknesses = [];
  const refactoringCandidates = [];
  
  const nodes = graph.nodes.filter(n => n.type !== 'external');
  let highFanOutCount = 0;
  const isolatedModules = [];
  let totalFanOut = 0;
  
  let maxDegree = 0;
  let mostCriticalNode = null;

  nodes.forEach(n => {
    const fanIn = n.inDegree || 0;
    const fanOut = n.outDegree || 0;
    const degree = fanIn + fanOut;
    
    totalFanOut += fanOut;
    
    if (degree > maxDegree) {
      maxDegree = degree;
      mostCriticalNode = n;
    }

    if (fanOut > 10) highFanOutCount++;
    // Exclude entry points (files with fanIn 0 but fanOut > 0)
    // Isolated means fanIn 0 and fanOut 0.
    if (fanIn === 0 && fanOut === 0) {
      isolatedModules.push({ id: n.id, label: n.label || n.id });
    }

    if (fanOut > 12 && fanIn > 3) {
      refactoringCandidates.push({
        id: n.id,
        label: n.label || n.id,
        reason: `God Module: High coupling (Fan-Out: ${fanOut}) while being heavily depended upon (Fan-In: ${fanIn}). High risk on modification.`
      });
    } else if (fanOut > 15) {
      refactoringCandidates.push({
        id: n.id,
        label: n.label || n.id,
        reason: `High Coupling (Fan-Out: ${fanOut}): Depends on too many files. Likely violates Single Responsibility Principle.`
      });
    } else if (fanIn > 20) {
      refactoringCandidates.push({
        id: n.id,
        label: n.label || n.id,
        reason: `Bottleneck (Fan-In: ${fanIn}): Extremely high incoming dependencies. Any change here impacts a massive part of the system.`
      });
    }
  });

  const avgFanOut = nodes.length ? (totalFanOut / nodes.length).toFixed(1) : 0;

  // Penalties
  const cyclePenalty = Math.min(30, cycles.length * 10);
  score -= cyclePenalty;
  if (cycles.length > 0) {
    weaknesses.push(`Circular Dependencies: ${cycles.length} cycle(s) detected (-${cyclePenalty} pts). Critical maintainability risk.`);
  } else {
    strengths.push("Zero Circular Dependencies. Excellent directional architecture.");
  }

  const couplingPenalty = Math.min(20, highFanOutCount * 2);
  score -= couplingPenalty;
  if (highFanOutCount > 0) {
    weaknesses.push(`High Coupling: ${highFanOutCount} modules have excessive dependencies (Fan-Out > 10) (-${couplingPenalty} pts).`);
  } else if (avgFanOut < 5) {
    strengths.push(`Low Coupling: Average module Fan-Out is ${avgFanOut}. Well-defined responsibilities.`);
  }

  const unusedCount = (unusedDeps.unused || []).length;
  const unusedPenalty = Math.min(10, unusedCount * 1);
  score -= unusedPenalty;
  if (unusedCount > 0) {
    weaknesses.push(`Tech Debt: ${unusedCount} Unused Dependencies detected (-${unusedPenalty} pts).`);
  } else {
    strengths.push("Clean Dependency Tree: No unused internal or external dependencies found.");
  }

  const isolatedCount = isolatedModules.length;
  const isolatedPenalty = Math.min(10, isolatedCount * 2);
  score -= isolatedPenalty;
  if (isolatedCount > 0) {
    weaknesses.push(`Dead Code: ${isolatedCount} isolated modules detected with no incoming or outgoing connections (-${isolatedPenalty} pts).`);
  }

  if (score < 0) score = 0;
  
  const mostCritical = mostCriticalNode ? {
    id: mostCriticalNode.id,
    label: mostCriticalNode.label || mostCriticalNode.id,
    fanIn: mostCriticalNode.inDegree || 0,
    fanOut: mostCriticalNode.outDegree || 0,
    degree: maxDegree,
    reason: `Highest structural degree in the dependency graph.`
  } : null;

  return { score, strengths, weaknesses, refactoringCandidates, mostCritical, isolatedModules };
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
  
  const insights = calculateInsights(parsedFiles, graph, cycles, unusedDeps);
  
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
    highlyConnected,
    insights
  };
}
