import fs from 'fs/promises';
import path from 'path';

// Simple repository audit for CommonJS-style exports (module.exports / exports.*)
// Exits with code 0 when no issues found; non-zero if any occurrences are discovered

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git']);
const FILE_EXTENSIONS = new Set(['.js', '.cjs', '.mjs', '.ts', '.tsx', '.jsx']);

const patterns = [
  { name: 'module.exports', re: /\bmodule\s*\.\s*exports\b/ },
  { name: 'exports.*', re: /\bexports\s*\.\s*\w+/ },
  { name: "require(...)", re: /\brequire\s*\(/ },
];

async function walk(dir) {
  const results = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      results.push(...(await walk(full)));
    } else if (e.isFile()) {
      const ext = path.extname(e.name).toLowerCase();
      if (!FILE_EXTENSIONS.has(ext)) continue;
      const content = await fs.readFile(full, 'utf8');
      const matches = [];
      for (const p of patterns) {
        if (p.re.test(content)) matches.push(p.name);
      }
      if (matches.length > 0) {
        results.push({ file: path.relative(ROOT, full), matches });
      }
    }
  }
  return results;
}

(async function main() {
  try {
    const findings = await walk(ROOT);
    if (findings.length === 0) {
      console.log('No CommonJS-style exports or require() usages found in source files (excluding node_modules/dist).');
      process.exitCode = 0;
      return;
    }

    console.error('CommonJS-style usage detected:');
    for (const f of findings) {
      console.error(` - ${f.file}: ${f.matches.join(', ')}`);
    }

    console.error('\nGuidance: prefer ESM exports (export default / export const).');
    console.error('If CommonJS is required for a Node-only tool, document it in an allow-list and keep it outside src/ or in a clearly marked scripts/ folder.');
    process.exitCode = 2;
  } catch (err) {
    console.error('Error while scanning for CommonJS usage:', err);
    process.exitCode = 3;
  }
})();