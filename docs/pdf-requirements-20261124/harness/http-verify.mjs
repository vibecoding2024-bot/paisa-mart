// HTTP-level verification against the REAL local backend (src/index.ts) with synthetic data only.
// Usage: node http-verify.mjs <out.json>     BASE defaults to http://127.0.0.1:3911 (loopback enforced).
import { writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
const base = process.env.BASE || 'http://127.0.0.1:3911';
if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(base)) throw new Error('refusing non-loopback base ' + base);
const out = process.argv[2];
const results = [];
function check(area, label, cond, detail = '') {
  results.push({ area, label, pass: !!cond, detail: cond ? '' : String(detail).slice(0, 400) });
  console.log((cond ? 'PASS ' : 'FAIL ') + area + ' :: ' + label + (cond ? '' : '  -> ' + String(detail).slice(0, 300)));
}
async function call(method, path, { body, token, headers = {} } = {}) {
  const r = await fetch(base + path, { method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: 'Bearer ' + token } : {}), ...headers }, body: body !== undefined ? JSON.stringify(body) : undefined });
  const text = await r.text(); let json = null; try { json = JSON.parse(text); } catch {}
  return { status: r.status, json, text, ctype: r.headers.get('content-type') || '', cache: r.headers.get('cache-control') || '' };
}
const PW = process.env.LOCAL_STAFF_PASSWORD, ADMIN_PW = process.env.LOCAL_ADMIN_PASSWORD; // random per run (verify-all.sh)
if (!PW || !ADMIN_PW) throw new Error('Run through verify-all.sh: LOCAL_STAFF_PASSWORD and LOCAL_ADMIN_PASSWORD are required');
const A = '9876500001', B = '9876500002';
async function customerToken(phone) {
  const s = await call('POST', '/api/auth/send-otp', { body: { phone } });
  if (!s.json?.devOtp) throw new Error('dev OTP unavailable: ' + s.text);
  const v = await call('POST', '/api/auth/verify-otp', { body: { phone, otp: s.json.devOtp } });
  if (!v.json?.token) throw new Error('verify failed: ' + v.text);
  return v.json.token;
}
async function staffToken(email, password = PW) {
  const r = await call('POST', '/api/admin/auth/login', { body: { email, password } });
  if (!r.json?.token) throw new Error('login failed ' + email + ': ' + r.text);
  return r.json.token;
}
const idem = () => 'local-verify-' + randomUUID();
const loan = (phone) => ({ fullName: 'Synthetic ' + phone.slice(-1), phoneNumber: phone, cibil: '760', dateOfBirth: '01/02/1990', city: 'Hyderabad', state: 'Telangana', monthlyIncome: '85000', existingEmi: '0', loanAmountRequired: '500000' });

