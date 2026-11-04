import { expect, mock, test, afterAll } from 'bun:test';
import { createHash } from 'node:crypto';
const storage=new Map<string,string>();
mock.module('@react-native-async-storage/async-storage',()=>({default:{getItem:async(k:string)=>storage.get(k)??null,setItem:async(k:string,v:string)=>{storage.set(k,v)},removeItem:async(k:string)=>{storage.delete(k)}}}));
mock.module('expo-crypto',()=>({randomUUID:()=>crypto.randomUUID(),CryptoDigestAlgorithm:{SHA256:'sha256'},digestStringAsync:async (_algorithm:string,value:string)=>createHash('sha256').update(value).digest('hex')}));
const {submitBusinessLoanLead}=await import('../mobile/src/lib/business-loan-api');
const {submitLifeInsuranceLead}=await import('../mobile/src/lib/life-insurance-api');
const {submitVehicleLoanLead}=await import('../mobile/src/lib/vehicle-loan-api');
const original=globalThis.fetch;afterAll(()=>{globalThis.fetch=original});
const cases=[
  {name:'business-loans',send:submitBusinessLoanLead,input:{phoneNumber:'9876543210',full_name:'Retry Customer',business_type:'Retail',loan_purpose:'Expansion',timestamp:'first'}},
  {name:'life-insurance',send:submitLifeInsuranceLead,input:{phoneNumber:'9876543210',fullName:'Retry Customer',selectedLifeInsurer:'Test',policyType:'Term Insurance',premiumSlab:'₹10,000',premiumOtherAmount:''}},
  {name:'vehicle-loans',send:submitVehicleLoanLead,input:{phoneNumber:'9876543210',full_name:'Retry Customer',vehicle_condition:'New Vehicle',vehicle_type:'Car'}},
];
for(const c of cases)test(c.name+' retains a retry key across fresh invocations and locks changed uncertain input',async()=>{
  storage.clear();const keys:string[]=[];const data={id:crypto.randomUUID(),createdAt:new Date().toISOString()};
  globalThis.fetch=mock(async(_url:any,options:any)=>{keys.push(options.headers['Idempotency-Key']);if(keys.length===1)throw new Error('Saved response lost');return Response.json({success:true,data})}) as any;
  await expect(c.send(c.input as any)).rejects.toThrow('Saved response lost');
  await expect(c.send({...c.input,full_name:'Changed',fullName:'Changed'} as any)).rejects.toThrow('awaiting confirmation');expect(keys).toHaveLength(1);
  // Business UI generates a timestamp per click; it must not change submission identity.
  const retry=c.name==='business-loans'?{...c.input,timestamp:'second'}:c.input;
  expect(await c.send(retry as any)).toMatchObject(data);expect(keys[0]).toBe(keys[1]);
  expect([...storage.values()].join('')).not.toContain('Retry Customer');
  globalThis.fetch=mock(async()=>Response.json({success:false},{status:400})) as any;
  await expect(c.send({...c.input,phoneNumber:'bad'} as any)).rejects.toThrow();expect(storage.has('service-pending:'+c.name)).toBe(false);
});
