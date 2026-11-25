// Customer Home: "Invite a friend" card removed. Real local backend + built TEST web export, synthetic customers.
// Customer P has one approved payout (₹2,468.10) seeded through the real admin routes; customer E has none.
// At 360/390/768/1440 px: removed card absent, Learn card present, no horizontal overflow, payout total / empty
// state shown, full-page screenshot. Navigation: Learn card, every tab, Profile "Invite friends" still present.
// Any non-loopback request is aborted and recorded. Usage: node home-verify.cjs <out-dir>
const { chromium } = require('C:/Users/Swetha Anusha/Pictures/CHAITANYA/paisa mart/paisa-mart/.dash/.preview/browser-tools/node_modules/playwright-core');
const fs = require('fs'), path = require('path'), { randomUUID } = require('crypto');
const base = 'http://127.0.0.1:3911', outDir = process.argv[2]; fs.mkdirSync(outDir, { recursive: true });
const PW = process.env.LOCAL_STAFF_PASSWORD, ADMIN_PW = process.env.LOCAL_ADMIN_PASSWORD;
if (!PW || !ADMIN_PW) throw new Error('needs LOCAL_ADMIN_PASSWORD and LOCAL_STAFF_PASSWORD');
const results = [], pageErrors = [], external = [];
function check(label, cond, detail = '') { results.push({ label, pass: !!cond, detail: cond ? '' : String(detail).slice(0, 400) }); console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond ? '' : '  -> ' + detail)); }
async function call(method, p, { body, token, headers = {} } = {}) {
  const r = await fetch(base + p, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch {}
  return { status: r.status, json, text };
}
async function customerToken(phone) { const s = await call('POST', '/api/auth/send-otp', { body: { phone } }); return (await call('POST', '/api/auth/verify-otp', { body: { phone, otp: s.json.devOtp } })).json.token; }
async function staffToken(email, password) { return (await call('POST', '/api/admin/auth/login', { body: { email, password } })).json.token; }
const P = '9876500021', E = '9876500022', P_TOTAL = '₹2,468.10';
const profile = (phone, name) => ({ phoneNumber: phone, name, email: name.toLowerCase().replace(/\s+/g, '.') + '@example.test', occupation: 'Salaried', qualification: 'Graduate', annualIncome: '600000', pincode: '411001', dateOfBirth: { day: '1', month: '2', year: '1990' } });
const REMOVED = ['Invite a friend', 'Invite friends to Paisa Mart', 'BETTER, TOGETHER', 'Invite friends to start their journey', 'Earn Upto', 'Earn upto', '1 Lakh', 'Total Earnings'];

async function seedApprovedPayout(admin, t) {
  const lead = await call('POST', '/api/business-loans/leads', { body: { fullName: 'Home Payout P', phoneNumber: P, cibil: '760', dateOfBirth: '01/02/1990', city: 'Pune', state: 'Maharashtra', monthlyIncome: '85000', existingEmi: '0', loanAmountRequired: '700000', businessType: 'Retail', loanPurpose: 'Expansion' }, headers: { 'Idempotency-Key': 'home-verify-' + randomUUID() } });
  const id = 'BL-' + lead.json.data.id;
  const row = async () => (await call('GET', '/api/admin/operations/applications?pageSize=100', { token: admin })).json.data.find(x => x.id === id);
  const s = await call('PATCH', '/api/admin/operations/applications/' + id, { token: t.ops1, body: { version: (await row()).version, stage: 'disbursed' } });
  const p = await call('PUT', '/api/admin/operations/applications/' + id + '/payout', { token: t.ops1, body: { version: (await row()).version, customerAmount: '2468.10', paisamartAmount: '1.00' } });
  const e = await call('POST', '/api/admin/operations/applications/' + id + '/payout/approve', { token: t.exec1, body: { version: (await row()).version } });
  const m = await call('POST', '/api/admin/operations/applications/' + id + '/payout/approve', { token: t.mgr1, body: { version: (await row()).version } });
  check('seed approved payout ' + id, [s, p, e, m].every(r => r.status === 200), [s, p, e, m].map(r => r.status + ' ' + r.text.slice(0, 120)).join(' | '));
}

async function openHome(browser, width, token, who) {
  const context = await browser.newContext({ viewport: { width, height: width >= 768 ? 1000 : 800 } });
  await context.route('**/*', route => { const u = route.request().url(); if (!u.startsWith(base)) { external.push(who + '@' + width + ' ' + u); return route.abort(); } return route.continue(); });
  await context.addInitScript(([tok, p]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('paisa_mart_auth_token', tok); localStorage.setItem('user-profile-storage', JSON.stringify({ state: { profile: p }, version: 0 })); localStorage.setItem('auth.mpinHash', 'x'); sessionStorage.setItem('seeded', '1'); } }, [token, profile(who === 'P' ? P : E, 'Home ' + who)]);
  const page = await context.newPage(); page.setDefaultTimeout(20000);
  page.on('pageerror', e => pageErrors.push(who + '@' + width + ': ' + e.message));
  await page.goto(base + '/profile');
  await page.getByText('Home', { exact: true }).last().click();
  await page.getByText('Learn. Build. Grow.').first().waitFor();
  return { context, page };
}

