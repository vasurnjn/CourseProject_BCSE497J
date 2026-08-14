import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import AdmZip from 'adm-zip';
import simpleGit from 'simple-git';
import { analyzeProject } from '../services/analysisService.js';

// Job store for progress tracking
const jobs = new Map();

export const analyzeController = {
  async analyzeGithub(req, res) {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'GitHub URL is required' });
    
    // Validate GitHub URL
    const githubRegex = /^https?:\/\/github\.com\/[\w.-]+\/[\w.-]+(\/.*)?$/;
    if (!githubRegex.test(url)) return res.status(400).json({ error: 'Invalid GitHub URL' });
    
    const projectId = uuidv4();
    const jobId = uuidv4();
    const tmpDir = path.join(process.cwd(), 'tmp', projectId);
    
    jobs.set(jobId, { status: 'running', stage: 'Preparing repository', progress: 0, projectId: null });
    
    // Start analysis asynchronously
    res.json({ jobId, projectId });
    
    try {
      await fse.ensureDir(tmpDir);
      
      jobs.set(jobId, { status: 'running', stage: 'Cloning repository', progress: 5, projectId: null });
      
      // Clean URL - remove .git suffix, trailing slashes
      const cleanUrl = url.replace(/\.git$/, '').replace(/\/$/, '');
      const repoName = cleanUrl.split('/').slice(-2).join('/');
      
      const git = simpleGit();
      await git.clone(cleanUrl, tmpDir, ['--depth', '1']);
      
      jobs.set(jobId, { status: 'running', stage: 'Analyzing project', progress: 15, projectId: null });
      
      await analyzeProject(projectId, tmpDir, repoName, (p) => {
        jobs.set(jobId, { status: 'running', ...p, projectId: null });
      });
      
      jobs.set(jobId, { status: 'complete', stage: 'Complete', progress: 100, projectId });
    } catch (err) {
      console.error('GitHub analysis error:', err);
      jobs.set(jobId, { status: 'error', error: err.message, progress: 0, projectId: null });
    } finally {
      // Cleanup
      try { await fse.remove(tmpDir); } catch {}
    }
  },
  
  async analyzeUpload(req, res) {
    if (!req.files?.project) return res.status(400).json({ error: 'No file uploaded' });
    
    const file = req.files.project;
    const isZip = file.name.endsWith('.zip') || file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed';
    if (!isZip) return res.status(400).json({ error: 'Only ZIP files are supported' });
    
    const projectId = uuidv4();
    const jobId = uuidv4();
    const tmpDir = path.join(process.cwd(), 'tmp', projectId);
    
    jobs.set(jobId, { status: 'running', stage: 'Extracting files', progress: 5, projectId: null });
    res.json({ jobId, projectId });
    
    try {
      await fse.ensureDir(tmpDir);
      
      // Safe ZIP extraction with path traversal protection
      const zip = new AdmZip(file.tempFilePath || file.data);
      const entries = zip.getEntries();
      
      for (const entry of entries) {
        const entryName = entry.entryName;
        // Path traversal protection
        if (entryName.includes('..') || path.isAbsolute(entryName)) continue;
        
        const targetPath = path.join(tmpDir, entryName);
        if (!targetPath.startsWith(tmpDir)) continue; // additional safety
        
        if (entry.isDirectory) {
          await fse.ensureDir(targetPath);
        } else {
          await fse.ensureDir(path.dirname(targetPath));
          fs.writeFileSync(targetPath, entry.getData());
        }
      }
      
      jobs.set(jobId, { status: 'running', stage: 'Scanning files', progress: 15, projectId: null });
      
      // Find the actual project root (handle zip with single root dir)
      let projectRoot = tmpDir;
      const topLevel = fs.readdirSync(tmpDir);
      if (topLevel.length === 1 && fs.statSync(path.join(tmpDir, topLevel[0])).isDirectory()) {
        projectRoot = path.join(tmpDir, topLevel[0]);
      }
      
      await analyzeProject(projectId, projectRoot, file.name.replace('.zip', ''), (p) => {
        jobs.set(jobId, { status: 'running', ...p, projectId: null });
      });
      
      jobs.set(jobId, { status: 'complete', stage: 'Complete', progress: 100, projectId });
    } catch (err) {
      console.error('Upload analysis error:', err);
      jobs.set(jobId, { status: 'error', error: err.message, projectId: null });
    } finally {
      try { await fse.remove(tmpDir); } catch {}
    }
  },
  
  getStatus(req, res) {
    const job = jobs.get(req.params.jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  }
};
