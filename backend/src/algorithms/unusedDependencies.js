import fs from 'fs';
import path from 'path';

export function analyzeUnusedDependencies(rootDir, parsedFiles) {
  // Collect all used external packages
  const usedPackages = new Set();
  for (const file of parsedFiles) {
    for (const pkg of (file.externalDependencies || [])) {
      usedPackages.add(pkg);
    }
  }
  
  // Check package.json
  const packageJsonPath = path.join(rootDir, 'package.json');
  let declared = {};
  try {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    declared = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  } catch {
    return { used: [...usedPackages], unused: [], unknown: [...usedPackages], hasPackageJson: false };
  }
  
  const used = [];
  const unused = [];
  const unknown = [];
  
  for (const pkg of Object.keys(declared)) {
    // Normalize: @scope/package -> @scope/package, package -> package
    if (usedPackages.has(pkg)) {
      used.push(pkg);
    } else {
      // Some packages are used differently (e.g. types, peer deps, scripts)
      // Mark as unknown if it's a dev dep type package
      if (pkg.startsWith('@types/') || pkg.includes('eslint') || pkg.includes('prettier') || pkg.includes('babel') || pkg.includes('webpack') || pkg.includes('vite') || pkg.includes('jest') || pkg.includes('mocha')) {
        unknown.push(pkg);
      } else {
        unused.push(pkg);
      }
    }
  }
  
  // Also note packages used but not in package.json
  for (const pkg of usedPackages) {
    if (!declared[pkg]) unknown.push(pkg);
  }
  
  return { used, unused, unknown: [...new Set(unknown)], hasPackageJson: true };
}
