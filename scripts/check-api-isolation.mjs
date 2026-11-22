#!/usr/bin/env node
// Regression check: no production fallback outside mobile/src/lib/api-base.ts.
// Run: node scripts/check-api-isolation.mjs   (exit 1 on any violation)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
// The base-URL module itself, and the isolation test, which uses production literals to prove they are blocked.
const ALLOWED = new Set([join('mobile', 'src', 'lib', 'api-base.ts'), join('scripts', 'api-isolation.test.ts')]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(name)) out.push(path);
  }
  return out;
}

const rules = [
  { id: 'production-host', re: /paisa-mart\.com/i, why: 'production host literal (use API_BASE from lib/api-base)' },
  { id: 'base-url-env', re: /process\.env\.EXPO_PUBLIC_(API_URL|BACKEND_URL|VIBECODE_BACKEND_URL)\b/, why: 'base URL env read outside lib/api-base' },
  { id: 'absolute-fetch', re: /fetch\(\s*['"`]https?:\/\/(?!127\.0\.0\.1|localhost)/, why: 'fetch to a hard-coded absolute URL' },
  { id: 'webview-url', re: /source=\{\{\s*uri:\s*['"`]https?:\/\//, why: 'WebView with a hard-coded URL' },
];

export function findViolations() {
  const violations = [];
  const files = [...walk(join(root, 'mobile', 'src')), ...walk(join(root, 'scripts')).filter(f => /\.test\.ts$/.test(f))];
  for (const file of files) {
    const rel = relative(root, file);
    if (ALLOWED.has(rel)) continue;
    const lines = readFileSync(file, 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      for (const rule of rules) {
        if (rule.re.test(line) && !(rule.id === 'production-host' && /@[\w.-]*paisa-mart\.com|mailto:/i.test(line))) {
          violations.push(`${rel.split(sep).join('/')}:${i + 1} ${rule.id}: ${rule.why}`);
        }
      }
    });
  }
  return violations;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const violations = findViolations();
  if (violations.length) {
    console.error('API isolation check FAILED:\n' + violations.join('\n'));
    process.exit(1);
  }
  console.log('API isolation check passed: all clients resolve their backend through mobile/src/lib/api-base.ts');
}
