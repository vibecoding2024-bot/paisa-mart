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

test('only an explicit PAYMENTS_ENABLED=true re-opens the routes', async () => {
  for (const value of ['1', 'yes', 'TRUE', '']) {
    process.env.PAYMENTS_ENABLED = value;
    expect((await call('/api/payment/checkout')).status).toBe(503);
  }
  process.env.PAYMENTS_ENABLED = 'true';
  try { expect((await call('/api/payment/checkout')).status).toBe(200); } finally { delete process.env.PAYMENTS_ENABLED; }
});
