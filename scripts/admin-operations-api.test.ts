import { test, expect, mock } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// Regression (production 23 Nov 2026): the admin operations client lost its "/api/admin/operations" prefix, so
// /admin/dashboard requested e.g. <production origin>/applications?page=1, which the backend's SPA fallback
// answered with index.html ("Unexpected token '<' ... is not valid JSON").
// This drives the REAL admin client modules against the REAL backend app (synthetic data, no network) and requires
// every admin request to reach an /api/admin route and return JSON.
const store = new Map<string, string>();
mock.module('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (k: string) => store.get(k) ?? null,
    setItem: async (k: string, v: string) => { store.set(k, v); },
    removeItem: async (k: string) => { store.delete(k); },
  },
}));
for (const key of ['DATABASE_URL', 'POSTGRES_URL', 'HOME_LOANS_DATABASE_URL', 'PERSONAL_LOANS_DATABASE_URL', 'BUSINESS_LOANS_DATABASE_URL',
  'VEHICLE_LOANS_DATABASE_URL', 'LIFE_INSURANCE_DATABASE_URL', 'PAYMENTS_ENABLED', 'REVIEW_ACCOUNT_ENABLED']) delete process.env[key];
process.env.LEADS_DB = process.env.TXN_DB = process.env.USER_DB = join(mkdtempSync(join(tmpdir(), 'admin-ops-client-')), 'db.sqlite');
process.env.AUTH_TOKEN_SECRET = 'test-customer-secret';
process.env.HOME_LOAN_ADMIN_TOKEN_SECRET = 'test-admin-secret';
process.env.HOME_LOAN_ADMIN_PASSWORD = 'synthetic-admin-password';
process.env.ADMIN_EMAIL = 'admin@example.test';

const app = (await import('../backend/src/index')).default;
const { API_BASE } = await import('../mobile/src/lib/api-base');
const requests: { method: string; path: string; status: number; type: string }[] = [];
globalThis.fetch = (async (input: any, init?: any) => {
  const url = String(input?.url ?? input);
  if (!url.startsWith(API_BASE)) throw new Error('Unexpected request outside the test API: ' + url);
  const path = url.slice(API_BASE.length);
  const res = await app.fetch(new Request('http://local.test' + path, init));
  requests.push({ method: init?.method ?? 'GET', path: path.split('?')[0]!, status: res.status, type: res.headers.get('content-type') ?? '' });
  return res;
}) as typeof fetch;
const { adminLogin } = await import('../mobile/src/lib/home-loan-admin-api');
const { operations, operationsSnapshot } = await import('../mobile/src/lib/admin-operations-api');

test('admin sign-in and the dashboard snapshot reach the real admin API and return JSON', async () => {
  const user = await adminLogin('admin@example.test', 'synthetic-admin-password');
  expect(user).toBeTruthy();
  let snapshot: Awaited<ReturnType<typeof operationsSnapshot>>;
  try { snapshot = await operationsSnapshot(); }   // what /admin/dashboard loads first
  catch (error) { throw new Error(`${(error as Error).message}; failing request: ${JSON.stringify(requests.at(-1))}`); }
  expect(Array.isArray(snapshot.leads)).toBe(true);
  expect(snapshot.currentAdmin.role).toBe('admin');
  expect(Array.isArray(snapshot.adminUsers)).toBe(true);
  expect(Array.isArray(snapshot.auditLogs)).toBe(true);
  for (const path of ['/finance', '/customers', '/transactions']) expect((await operations(path)).success).toBe(true);
  const paths = requests.map((r) => r.path);
  expect(paths).toContain('/api/admin/operations/applications');
  expect(paths).toContain('/api/admin/operations/session');
  expect(paths).toContain('/api/admin/operations/staff');
  expect(paths).toContain('/api/admin/operations/audit');
  for (const r of requests) {
    expect({ path: r.path, prefixed: r.path.startsWith('/api/admin/') }).toEqual({ path: r.path, prefixed: true });
    expect({ path: r.path, type: r.type }).toEqual({ path: r.path, type: expect.stringContaining('application/json') });
    expect({ path: r.path, html: r.type.includes('text/html') }).toEqual({ path: r.path, html: false });
  }
});
