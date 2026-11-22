import { test, expect } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
// A-42 regression (no browser needed). The real-browser execution tests are in checkout-page.browser.test.ts.
for (const key of ['DATABASE_URL', 'POSTGRES_URL', 'VIMOPAY_PAYMENT_URL_HOSTS', 'VIMOPAY_BASE_URL']) delete process.env[key];
process.env.PAYMENTS_ENABLED = 'true'; // these tests exercise the payment routes themselves (paused by default)
process.env.LEADS_DB = process.env.TXN_DB = process.env.USER_DB = join(mkdtempSync(join(tmpdir(), 'checkout-page-')), 'db.sqlite');
process.env.AUTH_TOKEN_SECRET = 'test-customer-secret';
process.env.HOME_LOAN_ADMIN_TOKEN_SECRET = 'test-admin-secret';
const app = (await import('../index')).default;
const { CHECKOUT_PAGE } = await import('../checkout-page');
const { safePaymentUrl } = await import('../lib/payment-url');
const { savePending, getTxn } = await import('../lib/txn-store');

const call = (path: string, init: RequestInit = {}) => app.fetch(new Request('http://local.test' + path, init));
const XSS = '<img src=x onerror="fetch(\'/steal?t=\'+localStorage.auth_token)">';

test('A-42: the checkout page never inserts HTML or evaluates strings', () => {
  for (const sink of ['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'document.write', 'eval(', 'new Function', 'setTimeout("', "setTimeout('"]) {
    expect(CHECKOUT_PAGE).not.toContain(sink);
  }
  expect(CHECKOUT_PAGE).toContain('textContent');
  expect(CHECKOUT_PAGE).toContain('safeHttpsUrl');
});

test('A-42: the page is served with a CSP that allows only its own script and style', async () => {
  const res = await call('/api/payment/checkout');
  expect(res.status).toBe(200);
  const csp = res.headers.get('content-security-policy') ?? '';
  const html = await res.text();
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? '';
  const style = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
  expect(script.length).toBeGreaterThan(100);
  const hash = (s: string) => "'sha256-" + createHash('sha256').update(s, 'utf8').digest('base64') + "'";
  expect(csp).toContain("default-src 'none'");
  expect(csp).toContain('script-src ' + hash(script));
  expect(csp).toContain('style-src ' + hash(style));
  expect(csp).toContain("connect-src 'self'");
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).not.toMatch(/unsafe-inline|unsafe-eval|\*/);
  expect((html.match(/<script/g) ?? []).length).toBe(1);
  expect(res.headers.get('cache-control')).toBe('no-store');
});

test('A-42: the status API no longer reflects an unknown reference', async () => {
  const body = await (await call('/api/payment/status/' + encodeURIComponent(XSS))).json();
  expect(body).toEqual({ found: false, status: 'Unknown' });
  expect(JSON.stringify(body)).not.toContain('onerror');
});

test('A-42: create rejects a merchant reference that is not a plain identifier (before any gateway call)', async () => {
  for (const merchantRefId of [XSS, '"><svg onload=1>', 'a'.repeat(41), '', 'PM 1', 42]) {
    const res = await call('/api/payment/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ merchantRefId, custMobile: '9100000001' }) });
    expect(res.status).toBe(400);
  }
});

test('A-42: only https links on an allowlisted gateway host are accepted', () => {
  for (const bad of ['javascript:alert(1)', 'JaVaScRiPt:fetch(1)', 'data:text/html,<script>1</script>', 'http://gateway.vimopay.in/pay',
    'https://evil.example/pay', 'https://vimopay.in.evil.example/pay', 'https://evilvimopay.in/pay', 'https://user:pw@gateway.vimopay.in/pay',
    '//evil.example/x', '/relative', '', null, undefined, 42, 'https://' + 'a'.repeat(2100) + '.vimopay.in']) {
    expect(safePaymentUrl(bad)).toBeNull();
  }
  expect(safePaymentUrl('https://gateway.vimopay.in/pay?txn=1')).toBe('https://gateway.vimopay.in/pay?txn=1');
  expect(safePaymentUrl('https://pg.vimopay.in/x')).toBe('https://pg.vimopay.in/x');
  process.env.VIMOPAY_PAYMENT_URL_HOSTS = 'pay.partner-gateway.example';
  try { expect(safePaymentUrl('https://pay.partner-gateway.example/x')).toBe('https://pay.partner-gateway.example/x'); }
  finally { delete process.env.VIMOPAY_PAYMENT_URL_HOSTS; }
});

test('A-03 still holds: a forged callback cannot plant script into a transaction the page renders', async () => {
  savePending({ merchantRefId: 'PM-A42-1', txnId: 'T-1', amount: 10, txnStatusCode: '002', responseMessage: 'Transaction in progress', raw: {} });
  const before = getTxn('PM-A42-1');
  await call('/api/x/callback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ merchantRefId: 'PM-A42-1', responseMessage: XSS, txnId: XSS, txnStatusCode: '000' }) });
  expect(getTxn('PM-A42-1')).toEqual(before);
});
