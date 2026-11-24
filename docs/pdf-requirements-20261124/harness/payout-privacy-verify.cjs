// "My eligible payouts" cache isolation against the REAL local backend and the BUILT web app.
// The same payout cache also feeds the Home tab total and the Earnings tab, so all three surfaces are watched.
// Scenarios (synthetic customers, approved payouts seeded through the real admin routes):
//   settled   – A loads Home + My eligible payouts, closes them, logs out; B signs in through the OTP UI in the
//               same tab (no reload) with delayed responses.
//   in-flight – A's payout requests are held in flight through A's logout and released during B's session.
//   signed-out – after logout, the payout surfaces are opened with no token.
//   back/forward ×4 each way afterwards.
// A DOM observer, armed at A's logout, records any of A's reference number or amounts that ever render.
// Usage: node payout-privacy-verify.cjs <out-dir>   (needs LOCAL_ADMIN_PASSWORD and LOCAL_STAFF_PASSWORD)
const { chromium } = require('C:/Users/Swetha Anusha/Pictures/CHAITANYA/paisa mart/paisa-mart/.dash/.preview/browser-tools/node_modules/playwright-core');
const fs = require('fs'), path = require('path'), { randomUUID } = require('crypto');
const base = 'http://127.0.0.1:3911', outDir = process.argv[2]; fs.mkdirSync(outDir, { recursive: true });
const PW = process.env.LOCAL_STAFF_PASSWORD, ADMIN_PW = process.env.LOCAL_ADMIN_PASSWORD;
if (!PW || !ADMIN_PW) throw new Error('Run through payout-privacy-run.sh');
const results = [], pageErrors = [];
function check(label, cond, detail = '') { results.push({ label, pass: !!cond, detail: cond ? '' : String(detail).slice(0, 400) }); console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond ? '' : '  -> ' + detail)); }
async function call(method, p, { body, token, headers = {} } = {}) {
  const r = await fetch(base + p, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch {}
  return { status: r.status, json, text };
}
async function customerToken(phone) { const s = await call('POST', '/api/auth/send-otp', { body: { phone } }); return (await call('POST', '/api/auth/verify-otp', { body: { phone, otp: s.json.devOtp } })).json.token; }
async function staffToken(email, password) { return (await call('POST', '/api/admin/auth/login', { body: { email, password } })).json.token; }
const A = '9876500007', B = '9876500008';
const A_AMT = '4321.09', B_AMT = '1234.56';
const profile = (phone, name) => ({ phoneNumber: phone, name, email: name.toLowerCase().replace(/\s+/g, '.') + '@example.test', occupation: 'Salaried', qualification: 'Graduate', annualIncome: '600000', pincode: '411001', dateOfBirth: { day: '1', month: '2', year: '1990' } });
const loan = (phone, name) => ({ fullName: name, phoneNumber: phone, cibil: '760', dateOfBirth: '01/02/1990', city: 'Pune', state: 'Maharashtra', monthlyIncome: '85000', existingEmi: '0', loanAmountRequired: '700000' });
const wait = ms => new Promise(r => setTimeout(r, ms));
const payoutCall = u => /\/api\/customer-payouts(\?|$)/.test(u.replace(base, ''));

async function seedApprovedPayout(admin, t, phone, name, amount) {
  const lead = await call('POST', '/api/business-loans/leads', { body: { ...loan(phone, name), businessType: 'Retail', loanPurpose: 'Expansion' }, headers: { 'Idempotency-Key': 'payout-privacy-' + randomUUID() } });
  const id = 'BL-' + lead.json.data.id;
  const row = async () => (await call('GET', '/api/admin/operations/applications?pageSize=100', { token: admin })).json.data.find(x => x.id === id);
  let cur = await row();
  const s = await call('PATCH', '/api/admin/operations/applications/' + id, { token: t.ops1, body: { version: cur.version, stage: 'disbursed' } });
  cur = await row();
  const p = await call('PUT', '/api/admin/operations/applications/' + id + '/payout', { token: t.ops1, body: { version: cur.version, customerAmount: amount, paisamartAmount: '1.00' } });
  cur = await row();
  const e = await call('POST', '/api/admin/operations/applications/' + id + '/payout/approve', { token: t.exec1, body: { version: cur.version } });
  cur = await row();
  const m = await call('POST', '/api/admin/operations/applications/' + id + '/payout/approve', { token: t.mgr1, body: { version: cur.version } });
  check('seeded approved payout ' + id + ' for ' + phone, [s, p, e, m].every(r => r.status === 200), [s, p, e, m].map(r => r.status + ' ' + r.text.slice(0, 120)).join(' | '));
  return id;
}

async function scenario(browser, mode, tA, tB, aId, bId) {
  const markers = [aId, A_AMT, '4,321.09'];
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const held = [], log = [];
  await context.route('**/*', async route => {
    const req = route.request(), u = req.url();
    if (!u.startsWith(base)) return route.abort();
    const auth = req.headers()['authorization'] || '';
    if (payoutCall(u) && auth.endsWith(tA) && mode === 'in-flight' && held.release === undefined) { log.push('held A'); return new Promise(res => held.push(async () => { await route.continue(); res(); })); }
    if (payoutCall(u) && !auth.endsWith(tA)) { log.push('delayed ' + (auth ? 'B' : 'no-token')); await wait(1500); }
    return route.continue();
  });
  await context.addInitScript(([tok, p]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('paisa_mart_auth_token', tok); localStorage.setItem('user-profile-storage', JSON.stringify({ state: { profile: p }, version: 0 })); localStorage.setItem('auth.mpinHash', 'x'); sessionStorage.setItem('seeded', '1'); } }, [tA, profile(A, 'Payout A')]);
  const page = await context.newPage(); page.setDefaultTimeout(20000);
  page.on('pageerror', e => pageErrors.push(mode + ': ' + e.message));
  const leaks = () => page.evaluate(() => window.__leak);
  await page.goto(base + '/profile'); // '/' is the sign-in welcome page; the Home tab is reached from the tab bar
  let shot = 0;
  await page.exposeFunction('__leakShot', async () => { if (shot++ < 2) await page.screenshot({ path: path.join(outDir, 'payout-' + mode + '-leak-' + shot + '-phone.png') }).catch(() => {}); });
  // A leak counts only when an element showing A's value is visible on screen (rendered, non-zero size, inside the
  // viewport); renders inside hidden screens are recorded separately as __hiddenLeak.
  await page.evaluate(ids => {
    window.__sameSession = 1; window.__armed = false; window.__leak = []; window.__leakAt = []; window.__hiddenLeak = []; window.__seenA = [];
    const shown = el => { if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false; const r = el.getBoundingClientRect(); if (!r.width || !r.height || r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) return false; const top = document.elementFromPoint(Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1), Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1)); return !!top && (el.contains(top) || top.contains(el)); };
    const scan = () => {
      for (const i of ids) {
        const els = [...document.querySelectorAll('body *')].filter(e => e.childElementCount === 0 && (e.textContent || '').includes(i));
        if (!els.length) continue;
        if (!window.__armed) { if (!window.__seenA.includes(i)) window.__seenA.push(i); continue; }
        if (els.some(shown)) { if (!window.__leak.includes(i)) { window.__leak.push(i); window.__leakAt.push(i + ' @ ' + location.pathname); window.__leakShot(); } }
        else if (!window.__hiddenLeak.includes(i + ' @ ' + location.pathname)) window.__hiddenLeak.push(i + ' @ ' + location.pathname);
      }
    };
    new MutationObserver(scan).observe(document.body, { subtree: true, childList: true, characterData: true }); setInterval(scan, 200);
  }, markers);
  const tag = '[' + mode + '] ';
  // A: Home tab (payout total), Earnings tab, then Profile → My eligible payouts.
  await page.getByText('Home', { exact: true }).last().click();
  if (mode === 'settled') await page.getByText('₹4,321.09').first().waitFor();
  await page.getByText('Earnings', { exact: true }).last().click();
  if (mode === 'settled') await page.getByText('₹4,321.09').first().waitFor();
  await page.getByText('Profile', { exact: true }).last().click();
  await page.getByText('My eligible payouts', { exact: true }).click();
  if (mode === 'settled') { await page.waitForFunction(i => document.body.innerText.includes(i), aId); check(tag + 'A sees own payout (control)', (await page.evaluate(() => window.__seenA)).includes(aId)); }
  else { await page.getByText('Loading payout details…', { exact: true }).waitFor(); check(tag + 'A payout requests still in flight at logout', held.length >= 1, held.length + ' ' + log.join('; ')); }
  await page.getByText('← Back', { exact: true }).click();
  await page.evaluate(() => { window.__armed = true; });
  await page.getByText('Log out', { exact: true }).first().click();
  await page.getByText('Log out', { exact: true }).last().click();
  await page.waitForURL(u => !u.pathname.startsWith('/profile'));
  check(tag + 'logout cleared the token', await page.evaluate(() => !localStorage.getItem('paisa_mart_auth_token')));
  // Signed-out access to the payout screen in the same document (no token).
  await page.evaluate(() => { history.pushState(null, '', '/customer-payouts'); dispatchEvent(new PopStateEvent('popstate', { state: null })); });
  await page.getByText('My eligible payouts', { exact: true }).first().waitFor();
  await page.getByText('Please sign in to view your payout details', { exact: true }).waitFor().catch(() => {});
  let text = await page.locator('body').innerText();
  check(tag + 'signed-out payout screen asks to sign in and shows no A payout', text.includes('Please sign in to view your payout details') && (await leaks()).length === 0, 'A: ' + (await leaks()).join(',') + ' | ' + text.slice(0, 200));
  if (mode === 'in-flight') { /* keep A's held responses pending until B's session */ }
  // B signs in through the real OTP UI in the same document.
  await page.evaluate(() => { history.pushState(null, '', '/'); dispatchEvent(new PopStateEvent('popstate', { state: null })); });
  let devOtp = null; page.on('response', async r => { if (r.url().endsWith('/api/auth/send-otp')) try { devOtp = (await r.json()).devOtp; } catch {} });
  await page.getByLabel('Mobile number').fill(B);
  await page.getByText('Get started', { exact: true }).click();
  await page.getByLabel('OTP digit 1').waitFor();
  for (let i = 0; i < 6; i++) await page.getByLabel('OTP digit ' + (i + 1)).fill(devOtp[i]);
  await page.getByText('Verify & continue', { exact: true }).click();
  await page.waitForURL(u => !u.pathname.includes('otp'));
  await page.getByText('Home', { exact: true }).last().click().catch(() => {});
  await page.waitForTimeout(300);
  if (mode === 'in-flight') { held.release = true; for (const go of held.splice(0)) await go(); }
  await page.getByText('₹1,234.56').first().waitFor().catch(() => {});
  await page.waitForTimeout(2500);
  text = await page.locator('body').innerText();
  check(tag + 'B Home shows B total and never A\'s', text.includes('₹1,234.56') && (await leaks()).length === 0, 'A: ' + (await leaks()).join(',') + ' | ' + text.slice(0, 200));
  await page.screenshot({ path: path.join(outDir, 'payout-' + mode + '-B-home-phone.png') });
  await page.getByText('Earnings', { exact: true }).last().click();
  await page.waitForTimeout(2500);
  text = await page.locator('body').innerText();
  check(tag + 'B Earnings shows B payout and never A\'s', text.includes(bId) || text.includes('₹1,234.56'), text.slice(0, 200));
  check(tag + 'B Earnings never renders A', (await leaks()).length === 0, 'A: ' + (await leaks()).join(','));
  await page.getByText('Profile', { exact: true }).last().click();
  await page.getByText('My eligible payouts', { exact: true }).click();
  await page.waitForFunction(i => document.body.innerText.includes(i), bId, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2000);
  text = await page.locator('body').innerText();
  check(tag + 'B My eligible payouts shows B\'s payout', text.includes(bId) && text.includes(B_AMT), text.slice(0, 300));
  check(tag + 'B My eligible payouts never renders A', (await leaks()).length === 0, 'A: ' + (await leaks()).join(','));
  await page.screenshot({ path: path.join(outDir, 'payout-' + mode + '-B-my-eligible-payouts-phone.png') });
  for (const dir of ['back', 'back', 'back', 'back', 'forward', 'forward', 'forward', 'forward']) {
    await (dir === 'back' ? page.goBack() : page.goForward()).catch(() => {});
    await page.waitForTimeout(1800);
  }
  check(tag + 'back/forward stayed in the same page session (no reload)', await page.evaluate(() => window.__sameSession === 1));
  check(tag + 'back/forward never renders A\'s payout for B', (await leaks()).length === 0, 'A: ' + (await leaks()).join(','));
  console.log(tag + log.join('; '));
  console.log(tag + 'visible A renders: ' + JSON.stringify(await page.evaluate(() => window.__leakAt)));
  console.log(tag + 'hidden-only A renders: ' + JSON.stringify(await page.evaluate(() => window.__hiddenLeak)));
  await context.close();
}

