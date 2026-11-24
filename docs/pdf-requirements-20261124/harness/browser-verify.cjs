// Browser verification of the BUILT web export served by the REAL local backend (synthetic data only).
// Every request to a non-loopback origin is aborted. Usage: node browser-verify.cjs <out-dir>
const { chromium } = require('C:/Users/Swetha Anusha/Pictures/CHAITANYA/paisa mart/paisa-mart/.dash/.preview/browser-tools/node_modules/playwright-core');
const fs = require('fs'), path = require('path'), { randomUUID } = require('crypto');
const base = 'http://127.0.0.1:3911';
const outDir = process.argv[2]; fs.mkdirSync(outDir, { recursive: true });
const results = [], pageErrors = [], htmlForJson = [], blocked = new Set();
function check(area, label, cond, detail = '') {
  results.push({ area, label, pass: !!cond, detail: cond ? '' : String(detail).slice(0, 500) });
  console.log((cond ? 'PASS ' : 'FAIL ') + area + ' :: ' + label + (cond ? '' : '  -> ' + String(detail).slice(0, 300)));
}
async function call(method, p, { body, token, headers = {} } = {}) {
  const r = await fetch(base + p, { method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}), ...headers }, body: body !== undefined ? JSON.stringify(body) : undefined });
  const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch {}
  return { status: r.status, json, text };
}
const PW = process.env.LOCAL_STAFF_PASSWORD, ADMIN_PW = process.env.LOCAL_ADMIN_PASSWORD; // random per run (verify-all.sh)
if (!PW || !ADMIN_PW) throw new Error('Run through verify-all.sh: LOCAL_STAFF_PASSWORD and LOCAL_ADMIN_PASSWORD are required');
const staffToken = async (email, pw = PW) => (await call('POST', '/api/admin/auth/login', { body: { email, password: pw } })).json.token;
async function customerToken(phone) {
  const s = await call('POST', '/api/auth/send-otp', { body: { phone } });
  return (await call('POST', '/api/auth/verify-otp', { body: { phone, otp: s.json.devOtp } })).json.token;
}
const idem = () => 'local-verify-' + randomUUID();
const loan = (phone, name) => ({ fullName: name, phoneNumber: phone, cibil: '760', dateOfBirth: '01/02/1990', city: 'Pune', state: 'Maharashtra', monthlyIncome: '85000', existingEmi: '0', loanAmountRequired: '700000' });
const C = '9876500003', D = '9876500004';
const profile = (phone, name) => ({ phoneNumber: phone, name, email: name.toLowerCase().replace(/\s+/g, '.') + '@example.test', occupation: 'Salaried', qualification: 'Graduate', annualIncome: '600000', pincode: '411001', dateOfBirth: { day: '1', month: '2', year: '1990' } });

