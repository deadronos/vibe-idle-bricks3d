import fs from 'fs/promises';
import path from 'path';

// Simple repository audit for CommonJS-style exports (module.exports / exports.*)
// Exits with code 0 when no issues found; non-zero if any occurrences are discovered

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'scripts']);
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
        for (const m of content.matchAll(p.re)) {
          const index = m.index;
          if (index === undefined) continue;

          // Skip if match is inside a single-line comment
          const lineStart = content.lastIndexOf('\n', index) + 1;
          const nextNewline = content.indexOf('\n', index);
          const lineEnd = nextNewline === -1 ? content.length : nextNewline;
          const line = content.substring(lineStart, lineEnd);
          const slashIdx = line.indexOf('//');
          if (slashIdx !== -1 && index - lineStart >= slashIdx) continue; // inside // comment

          // Skip if match is inside a block comment (/* ... */)
          const lastOpen = content.lastIndexOf('/*', index);
          const lastClose = content.lastIndexOf('*/', index);
          if (lastOpen !== -1 && lastOpen > lastClose) continue; // inside block comment

          // Skip if match is inside a template literal (backticks)
          const before = content.slice(0, index);
          const backticksBefore = (before.match(/`/g) || []).length;
          const after = content.slice(index);
          const backticksAfter = (after.match(/`/g) || []).length;
          if (backticksBefore % 2 === 1 && backticksAfter >= 1) continue;

          // If we reached here, consider it a real match (not in simple comments/templates)
          matches.push(p.name);
          break; // record pattern once per file
        }
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