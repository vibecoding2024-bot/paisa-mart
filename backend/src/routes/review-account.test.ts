import { test, expect, beforeEach } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
for (const key of ['DATABASE_URL', 'POSTGRES_URL', 'HOME_LOANS_DATABASE_URL', 'PERSONAL_LOANS_DATABASE_URL', 'BUSINESS_LOANS_DATABASE_URL', 'VEHICLE_LOANS_DATABASE_URL', 'ALLOW_DEV_OTP']) delete process.env[key];
for (const key of Object.keys(process.env)) if (key.startsWith('MSG91_') || key.startsWith('EXPO_PUBLIC_MSG91')) delete process.env[key];
process.env.PAYMENTS_ENABLED = 'true'; // these tests exercise the payment routes themselves (paused by default)
process.env.VIMOPAY_SECRET_KEY = 'synthetic-test-key-0123456789abc'; process.env.VIMOPAY_SALT_KEY = 'synthetic-salt'; process.env.VIMOPAY_ED_KEY = 'synthetic-ed'; process.env.VIMOPAY_USER_ID = 'synthetic-user'; // complete synthetic VimoPay config (never real)
process.env.LEADS_DB = process.env.TXN_DB = join(mkdtempSync(join(tmpdir(), 'review-test-')), 'db.sqlite');
process.env.AUTH_TOKEN_SECRET = 'test-customer-secret';
process.env.HOME_LOAN_ADMIN_TOKEN_SECRET = 'test-admin-secret';
const { authRouter } = await import('./auth');
const { kycRouter } = await import('./kyc');
const { paymentRouter } = await import('./payment');
const { customerApplicationsRouter } = await import('./customer-applications');
const review = await import('../lib/review-account');
const { saveBusinessLoanLead } = await import('../lib/business-loan-lead-store');

// Generated per run; never a real credential.
const REVIEW_PHONE = '9000000099';
const CODE = String(100000 + (randomBytes(4).readUInt32BE() % 900000));
const KEY = randomBytes(32).toString('hex');
function enable(overrides: Record<string, string> = {}) {
  Object.assign(process.env, {
    REVIEW_ACCOUNT_ENABLED: 'true', REVIEW_ACCOUNT_PHONE: REVIEW_PHONE, REVIEW_ACCOUNT_HMAC_KEY: KEY,
    REVIEW_ACCOUNT_CODE_HASH: review.reviewCodeHash(CODE, KEY),
    REVIEW_ACCOUNT_EXPIRES_AT: new Date(Date.now() + 3600_000).toISOString(), ...overrides,
  });
}
let ip = 0;
const post = (router: any, path: string, body: unknown) => router.request(path, {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.' + (++ip) + '.1' }, body: JSON.stringify(body),
});
const claims = (token: string) => JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString());
beforeEach(() => { review.resetReviewFailuresForTests(); delete process.env.ALLOW_DEV_OTP; enable(); });

test('review phone: send-otp sends no SMS and leaks nothing; correct code issues a review token', async () => {
  const sent = await post(authRouter, '/send-otp', { phone: REVIEW_PHONE });
  expect(sent.status).toBe(200);
  expect(await sent.json()).toEqual({ success: true });
  const verified = await post(authRouter, '/verify-otp', { phone: REVIEW_PHONE, otp: CODE });
  expect(verified.status).toBe(200);
  expect(claims((await verified.json()).token)).toMatchObject({ sub: '+91' + REVIEW_PHONE, review: true });
});

test('wrong code is refused and the path locks after the failure limit', async () => {
  const wrong = CODE === '111111' ? '222222' : '111111';
  expect((await post(authRouter, '/verify-otp', { phone: REVIEW_PHONE, otp: wrong })).status).toBe(401);
  for (let i = 1; i < review.REVIEW_MAX_FAILURES; i++) review.verifyReviewCode(REVIEW_PHONE, wrong);
  expect(review.reviewLoginActive()).toBe(false);
  // Even the correct code is now refused (normal path; no provider and no dev OTP here).
  expect((await post(authRouter, '/verify-otp', { phone: REVIEW_PHONE, otp: CODE })).status).toBe(401);
});

test('the review code is not universal: any other phone is refused', async () => {
  for (const phone of ['9000000098', '9876543210']) {
    expect((await post(authRouter, '/verify-otp', { phone, otp: CODE })).status).toBe(401);
  }
});