async function seed(phone, which) {
  const made = [];
  const post = async (label, path, body, key) => {
    const r = await call('POST', path, { body, headers: key ? { 'Idempotency-Key': key } : {} });
    check('seed', label + ' submitted for ' + phone, r.status === 200 && r.json?.success, r.status + ' ' + r.text);
    made.push(label);
  };
  if (which.includes('HL')) await post('HL', '/api/home-loans/leads', { ...loan(phone), loanType: 'House Purchase' });
  if (which.includes('PL')) await post('PL', '/api/personal-loans/applications', { ...loan(phone), requestKey: randomUUID(), companyName: 'Synthetic Co', employmentType: 'Private' });
  if (which.includes('PL-LEGACY')) await post('PL-LEGACY', '/api/personal-loans/leads', { phoneNumber: phone, fullName: 'Legacy ' + phone.slice(-1), monthlyIncome: '50000', existingEmi: '0', loanAmountRequired: '200000' });
  if (which.includes('BL')) await post('BL', '/api/business-loans/leads', { ...loan(phone), businessType: 'Retail', loanPurpose: 'Expansion' }, idem());
  if (which.includes('VL')) await post('VL', '/api/vehicle-loans/leads', { ...loan(phone), occupation: 'Salaried', vehicleCondition: 'New Vehicle', vehicleType: 'Car' }, idem());
  if (which.includes('LI')) await post('LI', '/api/life-insurance/leads', { phoneNumber: phone, fullName: 'Life ' + phone.slice(-1), selectedLifeInsurer: 'Synthetic Life', policyType: 'Term Insurance', premiumSlab: '₹10,000' }, idem());
  const svc = { fullName: 'Service ' + phone.slice(-1), phoneNumber: phone, provider: 'Synthetic Provider', productName: 'Synthetic Product' };
  if (which.includes('CC')) await post('CC', '/api/services/credit-cards/applications', svc, idem());
  if (which.includes('BA')) await post('BA', '/api/services/bank-accounts/applications', svc, idem());
  if (which.includes('IL')) await post('IL', '/api/services/insta-loans/applications', svc, idem());
  if (which.includes('HI')) await post('HI', '/api/services/health-insurance/applications', { fullName: svc.fullName, phoneNumber: phone, provider: 'Synthetic Health', selectedMembers: ['myself'], elderAge: '35', childrenCount: 0, pincode: '500001', preExistingDisease: 'No' }, idem());
  if (which.includes('MI')) await post('MI', '/api/services/motor-insurance/applications', { fullName: svc.fullName, phoneNumber: phone, provider: 'Synthetic Motor', form: 'policy', vehicleType: 'Car', vehicleTypeOther: '', insuranceType: 'Third Party Insurance', modelYear: '2022' }, idem());
  return made;
}

