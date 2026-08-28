import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
const traverse = _traverse.default || _traverse;
import path from 'path';

export function parseJavaScript(fileInfo, allFiles, aliases = []) {
  const { content, path: filePath, language } = fileInfo;
  
  const result = {
    imports: [],
    exports: [],
    functions: [],
    classes: [],
    dependencies: [],
    externalDependencies: []
  };
  
  if (!content || content.trim() === '') return result;
  
  let ast;
  try {
    ast = parse(content, {
      sourceType: 'module',
      errorRecovery: true,
      plugins: [
        'jsx',
        language === 'typescript' ? 'typescript' : 'flow',
        'decorators-legacy',
        'classProperties',
        'optionalChaining',
        'nullishCoalescingOperator',
        'dynamicImport'
      ].filter(Boolean)
    });
  } catch (err) {
    // try commonjs fallback
    try {
      ast = parse(content, { sourceType: 'script', errorRecovery: true, plugins: ['jsx'] });
    } catch {
      return result;
    }
  }
  
  const fileDir = path.dirname(filePath);
  
  traverse(ast, {
    // ES Modules: import
    ImportDeclaration(nodePath) {
      const source = nodePath.node.source.value;
      const specifiers = nodePath.node.specifiers.map(s => ({
        type: s.type,
        local: s.local?.name,
        imported: s.imported?.name || s.local?.name
      }));
      result.imports.push({ source, specifiers });
      
      const resolved = resolveImport(source, fileDir, allFiles, aliases);
      if (resolved) {
        result.dependencies.push({ source: filePath, target: resolved, type: 'IMPORTS', importSource: source });
      } else if (!source.startsWith('.') && !aliases.some(a => source.startsWith(a.prefix))) {
        // external package
        const pkgName = source.startsWith('@') ? source.split('/').slice(0, 2).join('/') : source.split('/')[0];
        result.externalDependencies.push(pkgName);
      }
    },
    
    // CommonJS: require()
    CallExpression(nodePath) {
      const callee = nodePath.node.callee;
      if (callee.name === 'require' && nodePath.node.arguments.length > 0) {
        const arg = nodePath.node.arguments[0];
        if (arg.type === 'StringLiteral') {
          const source = arg.value;
          result.imports.push({ source, specifiers: [], type: 'require' });
          const resolved = resolveImport(source, fileDir, allFiles, aliases);
          if (resolved) {
            result.dependencies.push({ source: filePath, target: resolved, type: 'IMPORTS', importSource: source });
          } else if (!source.startsWith('.') && !aliases.some(a => source.startsWith(a.prefix))) {
            const pkgName = source.startsWith('@') ? source.split('/').slice(0, 2).join('/') : source.split('/')[0];
            result.externalDependencies.push(pkgName);
          }
        }
      }
    },
    
    // Function declarations
    FunctionDeclaration(nodePath) {
      if (nodePath.node.id?.name) {
        result.functions.push({
          name: nodePath.node.id.name,
          file: filePath,
          line: nodePath.node.loc?.start?.line,
          async: nodePath.node.async,
          params: nodePath.node.params?.length || 0
        });
      }
    },
    
    // Arrow functions / function expressions assigned to variables
    VariableDeclarator(nodePath) {
      const init = nodePath.node.init;
      if (init && (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression')) {
        const name = nodePath.node.id?.name;
        if (name) {
          result.functions.push({
            name,
            file: filePath,
            line: nodePath.node.loc?.start?.line,
            async: init.async,
            params: init.params?.length || 0
          });
        }
      }
    },
    
    // Class declarations
    ClassDeclaration(nodePath) {
      const className = nodePath.node.id?.name;
      if (className) {
        const superClass = nodePath.node.superClass?.name;
        const methods = [];
        for (const member of nodePath.node.body?.body || []) {
          if (member.type === 'ClassMethod' && member.key?.name) {
            methods.push({ name: member.key.name, kind: member.kind, static: member.static });
          }
        }
        result.classes.push({ name: className, file: filePath, superClass, methods, line: nodePath.node.loc?.start?.line });
        
        if (superClass) {
          // Record inheritance — will be resolved later
          result.dependencies.push({ source: filePath, target: superClass, type: 'EXTENDS', isClassName: true });
        }
      }
    },
    
    // Export declarations
    ExportNamedDeclaration(nodePath) {
      const decl = nodePath.node.declaration;
      if (decl?.id?.name) result.exports.push(decl.id.name);
      for (const spec of nodePath.node.specifiers || []) {
        if (spec.exported?.name) result.exports.push(spec.exported.name);
      }
    },
    ExportDefaultDeclaration(nodePath) {
      const decl = nodePath.node.declaration;
      if (decl?.id?.name) result.exports.push(decl.id.name);
      else result.exports.push('default');
    }
  });
  
  // Deduplicate external deps
  result.externalDependencies = [...new Set(result.externalDependencies)];
  
  return result;
}

function resolveImport(importPath, fromDir, allFiles, aliases = []) {
  const filePaths = allFiles.map(f => f.path);
  const extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
  
  let resolved;
  
  if (importPath.startsWith('.')) {
    // Relative import
    resolved = path.normalize(path.join(fromDir, importPath)).replace(/\\/g, '/');
  } else {
    // Try aliases
    for (const alias of aliases) {
      if (importPath.startsWith(alias.prefix)) {
        // Alias targets are relative to rootDir. allFiles paths are also relative to rootDir.
        resolved = importPath.replace(alias.prefix, alias.target);
        break;
      }
    }
  }
  
  if (!resolved) return null;
  
  // Exact match
  if (filePaths.includes(resolved)) return resolved;
  
  // Try with extensions
  for (const ext of extensions) {
    const candidate = resolved + ext;
    if (filePaths.includes(candidate)) return candidate;
  }
  
  // Try index files
  for (const ext of extensions) {
    const candidate = resolved + '/index' + ext;
    if (filePaths.includes(candidate)) return candidate;
  }
  
  return null;
}