(async () => {
  // ---------- seed (real public routes) ----------
  const admin = await staffToken('admin@example.test', ADMIN_PW);
  const tC = await customerToken(C), tD = await customerToken(D);
  for (const [tok, p, n] of [[tC, C, 'Browser Customer C'], [tD, D, 'Browser Customer D']]) {
    const r = await call('POST', '/api/users/profile', { token: tok, body: profile(p, n) });
    check('setup', 'synthetic profile ' + p, r.status === 200, r.text);
  }
  const seeds = [
    ['/api/home-loans/leads', { ...loan(C, 'Home C'), loanType: 'House Purchase' }],
    ['/api/business-loans/leads', { ...loan(C, 'Business C'), businessType: 'Retail', loanPurpose: 'Expansion' }, true],
    ['/api/personal-loans/applications', { ...loan(C, 'Personal C'), requestKey: randomUUID(), companyName: 'Synthetic Co', employmentType: 'Private' }],
    ['/api/vehicle-loans/leads', { ...loan(C, 'Vehicle C'), occupation: 'Salaried', vehicleCondition: 'Used Vehicle', vehicleType: 'Car' }, true],
    ['/api/services/bank-accounts/applications', { fullName: 'Bank C', phoneNumber: C, provider: 'Synthetic Bank', productName: 'Savings' }, true],
    ['/api/services/insta-loans/applications', { fullName: 'Insta C', phoneNumber: C, provider: 'Synthetic Lender', productName: 'Insta' }, true],
    ['/api/business-loans/leads', { ...loan(D, 'Business D'), businessType: 'Trading', loanPurpose: 'Stock' }, true],
  ];
  for (const [p, body, key] of seeds) { const r = await call('POST', p, { body, headers: key ? { 'Idempotency-Key': idem() } : {} }); check('setup', 'seed ' + p + ' ' + body.fullName, r.status === 200, r.text); }
  const rows = async (tok = admin) => (await call('GET', '/api/admin/operations/applications?pageSize=100', { token: tok })).json.data;
  const all = await rows();
  const byName = n => all.find(r => r.userName === n);
  const id = { HL: byName('Home C').id, BL: byName('Business C').id, PL: byName('Personal C').id, VL: byName('Vehicle C').id, BA: byName('Bank C').id, IL: byName('Insta C').id, BLD: byName('Business D').id };

  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  async function ctx(width, height = 1000) {
    const context = await browser.newContext({ viewport: { width, height } });
    await context.route('**/*', r => { const u = r.request().url(); if (u.startsWith(base) || u.startsWith('data:') || u.startsWith('blob:')) return r.continue(); blocked.add(new URL(u).origin); return r.abort(); });
    const page = await context.newPage(); page.setDefaultTimeout(20000);
    page.on('pageerror', e => pageErrors.push(e.message));
    page.on('response', async res => { const u = res.url(); if (u.startsWith(base + '/api/')) { const ct = res.headers()['content-type'] || ''; if (ct.includes('text/html')) htmlForJson.push(res.request().method() + ' ' + u.replace(base, '') + ' ' + res.status()); } });
    return { context, page };
  }
  const shot = async (page, name) => page.screenshot({ path: path.join(outDir, name + '.png'), fullPage: false });
  // The admin store is in-memory by design (pre-existing): a browser reload returns to sign-in.
  // "Reload" below therefore means: full page reload -> sign in again -> reopen the lead from the Leads list.
  async function signIn(s) {
    await s.page.goto(base + '/admin');
    await s.page.getByPlaceholder('admin@paisamart.com').fill(s.email);
    await s.page.getByPlaceholder('Enter password', { exact: true }).fill(s.pw);
    await s.page.getByText('Sign In', { exact: true }).last().click();
    await s.page.getByText('Refresh data', { exact: true }).first().waitFor();
  }
  async function staffLogin(email, pw = PW, width = 1440) {
    const s = { ...(await ctx(width)), email, pw };
    await signIn(s);
    return s;
  }
  const bodyText = page => page.locator('body').innerText();
  const names = { HL: 'Home C', BL: 'Business C', PL: 'Personal C', VL: 'Vehicle C', BA: 'Bank C', IL: 'Insta C', BLD: 'Business D' };
  async function openLead(s, key) {
    await s.page.getByText("Refresh data", { exact: true }).first().click(); await s.page.waitForTimeout(1500);
    await s.page.getByText('Leads', { exact: true }).first().click();
    await s.page.getByText(names[key], { exact: true }).first().click();
    await s.page.getByText(id[key], { exact: true }).first().waitFor();
  }
  async function reloadLead(s, key) {
    await s.page.reload(); await signIn(s); await openLead(s, key);
  }
  async function openHome(s, reload = false) {
    if (reload) { await s.page.reload(); await signIn(s); }
    await s.page.getByText('Home Loan Pipeline', { exact: true }).first().click();
    await s.page.getByText('Home C', { exact: true }).first().click();
    await s.page.getByText(id.HL, { exact: true }).waitFor();
  }
  async function stageOptions(page) {
    await page.getByText('Change Stage', { exact: true }).first().click();
    await page.getByText('Update Stage', { exact: true }).waitFor();
    const t = await bodyText(page);
    const seg = t.slice(t.lastIndexOf('Change Stage') + 'Change Stage'.length, t.lastIndexOf('Update Stage'));
    return seg.split('\n').map(s => s.trim()).filter(Boolean).filter(s => s !== '(current)' && !/^Reason/.test(s));
  }
  async function chooseStage(page, label) {
    await page.getByText(label, { exact: true }).last().click();
    await page.getByText('Update Stage', { exact: true }).click();
    await page.getByText('Update Stage', { exact: true }).waitFor({ state: 'detached' });
  }
  const headerStage = async page => (await bodyText(page)).split('\n').map(s => s.trim()).filter(Boolean);

  try {
    // ================= A + B in the admin UI (ops1, desktop) =================
    const ops = await staffLogin('ops1@example.test');
    const expected = {
      BL: ['New leads', 'Contacted', 'Documents pending', 'Login / application submitted', 'Underwriting', 'Sanctioned', 'Disbursed', 'Rejected / dropped', 'Payout'],
      IL: ['Leads', 'Logins', 'Loan Net Disbursement', 'Rejected', 'Payout'],
    };
    for (const key of ['BL', 'PL', 'VL', 'IL']) {
      await openLead(ops, key);
      const opts = await stageOptions(ops.page);
      const want = key === 'IL' ? expected.IL : expected.BL;
      const iR = opts.findIndex(o => /^Rejected/.test(o));
      check('A', key + ' Change Stage lists Payout immediately after Rejected (UI)', JSON.stringify(opts.map(o => o.replace(/\(current\)/, '').trim())) === JSON.stringify(want) && opts[iR + 1] === 'Payout', JSON.stringify(opts));
      if (key === 'BL') await shot(ops.page, 'A-business-change-stage-desktop');
      await chooseStage(ops.page, 'Payout');
      await reloadLead(ops, key);
      const t = await bodyText(ops.page);
      check('A', key + ' Payout selection persists after full reload', t.includes('Payout selected'), t.slice(0, 200));
      const reopened = await stageOptions(ops.page);
      check('A', key + ' Payout marked current and stage unchanged (New/Leads still current)', /Payout\s*\(current\)/.test((await bodyText(ops.page))) && /(New leads|Leads)\s*\(current\)/.test(await bodyText(ops.page)), JSON.stringify(reopened));
      await ops.page.reload(); await signIn(ops);
    }
    // B: Business Sanctioned via the UI
    await openLead(ops, "BL");
    await stageOptions(ops.page);
    await chooseStage(ops.page, 'Sanctioned');
    await reloadLead(ops, "BL");
    let lines = await headerStage(ops.page);
    check('B', 'Business Sanctioned saved via UI and shown after reload', lines[lines.indexOf(id.BL) + 1] === 'Sanctioned', lines.slice(lines.indexOf(id.BL) - 1, lines.indexOf(id.BL) + 3).join(' | '));
    const blRow = (await rows()).find(r => r.id === id.BL);
    check('B', 'Business Sanctioned persisted in backend with stage history', blRow.stage === 'approved' && blRow.stageHistory.at(-1)?.toStage === 'approved' && blRow.stageHistory.at(-1)?.changedBy === 'ops1@example.test' && blRow.payoutStatus === 'selected', JSON.stringify([blRow.stage, blRow.stageHistory, blRow.payoutStatus]));
    await ops.page.getByText('Journey', { exact: true }).first().click().catch(() => {});
    check('B', 'Journey shows Stage: New leads → Sanctioned', (await bodyText(ops.page)).includes('New leads → Sanctioned'));
    await shot(ops.page, 'B-business-sanctioned-desktop');
    // Disbursed via UI for BL, PL, VL
    for (const key of ['BL', 'PL', 'VL']) {
      await openLead(ops, key);
      check('C', key + ' payout box says it is available after Disbursed before prerequisite', (await bodyText(ops.page)).includes('Available after Disbursed.'));
      await stageOptions(ops.page); await chooseStage(ops.page, 'Disbursed');
      await reloadLead(ops, key);
      check('C', key + ' reaches Disbursed via UI; payout fields appear', (await ops.page.getByLabel('Customer Eligible Payout (₹)', { exact: true }).count()) === 1);
    }
    // BA activation (requires provider decision + evidence): set through the real ops API, then UI must show the fields.
    { const cur = (await rows()).find(r => r.id === id.BA); const t1 = await staffToken('ops1@example.test');
      const r = await call('PATCH', '/api/admin/operations/applications/' + id.BA, { token: t1, body: { version: cur.version, stage: 'approved', provider: 'Synthetic Bank', providerDecision: 'approved', providerEvidence: 'Synthetic evidence' } });
      check('D', 'BA Account Activation recorded (provider evidence via ops API)', r.status === 200, r.text); }
    await openLead(ops, "BA");
    check('D', 'BA at Account Activation shows editable payout fields', (await ops.page.getByLabel('Paisamart Eligible Payout (₹)', { exact: true }).count()) === 1 && (await bodyText(ops.page)).includes('Account Activation'));
    // HL via Home Loan Pipeline as env admin
    const adm = await staffLogin('admin@example.test', ADMIN_PW);
    await openHome(adm);
    await adm.page.getByText('New leads', { exact: true }).last().click();
    let t = await bodyText(adm.page);
    const homeOpts = ['New leads', 'Contacted', 'Documents pending', 'Login / application submitted', 'Underwriting', 'Sanctioned', 'Disbursed', 'Rejected / dropped', 'Payout'];
    const pos = homeOpts.map(o => t.lastIndexOf('\n' + o + '\n'));
    check('A', 'HL pipeline dropdown lists Payout immediately after Rejected / dropped', pos.every(p => p >= 0) && pos.slice(1).every((p, i) => p > pos[i]) && t.slice(pos[7], pos[8]).split('\n').filter(Boolean).length === 1, JSON.stringify(pos));
    await shot(adm.page, 'A-home-pipeline-dropdown-desktop');
    await adm.page.getByText('Payout', { exact: true }).last().click();
    await adm.page.getByText('Save changes', { exact: true }).click();
    await adm.page.waitForTimeout(1500);
    await openHome(adm, true);
    check('A', 'HL Payout selection persists after reload without changing pipeline stage', (await bodyText(adm.page)).includes('Payout selected') && (await rows()).find(r => r.id === id.HL).homeStage === 'new');
    await adm.page.getByText('New leads', { exact: true }).last().click();
    await adm.page.getByText('Disbursed', { exact: true }).last().click();
    await adm.page.getByText('Save changes', { exact: true }).click();
    await adm.page.waitForTimeout(1500);
    await openHome(adm, true);
    check('C', 'HL Disbursed via pipeline shows payout fields', (await adm.page.getByLabel('Customer Eligible Payout (₹)', { exact: true }).count()) === 1);

    // ================= C/D/E: amounts via UI, approvals via UI =================
    const amounts = { HL: ['15000.50', '4500.25'], BL: ['2500.75', '800'], PL: ['1200', '0.45'], VL: ['3210.7', '99'], BA: ['250', '750.4'] };
    async function enter(page, a, b) {
      await page.getByLabel('Customer Eligible Payout (₹)', { exact: true }).fill(a);
      await page.getByLabel('Paisamart Eligible Payout (₹)', { exact: true }).fill(b);
      await page.getByText('Save payout amounts', { exact: true }).click();
      await page.getByText('Executive: Approval pending', { exact: true }).first().waitFor();
    }
    const norm = v => { const [w, f = ''] = v.split('.'); return w + '.' + f.padEnd(2, '0'); };
    for (const key of ['BL', 'PL', 'VL', 'BA']) {
      await openLead(ops, key);
      await ops.page.getByLabel('Customer Eligible Payout (₹)', { exact: true }).fill('-5');
      check('C', key + ' UI disables save for a negative amount', await ops.page.getByText('Save payout amounts', { exact: true }).evaluate(el => { let n = el; while (n && n.getAttribute && n.getAttribute('aria-disabled') === null && n.parentElement) n = n.parentElement; return n?.getAttribute?.('aria-disabled') === 'true'; }));
      await enter(ops.page, ...amounts[key]);
      await reloadLead(ops, key);
      const v1 = await ops.page.getByLabel('Customer Eligible Payout (₹)', { exact: true }).inputValue(), v2 = await ops.page.getByLabel('Paisamart Eligible Payout (₹)', { exact: true }).inputValue();
      check(key === 'BA' ? 'D' : 'C', key + ' amounts entered in UI persist after reload', v1 === norm(amounts[key][0]) && v2 === norm(amounts[key][1]), v1 + ' / ' + v2);
    }
    await enter(adm.page, ...amounts.HL);
    await openHome(adm, true);
    check('C', 'HL amounts entered in pipeline persist after reload', (await adm.page.getByLabel('Customer Eligible Payout (₹)', { exact: true }).inputValue()) === '15000.50');
    await shot(ops.page, 'C-bank-account-payout-entry-desktop');

    // customer C (390 px) sees nothing yet
    const cust = await ctx(390, 844);
    await cust.context.addInitScript(([tok, p]) => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('paisa_mart_auth_token', tok); localStorage.setItem('user-profile-storage', JSON.stringify({ state: { profile: p }, version: 0 })); localStorage.setItem('auth.mpinHash', 'x'); sessionStorage.setItem('seeded', '1'); } }, [tC, profile(C, 'Browser Customer C')]);
    await cust.page.goto(base + '/customer-payouts');
    await cust.page.getByText('No approved payout details are available.', { exact: true }).waitFor();
    check('E', 'customer sees no payout before approvals (UI)', true);

    // executive approves all via Payouts tab (phone width)
    const ex = await staffLogin('exec1@example.test', PW, 390);
    await ex.page.getByText('Payouts', { exact: true }).first().click();
    await ex.page.getByText('Eligible payout', { exact: true }).first().waitFor();
    check('E', 'executive sees amounts read-only (no edit fields) on Payouts tab', (await ex.page.getByLabel('Customer Eligible Payout (₹)', { exact: true }).count()) === 0 && (await bodyText(ex.page)).includes('Paisamart Eligible Payout: ₹750.40'));
    for (let i = 0; i < 5; i++) { const n = ((await bodyText(ex.page)).match(/Executive: Approved by exec1/g) || []).length; await ex.page.getByText('Approve as executive', { exact: true }).nth(i).click(); await ex.page.waitForFunction(k => (document.body.innerText.match(/Executive: Approved by exec1/g) || []).length > k, n, { timeout: 20000 }); }
    t = await bodyText(ex.page);
    check('E', 'executive approved all five products in UI', (t.match(/Executive: Approved by exec1@example\.test/g) || []).length >= 5, (t.match(/Executive: Approved by exec1/g) || []).length);
    await shot(ex.page, 'E-executive-payouts-phone');
    await cust.page.reload(); await cust.page.getByText('No approved payout details are available.', { exact: true }).waitFor();
    check('E', 'one approval keeps customer payout hidden (UI)', true);
    // manager approves via lead details
    const mg = await staffLogin('mgr1@example.test');
    for (const key of ['BL', 'PL', 'VL', 'BA', 'HL']) {
      await openLead(mg, key);
      await mg.page.getByText('Approve as manager', { exact: true }).click();
      await mg.page.getByText('Manager: Approved by mgr1@example.test', { exact: true }).waitFor();
    }
    check('E', 'manager approved all five in lead details', true);
    await cust.page.reload();
    await cust.page.getByText('Customer Eligible Payout: ₹2500.75', { exact: true }).waitFor();
    t = await bodyText(cust.page);
    check('E', 'after both approvals applicant sees only customer amounts for all five', ['15000.50', '2500.75', '1200.00', '3210.70', '250.00'].every(a => t.includes('₹' + a)) && !['4500.25', '800.00', '99.00', '750.40', '0.45'].some(a => t.includes(a)), t);
    check('E', 'customer payout page fits phone width', await cust.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await shot(cust.page, 'E-customer-payouts-phone');
    // edit clears approvals (UI)
    await openLead(ops, "BL");
    await ops.page.getByLabel('Paisamart Eligible Payout (₹)', { exact: true }).fill('801');
    await ops.page.getByText('Save payout amounts', { exact: true }).click();
    await ops.page.getByText('Manager: Approval pending', { exact: true }).waitFor();
    check('E', 'UI edit of Paisamart amount clears both approvals', (await bodyText(ops.page)).includes('Executive: Approval pending'));
    await cust.page.reload(); await cust.page.getByText('Customer Eligible Payout: ₹1200.00', { exact: true }).waitFor();
    check('E', 'edited BL amount hidden from applicant again', !(await bodyText(cust.page)).includes('2500.75'));
    // viewer
    const vw = await staffLogin('viewer1@example.test');
    await vw.page.getByText('Payouts', { exact: true }).first().click();
    await vw.page.getByText('Payout review requires authorized staff access.', { exact: true }).waitFor();
    await openLead(vw, "PL");
    check('E', 'viewer sees no payout amounts or controls', !(await bodyText(vw.page)).includes('Eligible Payout') && !(await bodyText(vw.page)).includes('1200.00'));

    // ================= F: customer lead profiles =================
    await cust.page.goto(base + '/profile');
    await cust.page.getByText('My applications & status', { exact: true }).click();
    await cust.page.getByText('My applications', { exact: true }).waitFor();
    await cust.page.getByText(id.HL, { exact: true }).waitFor();
    t = await bodyText(cust.page);
    check('F', 'customer C reaches My applications from Profile and sees all 6 own records', [id.HL, id.BL, id.PL, id.VL, id.BA, id.IL].every(x => t.includes(x)) && !t.includes(id.BLD), t.slice(0, 400));
    check('F', 'list shows admin stages (Sanctioned→Disbursed, Account Activation)', t.includes('Disbursed') && t.includes('Account Activation'));
    check('F', 'no internal data on customer screen', !['ops1@', 'mgr1@', 'exec1@', 'Synthetic evidence', '760', '85000', '4500.25', 'Paisamart'].some(s => t.includes(s)));
    check('F', 'My applications fits phone width', await cust.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await shot(cust.page, 'F-my-applications-phone');
    // admin changes IL stage → customer refresh and reload
    { const cur = (await rows()).find(r => r.id === id.IL); const t1 = await staffToken('ops1@example.test');
      const r = await call('PATCH', '/api/admin/operations/applications/' + id.IL, { token: t1, body: { version: cur.version, stage: 'submitted' } }); check('F', 'admin moves IL to Logins', r.status === 200, r.text); }
    await cust.page.getByText('Refresh status', { exact: true }).click();
    await cust.page.waitForFunction(() => document.body.innerText.includes('Logins'));
    check('F', 'stage change appears after Refresh status', true);
    await cust.page.reload(); await cust.page.getByText(id.IL, { exact: true }).waitFor();
    check('F', 'stage change and record retained after full reload', (await bodyText(cust.page)).includes('Logins'));
    // error state: backend error must not show stale/other data
    await cust.page.route('**/api/customer-applications', r => r.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Your applications are unavailable. Please retry.' }) }));
    await cust.page.getByText('Refresh status', { exact: true }).click();
    await cust.page.getByText('Your applications are unavailable. Please retry.', { exact: true }).waitFor();
    check('F', 'error state hides previously loaded records', !(await bodyText(cust.page)).includes(id.HL));
    await cust.page.unroute('**/api/customer-applications');
    // logout then customer D signs in through the real UI in the same tab (no reload)
    await cust.page.goto(base + '/profile');
    await cust.page.getByText('My applications & status', { exact: true }).click();
    await cust.page.getByText(id.HL, { exact: true }).waitFor();
    check('F', 'C list loaded in-app before logout', true);
    await cust.page.evaluate(() => { window.__sameSession = 1; });
    await cust.page.getByText('← Back', { exact: true }).click();
    await cust.page.getByText('My home loan applications', { exact: true }).click();
    await cust.page.getByText(id.HL, { exact: true }).waitFor();
    check('F', 'C home loan status loaded in-app before logout', true);
    await cust.page.getByText('← Back', { exact: true }).click();
    await cust.page.getByText('Log out', { exact: true }).first().click();
    await cust.page.getByText('Log out', { exact: true }).last().click();
    // Pre-existing (not in the PDFs): logout lands on /basic-info because the tabs guard redirects first.
    await cust.page.waitForURL(u => !u.pathname.startsWith('/profile'));
    check('F', 'logout clears the customer token', await cust.page.evaluate(() => !localStorage.getItem('paisa_mart_auth_token')));
    // Client-side history navigation (no reload) keeps the in-memory React Query cache, as a real SPA session does.
    await cust.page.evaluate(() => { history.pushState(null, '', '/'); dispatchEvent(new PopStateEvent('popstate', { state: null })); });
    await cust.page.getByLabel('Mobile number').waitFor();
    check('F', 'same tab reaches sign-in without reload', await cust.page.evaluate(() => window.__sameSession === 1));
    let devOtp = null;
    cust.page.on('response', async res => { if (res.url().endsWith('/api/auth/send-otp')) { try { devOtp = (await res.json()).devOtp; } catch {} } });
    await cust.page.getByLabel('Mobile number').fill(D);
    await cust.page.getByText('Get started', { exact: true }).click();
    await cust.page.getByLabel('OTP digit 1').waitFor();
    for (let i = 0; i < 6; i++) await cust.page.getByLabel('OTP digit ' + (i + 1)).fill(devOtp[i]);
    await cust.page.getByText('Verify & continue', { exact: true }).click();
    await cust.page.waitForURL(u => !u.pathname.includes('otp'), { timeout: 20000 });
    await cust.page.getByText('Profile', { exact: true }).last().click();
    await cust.page.getByText('My applications & status', { exact: true }).waitFor();
    await cust.page.evaluate(cIds => { window.__leak = []; const scan = () => { const t = document.body.innerText; for (const i of cIds) if (t.includes(i) && !window.__leak.includes(i)) window.__leak.push(i); }; new MutationObserver(scan).observe(document.body, { subtree: true, childList: true, characterData: true }); }, [id.HL, id.BL, id.PL, id.VL, id.BA, id.IL]);
    await cust.page.getByText('My applications & status', { exact: true }).click();
    await cust.page.getByText(id.BLD, { exact: true }).waitFor();
    await cust.page.waitForTimeout(500);
    const seenA = await cust.page.evaluate(() => window.__leak);
    t = await bodyText(cust.page);
    check('F', 'D session is the same page session (no reload)', await cust.page.evaluate(() => window.__sameSession === 1));
    check('F', "after logout, customer D never sees customer C's cached records (in-app navigation)", seenA.length === 0, 'C reference numbers rendered on D screen: ' + seenA.join(', '));
    check('F', "customer D's list shows only D's record", t.includes(id.BLD) && ![id.HL, id.BL, id.PL, id.VL, id.BA, id.IL].some(x => t.includes(x)));
    await shot(cust.page, 'F-customer-D-after-switch-phone');
    await cust.page.getByText('← Back', { exact: true }).click();
    await cust.page.getByText('My home loan applications', { exact: true }).waitFor();
    await cust.page.evaluate(hl => { window.__leak2 = []; new MutationObserver(() => { if (document.body.innerText.includes(hl) && !window.__leak2.length) window.__leak2.push(hl); }).observe(document.body, { subtree: true, childList: true, characterData: true }); }, id.HL);
    await cust.page.getByText('My home loan applications', { exact: true }).click();
    await cust.page.getByText('No applications found for your signed-in mobile number.', { exact: true }).waitFor();
    await cust.page.waitForTimeout(500);
    check('F', "after logout, customer D never sees customer C's cached home loan status", (await cust.page.evaluate(() => window.__leak2)).length === 0);
    // direct API: D cannot read C
    const dList = await call('GET', '/api/customer-applications', { token: tD });
    check('F', 'API: customer D list excludes C', dList.json.data.length === 1 && dList.json.data[0].referenceNumber === id.BLD);

    // ================= admin smoke (desktop + phone) =================
    for (const [label, width] of [['desktop', 1440], ['phone', 390]]) {
      const s = await staffLogin('admin@example.test', ADMIN_PW, width); // fresh session per width
      for (const tab of ['Overview', 'Leads', 'Home Loan Pipeline', 'Pipeline', 'Products', 'Incentives', 'Payouts', 'Tasks', 'Analytics', 'Settings', 'Utility Txns', 'Health Ins.', 'Motor Ins.', 'Life Ins.']) {
        const before = pageErrors.length;
        try {
          const link = s.page.getByText(tab, { exact: true }).first();
          await link.evaluate(el => el.scrollIntoView({ inline: 'center', block: 'nearest' }));
          await s.page.waitForTimeout(300);
          await link.click();
          await s.page.waitForTimeout(1200);
          const txt = await bodyText(s.page);
          check('smoke', label + ' ' + tab + ' opens without runtime error', pageErrors.length === before && !/Something went wrong|Unexpected token '<'/i.test(txt), pageErrors.slice(before).join('; ') || txt.slice(0, 200));
        } catch (e) { check('smoke', label + ' ' + tab + ' opens', false, e.message); await shot(s.page, 'smoke-fail-' + label + '-' + tab.replace(/W+/g, '_')).catch(() => {}); }
      }
      if (label === 'phone') await shot(s.page, 'smoke-admin-phone-last-tab');
      await s.page.getByLabel('Sign out of admin').first().click().catch(() => {});
    }
  } catch (e) {
    check('harness', 'unexpected error', false, e.stack);
    for (const c of browser.contexts()) for (const [i, p] of c.pages().entries()) await p.screenshot({ path: path.join(outDir, 'error-' + Math.random().toString(36).slice(2, 6) + '-' + i + '.png'), fullPage: true }).catch(() => {});
  } finally {
    check('safety', 'no /api/ request received index.html', htmlForJson.length === 0, htmlForJson.join('; '));
    check('safety', 'no uncaught browser runtime errors', pageErrors.length === 0, pageErrors.join('; '));
    const pass = results.filter(r => r.pass).length, fail = results.length - pass;
    console.log('\nBrowser verification: ' + pass + ' pass / ' + fail + ' fail; aborted outside origins: ' + [...blocked].join(', '));
    fs.writeFileSync(path.join(outDir, 'browser-results.json'), JSON.stringify({ ids: id, pass, fail, blockedOrigins: [...blocked], htmlForJson, pageErrors, results }, null, 2));
    await browser.close();
    process.exit(fail ? 1 : 0);
  }
})().catch(e => { console.error(e); process.exit(2); });
