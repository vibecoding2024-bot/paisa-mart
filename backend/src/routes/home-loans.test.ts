import { test, expect } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.LEADS_DB = join(mkdtempSync(join(tmpdir(), 'paisa-pipeline-')), 'test.db');
process.env.HOME_LOANS_DATABASE_URL = '';
process.env.DATABASE_URL = '';
process.env.POSTGRES_URL = '';
process.env.AUTH_TOKEN_SECRET = 'isolated-customer-test-secret';
process.env.HOME_LOAN_ADMIN_PASSWORD = 'test-password-only';
process.env.HOME_LOAN_ADMIN_TOKEN_SECRET = 'test-secret-for-isolated-tests-only';
const { homeLoansRouter } = await import('./home-loans');
const { adminRouter } = await import('./admin');
const { HOME_LOAN_STAGES } = await import('../lib/home-loan-stages');
const { parseBirthDate, formatBirthDate } = await import('../../../mobile/src/lib/birth-date');
const json = (data: unknown, token?: string) => ({ headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: JSON.stringify(data) });
const readJson = (response: Response): Promise<any> => response.json();
const application = { phoneNumber: '9876543210', fullName: 'Test Applicant', dateOfBirth: '29/02/2000', monthlyIncome: '50000', existingEmi: '0', loanAmountRequired: '2500000', loanType: 'House Purchase', city: 'Hyderabad' };

test('calendar date parsing rejects impossible/future dates and preserves leap dates', () => {
  expect(parseBirthDate('31/02/2000')).toBeNull();
  expect(parseBirthDate('29/02/2001')).toBeNull();
  expect(parseBirthDate('01/01/2999')).toBeNull();
  expect(formatBirthDate(parseBirthDate('29/02/2000')!)).toBe('29/02/2000');
});

test('submission, protected pipeline, all stages, totals, edits and optimistic concurrency', async () => {
  expect((await homeLoansRouter.request('/leads', { method: 'POST', ...json({ ...application, dateOfBirth: '31/02/2000' }) })).status).toBe(400);
  const response = await homeLoansRouter.request('/leads', { method: 'POST', ...json(application) });
  expect(response.status).toBe(200);
  const saved = (await readJson(response)).data;
  expect(saved.referenceNumber).toBe('HL-' + saved.id);
  expect((await adminRouter.request('/home-loans')).status).toBe(401);
  expect((await adminRouter.request('/home-loans/' + saved.id, { method: 'PATCH', ...json({}) })).status).toBe(401);
  expect((await adminRouter.request('/auth/login', { method: 'POST', ...json({ email: 'admin@paisamart.com', password: 'admin123' }) })).status).toBe(401);
  const login = await adminRouter.request('/auth/login', { method: 'POST', ...json({ email: 'admin@paisamart.com', password: 'test-password-only' }) });
  expect(login.status).toBe(200);
  const token = (await readJson(login)).token;
  const headers = { Authorization: 'Bearer ' + token };
  const initial = await readJson(await adminRouter.request('/home-loans', { headers }));
  expect(initial.summary).toHaveLength(8);
  expect(initial.summary.find((row: any) => row.stage === 'new').totalLoanAmount).toBe('2500000');
  expect(initial.data[0].fullName).toBe(application.fullName);
  let version = 0;
  for (const stage of HOME_LOAN_STAGES) {
    const change = { stage, version, loanAmountRequired: '3000000', note: 'Reviewed ' + stage };
    expect((await adminRouter.request('/home-loans/' + saved.id, { method: 'PATCH', ...json(change, token) })).status).toBe(200);
    expect((await adminRouter.request('/home-loans/' + saved.id, { method: 'PATCH', ...json(change, token) })).status).toBe(409);
    version++;
    const list = await readJson(await adminRouter.request('/home-loans?stage=' + stage + '&search=' + saved.referenceNumber, { headers }));
    expect(list.total).toBe(1);
    expect(list.data[0].version).toBe(version);
    expect(list.data[0].history).toHaveLength(version);
    expect(list.summary.find((row: any) => row.stage === stage).totalLoanAmount).toBe('3000000');
    expect(list.summary.filter((row: any) => row.stage !== stage).every((row: any) => row.count === 0 && row.totalLoanAmount === '0')).toBe(true);
  }
  expect((await adminRouter.request('/home-loans/' + saved.id, { method: 'PATCH', ...json({ stage: 'unknown', version, loanAmountRequired: '0' }, token) })).status).toBe(400);
  expect((await adminRouter.request('/home-loans/missing', { method: 'PATCH', ...json({ stage: 'new', version: 0, loanAmountRequired: '100' }, token) })).status).toBe(404);
  expect((await adminRouter.request('/home-loans?page=-1', { headers })).status).toBe(400);
});


test('customer status is signed, scoped to verified phone, private, and reflects admin updates', async () => {
  const { createHmac } = await import('node:crypto');
  const token = (sub: string, exp = Math.floor(Date.now()/1000)+300) => {
    const data = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub,exp})).toString('base64url');
    return data+'.'+createHmac('sha256',process.env.AUTH_TOKEN_SECRET!).update(data).digest('base64url');
  };
  const customer = token('+919123456789');
  const headers = {Authorization:'Bearer '+customer};
  const saved = (await readJson(await homeLoansRouter.request('/leads', {method:'POST',...json({...application,phoneNumber:'9123456789'})}))).data;
  expect((await homeLoansRouter.request('/applications')).status).toBe(401);
  expect((await homeLoansRouter.request('/applications',{headers:{Authorization:'Bearer '+customer+'tampered'}})).status).toBe(401);
  expect((await homeLoansRouter.request('/applications',{headers:{Authorization:'Bearer '+token('+919123456789',1)}})).status).toBe(401);
  const {updatePipeline} = await import('../lib/home-loan-pipeline');
  await updatePipeline(saved.id,{stage:'sanctioned',version:0,loanAmountRequired:'2500000',note:'PRIVATE ADMIN NOTE'},'test-admin');
  const response = await homeLoansRouter.request('/applications',{headers});
  const body = await readJson(response);
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(body.data).toHaveLength(1);
  expect(body.data[0].stage).toBe('sanctioned');
  expect(body.data[0].referenceNumber).toBe('HL-'+saved.id);
  expect(JSON.stringify(body)).not.toContain('PRIVATE ADMIN NOTE');
  expect(body.data[0].phoneNumber).toBeUndefined();
  const other = await readJson(await homeLoansRouter.request('/applications',{headers:{Authorization:'Bearer '+token('+919999999999')}}));
  expect(other.data).toHaveLength(0);
});
