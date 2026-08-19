import { scanSourceFiles } from '../backend/src/analyzers/scanner.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sampleDir = path.join(__dirname, '../samples/demo-project');

describe('Source Scanner', () => {
  test('finds JavaScript source files', () => {
    const files = scanSourceFiles(sampleDir);
    const jsFiles = files.filter(f => f.language === 'javascript');
    expect(jsFiles.length).toBeGreaterThan(0);
  });
  
  test('collects file metadata', () => {
    const files = scanSourceFiles(sampleDir);
    const f = files[0];
    expect(f).toHaveProperty('path');
    expect(f).toHaveProperty('language');
    expect(f).toHaveProperty('lineCount');
    expect(f).toHaveProperty('size');
  });
});
