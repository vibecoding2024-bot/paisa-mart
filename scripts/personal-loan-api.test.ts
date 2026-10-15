import { beforeEach, test, expect, mock } from 'bun:test';
const storage = new Map<string, string>();
mock.module('@react-native-async-storage/async-storage', () => ({ default: { getItem: async (key: string) => storage.get(key) ?? null, setItem: async (key: string, value: string) => { storage.set(key, value); }, removeItem: async (key: string) => { storage.delete(key); } } }));
mock.module('expo-crypto', () => ({ randomUUID: () => crypto.randomUUID() }));
const { submitPersonalLoanLead } = await import('../mobile/src/lib/personal-loan-api');
const payload = { phoneNumber: '9000000000', mobile_number: '9000000000', full_name: 'Test Customer', cibil: '750', date_of_birth: '15/01/1990', city: 'Hyderabad', state: 'Telangana', company_name: 'Test Company', monthly_income: '50000', loan_amount_required: '300000', existing_emi: '0', employment_type: 'Private', timestamp: '2026-10-16' };
const id = crypto.randomUUID();
const data = { id, referenceNumber: `PL-${id}`, status: 'Received', createdAt: new Date().toISOString() };
beforeEach(() => storage.clear());
test('returns only a complete confirmed server receipt', async () => {
  globalThis.fetch = mock(async () => Response.json({ success: true, data })) as any;
  const receipt = await submitPersonalLoanLead(payload); expect(receipt.referenceNumber).toBe(data.referenceNumber); expect(receipt.requestKey).toBeTruthy();
});
test('HTTP failure and incomplete success cannot become confirmation', async () => {
  for (const response of [Response.json({ success: false, message: 'Save failed' }, { status: 500 }), Response.json({ success: true }), Response.json({ success: true, data: { id } }), new Response('<html>Bad gateway</html>', { status: 502 })]) {
    globalThis.fetch = mock(async () => response) as any;
    await expect(submitPersonalLoanLead(payload)).rejects.toThrow();
  }
});
test('lost response retries use the same durable request key', async () => {
  const keys: string[] = [];
  globalThis.fetch = mock(async (_url: any, options: any) => { keys.push(JSON.parse(options.body).requestKey); if (keys.length === 1) throw new Error('Network lost'); return Response.json({ success: true, data }); }) as any;
  await expect(submitPersonalLoanLead(payload)).rejects.toThrow('Network lost');
  await submitPersonalLoanLead(payload); expect(keys[0]).toBe(keys[1]);
});
test('changed details cannot silently duplicate an uncertain submission', async () => {
  globalThis.fetch = mock(async () => { throw new Error('Network lost'); }) as any;
  await expect(submitPersonalLoanLead(payload)).rejects.toThrow();
  await expect(submitPersonalLoanLead({ ...payload, monthly_income: '60000' })).rejects.toThrow('earlier submission');
});


test('confirmed submissions can be repeated safely or followed by a different application', async () => {
  const keys: string[] = [];
  globalThis.fetch = mock(async (_url: any, options: any) => { keys.push(JSON.parse(options.body).requestKey); return Response.json({ success: true, data }); }) as any;
  await submitPersonalLoanLead(payload);
  await submitPersonalLoanLead(payload);
  await submitPersonalLoanLead({ ...payload, loan_amount_required: '400000' });
  expect(keys[0]).toBe(keys[1]); expect(keys[2]).not.toBe(keys[0]);
});
