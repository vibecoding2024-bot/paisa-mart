import { afterAll, expect, mock, test } from 'bun:test';
const storage = new Map<string,string>();
mock.module('@react-native-async-storage/async-storage',()=>({default:{getItem:async(k:string)=>storage.get(k)??null,setItem:async(k:string,v:string)=>{storage.set(k,v)},removeItem:async(k:string)=>{storage.delete(k)}}}));
const { submitServiceApplication, verifyServiceReceipt } = await import('../mobile/src/lib/service-application-api');
import type { ServiceProduct } from '../mobile/src/lib/service-application-api';
const original = globalThis.fetch;
afterAll(() => { globalThis.fetch = original; });
const data = { id: crypto.randomUUID(), referenceNumber: 'HI-real-reference', createdAt: new Date().toISOString() };
test('each service sends its full payload and retry key and returns only the server receipt', async () => {
  for (const product of ['credit-cards','bank-accounts','insta-loans','health-insurance','motor-insurance'] as ServiceProduct[]) {
    const fetch = mock(async (url: any, options: any) => {
      expect(url).toContain(`/api/services/${product}/applications`);
      expect(options.headers['Idempotency-Key']).toBe('stable-submission-key');
      expect(JSON.parse(options.body)).toEqual({ fullName: 'Applicant' });
      return Response.json({ success: true, data });
    });
    globalThis.fetch = fetch as any;
    expect(await submitServiceApplication(product, { fullName: 'Applicant' }, 'stable-submission-key')).toEqual(data);
  }
});
test('errors, non-JSON and incomplete or blank receipts cannot produce success', async () => {
  for (const response of [new Response('bad gateway',{status:502}), Response.json({success:false},{status:503}), Response.json({success:true}), ...[{...data,id:' '},{...data,referenceNumber:''},{...data,createdAt:'bad'}].map(data=>Response.json({success:true,data}))]) {
    globalThis.fetch = mock(async () => response) as any;
    await expect(submitServiceApplication('health-insurance', {}, 'stable-submission-key')).rejects.toThrow();
  }
});
test('confirmation checks the backend receipt and rejects nonexistent applications', async () => {
  globalThis.fetch = mock(async () => Response.json({success:true,data})) as any;
  await expect(verifyServiceReceipt('motor-insurance',data.id)).rejects.toThrow('receipt');
  storage.set('service-receipt:motor-insurance:'+data.id,'private-receipt-key');
  globalThis.fetch = mock(async (_url:any, options:any) => { expect(options.headers.Authorization).toBe('Bearer private-receipt-key'); return Response.json({success:true,data}); }) as any;
  expect(await verifyServiceReceipt('motor-insurance',data.id)).toEqual(data);
  globalThis.fetch = mock(async () => Response.json({success:false},{status:404})) as any;
  await expect(verifyServiceReceipt('motor-insurance','fake')).rejects.toThrow();
});
