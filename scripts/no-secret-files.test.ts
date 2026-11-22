import { test, expect } from 'bun:test';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
// A-05 regression: credential-type files must never be tracked again. The full redacted content scan is
// `python scripts/secret-scan.py` (exit 1 on any finding); this guard runs with the normal test suite.
const root = join(import.meta.dir, '..');
const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).split('\n').filter(Boolean);

test('no env files, archives with app sources, local databases or private keys are tracked', () => {
  const forbidden = tracked.filter(p =>
    /(^|\/)\.env(\.|$)/.test(p) && !p.endsWith('.env.example') ||
    /paisa-mart-mvp\.zip$/.test(p) ||
    /^backend\/[^/]+\.(db|sqlite)$/.test(p) ||
    /\.(jks|p12|pfx|pem|key)$/.test(p) ||
    /(^|\/)keystore\.properties$/.test(p) ||
    (/\.keystore$/.test(p) && p !== 'android/app/debug.keystore'));
  expect(forbidden).toEqual([]);
});

test('example env files hold names only (no values for secret variables)', () => {
  for (const file of tracked.filter(p => p.endsWith('.env.example'))) {
    const text = execFileSync('git', ['show', `:${file}`], { cwd: root, encoding: 'utf8' });
    for (const line of text.split('\n')) {
      const m = line.match(/^([A-Z0-9_]*(SECRET|TOKEN|PASSWORD|API_KEY|AUTH_KEY|SERVER_KEY|SALT_KEY|ED_KEY|HMAC_KEY|CODE_HASH)[A-Z0-9_]*)=(.*)$/);
      if (m) expect({ file, name: m[1], value: m[3].trim() }).toEqual({ file, name: m[1], value: '' });
    }
  }
});

test('the backend no longer serves the source archive at /download', () => {
  const index = execFileSync('git', ['show', ':backend/src/index.ts'], { cwd: root, encoding: 'utf8' });
  expect(index).not.toContain('paisa-mart-mvp.zip"');
  expect(index).not.toMatch(/app\.get\(\s*["']\/download["']/);
});