async function homeChecks(page, width, who, expectTotal) {
  const tag = `[${who} ${width}px] `;
  await page.getByText(expectTotal, { exact: true }).first().waitFor().catch(() => {});
  // Text of the active screen only: inactive tabs stay mounted under aria-hidden="true" (Profile has its own
  // "Invite friends" item, which must remain there).
  const body = await page.evaluate(() => [...document.querySelectorAll('body *')]
    .filter(e => e.childElementCount === 0 && e.checkVisibility({ opacityProperty: true, visibilityProperty: true }) && !e.closest('[aria-hidden="true"]'))
    .map(e => e.textContent).join('\n'));
  for (const s of REMOVED) check(tag + 'absent: "' + s + '"', !body.includes(s), 'found');
  check(tag + 'Learn card present', body.includes('Learn. Build. Grow.') && body.includes('Explore learning'));
  check(tag + 'approved payout total ' + expectTotal, body.includes('Approved eligible payouts') && body.includes(expectTotal), body.slice(0, 600));
  const ov = await page.evaluate(() => {
    const sw = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const wide = [...document.querySelectorAll('body *')].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1) && el.checkVisibility(); }).length;
    return { sw, iw: innerWidth, wide };
  });
  check(tag + 'no horizontal page overflow', ov.sw <= ov.iw, JSON.stringify(ov));
  const card = page.getByText('Learn. Build. Grow.').first(); const box = await card.boundingBox();
  check(tag + 'Learn card inside viewport width', box && box.x >= 0 && box.x + box.width <= width, JSON.stringify(box));
  // Close-up of the section where the removed card used to be (viewport shot, no re-layout).
  await card.scrollIntoViewIfNeeded(); await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, `home-${who}-${width}-section.png`) });
  // Full length: the app scrolls inside its own container, so grow the viewport to that container's height.
  const vp = page.viewportSize();
  const fullH = await page.evaluate(() => Math.max(...[...document.querySelectorAll('body *')].filter(e => !e.closest('[aria-hidden="true"]') && e.scrollHeight > e.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)).map(e => e.scrollHeight - e.clientHeight), 0));
  await page.setViewportSize({ width: vp.width, height: Math.min(vp.height + fullH, 6000) }); await page.waitForTimeout(1200);
  await page.evaluate(() => [...document.querySelectorAll('body *')].forEach(e => { if (e.scrollTop) e.scrollTop = 0; }));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, `home-${who}-${width}.png`) });
  await page.setViewportSize(vp); await page.waitForTimeout(400);
}

(async () => {
  const admin = await staffToken('admin@example.test', ADMIN_PW);
  for (const [email, role] of [['ops1@example.test', 'ops'], ['exec1@example.test', 'executive'], ['mgr1@example.test', 'manager']]) {
    const r = await call('POST', '/api/admin/operations/staff', { token: admin, body: { name: email.split('@')[0], email, role, password: PW, active: true } });
    check('create staff ' + email, r.status === 200, r.text);
  }
  const t = { ops1: await staffToken('ops1@example.test', PW), exec1: await staffToken('exec1@example.test', PW), mgr1: await staffToken('mgr1@example.test', PW) };
  const tP = await customerToken(P), tE = await customerToken(E);
  for (const [tk, ph, n] of [[tP, P, 'Home P'], [tE, E, 'Home E']]) check('profile ' + ph, (await call('POST', '/api/users/profile', { token: tk, body: profile(ph, n) })).status === 200);
  await seedApprovedPayout(admin, t);
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    for (const width of [360, 390, 768, 1440]) {
      for (const [who, tok, total] of [['P', tP, P_TOTAL], ['E', tE, '₹0.00']]) {
        if (who === 'E' && width > 390) continue; // empty state checked at phone widths
        const { context, page } = await openHome(browser, width, tok, who);
        try {
          await homeChecks(page, width, who, total);
          if (who === 'P') {
            const tag = `[P ${width}px] nav: `;
            await page.getByText('Learn. Build. Grow.').first().click();
            await page.waitForURL(u => /\/learn/.test(u.pathname));
            check(tag + 'Learn card opens /learn', /\/learn/.test(new URL(page.url()).pathname), page.url());
            for (const [tab, expect] of [['Home', 'Learn. Build. Grow.'], ['Products', null], ['Earnings', P_TOTAL], ['Profile', 'Invite friends'], ['Home', P_TOTAL]]) {
              await page.getByText(tab, { exact: true }).last().click();
              if (expect) await page.getByText(expect, { exact: true }).first().waitFor().catch(() => {});
              await page.waitForTimeout(400);
              const txt = await page.evaluate(() => document.body.innerText);
              check(tag + tab + ' tab' + (expect ? ' shows "' + expect + '"' : ' opens') + ' (' + new URL(page.url()).pathname + ')', expect ? txt.includes(expect) : /products/.test(page.url()), new URL(page.url()).pathname);
            }
          }
        } catch (e) { check(`[${who} ${width}px] harness error`, false, e.stack); }
        await context.close();
      }
    }
  } finally {
    check('no uncaught runtime errors', pageErrors.length === 0, pageErrors.join('; '));
    // The backend (src/index.ts, unchanged here) injects a Google Fonts <link> into every served page; it was aborted.
    const fonts = external.filter(u => /https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u.split(' ')[1]));
    console.log('INFO pre-existing backend-injected font requests aborted: ' + fonts.length);
    check('no other non-loopback browser requests', external.length === fonts.length, external.filter(u => !fonts.includes(u)).slice(0, 5).join('; '));
    const pass = results.filter(r => r.pass).length, fail = results.length - pass;
    console.log('\nHome verification: ' + pass + ' pass / ' + fail + ' fail');
    fs.writeFileSync(path.join(outDir, 'home-results.json'), JSON.stringify({ pass, fail, results, pageErrors, external }, null, 2));
    await browser.close(); process.exit(fail ? 1 : 0);
  }
})().catch(e => { console.error(e); process.exit(2); });
