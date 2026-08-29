import { parseJavaScript } from './javascriptParser.js';
import { parsePython } from './pythonParser.js';

export function parseFile(fileInfo, allFiles, aliases = []) {
  switch (fileInfo.language) {
    case 'javascript':
    case 'typescript':
      return parseJavaScript(fileInfo, allFiles, aliases);
    case 'python':
      return parsePython(fileInfo, allFiles);
    default:
      return { imports: [], exports: [], functions: [], classes: [], dependencies: [], externalDependencies: [] };
  }
}
