import { test, expect } from 'bun:test';
// @ts-ignore - plain ESM helper
import { findViolations } from './check-api-isolation.mjs';
import { resolveApiBase, PRODUCTION_API_ORIGIN } from '../mobile/src/lib/api-base';

test('no API client, WebView or fallback reaches production outside lib/api-base', () => {
  expect(findViolations()).toEqual([]);
});

test('a test build refuses to resolve to production (empty, explicit or subdomain)', () => {
  for (const value of ['', PRODUCTION_API_ORIGIN, 'https://paisa-mart.com/', 'https://api.paisa-mart.com']) {
    expect(() => resolveApiBase(value, true)).toThrow();
  }
  expect(resolveApiBase('http://127.0.0.1:3901/', true)).toBe('http://127.0.0.1:3901');
  // Production builds keep the production default.
  expect(resolveApiBase('', false)).toBe(PRODUCTION_API_ORIGIN);
});

test('automated tests cannot reach external hosts by default', async () => {
  await expect(fetch('https://paisa-mart.com/api/users/profiles')).rejects.toThrow(/Test network guard/);
  await expect(fetch('https://example.com/')).rejects.toThrow(/Test network guard/);
  expect(process.env.EXPO_PUBLIC_API_URL).not.toMatch(/paisa-mart\.com/);
});
