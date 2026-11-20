import { test, expect } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHmac } from 'node:crypto';
for (const key of ['DATABASE_URL','POSTGRES_URL','HOME_LOANS_DATABASE_URL','PERSONAL_LOANS_DATABASE_URL','BUSINESS_LOANS_DATABASE_URL','VEHICLE_LOANS_DATABASE_URL','LIFE_INSURANCE_DATABASE_URL']) delete process.env[key];
process.env.LEADS_DB = process.env.TXN_DB = join(mkdtempSync(join(tmpdir(), 'customer-apps-test-')), 'db.sqlite');
process.env.HOME_LOAN_ADMIN_TOKEN_SECRET = 'test-admin-secret';
process.env.AUTH_TOKEN_SECRET = 'test-customer-secret';
process.env.HOME_LOAN_ADMIN_PASSWORD = 'test-admin-password';
process.env.ADMIN_EMAIL = 'admin@paisamart.com';
const { adminRouter: app } = await import('./admin');
const { customerApplicationsRouter: customer } = await import('./customer-applications');
const { saveBusinessLoanLead } = await import('../lib/business-loan-lead-store');
const { saveHomeLoanLead } = await import('../lib/home-loan-lead-store');
const { savePersonalApplication } = await import('../lib/personal-loan-application-store');
const { saveVehicleLoanLead } = await import('../lib/vehicle-loan-lead-store');
const { saveServiceApplication } = await import('../lib/service-application-store');
const json = (d: unknown) => ({ headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
const login = await app.request('/auth/login', { method: 'POST', ...json({ email: 'admin@paisamart.com', password: 'test-admin-password' }) });
const admin = (await login.json()).token;
const auth = { Authorization: 'Bearer ' + admin, 'Content-Type': 'application/json' };
const applicant = '9000000000', other = '9000000001';
function token(phone: string, extra: object = {}) {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ sub: '+91' + phone, exp: Math.floor(Date.now() / 1000) + 3600, ...extra })).toString('base64url');
  return h + '.' + p + '.' + createHmac('sha256', process.env.AUTH_TOKEN_SECRET!).update(h + '.' + p).digest('base64url');
}
async function mine(phone = applicant) {
  const r = await customer.request('/', { headers: { Authorization: 'Bearer ' + token(phone) } });
  expect(r.status).toBe(200); expect(r.headers.get('cache-control')).toBe('no-store');
  return (await r.json()).data as any[];
}
async function row(id: string) { return (await (await app.request('/operations/applications?search=' + id, { headers: auth })).json()).data.find((r: any) => r.id === id); }
const common = (phoneNumber: string) => ({ fullName: 'Status Customer', phoneNumber, cibil: '750', dateOfBirth: '01/01/1990', city: 'Hyderabad', state: 'Telangana', monthlyIncome: '50000', loanAmountRequired: '100000', existingEmi: '0' });

test('customer lists only own submissions across products and sees admin-processed stages', async () => {
  const ids = {
    home: 'HL-' + (await saveHomeLoanLead({ ...common(applicant), loanType: 'House Purchase' })).id,
    personal: 'PL-' + (await savePersonalApplication({ ...common(applicant), companyName: 'Test', employmentType: 'Private' }, crypto.randomUUID())).id,
    business: 'BL-' + (await saveBusinessLoanLead({ ...common('+91' + applicant), businessType: 'Retail', loanPurpose: 'Expansion' })).id,
    vehicle: 'VL-' + (await saveVehicleLoanLead({ ...common(applicant), occupation: 'Salaried', vehicleType: 'Car', vehicleCondition: 'New Vehicle' })).id,
    card: 'CC-' + (await saveServiceApplication('credit-cards', { ...common(applicant), provider: 'Test bank', productName: 'Card' }, crypto.randomUUID())).id,
  };
  const foreign = 'BL-' + (await saveBusinessLoanLead({ ...common(other), businessType: 'Retail', loanPurpose: 'Expansion' })).id;
  let list = await mine();
  expect(list.map(r => r.referenceNumber).sort()).toEqual(Object.values(ids).sort());
  expect(list.every(r => r.stage === 'new')).toBe(true);
  expect(Object.keys(list[0]).sort()).toEqual(['createdAt', 'details', 'productType', 'referenceNumber', 'stage', 'updatedAt']);
  expect((await mine(other)).map(r => r.referenceNumber)).toEqual([foreign]);

  // Admin processing must not remove the lead from the customer view; stage follows admin.
  const b = await row(ids.business);
  expect((await app.request('/operations/applications/' + ids.business, { method: 'PATCH', headers: auth, body: JSON.stringify({ version: b.version, stage: 'approved' }) })).status).toBe(200);
  const h = await row(ids.home);
  expect((await app.request('/home-loans/' + ids.home.slice(3), { method: 'PATCH', headers: auth, body: JSON.stringify({ version: h.homeVersion, stage: 'underwriting', loanAmountRequired: '100000', note: 'internal note' }) })).status).toBe(200);
  list = await mine();
  const byId = Object.fromEntries(list.map(r => [r.referenceNumber, r]));
  expect(byId[ids.business].stage).toBe('approved');
  expect(byId[ids.home].stage).toBe('kyc_completed');
  expect(Date.parse(byId[ids.business].updatedAt)).toBeGreaterThanOrEqual(Date.parse(byId[ids.business].createdAt));
  const raw = JSON.stringify(list);
  expect(byId[ids.vehicle].details).toMatchObject({ Name: 'Status Customer', 'Vehicle condition': 'New Vehicle', 'Loan amount required': '100000' });
  for (const secret of ['internal note', 'admin@paisamart.com', '750', '01/01/1990', '50000']) expect(raw).not.toContain(secret);
});

test('rejects missing, forged, expired and admin tokens', async () => {
  expect((await customer.request('/')).status).toBe(401);
  expect((await customer.request('/', { headers: { Authorization: 'Bearer ' + token(applicant).slice(0, -2) + 'xx' } })).status).toBe(401);
  expect((await customer.request('/', { headers: { Authorization: 'Bearer ' + token(applicant, { exp: 1 }) } })).status).toBe(401);
  expect((await customer.request('/', { headers: { Authorization: 'Bearer ' + token(applicant, { role: 'admin' }) } })).status).toBe(401);
});
