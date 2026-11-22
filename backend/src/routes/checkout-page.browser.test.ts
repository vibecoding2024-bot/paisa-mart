import { test, expect, beforeAll, afterAll } from 'bun:test';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Hono } from 'hono';
/**
 * A-42 regression in a REAL browser (headless Chrome over the DevTools protocol).
 * - The real checkout page and real /status route are served from an isolated synthetic SQLite database seeded
 *   with malicious values (as legacy forged rows or gateway text could contain).
 * - Only /states and /create (which need the VimoPay network) are faked, with malicious and legitimate responses.
 * - Chrome resolves only 127.0.0.1 (--host-resolver-rules), and the test process's fetch guard blocks other hosts,
 *   so nothing can reach production. Each payload tries to execute, read the stored token, and redirect.
 * Skipped (with a message) only when no Chrome/Edge binary is available; set CHROME_PATH to choose one.
 */
for (const key of ['DATABASE_URL', 'POSTGRES_URL', 'VIMOPAY_PAYMENT_URL_HOSTS', 'VIMOPAY_BASE_URL']) delete process.env[key];
process.env.TXN_DB = join(mkdtempSync(join(tmpdir(), 'checkout-browser-')), 'db.sqlite');
const { paymentRouter } = await import('./payment');
const { savePending } = await import('../lib/txn-store');