(async () => {
  const admin = await staffToken('admin@example.test', ADMIN_PW);
  for (const [email, role] of [['ops1@example.test', 'ops'], ['exec1@example.test', 'executive'], ['mgr1@example.test', 'manager']]) {
    const r = await call('POST', '/api/admin/operations/staff', { token: admin, body: { name: email.split('@')[0], email, role, password: PW, active: true } });
    check('create staff ' + email, r.status === 200, r.text);
  }
  const t = { ops1: await staffToken('ops1@example.test', PW), exec1: await staffToken('exec1@example.test', PW), mgr1: await staffToken('mgr1@example.test', PW) };
  const tA = await customerToken(A), tB = await customerToken(B);
  for (const [tk, p, n] of [[tA, A, 'Payout A'], [tB, B, 'Payout B']]) check('profile ' + p, (await call('POST', '/api/users/profile', { token: tk, body: profile(p, n) })).status === 200);
  const aId = await seedApprovedPayout(admin, t, A, 'Payout Business A', A_AMT);
  const bId = await seedApprovedPayout(admin, t, B, 'Payout Business B', B_AMT);
  const pa = await call('GET', '/api/customer-payouts', { token: tA }), pb = await call('GET', '/api/customer-payouts', { token: tB }), pn = await call('GET', '/api/customer-payouts');
  check('API: A gets only A payout, B only B, no token 401', pa.json?.data?.length === 1 && pa.json.data[0].referenceNumber === aId && pb.json?.data?.length === 1 && pb.json.data[0].referenceNumber === bId && pn.status === 401, [pa.text, pb.text, pn.status].join(' | '));
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    for (const mode of ['settled', 'in-flight']) {
      try { await scenario(browser, mode, tA, tB, aId, bId); } catch (e) { check('[' + mode + '] harness error', false, e.stack); }
    }
  } finally {
    check('no uncaught runtime errors', pageErrors.length === 0, pageErrors.join('; '));
    const pass = results.filter(r => r.pass).length, fail = results.length - pass;
    console.log('\nPayout privacy verification: ' + pass + ' pass / ' + fail + ' fail');
    fs.writeFileSync(path.join(outDir, 'payout-privacy-results.json'), JSON.stringify({ pass, fail, results, pageErrors }, null, 2));
    await browser.close(); process.exit(fail ? 1 : 0);
  }
})().catch(e => { console.error(e); process.exit(2); });
