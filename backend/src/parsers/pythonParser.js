export function parsePython(fileInfo, allFiles) {
  const { content, path: filePath } = fileInfo;
  const result = { imports: [], exports: [], functions: [], classes: [], dependencies: [], externalDependencies: [] };
  if (!content) return result;
  
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // import module
    const importMatch = line.match(/^import\s+([\w.,\s]+)/);
    if (importMatch) {
      const modules = importMatch[1].split(',').map(m => m.trim().split(' ')[0]);
      for (const mod of modules) {
        result.imports.push({ source: mod, specifiers: [] });
        if (!mod.startsWith('.')) result.externalDependencies.push(mod.split('.')[0]);
      }
    }
    
    // from module import ...
    const fromMatch = line.match(/^from\s+([\w.]+)\s+import/);
    if (fromMatch) {
      const mod = fromMatch[1];
      result.imports.push({ source: mod, specifiers: [] });
      if (!mod.startsWith('.')) result.externalDependencies.push(mod.split('.')[0]);
    }
    
    // def function
    const funcMatch = line.match(/^def\s+(\w+)\s*\(/);
    if (funcMatch) result.functions.push({ name: funcMatch[1], file: filePath, line: i + 1 });
    
    // class
    const classMatch = line.match(/^class\s+(\w+)[:(]/);
    if (classMatch) result.classes.push({ name: classMatch[1], file: filePath, line: i + 1 });
  }
  
  result.externalDependencies = [...new Set(result.externalDependencies)];
  return result;
}