test('disabled, expired or incomplete config fails closed with no devOtp anywhere', async () => {
  const cases = [
    { REVIEW_ACCOUNT_ENABLED: 'false' },
    { REVIEW_ACCOUNT_EXPIRES_AT: new Date(Date.now() - 1000).toISOString() },
    { REVIEW_ACCOUNT_HMAC_KEY: 'short' },
    { REVIEW_ACCOUNT_CODE_HASH: 'not-a-hash' },
  ];
  for (const [i, overrides] of cases.entries()) {
    const phone = '900000007' + i; // fresh phone per case: send-otp allows 3 requests per phone per 15 min
    enable({ REVIEW_ACCOUNT_PHONE: phone, ...overrides });
    const sent = await post(authRouter, '/send-otp', { phone });
    expect(sent.status).toBe(503);
    expect(JSON.stringify(await sent.json())).not.toContain('devOtp');
    expect((await post(authRouter, '/verify-otp', { phone, otp: CODE })).status).toBe(401);
  }
});

test('A-06: dev OTP only with explicit ALLOW_DEV_OTP=true', async () => {
  expect((await post(authRouter, '/send-otp', { phone: '9000000011' })).status).toBe(503);
  process.env.ALLOW_DEV_OTP = 'true';
  const allowed = await (await post(authRouter, '/send-otp', { phone: '9000000012' })).json();
  expect(allowed.devOtp).toMatch(/^\d{6}$/);
  delete process.env.ALLOW_DEV_OTP;
  expect((await post(authRouter, '/verify-otp', { phone: '9000000012', otp: allowed.devOtp })).status).toBe(401);
});

test('A-02: a widget reqId is bound to the phone it was sent to', async () => {
  process.env.MSG91_MOBILE_WIDGET_ID = 'widget';
  process.env.MSG91_AUTH_KEY = 'test-key';
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string) => new Response(JSON.stringify(
    String(url).includes('sendOtp') ? { type: 'success', message: 'req-' + ip } : { type: 'success' }), { status: 200 })) as any;
  try {
    const { reqId } = await (await post(authRouter, '/send-otp', { phone: '9300000001' })).json();
    expect(reqId).toBeTruthy();
    expect((await post(authRouter, '/verify-otp', { phone: '9300000002', otp: '123456', reqId })).status).toBe(401);
    const own = await post(authRouter, '/verify-otp', { phone: '9300000001', otp: '123456', reqId });
    expect(own.status).toBe(200);
    expect(claims((await own.json()).token).sub).toBe('+919300000001');
    expect((await post(authRouter, '/verify-otp', { phone: '9300000001', otp: '123456', reqId })).status).toBe(401);
  } finally {
    globalThis.fetch = realFetch;
    delete process.env.MSG91_MOBILE_WIDGET_ID;
    delete process.env.MSG91_AUTH_KEY;
  }
});

test('review account: no KYC, no payments, and only its own synthetic applications', async () => {
  const reviewToken = (await (await post(authRouter, '/verify-otp', { phone: REVIEW_PHONE, otp: CODE })).json()).token;
  expect((await post(kycRouter, '/vimopay/start', { phoneNumber: REVIEW_PHONE })).status).toBe(401);
  const kyc = await kycRouter.request('/vimopay/start', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + reviewToken }, body: JSON.stringify({ phoneNumber: REVIEW_PHONE }) });
  expect(kyc.status).toBe(403);
  expect((await post(paymentRouter, '/create', { custMobile: REVIEW_PHONE, amount: 10 })).status).toBe(403);
  const common = { cibil: '750', dateOfBirth: '01/01/1990', city: 'Hyderabad', state: 'Telangana', monthlyIncome: '50000', loanAmountRequired: '100000', existingEmi: '0', businessType: 'Retail', loanPurpose: 'Expansion' };
  await saveBusinessLoanLead({ ...common, fullName: 'Demo Applicant', phoneNumber: REVIEW_PHONE } as any);
  await saveBusinessLoanLead({ ...common, fullName: 'Other Customer', phoneNumber: '9000000055' } as any);
  const { token } = await (await post(authRouter, '/verify-otp', { phone: REVIEW_PHONE, otp: CODE })).json();
  const response = await customerApplicationsRouter.request('/', { headers: { Authorization: 'Bearer ' + token } });
  expect(response.status).toBe(200);
  expect((await response.json()).data.map((a: any) => a.details.Name)).toEqual(['Demo Applicant']);
});

