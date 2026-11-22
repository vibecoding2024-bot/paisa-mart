import { test, expect } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// A-03 regression: drives the real app (index.ts) so route ORDER is tested, not just the handler.
for (const key of ['DATABASE_URL', 'POSTGRES_URL', 'VIMOPAY_KYC_START_URL', 'VIMOPAY_KYC_STATUS_URL', 'VIMOPAY_KYC_URL_TEMPLATE']) delete process.env[key];
process.env.LEADS_DB = process.env.TXN_DB = process.env.USER_DB = join(mkdtempSync(join(tmpdir(), 'gateway-callback-')), 'db.sqlite');
process.env.AUTH_TOKEN_SECRET = 'test-customer-secret';
process.env.HOME_LOAN_ADMIN_TOKEN_SECRET = 'test-admin-secret';
const app = (await import('../index')).default;
const { savePending, getTxn, recentTxns } = await import('../lib/txn-store');

const call = (path: string, method = 'GET', body?: unknown) => app.fetch(new Request('http://local.test' + path, {
  method, headers: { 'Content-Type': 'application/json' }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
}));
const ACK = { successStatus: true, message: 'Success', responseCode: '000' };

test('A-03: a forged callback for an unknown reference is acknowledged but creates no transaction', async () => {
  const before = recentTxns(1000).length;
  for (const [path, method] of [['/api/anything/callback', 'POST'], ['/x/CallBack', 'PUT'], ['/api/payment/vimopay-callback', 'POST']] as const) {
    const res = await call(path, method, { merchantRefId: 'FORGED-NEW', txnStatusCode: '000', amount: '99999' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(ACK);
  }
  expect((await call('/api/payment-callback')).status).toBe(200); // the audit's empty-body case
  expect(getTxn('FORGED-NEW')).toBeNull();
  expect(getTxn('unknown')).toBeNull();
  expect(recentTxns(1000).length).toBe(before);
});

test('A-03: no callback path or method can change an existing transaction', async () => {
  savePending({ merchantRefId: 'PM-REAL-1', txnId: 'T-1', amount: 10, txnStatusCode: '002', responseMessage: 'Transaction in progress', raw: { ok: true } });
  const original = getTxn('PM-REAL-1');
  const forged = { merchantRefId: 'PM-REAL-1', txnId: 'FORGED', txnStatusCode: '000', txnStatus: 'Success', amount: '99999', responseMessage: 'forged' };
  await call('/api/anything/callback', 'POST', forged);
  await call('/api/payment/vimopay-callback', 'POST', forged);
  await call('/api/payment/vimopay-callback?merchantRefId=PM-REAL-1&txnStatusCode=000');
  await call('/x/callback?merchantRefId=PM-REAL-1&txnStatusCode=001');
  expect(getTxn('PM-REAL-1')).toEqual(original);
  const status = await (await call('/api/payment/status/PM-REAL-1')).json();
  expect(status).toMatchObject({ found: true, status: 'Pending', amount: '10', txnId: 'T-1' });
});

test('A-03: KYC callbacks now reach the KYC router instead of the catch-all', async () => {
  const get = await call('/api/kyc/vimopay/callback');
  expect(get.status).toBe(400);
  expect(get.headers.get('content-type')).toContain('text/html');
  expect(await get.text()).toContain('KYC failed');
  const post = await call('/api/kyc/vimopay/callback', 'POST', { kycStatus: 'verified', phoneNumber: '9100000001' });
  expect(post.status).toBe(400);
  expect(await post.json()).toMatchObject({ success: false });
});

test('A-03: callback bodies (name, phone) are never logged', async () => {
  const lines: string[] = [];
  const saved = { log: console.log, warn: console.warn, error: console.error, info: console.info };
  for (const k of ['log', 'warn', 'error', 'info'] as const) console[k] = (...a: unknown[]) => { lines.push(a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' ')); };
  try {
    await call('/api/anything/callback', 'POST', { merchantRefId: 'PM-REAL-1', custMobile: '9876501234', custName: 'Private Person', txnStatusCode: '000' });
    await call('/api/payment/vimopay-callback?custMobile=9876501234&custName=Private');
  } finally { Object.assign(console, saved); }
  const text = lines.join('\n');
  expect(text).toContain('not applied');
  expect(text).not.toContain('9876501234');
  expect(text).not.toContain('Private');
});

test('A-03: ordinary routes are unaffected by the callback fallback', async () => {
  expect(await (await call('/health')).json()).toEqual({ status: 'ok' });
  expect(await (await call('/api/payment/status/NOPE')).json()).toMatchObject({ found: false });
  expect((await call('/api/users/profile/9100000001')).status).toBe(401);
});
