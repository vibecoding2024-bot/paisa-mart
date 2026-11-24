// Customer application-list privacy scenarios against the REAL local backend and the BUILT web app.
// Customer A's requests are held in flight while A closes the screens and logs out; customer B then signs in
// through the real OTP UI in the same tab (no reload), with B's own responses delayed. A's held responses are
// released while B is on the list. Browser back/forward is exercised afterwards. A DOM observer records any
// of A's reference numbers that ever render. Usage: node privacy-verify.cjs <out-dir>
const { chromium } = require('C:/Users/Swetha Anusha/Pictures/CHAITANYA/paisa mart/paisa-mart/.dash/.preview/browser-tools/node_modules/playwright-core');
const fs = require('fs'), path = require('path'), { randomUUID } = require('crypto');
const base = 'http://127.0.0.1:3911', outDir = process.argv[2]; fs.mkdirSync(outDir, { recursive: true });
const results = [], pageErrors = [];
function check(label, cond, detail = '') { results.push({ label, pass: !!cond, detail: cond ? '' : String(detail).slice(0, 400) }); console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond ? '' : '  -> ' + detail)); }
async function call(method, p, { body, token, headers = {} } = {}) {
  const r = await fetch(base + p, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  return { status: r.status, json: await r.json().catch(() => null) };
}
async function customerToken(phone) { const s = await call('POST', '/api/auth/send-otp', { body: { phone } }); return (await call('POST', '/api/auth/verify-otp', { body: { phone, otp: s.json.devOtp } })).json.token; }
const A = '9876500005', B = '9876500006';
const profile = (phone, name) => ({ phoneNumber: phone, name, email: name.toLowerCase().replace(/\s+/g, '.') + '@example.test', occupation: 'Salaried', qualification: 'Graduate', annualIncome: '600000', pincode: '411001', dateOfBirth: { day: '1', month: '2', year: '1990' } });
const loan = (phone, name) => ({ fullName: name, phoneNumber: phone, cibil: '760', dateOfBirth: '01/02/1990', city: 'Pune', state: 'Maharashtra', monthlyIncome: '85000', existingEmi: '0', loanAmountRequired: '700000' });
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const tA = await customerToken(A), tB = await customerToken(B);
  for (const [t, p, n] of [[tA, A, 'Privacy A'], [tB, B, 'Privacy B']]) check('profile ' + p, (await call('POST', '/api/users/profile', { token: t, body: profile(p, n) })).status === 200);
  const hl = await call('POST', '/api/home-loans/leads', { body: { ...loan(A, 'Privacy Home A'), loanType: 'House Purchase' } });
  const bl = await call('POST', '/api/business-loans/leads', { body: { ...loan(A, 'Privacy Business A'), businessType: 'Retail', loanPurpose: 'Expansion' }, headers: { 'Idempotency-Key': 'privacy-' + randomUUID() } });
  const blB = await call('POST', '/api/business-loans/leads', { body: { ...loan(B, 'Privacy Business B'), businessType: 'Trading', loanPurpose: 'Stock' }, headers: { 'Idempotency-Key': 'privacy-' + randomUUID() } });
  const aIds = [hl.json.data.referenceNumber, 'BL-' + bl.json.data.id], bId = 'BL-' + blB.json.data.id;
  check('seeded A (home + business) and B (business)', aIds.every(Boolean) && blB.status === 200, JSON.stringify(aIds));

  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const held = [], log = [];
    await context.route('**/*', async route => {
      const req = route.request(), u = req.url();
      if (!u.startsWith(base)) return route.abort();
      const listCall = /\/api\/(customer-applications|home-loans\/applications)(\?|$)/.test(u.replace(base, ''));
      const auth = req.headers()['authorization'] || '';
      if (listCall && auth.endsWith(tA) && held.release === undefined) { log.push('held A ' + u.replace(base, '')); return new Promise(res => held.push(async () => { await route.continue(); res(); })); }
      if (listCall && !auth.endsWith(tA)) { log.push('delayed B ' + u.replace(base, '')); await wait(1500); }
      return route.continue();
    });
    await context.addInitScript(([tok, p]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('paisa_mart_auth_token', tok); localStorage.setItem('user-profile-storage', JSON.stringify({ state: { profile: p }, version: 0 })); localStorage.setItem('auth.mpinHash', 'x'); sessionStorage.setItem('seeded', '1'); } }, [tA, profile(A, 'Privacy A')]);
    const page = await context.newPage(); page.setDefaultTimeout(20000);
    page.on('pageerror', e => pageErrors.push(e.message));
    await page.goto(base + '/profile');
    await page.evaluate(ids => { window.__sameSession = 1; window.__leak = []; const scan = () => { const t = document.body.innerText; for (const i of ids) if (t.includes(i) && !window.__leak.includes(i)) window.__leak.push(i); }; new MutationObserver(scan).observe(document.body, { subtree: true, childList: true, characterData: true }); }, aIds);
    // A opens both lists; responses are held in flight. A closes them and logs out while still pending.
    await page.getByText('My applications & status', { exact: true }).click();
    await page.getByText('Loading applications…', { exact: true }).first().waitFor();
    await page.getByText('← Back', { exact: true }).click();
    await page.getByText('My home loan applications', { exact: true }).click();
    await page.getByText('Loading applications…', { exact: true }).first().waitFor();
    await page.getByText('← Back', { exact: true }).click();
    check('A has 2 list requests still in flight at logout', held.length === 2, held.length + ' ' + log.join('; '));
    await page.getByText('Log out', { exact: true }).first().click();
    await page.getByText('Log out', { exact: true }).last().click();
    await page.waitForURL(u => !u.pathname.startsWith('/profile'));
    check('logout cleared the token while A requests were pending', await page.evaluate(() => !localStorage.getItem('paisa_mart_auth_token')));
    // B signs in through the real OTP UI in the same document.
    await page.evaluate(() => { history.pushState(null, '', '/'); dispatchEvent(new PopStateEvent('popstate', { state: null })); });
    let devOtp = null; page.on('response', async r => { if (r.url().endsWith('/api/auth/send-otp')) try { devOtp = (await r.json()).devOtp; } catch {} });
    await page.getByLabel('Mobile number').fill(B);
    await page.getByText('Get started', { exact: true }).click();
    await page.getByLabel('OTP digit 1').waitFor();
    for (let i = 0; i < 6; i++) await page.getByLabel('OTP digit ' + (i + 1)).fill(devOtp[i]);
    await page.getByText('Verify & continue', { exact: true }).click();
    await page.waitForURL(u => !u.pathname.includes('otp'));
    await page.getByText('Profile', { exact: true }).last().click();
    // B opens My applications (B's response delayed); release A's held responses while B's screen is open.
    await page.getByText('My applications & status', { exact: true }).click();
    await page.waitForTimeout(300);
    held.release = true; for (const go of held.splice(0)) await go();
    await page.getByText(bId, { exact: true }).waitFor().catch(() => {});
    await page.waitForTimeout(2500);
    let text = await page.locator('body').innerText();
    check('B My applications shows B\'s record', text.includes(bId), text.slice(0, 300));
    check('B My applications never shows A\'s records (held A responses released during B session)', (await page.evaluate(() => window.__leak)).length === 0, 'A refs rendered: ' + (await page.evaluate(() => window.__leak)).join(', '));
    await page.screenshot({ path: path.join(outDir, 'privacy-B-my-applications-phone.png') });
    await page.getByText('← Back', { exact: true }).click();
    await page.getByText('My home loan applications', { exact: true }).click();
    await page.getByText('No applications found for your signed-in mobile number.', { exact: true }).waitFor().catch(() => {});
    await page.waitForTimeout(2000);
    text = await page.locator('body').innerText();
    check('B My home loan applications shows none and never A\'s', text.includes('No applications found') && (await page.evaluate(() => window.__leak)).length === 0, 'A refs: ' + (await page.evaluate(() => window.__leak)).join(', ') + ' | ' + text.slice(0, 200));
    // Browser back/forward across the history that includes A's list URLs.
    for (const dir of ['back', 'back', 'back', 'back', 'forward', 'forward', 'forward', 'forward']) {
      await (dir === 'back' ? page.goBack() : page.goForward()).catch(() => {});
      await page.waitForTimeout(1800);
    }
    check('back/forward stayed in the same page session (no reload)', await page.evaluate(() => window.__sameSession === 1));
    check('back/forward never renders A\'s records for B', (await page.evaluate(() => window.__leak)).length === 0, 'A refs: ' + (await page.evaluate(() => window.__leak)).join(', '));
    console.log(log.join('\n'));
  } catch (e) { check('harness error', false, e.stack); }
  finally {
    check('no uncaught runtime errors', pageErrors.length === 0, pageErrors.join('; '));
    const pass = results.filter(r => r.pass).length, fail = results.length - pass;
    console.log('\nPrivacy verification: ' + pass + ' pass / ' + fail + ' fail');
    fs.writeFileSync(path.join(outDir, 'privacy-results.json'), JSON.stringify({ pass, fail, results, pageErrors }, null, 2));
    await browser.close(); process.exit(fail ? 1 : 0);
  }
})().catch(e => { console.error(e); process.exit(2); });
