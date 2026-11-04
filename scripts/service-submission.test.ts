import { expect, mock, test, beforeEach, afterAll } from 'bun:test';
import { createHash } from 'node:crypto';
const storage = new Map<string,string>();
mock.module('@react-native-async-storage/async-storage',()=>({default:{getItem:async(k:string)=>storage.get(k)??null,setItem:async(k:string,v:string)=>{storage.set(k,v)},removeItem:async(k:string)=>{storage.delete(k)}}}));
mock.module('expo-crypto',()=>({randomUUID:()=>crypto.randomUUID(),CryptoDigestAlgorithm:{SHA256:'sha256'},digestStringAsync:async (_algorithm:string,value:string)=>createHash('sha256').update(value).digest('hex')}));
const {submitDurableService}=await import('../mobile/src/lib/service-submission');
const original=globalThis.fetch;afterAll(()=>{globalThis.fetch=original});beforeEach(()=>storage.clear());
const data={id:crypto.randomUUID(),referenceNumber:'HI-test',createdAt:new Date().toISOString()};
test('lost response and a fresh invocation retain the key; changed uncertain details cannot duplicate',async()=>{
  const keys:string[]=[];
  globalThis.fetch=mock(async(_url:any,options:any)=>{keys.push(options.headers['Idempotency-Key']);if(keys.length===1)throw new Error('Response lost');return Response.json({success:true,data})}) as any;
  await expect(submitDurableService('health-insurance',{fullName:'Customer',preExistingDisease:'Yes'})).rejects.toThrow('Response lost');
  await expect(submitDurableService('health-insurance',{fullName:'Changed'})).rejects.toThrow('awaiting confirmation');
  expect(keys).toHaveLength(1);
  expect(await submitDurableService('health-insurance',{fullName:'Customer',preExistingDisease:'Yes'})).toEqual(data);
  expect(keys[0]).toBe(keys[1]);
  expect(storage.get('service-receipt:health-insurance:'+data.id)).toBe(keys[0]);
  expect([...storage.values()].join('')).not.toContain('Customer');
  expect([...storage.values()].join('')).not.toContain('preExistingDisease');
});
test('definite validation rejection permits corrected details; confirmed receipts allow later applications',async()=>{
  globalThis.fetch=mock(async()=>Response.json({success:false},{status:400})) as any;
  await expect(submitDurableService('motor-insurance',{fullName:''})).rejects.toThrow();
  expect(storage.has('service-pending:motor-insurance')).toBe(false);
  const keys:string[]=[];globalThis.fetch=mock(async(_url:any,options:any)=>{keys.push(options.headers['Idempotency-Key']);return Response.json({success:true,data})}) as any;
  await submitDurableService('motor-insurance',{fullName:'First'});
  await submitDurableService('motor-insurance',{fullName:'Second'});
  expect(keys[0]).not.toBe(keys[1]);
});
