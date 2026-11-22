import { test, expect } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// Payments are paused server-side by default: every payment route is refused before any VimoPay call.
// (The test network guard would also block any outbound call; a refusal here is a 503, never a 5xx from a failed fetch.)
delete process.env.PAYMENTS_ENABLED;
for (const key of ['DATABASE_URL', 'POSTGRES_URL']) delete process.env[key];
process.env.LEADS_DB = process.env.TXN_DB = process.env.USER_DB = join(mkdtempSync(join(tmpdir(), 'payments-paused-')), 'db.sqlite');
process.env.AUTH_TOKEN_SECRET = 'test-customer-secret';
process.env.HOME_LOAN_ADMIN_TOKEN_SECRET = 'test-admin-secret';
const app = (await import('../index')).default;
const { getTxn } = await import('../lib/txn-store');
const call = (path: string, method = 'GET', body?: unknown) => app.fetch(new Request('http://local.test' + path, {
  method, headers: { 'Content-Type': 'application/json' }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) }));

test('paused by default: every payment route answers 503 and nothing reaches the gateway', async () => {
  const outbound: string[] = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (input: any, init?: any) => { outbound.push(String(input?.url ?? input)); return realFetch(input, init); }) as typeof fetch;
  try {
    for (const [path, method, body] of [['/api/payment/create', 'POST', { amount: 10, custMobile: '9100000001' }], ['/api/payment/auth', 'GET'],
      ['/api/payment/config', 'GET'], ['/api/payment/states', 'GET'], ['/api/payment/checkout', 'GET'], ['/api/payment/status/PM-1', 'GET']] as const) {
      const res = await call(path, method, body);
      expect(res.status).toBe(503);
      expect(await res.json()).toMatchObject({ success: false, paymentsPaused: true, error: 'Payments are currently unavailable.' });
    }
  } finally { globalThis.fetch = realFetch; }
  expect(outbound).toEqual([]);
});

test('paused: gateway callbacks are still acknowledged but never applied (A-03)', async () => {
  const res = await call('/api/payment/vimopay-callback', 'POST', { merchantRefId: 'PM-X', txnStatusCode: '000', amount: '99999' });
  expect(res.status).toBe(200);
  expect(getTxn('PM-X')).toBeNull();
});

const VALID = { VIMOPAY_SECRET_KEY: 'synthetic-test-key-0123456789abc', VIMOPAY_SALT_KEY: 'synthetic-salt', VIMOPAY_ED_KEY: 'synthetic-ed', VIMOPAY_USER_ID: 'synthetic-user' };
const KEYS = [...Object.keys(VALID), 'VIMOPAY_BASE_URL', 'PAYMENTS_ENABLED'];
const withEnv = async (env: Record<string, string | undefined>, fn: () => Promise<void>) => {
  const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  for (const k of KEYS) delete process.env[k];
  for (const [k, v] of Object.entries(env)) if (v !== undefined) process.env[k] = v;
  try { await fn(); } finally { for (const k of KEYS) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]!; } }
};

test('only an explicit PAYMENTS_ENABLED=true re-opens the routes (with a complete configuration)', async () => {
  for (const value of ['1', 'yes', 'TRUE', '', ' true', undefined]) {
    await withEnv({ ...VALID, PAYMENTS_ENABLED: value }, async () => { expect((await call('/api/payment/checkout')).status).toBe(503); });
  }
  await withEnv({ ...VALID, PAYMENTS_ENABLED: 'true' }, async () => { expect((await call('/api/payment/checkout')).status).toBe(200); });
});

test('missing or invalid payment configuration keeps payments disabled even when PAYMENTS_ENABLED=true', async () => {
  const cases: Record<string, string | undefined>[] = [
    {},                                                        // nothing configured
    { ...VALID, VIMOPAY_SECRET_KEY: undefined },               // missing secret
    { ...VALID, VIMOPAY_SECRET_KEY: '   ' },                   // blank secret
    { ...VALID, VIMOPAY_SECRET_KEY: 'too-short-secret' },      // not a 32-byte AES-256 key
    { ...VALID, VIMOPAY_SALT_KEY: '' },                        // missing salt
    { ...VALID, VIMOPAY_ED_KEY: undefined },                   // missing ED key
    { ...VALID, VIMOPAY_USER_ID: '' },                         // missing user id
    { ...VALID, VIMOPAY_BASE_URL: 'http://gateway.vimopay.in' }, // not https
    { ...VALID, VIMOPAY_BASE_URL: 'not a url' },               // malformed
  ];
  for (const env of cases) {
    await withEnv({ ...env, PAYMENTS_ENABLED: 'true' }, async () => {
      for (const path of ['/api/payment/checkout', '/api/payment/config', '/api/payment/auth']) {
        const res = await call(path);
        expect(res.status).toBe(503);
        expect(await res.json()).toMatchObject({ paymentsPaused: true });
      }
    });
  }
});