test('A-02 web: verify-otp-token binds identity to the provider-verified phone, with no fallback and no raw data', async () => {
  process.env.MSG91_AUTH_KEY = 'test-key';
  const realFetch = globalThis.fetch;
  let providerBody: Record<string, unknown> = {};
  globalThis.fetch = (async () => new Response(JSON.stringify(providerBody), { status: 200 })) as any;
  try {
    providerBody = { type: 'success', message: '919300000011' };
    const ok = await post(authRouter, '/verify-otp-token', { accessToken: 'tok', channel: 'web', phone: '9300000011' });
    expect(ok.status).toBe(200);
    const body = await ok.json();
    expect(claims(body.token).sub).toBe('+919300000011');
    expect(body.data).toBeUndefined();
    // Someone else's verified token cannot sign in as a different phone.
    expect((await post(authRouter, '/verify-otp-token', { accessToken: 'tok', channel: 'web', phone: '9300000012' })).status).toBe(401);
    // Provider response without a phone: previously fell back to the client phone; now refused.
    providerBody = { type: 'success' };
    expect((await post(authRouter, '/verify-otp-token', { accessToken: 'tok', channel: 'web', phone: '9300000011' })).status).toBe(401);
    // Free text containing digits is not accepted as a verified phone.
    providerBody = { type: 'success', message: 'verified 919300000011' };
    expect((await post(authRouter, '/verify-otp-token', { accessToken: 'tok', channel: 'web', phone: '9300000011' })).status).toBe(401);
    // The phone being signed in is mandatory.
    providerBody = { type: 'success', message: '919300000011' };
    expect((await post(authRouter, '/verify-otp-token', { accessToken: 'tok', channel: 'web' })).status).toBe(400);
    // Provider rejection stays a rejection.
    providerBody = { type: 'error', message: 'invalid' };
    expect((await post(authRouter, '/verify-otp-token', { accessToken: 'tok', channel: 'web', phone: '9300000011' })).status).toBe(401);
    // The review phone never signs in through the provider token path.
    providerBody = { type: 'success', message: '91' + REVIEW_PHONE };
    expect((await post(authRouter, '/verify-otp-token', { accessToken: 'tok', channel: 'web', phone: REVIEW_PHONE })).status).toBe(401);
  } finally {
    globalThis.fetch = realFetch;
    delete process.env.MSG91_AUTH_KEY;
  }
});

test('review tokens never outlive the window and are revoked when the window is disabled or expires', async () => {
  const { token } = await (await post(authRouter, '/verify-otp', { phone: REVIEW_PHONE, otp: CODE })).json();
  expect(claims(token).exp).toBeLessThanOrEqual(Math.floor(Date.parse(process.env.REVIEW_ACCOUNT_EXPIRES_AT!) / 1000));
  const list = () => customerApplicationsRouter.request('/', { headers: { Authorization: 'Bearer ' + token } });
  expect((await list()).status).toBe(200);
  process.env.REVIEW_ACCOUNT_ENABLED = 'false';
  expect((await list()).status).toBe(401);
  enable({ REVIEW_ACCOUNT_EXPIRES_AT: new Date(Date.now() - 1000).toISOString() });
  expect((await list()).status).toBe(401);
});

test('no review code, OTP or token appears in logs', async () => {
  const lines: string[] = [];
  const orig = { log: console.log, warn: console.warn, error: console.error };
  for (const k of ['log', 'warn', 'error'] as const) console[k] = (...a: unknown[]) => { lines.push(a.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' ')); };
  try {
    await post(authRouter, '/send-otp', { phone: REVIEW_PHONE });
    const { token } = await (await post(authRouter, '/verify-otp', { phone: REVIEW_PHONE, otp: CODE })).json();
    await post(authRouter, '/verify-otp', { phone: REVIEW_PHONE, otp: CODE === '111111' ? '222222' : '111111' });
    const all = lines.join('\n');
    expect(all).not.toContain(CODE);
    expect(all).not.toContain(token);
    expect(all).not.toContain(REVIEW_PHONE);
    expect(all).toContain('90******99');
  } finally { Object.assign(console, orig); }
});
