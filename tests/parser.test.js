import { parseJavaScript } from '../backend/src/parsers/javascriptParser.js';

const mockFiles = [
  { path: 'src/auth.js' },
  { path: 'src/utils.js' },
  { path: 'src/database.js' },
];

describe('JavaScript Parser', () => {
  test('extracts ES module imports', () => {
    const content = `import { foo } from './utils.js';\nimport bar from './database.js';`;
    const result = parseJavaScript({ content, path: 'src/auth.js', language: 'javascript' }, mockFiles);
    expect(result.imports).toHaveLength(2);
    expect(result.imports[0].source).toBe('./utils.js');
  });

  test('extracts function declarations', () => {
    const content = `function login(user) { return user; }\nconst logout = () => {};`;
    const result = parseJavaScript({ content, path: 'src/auth.js', language: 'javascript' }, mockFiles);
    expect(result.functions.some(f => f.name === 'login')).toBe(true);
    expect(result.functions.some(f => f.name === 'logout')).toBe(true);
  });

  test('extracts class declarations', () => {
    const content = `class AuthService extends BaseService { constructor() {} }`;
    const result = parseJavaScript({ content, path: 'src/auth.js', language: 'javascript' }, mockFiles);
    expect(result.classes).toHaveLength(1);
    expect(result.classes[0].name).toBe('AuthService');
    expect(result.classes[0].superClass).toBe('BaseService');
  });

  test('identifies external dependencies', () => {
    const content = `import express from 'express';\nimport _ from 'lodash';`;
    const result = parseJavaScript({ content, path: 'src/app.js', language: 'javascript' }, mockFiles);
    expect(result.externalDependencies).toContain('express');
    expect(result.externalDependencies).toContain('lodash');
  });

  test('resolves local relative imports', () => {
    const content = `import { auth } from './auth.js';`;
    const result = parseJavaScript({ content, path: 'src/app.js', language: 'javascript' }, mockFiles);
    const dep = result.dependencies.find(d => d.target === 'src/auth.js');
    expect(dep).toBeTruthy();
  });
});