const CHROME = [process.env.CHROME_PATH, 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium',
  '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find(p => p && existsSync(p));
const TOKEN = 'SYNTHETIC-TOKEN-a42';
// Every payload tries all three: execute (window.__pwned / title), read the token (/steal), and redirect away.
const ACT = "window.__pwned=1;document.title='PWNED';fetch('/steal?t='+localStorage.getItem('auth_token'));location.href='https://evil.example/'";
const P = {
  img: `<img src=x onerror="${ACT}">`,
  svg: `"><svg onload="${ACT}">`,
  script: `<script>${ACT}</script>`,
  link: `<a id=jl href="javascript:${ACT}">click</a>`,
};

let steals: string[] = [];
let createMode: 'malicious' | 'legit' = 'malicious';
const fake = new Hono();
fake.get('/steal', c => { steals.push(c.req.url); return c.text('no'); });
fake.get('/api/payment/states', c => c.json({ data: [{ code: P.svg, description: P.img }, { code: 'KA', description: 'Karnataka' }] }));
fake.post('/api/payment/create', c => c.json(createMode === 'legit'
  ? { merchantRefId: 'PM-LEGIT-1', data: { paymentUrl: 'https://gateway.vimopay.in/pay/abc?x=1', txnId: 'T-LEGIT', amount: 10, txnStatus: 'Pending' } }
  : { merchantRefId: P.img, data: { paymentUrl: `javascript:${ACT}`, txnId: P.script, amount: P.svg, txnStatus: P.link } }));
fake.route('/api/payment', paymentRouter); // real /checkout (with CSP) and real /status

let server: ReturnType<typeof Bun.serve> | undefined;
let chrome: ReturnType<typeof Bun.spawn> | undefined;
let profile = '';
let ws: WebSocket | undefined;
let origin = '';
let nextId = 0;
const pending = new Map<number, (v: any) => void>();

function cdp(method: string, params: Record<string, unknown> = {}): Promise<any> {
  const id = ++nextId;
  ws!.send(JSON.stringify({ id, method, params }));
  return new Promise(resolve => pending.set(id, resolve));
}
async function evaluate(expression: string): Promise<any> {
  const r = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  return r.result?.result?.value;
}
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
async function open(path: string) {
  await cdp('Page.navigate', { url: origin + path });
  for (let i = 0; i < 50 && (await evaluate('document.readyState')) !== 'complete'; i++) await sleep(100);
  await sleep(1200); // let the status poll / states fetch render (and any payload fire)
}
const STATE = `JSON.stringify({pwned:!!window.__pwned,csp:!!window.__csp,title:document.title,href:location.href,
  resultText:document.getElementById('result')?.textContent??null,msg:document.getElementById('msg')?.textContent??null,
  injected:document.querySelectorAll('#result img,#result svg,#result script,#result a[href^="javascript"],select img,select svg').length,
  links:[...document.querySelectorAll('#result a')].map(a=>({href:a.getAttribute('href'),rel:a.rel,target:a.target})),
  options:[...document.querySelectorAll('#location option')].map(o=>[o.value,o.textContent])})`;
const state = async () => JSON.parse(await evaluate(STATE));
function expectSafe(s: any) {
  expect(s.pwned).toBe(false);
  expect(s.title).toBe('Paisa Mart — Payment');
  expect(s.href.startsWith(origin + '/api/payment/checkout')).toBe(true);
  expect(s.injected).toBe(0);
  expect(steals).toEqual([]);
}

beforeAll(async () => {
  if (!CHROME) return;
  savePending({ merchantRefId: 'PM-XSS-1', txnId: P.script, amount: P.svg, txnStatusCode: '002', responseMessage: P.img, raw: {} });
  savePending({ merchantRefId: 'PM-OK-1', txnId: 'T-OK-1', amount: 10, txnStatusCode: '002', responseMessage: 'Transaction in progress', raw: {} });
  server = Bun.serve({ port: 0, hostname: '127.0.0.1', fetch: fake.fetch });
  origin = `http://127.0.0.1:${server.port}`;
  profile = mkdtempSync(join(tmpdir(), 'a42-chrome-'));
  const port = 9300 + Math.floor(Math.random() * 500);
  chrome = Bun.spawn([CHROME, '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1', 'about:blank'],
    { stdout: 'ignore', stderr: 'ignore' });
  let target: any;
  for (let i = 0; i < 100 && !target; i++) {
    try { target = ((await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()) as any[]).find((t: any) => t.type === 'page'); } catch {}
    if (!target) await sleep(100);
  }
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise<void>(r => { ws!.onopen = () => r(); });
  ws.addEventListener('message', e => { const m = JSON.parse(String(e.data)); if (m.id && pending.has(m.id)) { pending.get(m.id)!(m); pending.delete(m.id); } });
  await cdp('Page.enable'); await cdp('Runtime.enable');
  await open('/api/payment/checkout');
  await evaluate(`localStorage.setItem('auth_token', ${JSON.stringify(TOKEN)}); true`);
}, 30000);

afterAll(() => {
  try { ws?.close(); } catch {}
  chrome?.kill();
  server?.stop(true);
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
});

const browserTest = CHROME ? test : test.skip;
if (!CHROME) console.warn('[A-42 browser test] skipped: no Chrome/Edge found (set CHROME_PATH)');

browserTest('stored malicious transaction values render as text and cannot execute, read the token or redirect', async () => {
  await open('/api/payment/checkout?ref=PM-XSS-1');
  const s = await state();
  expectSafe(s);
  expect(s.resultText).toContain('PM-XSS-1');
  expect(s.resultText).toContain('<script>');       // visible as literal text
  expect(s.resultText).toContain('onerror=');
}, 30000);

browserTest('a reflected reference in the URL renders as text only; redirect-claimed success is not shown', async () => {
  await open('/api/payment/checkout?ref=' + encodeURIComponent(P.img) + '&status=Success&txnStatus=Success');
  const s = await state();
  expectSafe(s);
  expect(s.resultText).toContain('<img src=x onerror=');
  expect(s.resultText).toContain('StatusUnknown'); // the server's status (not found), not the URL's "Success"
  expect(s.msg).not.toContain('successful');
}, 30000);

browserTest('malicious state names stay text, and a javascript: payment link is refused', async () => {
  createMode = 'malicious';
  await open('/api/payment/checkout');
  let s = await state();
  expect(s.options).toContainEqual([P.svg, P.img]);   // stored as literal option text/value
  await evaluate(`(()=>{const $=id=>document.getElementById(id);$('custName').value='Synthetic';$('custMobile').value='9100000001';
    $('email').value='person@example.test';$('location').value='KA';$('f').requestSubmit();return true})()`);
  await sleep(1200);
  s = await state();
  expectSafe(s);
  expect(s.links).toEqual([]);
  expect(s.msg).toContain('rejected as unsafe');
  // Even if a click were attempted on any link, nothing navigates: there is none.
  expect(await evaluate(`localStorage.getItem('auth_token')`)).toBe(TOKEN); // token untouched, never sent anywhere
}, 30000);

browserTest('the CSP blocks inline handlers even if markup were injected (defence in depth)', async () => {
  await open('/api/payment/checkout');
  await evaluate(`document.body.insertAdjacentHTML('beforeend','<img src=x onerror="window.__csp=1"><script>window.__csp=1</script>'); true`);
  await sleep(800);
  const s = await state();
  expect(s.csp).toBe(false);
  expectSafe(s);
}, 30000);

browserTest('legitimate checkout still renders: stored transaction and a valid gateway link', async () => {
  await open('/api/payment/checkout?ref=PM-OK-1');
  let s = await state();
  expectSafe(s);
  expect(s.resultText).toContain('PM-OK-1');
  expect(s.resultText).toContain('T-OK-1');
  expect(s.resultText).toContain('₹10');
  expect(s.resultText).toContain('Pending');
  createMode = 'legit';
  await open('/api/payment/checkout');
  s = await state();
  expect(s.options).toContainEqual(['KA', 'Karnataka']);
  await evaluate(`(()=>{const $=id=>document.getElementById(id);$('custName').value='Synthetic';$('custMobile').value='9100000001';
    $('email').value='person@example.test';$('location').value='KA';$('f').requestSubmit();return true})()`);
  await sleep(1200);
  s = await state();
  expectSafe(s);
  expect(s.links).toEqual([{ href: 'https://gateway.vimopay.in/pay/abc?x=1', rel: 'noopener noreferrer', target: '_blank' }]);
  expect(s.resultText).toContain('PM-LEGIT-1');
  expect(s.msg).toContain('Payment created');
}, 30000);