(async () => {
  const admin = await staffToken('admin@example.test', ADMIN_PW);
  for (const [email, role] of [['ops1@example.test', 'ops'], ['ops2@example.test', 'ops'], ['exec1@example.test', 'executive'], ['exec2@example.test', 'executive'], ['mgr1@example.test', 'manager'], ['viewer1@example.test', 'viewer']]) {
    const r = await call('POST', '/api/admin/operations/staff', { token: admin, body: { name: email.split('@')[0], email, role, password: PW, active: true } });
    check('setup', 'create staff ' + email, r.status === 200, r.text);
  }
  const t = {};
  for (const n of ['ops1', 'ops2', 'exec1', 'exec2', 'mgr1', 'viewer1']) t[n] = await staffToken(n + '@example.test');
  await seed(A, ['HL', 'PL', 'PL-LEGACY', 'BL', 'VL', 'LI', 'CC', 'BA', 'IL', 'HI', 'MI']);
  await seed(B, ['HL', 'BL', 'BA']);
  const cA = await customerToken(A), cB = await customerToken(B);

  async function rows(token = admin) {
    const r = await call('GET', '/api/admin/operations/applications?pageSize=100', { token });
    if (r.status !== 200) throw new Error('applications ' + r.status + ' ' + r.text);
    return r.json.data;
  }
  async function row(id, token = admin) { return (await rows(token)).find(x => x.id === id); }
  const all = await rows();
  const ref = (kind, phone, table) => all.find(r => r.productType === kind && r.mobile.endsWith(phone) && (!table || r.sourceTable === table))?.id;
  const ids = {
    HL: ref('home-loans', A), BL: ref('business-loans', A), PL: ref('personal-loans', A, 'personal_loan_applications'),
    PLL: ref('personal-loans', A, 'personal_loan_leads'), VL: ref('vehicle-loans', A), LI: ref('life-insurance', A), CC: ref('credit-cards', A), BA: ref('bank-accounts', A),
    IL: ref('insta-loans', A), HI: ref('health-insurance', A), MI: ref('motor-insurance', A), HLB: ref('home-loans', B), BLB: ref('business-loans', B), BAB: ref('bank-accounts', B),
  };
  check('setup', 'every seeded record listed in admin', Object.values(ids).every(Boolean), JSON.stringify(ids));
  const customerIdsA = Object.entries(ids).filter(([k]) => !k.endsWith('B')).map(([, v]) => v);

  // ---------- F: customer lead profiles (initial) ----------
  const mine = async (tok) => call('GET', '/api/customer-applications', { token: tok });
  let la = await mine(cA), lb = await mine(cB);
  check('F', 'customer A lists all 11 own submissions across products', la.status === 200 && la.json.data.length === 11 && customerIdsA.every(id => la.json.data.some(r => r.referenceNumber === id)), la.text);
  check('F', 'customer B lists only own 3 submissions', lb.status === 200 && lb.json.data.length === 3 && lb.json.data.every(r => [ids.HLB, ids.BLB, ids.BAB].includes(r.referenceNumber)), lb.text);
  check('F', "A's list contains none of B's records", !la.json.data.some(r => [ids.HLB, ids.BLB, ids.BAB].includes(r.referenceNumber)));
  check('F', 'customer list is no-store JSON', la.cache.includes('no-store') && la.ctype.includes('application/json'), la.cache + ' ' + la.ctype);
  for (const [label, tok] of [['missing token', undefined], ['forged token', cA.slice(0, -3) + 'abc'], ['admin token', admin], ['ops token', t.ops1]]) {
    const r = await mine(tok); check('F', 'customer list refuses ' + label, r.status === 401, r.status + ' ' + r.text);
  }

  // ---------- A: Payout action after Rejected, every loan type ----------
  for (const key of ['HL', 'BL', 'PL', 'PLL', 'VL', 'IL']) {
    const before = await row(ids[key]);
    const r = await call('PATCH', '/api/admin/operations/applications/' + ids[key], { token: key === 'HL' ? admin : t.ops1, body: { version: before.version, payoutStatus: 'selected' } });
    const after = await row(ids[key]);
    check('A', key + ' Payout selection saves', r.status === 200, r.text);
    check('A', key + ' Payout persists on reload and leaves stage/provider decision unchanged', after.payoutStatus === 'selected' && after.stage === before.stage && after.providerDecision === before.providerDecision, JSON.stringify({ before: [before.stage, before.providerDecision], after: [after.stage, after.payoutStatus, after.providerDecision] }));
  }
  for (const key of ['CC', 'LI', 'BA']) {
    const before = await row(ids[key]);
    const r = await call('PATCH', '/api/admin/operations/applications/' + ids[key], { token: t.ops1, body: { version: before.version, payoutStatus: 'selected' } });
    check('A', key + ' (not a loan) refuses Payout selection', r.status === 400, r.status + ' ' + r.text);
  }
  { const v = await row(ids.BL); const r = await call('PATCH', '/api/admin/operations/applications/' + ids.BL, { token: t.viewer1, body: { version: v.version, payoutStatus: 'selected' } }); check('A', 'viewer cannot select Payout', r.status === 403, r.status); }

  // ---------- B: Business Sanctioned ----------
  {
    const before = await row(ids.BLB);
    const r = await call('PATCH', '/api/admin/operations/applications/' + ids.BLB, { token: t.ops1, body: { version: before.version, stage: 'approved', note: 'Sanctioned locally' } });
    const after = await row(ids.BLB);
    check('B', 'Business Sanctioned saves without provider evidence', r.status === 200, r.status + ' ' + r.text);
    check('B', 'Sanctioned persists on reload', after.stage === 'approved' && after.version === before.version + 1, JSON.stringify([after.stage, after.version]));
    const h = after.stageHistory.at(-1);
    check('B', 'stage history records new → Sanctioned with actor', h?.fromStage === 'new' && h?.toStage === 'approved' && h?.changedBy === 'ops1@example.test', JSON.stringify(after.stageHistory));
    check('B', 'provider decision not overwritten by Sanctioned', after.providerDecision === 'unconfirmed');
    const audit = await call('GET', '/api/admin/operations/audit', { token: admin });
    const e = audit.json.data.find(x => x.entityId === ids.BLB && x.action === 'application_update');
    check('B', 'audit records stage before/after', e?.details?.changes?.stage?.before === 'new' && e?.details?.changes?.stage?.after === 'approved', JSON.stringify(e));
    lb = await mine(cB);
    check('B/F', 'customer B sees Sanctioned on their Business lead', lb.json.data.find(x => x.referenceNumber === ids.BLB)?.stage === 'approved', lb.text);
  }

  // ---------- C/D/E: payouts ----------
  const payout = (id, tok, body) => call('PUT', '/api/admin/operations/applications/' + id + '/payout', { token: tok, body });
  const approve = (id, tok, body) => call('POST', '/api/admin/operations/applications/' + id + '/payout/approve', { token: tok, body });
  const custPayouts = async (tok) => (await call('GET', '/api/customer-payouts', { token: tok }));
  async function toPrerequisite(key) {
    const id = ids[key], cur = await row(id);
    if (key === 'HL') {
      const r = await call('PATCH', '/api/admin/home-loans/' + cur.sourceId, { token: admin, body: { stage: 'disbursed', version: cur.homeVersion, loanAmountRequired: '500000', note: '' } });
      return r;
    }
    if (key === 'BA') return call('PATCH', '/api/admin/operations/applications/' + id, { token: t.ops1, body: { version: cur.version, stage: 'approved', provider: 'Synthetic Bank', providerDecision: 'approved', providerEvidence: 'Synthetic local evidence' } });
    return call('PATCH', '/api/admin/operations/applications/' + id, { token: t.ops1, body: { version: cur.version, stage: 'disbursed' } });
  }
  const amounts = { HL: ['15000.5', '4500.25'], BL: ['999999999999.99', '0.01'], PL: ['0', '1200'], VL: ['3210.7', '0'], BA: ['250', '750.4'] };
  for (const key of ['HL', 'BL', 'PL', 'VL', 'BA']) {
    const id = ids[key], editor = key === 'HL' ? admin : t.ops1, area = key === 'BA' ? 'D' : 'C';
    const vb = await row(id);
    // prerequisite: not eligible before Disbursed / Account Activation (BL is Sanctioned-equivalent test: move to approved first)
    if (key === 'BL') { const r = await call('PATCH', '/api/admin/operations/applications/' + id, { token: t.ops1, body: { version: vb.version, stage: 'approved' } }); check(area, 'BL moved to Sanctioned', r.status === 200, r.text); }
    if (key === 'BA') { const r = await call('PATCH', '/api/admin/operations/applications/' + id, { token: t.ops1, body: { version: vb.version, stage: 'submitted' } }); check(area, 'BA moved to Logins', r.status === 200, r.text); }
    let cur = await row(id);
    check(area, key + ' not payout-eligible before prerequisite (stage ' + cur.stage + ')', cur.payoutEligible === false);
    let r = await payout(id, editor, { version: cur.version, homeVersion: cur.homeVersion, customerAmount: '10', paisamartAmount: '10' });
    check(area, key + ' amount entry refused before prerequisite', r.status === 400, r.status + ' ' + r.text);
    r = await toPrerequisite(key);
    check(area, key + ' reaches ' + (key === 'BA' ? 'Account Activation' : 'Disbursed'), r.status === 200, r.status + ' ' + r.text);
    cur = await row(id);
    check(area, key + ' payout-eligible at prerequisite', cur.payoutEligible === true && cur.stage === (key === 'BA' ? 'approved' : 'disbursed'), JSON.stringify([cur.stage, cur.payoutEligible]));
    // invalid amounts
    for (const bad of ['-1', '1e3', 'NaN', 'Infinity', '1.234', '', ' 10', '10.', '0x10', '1,000', '01', '1000000000000', 12]) {
      const rb = await payout(id, editor, { version: cur.version, homeVersion: cur.homeVersion, customerAmount: bad, paisamartAmount: '1' });
      if (rb.status !== 400) { check(area, key + ' rejects invalid amount ' + JSON.stringify(bad), false, rb.status + ' ' + rb.text); }
    }
    const after = await row(id);
    check(area, key + ' rejects 13 invalid/negative/non-finite/over-precise amounts with no change', after.version === cur.version && !after.payout, JSON.stringify(after.payout));
    // role checks for entry
    for (const [n, tok, code] of [['executive', t.exec1, 403], ['manager', t.mgr1, 403], ['viewer', t.viewer1, 403], ['customer', cA, 401]]) {
      const rr = await payout(id, tok, { version: cur.version, homeVersion: cur.homeVersion, customerAmount: '1', paisamartAmount: '1' });
      check(area, key + ' ' + n + ' cannot enter amounts', rr.status === code, rr.status + ' ' + rr.text);
    }
    // entry
    const [ca, pa] = amounts[key];
    r = await payout(id, editor, { version: cur.version, homeVersion: cur.homeVersion, customerAmount: ca, paisamartAmount: pa });
    check(area, key + ' authorised staff saves both amounts', r.status === 200, r.text);
    cur = await row(id);
    const norm = v => { const [w, f = ''] = v.split('.'); return w + '.' + f.padEnd(2, '0'); };
    check(area, key + ' amounts persist exactly after reload (' + norm(ca) + ' / ' + norm(pa) + ')', cur.payout?.customerAmount === norm(ca) && cur.payout?.paisamartAmount === norm(pa), JSON.stringify(cur.payout));
    check(area, key + ' stage/provider decision unchanged by payout save', cur.stage === (key === 'BA' ? 'approved' : 'disbursed'));
    // approvals: wrong roles
    for (const [n, tok] of [['ops editor', editor], ['admin', admin], ['viewer', t.viewer1]]) {
      const rr = await approve(id, tok, { version: cur.version, homeVersion: cur.homeVersion });
      check('E', key + ' ' + n + ' cannot approve', rr.status === 403, rr.status + ' ' + rr.text);
    }
    // one approval insufficient
    r = await approve(id, t.exec1, { version: cur.version - 1, homeVersion: cur.homeVersion });
    check('E', key + ' stale-version approval refused', r.status === 409, r.status + ' ' + r.text);
    r = await approve(id, t.exec1, { version: cur.version, homeVersion: cur.homeVersion });
    check('E', key + ' executive approves', r.status === 200, r.text);
    let cp = await custPayouts(cA);
    check('E', key + ' one approval keeps customer amount hidden', cp.status === 200 && !cp.json.data.some(x => x.referenceNumber === id), cp.text);
    cur = await row(id);
    r = await approve(id, t.exec2, { version: cur.version, homeVersion: cur.homeVersion });
    check('E', key + ' second executive cannot fill the manager approval', r.status === 409, r.status + ' ' + r.text);
    // stale: manager read version v, ops edits amounts, manager approves with v -> refused
    const seen = cur.version;
    r = await payout(id, editor, { version: cur.version, homeVersion: cur.homeVersion, customerAmount: ca, paisamartAmount: key === 'BL' ? '0.02' : '9.99' });
    check('E', key + ' edit (Paisamart amount only) saves', r.status === 200, r.text);
    cur = await row(id);
    check('E', key + ' amount edit clears both approvals', cur.payout && Object.keys(cur.payout.approvals).length === 0, JSON.stringify(cur.payout?.approvals));
    r = await approve(id, t.mgr1, { version: seen, homeVersion: cur.homeVersion });
    check('E', key + ' stale approval of the previous amounts refused', r.status === 409, r.status + ' ' + r.text);
    // concurrent approvals on the same version: exactly one wins
    const [c1, c2] = await Promise.all([approve(id, t.mgr1, { version: cur.version, homeVersion: cur.homeVersion }), approve(id, t.exec1, { version: cur.version, homeVersion: cur.homeVersion })]);
    check('E', key + ' concurrent approvals on one version: exactly one succeeds', [c1.status, c2.status].sort().join() === '200,409', c1.status + ',' + c2.status);
    cur = await row(id);
    const loser = c1.status === 409 ? t.mgr1 : t.exec1;
    r = await approve(id, loser, { version: cur.version, homeVersion: cur.homeVersion });
    check('E', key + ' second role approves after refresh', r.status === 200, r.text);
    cur = await row(id);
    cp = await custPayouts(cA);
    const vis = cp.json.data.find(x => x.referenceNumber === id);
    check('E', key + ' both approvals: applicant sees own customer amount', vis?.customerAmount === norm(ca), cp.text);
    check('E', key + ' applicant response has no Paisamart amount / staff identity', !cp.json.data.some(x => x.referenceNumber === id && JSON.stringify(x).includes('"' + cur.payout.paisamartAmount + '"')) && !/example\.test|paisamart(Amount)?"/i.test(cp.text) && Object.keys(vis || {}).sort().join() === 'currency,customerAmount,productType,referenceNumber', cp.text);
    const cpB = await custPayouts(cB);
    check('E', key + ' other customer cannot see it', cpB.status === 200 && !cpB.json.data.some(x => x.referenceNumber === id), cpB.text);
    // viewer API visibility
    const vr = await row(id, t.viewer1);
    check('E', key + ' viewer API row has no payout amounts or approvals', vr && !('payout' in vr) && !JSON.stringify(vr).includes(cur.payout.customerAmount), JSON.stringify(vr).slice(0, 300));
    // executive API (reviewer) sees amounts before/after approval
    const er = await row(id, t.exec1);
    check('E', key + ' executive API row shows both amounts for review', er.payout?.customerAmount === cur.payout.customerAmount && er.payout?.paisamartAmount === cur.payout.paisamartAmount);
    check(area, key + ' stage still ' + cur.stage + ' after approvals (not overwritten)', cur.stage === (key === 'BA' ? 'approved' : 'disbursed'));
  }
  // maker self-approval: editor later granted an approver role cannot approve own entry
  {
    const id = ids.VL; let cur = await row(id);
    let r = await payout(id, t.ops2, { version: cur.version, homeVersion: cur.homeVersion, customerAmount: '3210.70', paisamartAmount: '1.00' });
    check('E', 'ops2 edits VL amounts (approvals reset)', r.status === 200, r.text);
    const staff = (await call('GET', '/api/admin/operations/staff', { token: admin })).json.data.find(s => s.email === 'ops2@example.test');
    r = await call('POST', '/api/admin/operations/staff', { token: admin, body: { id: staff.id, version: staff.version, name: staff.name, email: staff.email, role: 'executive', active: true } });
    check('E', 'admin changes ops2 to executive', r.status === 200, r.text);
    const ops2exec = await staffToken('ops2@example.test');
    cur = await row(id);
    r = await approve(id, ops2exec, { version: cur.version, homeVersion: cur.homeVersion });
    check('E', 'maker self-approval refused (editor cannot approve own entry)', r.status === 403 && /cannot approve their own/i.test(r.text), r.status + ' ' + r.text);
    const cp = await custPayouts(cA);
    check('E', 'VL hidden from applicant after re-edit', !cp.json.data.some(x => x.referenceNumber === id));
  }
  // either order: BA re-approved manager first above via concurrency; explicitly manager→executive on PL
  {
    const id = ids.PL; let cur = await row(id);
    await payout(id, t.ops1, { version: cur.version, homeVersion: cur.homeVersion, customerAmount: '0', paisamartAmount: '1300' });
    cur = await row(id);
    const m = await approve(id, t.mgr1, { version: cur.version }); cur = await row(id);
    const e = await approve(id, t.exec1, { version: cur.version });
    const cp = await custPayouts(cA);
    check('E', 'manager-then-executive order accepted; ₹0.00 customer amount released', m.status === 200 && e.status === 200 && cp.json.data.find(x => x.referenceNumber === id)?.customerAmount === '0.00', m.status + ' ' + e.status + ' ' + cp.text);
  }
  // Home: pipeline stage regression invalidates approvals
  {
    const id = ids.HL; let cur = await row(id);
    let r = await call('PATCH', '/api/admin/home-loans/' + cur.sourceId, { token: admin, body: { stage: 'sanctioned', version: cur.homeVersion, loanAmountRequired: '500000', note: '' } });
    const cp = await custPayouts(cA);
    check('C', 'HL moved back to Sanctioned hides the approved payout', r.status === 200 && !cp.json.data.some(x => x.referenceNumber === id), r.status + ' ' + cp.text);
    cur = await row(id);
    r = await call('PATCH', '/api/admin/home-loans/' + cur.sourceId, { token: admin, body: { stage: 'disbursed', version: cur.homeVersion, loanAmountRequired: '500000', note: '' } });
    cur = await row(id);
    check('C', 'HL back at Disbursed requires fresh approvals', r.status === 200 && Object.keys(cur.payout.approvals).length === 0, JSON.stringify(cur.payout?.approvals));
  }
  { const r = await payout(ids.CC, t.ops1, { version: (await row(ids.CC)).version, customerAmount: '1', paisamartAmount: '1' }); check('C', 'Credit card (out of scope) has no payout amounts', r.status === 400 || r.status === 404, r.status + ' ' + r.text); }
  // Audit trail
  {
    const audit = (await call('GET', '/api/admin/operations/audit', { token: admin })).json.data;
    check('E', 'audit has payout_amount_edit and payout_approval entries for each product', ['HL', 'BL', 'PL', 'VL', 'BA'].every(k => audit.some(a => a.entityId === ids[k] && a.action === 'payout_amount_edit') && audit.some(a => a.entityId === ids[k] && a.action === 'payout_approval')));
  }

  // ---------- F: after processing ----------
  {
    const note = 'INTERNAL-NOTE-MARKER-' + randomUUID().slice(0, 8);
    const cur = await row(ids.VL);
    await call('PATCH', '/api/admin/operations/applications/' + ids.VL, { token: t.ops1, body: { version: cur.version, note, assignedOwner: 'ops1@example.test', priority: 'high' } });
    la = await mine(cA);
    const by = Object.fromEntries(la.json.data.map(r => [r.referenceNumber, r]));
    check('F', 'all 11 of A’s records still listed after admin processing', la.json.data.length === 11 && customerIdsA.every(id => by[id]), la.text.slice(0, 300));
    check('F', 'customer sees admin-set stages (HL disbursed, BL disbursed, BA activation)', by[ids.HL].stage === 'disbursed' && by[ids.BL].stage === 'disbursed' && by[ids.BA].stage === 'approved', JSON.stringify([by[ids.HL].stage, by[ids.BL].stage, by[ids.BA].stage]));
    const raw = la.text;
    // Values are matched as exact JSON strings: bare digits also occur inside timestamps (e.g. ...02.760Z).
    const leaks = [note, 'ops1@example.test', 'exec1', 'mgr1', 'Synthetic local evidence', 'paisamart', 'priority', 'assignedOwner', 'notes'].filter(s => raw.toLowerCase().includes(s.toLowerCase()))
      .concat(['760', '01/02/1990', '85000', '4500.25', '0.02', '9.99'].filter(v => raw.includes('"' + v + '"')));
    check('F', 'customer list excludes notes, staff, evidence, credit/DOB/income, payout amounts', leaks.length === 0, leaks.join(','));
    check('F', 'customer list fields limited to reference/product/stage/dates/details', la.json.data.every(r => Object.keys(r).sort().join() === 'createdAt,details,productType,referenceNumber,stage,updatedAt'));
  }

  const pass = results.filter(r => r.pass).length, fail = results.length - pass;
  console.log(`\nHTTP verification: ${pass} pass / ${fail} fail`);
  if (out) writeFileSync(out, JSON.stringify({ base, ids, pass, fail, results }, null, 2));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERROR', e); if (out) writeFileSync(out, JSON.stringify({ error: String(e?.stack || e), results }, null, 2)); process.exit(2); });
