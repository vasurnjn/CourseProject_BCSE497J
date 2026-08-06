import fs from 'fs';
import path from 'path';

const SUPPORTED_EXTENSIONS = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.py': 'python',
  '.java': 'java'
};

const IGNORED_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'coverage',
  'target', '__pycache__', '.venv', 'vendor', '.next',
  'out', '.nuxt', 'public', 'static'
]);

export function scanSourceFiles(rootDir) {
  const files = [];
  
  function walk(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
    catch { return; }
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
          walk(path.join(dir, entry.name));
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        const lang = SUPPORTED_EXTENSIONS[ext];
        if (lang) {
          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
          let content = '', lineCount = 0, size = 0;
          try {
            const stat = fs.statSync(fullPath);
            size = stat.size;
            if (size < 5 * 1024 * 1024) { // skip files > 5MB
              content = fs.readFileSync(fullPath, 'utf-8');
              lineCount = content.split('\n').length;
            }
          } catch {}
          files.push({ path: relativePath, fullPath, extension: ext, language: lang, size, lineCount, content });
        }
      }
    }
  }
  
  walk(rootDir);
  return files;
}
