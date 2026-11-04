import { expect, test } from 'bun:test';
import { Database } from 'bun:sqlite';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dbPath = join(mkdtempSync(join(tmpdir(), 'paisa-services-')), 'test.sqlite');
process.env.LEADS_DB = dbPath;
for (const key of ['HOME_LOANS_DATABASE_URL','PERSONAL_LOANS_DATABASE_URL','BUSINESS_LOANS_DATABASE_URL','LIFE_INSURANCE_DATABASE_URL','VEHICLE_LOANS_DATABASE_URL','DATABASE_URL','POSTGRES_URL']) delete process.env[key];
process.env.ADMIN_EMAIL = 'admin@example.test';
process.env.HOME_LOAN_ADMIN_PASSWORD = 'services-test-password';
process.env.HOME_LOAN_ADMIN_TOKEN_SECRET = 'services-test-admin-secret';
process.env.AUTH_TOKEN_SECRET = 'services-test-auth-secret';
const { serviceApplicationsRouter: router } = await import('./service-applications');
const { SERVICE_SOURCES } = await import('../lib/service-application-store');
const { adminRouter } = await import('./admin');
const { leadStageOptions, leadStageLabel } = await import('../../../mobile/src/lib/loan-product-stages');
const db = new Database(dbPath);
const common = { fullName: 'Service Applicant', phoneNumber: '9876543210', provider: 'Test Provider' };
const inputs = {
  'credit-cards': { ...common, productName: 'Test Credit Card' },
  'bank-accounts': { ...common, productName: 'Test Savings Account' },
  'insta-loans': { ...common, productName: 'Test Insta Loan' },
  'health-insurance': { ...common, selectedMembers: ['myself', 'children'], elderAge: '35', childrenCount: 2, pincode: '500001', preExistingDisease: 'Yes' },
  'motor-insurance': { ...common, form: 'policy', vehicleType: 'Car', vehicleTypeOther: '', insuranceType: 'Third Party Insurance', modelYear: '2020' },
};
const json = (data: unknown) => ({ headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
const submit = (product: string, input: unknown, key = crypto.randomUUID()) => router.request(`/${product}/applications`, { method: 'POST', ...json(input), headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key } });
const body = (r: Response) => r.json() as Promise<any>;
const receipts: Record<string, any> = {};
for (const source of SERVICE_SOURCES) test.serial(`${source.kind}: full details persist and retry returns one real receipt`, async () => {
  const key = crypto.randomUUID();
  const responses = await Promise.all([submit(source.kind, inputs[source.kind], key), submit(source.kind, inputs[source.kind], key)]);
  expect(responses.map(r => r.status)).toEqual([200,200]);
  const [a,b] = await Promise.all(responses.map(body));
  expect(a.data).toEqual(b.data);
  expect(a.data.referenceNumber).toBe(`${source.prefix}-${a.data.id}`);
  receipts[source.kind] = a.data;
  const row: any = db.query(`SELECT * FROM ${source.table} WHERE id=?`).get(a.data.id);
  expect(JSON.parse(row.payload)).toEqual(inputs[source.kind]);
  expect(row.full_name).toBe(common.fullName);
  expect(row.phone_number).toBe(common.phoneNumber);
  expect((db.query(`SELECT COUNT(*) AS n FROM ${source.table}`).get() as any).n).toBe(1);
  expect((await submit(source.kind, { ...inputs[source.kind], fullName: 'Changed' }, key)).status).toBe(409);
  const receipt = await body(await router.request(`/${source.kind}/receipts/${a.data.id}`));
  expect(receipt.data).toEqual(a.data);
  expect(Object.keys(receipt.data).sort()).toEqual(['createdAt','id','referenceNumber']);
});
test.serial('all five reject invalid input and failed writes without a success receipt', async () => {
  for (const source of SERVICE_SOURCES) {
    expect((await submit(source.kind, { ...inputs[source.kind], phoneNumber: '123' })).status).toBe(400);
    expect((await submit(source.kind, { ...inputs[source.kind], payout: 1500 })).status).toBe(400);
    expect((await submit(source.kind, inputs[source.kind], '')).status).toBe(400);
    db.run(`CREATE TRIGGER fail_write BEFORE INSERT ON ${source.table} BEGIN SELECT RAISE(FAIL, 'test failure'); END`);
    const failed = await submit(source.kind, inputs[source.kind]);
    expect(failed.status).toBe(503);
    expect(await body(failed)).toEqual({ success: false, message: 'Could not save your application. Please retry.' });
    db.run('DROP TRIGGER fail_write');
  }
  expect((await router.request('/motor-insurance/receipts/' + crypto.randomUUID())).status).toBe(404);
  expect((await submit('toString', common)).status).toBe(404);
});
test.serial('health conditional fields and motor date/type fields are validated', async () => {
  for (const patch of [{ selectedMembers: [] }, { elderAge: '17' }, { elderAge: '35.5' }, { childrenCount: 0 }, { pincode: '000000' }, { preExistingDisease: 'unknown' }])
    expect((await submit('health-insurance', { ...inputs['health-insurance'], ...patch })).status).toBe(400);
  for (const patch of [{ vehicleType: 'Others' }, { modelYear: '1800' }, { insuranceType: 'unknown' }])
    expect((await submit('motor-insurance', { ...inputs['motor-insurance'], ...patch })).status).toBe(400);
  const quote = { ...common, form: 'quote', vehicleCategory: 'Personal', vehicleType: 'Car', vehicleNumber: 'TS09AB1234', registrationYear: '2020', insuranceExpiryDate: '30/11/2026', city: 'Hyderabad' };
  expect((await submit('motor-insurance', { ...quote, insuranceExpiryDate: '31/02/2026' })).status).toBe(400);
  const saved = await body(await submit('motor-insurance', quote));
  expect(JSON.parse((db.query('SELECT payload FROM motor_insurance_applications WHERE id=?').get(saved.data.id) as any).payload)).toEqual(quote);
});
const login = async (email = 'admin@example.test', password = 'services-test-password') => (await body(await adminRouter.request('/auth/login', { method: 'POST', ...json({ email, password }) }))).token;
const ops = (token: string, path: string, method = 'GET', data?: unknown) => adminRouter.request('/operations' + path, { method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: data ? JSON.stringify(data) : undefined });
test.serial('all five admin sources, counts, assignment, stages and audit survive a fresh sign-in', async () => {
  const token = await login();
  const initial = await body(await ops(token, '/applications'));
  for (const source of SERVICE_SOURCES) {
    expect(initial.availability[source.table]).toBe('available');
    const id = receipts[source.kind].referenceNumber;
    const lead = initial.data.find((r: any) => r.id === id);
    expect(lead.provider).toBe(common.provider);
    expect(lead.stage).toBe('new');
    expect(initial.summary.byProduct[source.kind]).toBe(source.kind === 'motor-insurance' ? 2 : 1);
    const finalStage = source.kind === 'insta-loans' ? 'disbursed' : 'approved';
    expect(leadStageOptions(source.kind)).toEqual(['new','submitted',finalStage]);
    expect((await ops(token, `/applications/${id}`, 'PATCH', { version: 0, stage: finalStage })).status).toBe(400);
    expect((await ops(token, `/applications/${id}`, 'PATCH', { version: 0, stage: 'submitted', assignedOwner: 'admin@example.test', note: 'Login recorded' })).status).toBe(200);
    expect((await ops(token, `/applications/${id}`, 'PATCH', { version: 0, stage: 'new' })).status).toBe(409);
    if (source.kind === 'insta-loans') expect((await ops(token, `/applications/${id}`, 'PATCH', { version: 1, stage: finalStage, provider: common.provider, providerDecision: 'approved', providerEvidence: 'Approval is not disbursement' })).status).toBe(400);
    expect((await ops(token, `/applications/${id}`, 'PATCH', { version: 1, stage: finalStage, provider: common.provider, providerDecision: finalStage, providerEvidence: 'Test provider document', note: 'Provider milestone verified' })).status).toBe(200);
    const refreshed = await body(await ops(await login(), '/applications?product=' + source.kind));
    const current = refreshed.data.find((r: any) => r.id === id);
    expect(current.stage).toBe(finalStage);
    expect(current.assignedOwner).toBe('admin@example.test');
    expect(Date.parse(current.updatedAt)).toBeGreaterThanOrEqual(Date.parse(current.createdAt));
    expect(current.stageHistory.map((h: any) => [h.fromStage,h.toStage])).toEqual([['new','submitted'],['submitted',finalStage]]);
    expect(current.notes).toHaveLength(2);
    expect(leadStageLabel(source.kind, finalStage)).toBe(source.kind === 'credit-cards' ? 'Credit Card Activation' : source.kind === 'bank-accounts' ? 'Account Activation' : source.kind === 'insta-loans' ? 'Loan Net Disbursement' : 'Policy Issued');
    const events = (await body(await ops(token, '/audit'))).data.filter((a: any) => a.entityId === id);
    expect(events).toHaveLength(2);
  }
  expect((await body(await ops(token, '/finance'))).available).toBe(false);
  expect((await ops(token, '/finance', 'POST', { amount: 1500 })).status).toBe(404);
});
test.serial('existing admin/viewer permissions and sensitive-field redaction cover the new sources', async () => {
  expect((await ops('', '/applications')).status).toBe(401);
  const token = await login();
  expect((await ops(token, '/staff', 'POST', { name: 'Viewer', email: 'viewer@example.test', role: 'viewer', password: 'viewer-test-password', active: true })).status).toBe(200);
  const viewer = await login('viewer@example.test', 'viewer-test-password');
  const result = await body(await ops(viewer, '/applications'));
  for (const source of SERVICE_SOURCES) {
    const lead = result.data.find((r: any) => r.id === receipts[source.kind].referenceNumber);
    expect(lead.mobile).toBe('******3210');
    expect(lead.notes).toEqual([]);
    expect(lead.stageHistory).toEqual([]);
    expect(lead.extraDetails['Pre-existing Disease']).toBeUndefined();
    expect(lead.extraDetails['Vehicle Number']).toBeUndefined();
    expect((await ops(viewer, `/applications/${lead.id}`, 'PATCH', { version: lead.version, stage: 'new' })).status).toBe(403);
  }
});
