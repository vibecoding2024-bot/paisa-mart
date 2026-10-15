import { describe, test, expect } from 'bun:test';
import { Database } from 'bun:sqlite';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
process.env.LEADS_DB = join(mkdtempSync(join(tmpdir(), 'personal-loan-test-')), 'applications.sqlite');
delete process.env.DATABASE_URL; delete process.env.POSTGRES_URL; delete process.env.PERSONAL_LOANS_DATABASE_URL;
const { personalApplicationsRouter: app } = await import('./personal-loan-applications');
const payload = { requestKey: crypto.randomUUID(), fullName: 'Preview Customer', phoneNumber: '9000000000', cibil: '750', dateOfBirth: '15/01/1990', city: 'Hyderabad', state: 'Telangana', companyName: 'Preview Company', monthlyIncome: '50000', loanAmountRequired: '300000', existingEmi: '0', employmentType: 'Private' };
const submit = (body: unknown) => app.request('http://localhost/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
describe('Personal loan application receipts', () => {
  test('saves a complete application and returns the actual receipt', async () => {
    const response = await submit(payload); expect(response.status).toBe(200);
    const { data } = await response.json(); expect(data.referenceNumber).toBe(`PL-${data.id}`); expect(data.status).toBe('Received');
    const status = await app.request(`http://localhost/${data.id}`, { headers: { Authorization: `Bearer ${payload.requestKey}` } });
    expect(status.status).toBe(200); expect((await status.json()).data).toEqual(data);
    expect(status.headers.get('cache-control')).toBe('no-store');
    const denied = await app.request(`http://localhost/${data.id}`, { headers: { Authorization: `Bearer ${crypto.randomUUID()}` } });
    expect(denied.status).toBe(404);
  });
  test('concurrent submissions and retries recover one reference', async () => {
    const responses = await Promise.all(Array.from({ length: 12 }, () => submit(payload)));
    const bodies = await Promise.all(responses.map(response => response.json()));
    expect(new Set(bodies.map(body => body.data.id)).size).toBe(1);
  });
  test('same key with changed details is rejected', async () => { expect((await submit({ ...payload, monthlyIncome: '60000' })).status).toBe(409); });
  test('invalid dates and missing required fields never succeed', async () => {
    for (const patch of [{ dateOfBirth: '31/02/2000' }, { dateOfBirth: '01/01/2099' }, { monthlyIncome: '' }, { existingEmi: undefined }, { phoneNumber: '123' }, { cibil: '999' }]) {
      const response = await submit({ ...payload, ...patch, requestKey: crypto.randomUUID() }); expect(response.status).toBe(400); expect((await response.json()).success).toBe(false);
    }
  });
  test('status requires a receipt secret', async () => { expect((await app.request(`http://localhost/${crypto.randomUUID()}`)).status).toBe(401); });
});

test('persisted database supports refreshed status and surfaces save failures', async () => {
  const result = await (await submit(payload)).json();
  const db = new Database(process.env.LEADS_DB!);
  expect((db.query('SELECT COUNT(*) AS count FROM personal_loan_applications').get() as any).count).toBe(1);
  db.run("UPDATE personal_loan_applications SET status = 'Under review' WHERE id = ?", [result.data.id]);
  const refreshed = await app.request(`http://localhost/${result.data.id}`, { headers: { Authorization: `Bearer ${payload.requestKey}` } });
  expect((await refreshed.json()).data.status).toBe('Under review');
  db.run("CREATE TRIGGER fail_save BEFORE INSERT ON personal_loan_applications BEGIN SELECT RAISE(FAIL, 'test failure'); END");
  const failed = await submit({ ...payload, requestKey: crypto.randomUUID() });
  expect(failed.status).toBe(500); expect((await failed.json()).success).toBe(false);
  db.close();
});
