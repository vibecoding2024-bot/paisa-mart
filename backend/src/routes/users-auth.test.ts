import { test, expect } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHmac } from 'node:crypto';
for (const key of ['DATABASE_URL', 'POSTGRES_URL', 'VIMOPAY_KYC_START_URL', 'VIMOPAY_KYC_STATUS_URL', 'VIMOPAY_KYC_URL_TEMPLATE']) delete process.env[key];
process.env.LEADS_DB = process.env.TXN_DB = process.env.USER_DB = join(mkdtempSync(join(tmpdir(), 'users-auth-')), 'db.sqlite');
process.env.AUTH_TOKEN_SECRET = 'test-customer-secret';
process.env.HOME_LOAN_ADMIN_TOKEN_SECRET = 'test-admin-secret';
process.env.ADMIN_EMAIL = 'admin@example.test';
const { usersRouter } = await import('./users');
const { kycRouter } = await import('./kyc');
const { issueAuthToken } = await import('../lib/auth-token');
const { getUserProfile } = await import('../lib/user-profile-store');

const A = '9100000001', B = '9100000002';
function customerToken(phone: string) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: '+91' + phone, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  return header + '.' + payload + '.' + createHmac('sha256', process.env.AUTH_TOKEN_SECRET!).update(header + '.' + payload).digest('base64url');
}
const adminToken = await issueAuthToken('admin:admin@example.test', { role: 'admin', email: 'admin@example.test' });
const req = (router: any, path: string, method = 'GET', token?: string, body?: unknown) => router.request(path, {
  method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}),
});
const profile = (phone: string, extra: Record<string, unknown> = {}) => ({
  phoneNumber: phone, name: 'Synthetic Person', email: 'person@example.test', occupation: 'Salaried Employee',
  qualification: 'Graduate', annualIncome: '5 Lakhs to 7 Lakhs', pincode: '500001', ...extra,
});

test('A-01: unauthenticated profile access is refused on every route', async () => {
  expect((await req(usersRouter, '/profile/' + A)).status).toBe(401);
  expect((await req(usersRouter, '/profile', 'POST', undefined, profile(A))).status).toBe(401);
  expect((await req(usersRouter, '/profile/' + A + '/kyc', 'PATCH', undefined, { status: 'verified' })).status).toBe(401);
  expect((await req(usersRouter, '/profiles')).status).toBe(401);
  expect((await req(usersRouter, '/profiles?limit=-1')).status).toBe(401);
});

test('A-01: a customer reads and writes only their own profile', async () => {
  const a = customerToken(A);
  expect((await req(usersRouter, '/profile/' + A, 'GET', a)).status).toBe(404);
  const saved = await req(usersRouter, '/profile', 'POST', a, profile(A));
  expect(saved.status).toBe(200);
  expect((await saved.json()).data.phoneNumber).toBe(A);
  expect((await req(usersRouter, '/profile/' + A, 'GET', a)).status).toBe(200);
  // Another customer's profile: no read, no overwrite.
  expect((await req(usersRouter, '/profile', 'POST', customerToken(B), profile(B))).status).toBe(200);
  expect((await req(usersRouter, '/profile/' + B, 'GET', a)).status).toBe(403);
  expect((await req(usersRouter, '/profile', 'POST', a, profile(B, { name: 'Overwrite Attempt' }))).status).toBe(403);
  expect(getUserProfile(B)?.name).toBe('Synthetic Person');
  // Customers never see the full list.
  expect((await req(usersRouter, '/profiles', 'GET', a)).status).toBe(401);
});

test('A-01: customers cannot set KYC status, by PATCH or by profile body', async () => {
  const a = customerToken(A);
  expect((await req(usersRouter, '/profile/' + A + '/kyc', 'PATCH', a, { status: 'verified' })).status).toBe(401);
  expect((await req(usersRouter, '/profile', 'POST', a, profile(A, { kycStatus: 'verified' }))).status).toBe(200);
  expect(getUserProfile(A)?.kycStatus).toBe('not_started');
  // Staff (admin) may correct it manually; the list is admin-only and bounded.
  expect((await req(usersRouter, '/profile/' + A + '/kyc', 'PATCH', adminToken, { status: 'submitted' })).status).toBe(200);
  const list = await req(usersRouter, '/profiles?limit=-1', 'GET', adminToken);
  expect(list.status).toBe(200);
  expect((await list.json()).data.length).toBe(2);
});

test('KYC start/status require the owning customer; callbacks alone never verify', async () => {
  process.env.VIMOPAY_KYC_URL_TEMPLATE = 'https://provider.invalid/kyc?s={{sessionId}}&state={{state}}';
  const a = customerToken(A);
  expect((await req(kycRouter, '/vimopay/start', 'POST', undefined, { phoneNumber: A })).status).toBe(401);
  expect((await req(kycRouter, '/vimopay/start', 'POST', customerToken(B), { phoneNumber: A })).status).toBe(403);
  const started = await (await req(kycRouter, '/vimopay/start', 'POST', a, { phoneNumber: A })).json();
  expect(started.success).toBe(true);
  expect((await req(kycRouter, '/vimopay/status/' + started.sessionId, 'GET', customerToken(B))).status).toBe(404);
  expect((await req(kycRouter, '/vimopay/status/' + started.sessionId, 'GET', a)).status).toBe(200);
  const state = new URL(started.kycUrl).searchParams.get('state')!;
  // Forged callbacks (by phone, by session id, even with the customer's own signed state) do not verify.
  for (const forged of [{ phoneNumber: A, status: 'verified' }, { sessionId: started.sessionId, status: 'success' }, { state, kycStatus: 'verified' }]) {
    await req(kycRouter, '/vimopay/callback', 'POST', undefined, forged);
    expect(getUserProfile(A)?.kycStatus).toBe('submitted');
  }
  await req(kycRouter, '/vimopay/callback?state=' + encodeURIComponent(state) + '&status=verified');
  expect(getUserProfile(A)?.kycStatus).toBe('submitted');
  // Only the provider's authenticated status API can verify.
  process.env.VIMOPAY_KYC_STATUS_URL = 'https://provider.invalid/status/{{partnerRefId}}';
  const realFetch = globalThis.fetch;
  let providerStatus = 'pending';
  globalThis.fetch = (async () => new Response(JSON.stringify({ kycStatus: providerStatus }), { status: 200 })) as any;
  try {
    await req(kycRouter, '/vimopay/callback', 'POST', undefined, { state, kycStatus: 'verified' });
    expect(getUserProfile(A)?.kycStatus).toBe('submitted');
    providerStatus = 'verified';
    await req(kycRouter, '/vimopay/callback', 'POST', undefined, { state });
    expect(getUserProfile(A)?.kycStatus).toBe('verified');
  } finally {
    globalThis.fetch = realFetch;
    delete process.env.VIMOPAY_KYC_STATUS_URL;
    delete process.env.VIMOPAY_KYC_URL_TEMPLATE;
  }
});
