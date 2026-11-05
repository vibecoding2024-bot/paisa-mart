import { expect, test } from 'bun:test';
import { Database } from 'bun:sqlite';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const path=join(mkdtempSync(join(tmpdir(),'paisa-keyed-leads-')),'test.sqlite');
process.env.LEADS_DB=path;
for(const key of ['DATABASE_URL','POSTGRES_URL','HOME_LOANS_DATABASE_URL','BUSINESS_LOANS_DATABASE_URL','VEHICLE_LOANS_DATABASE_URL','LIFE_INSURANCE_DATABASE_URL']) delete process.env[key];
const {businessLoansRouter}=await import('./business-loans');
const {lifeInsuranceRouter}=await import('./life-insurance');
const {vehicleLoansRouter}=await import('./vehicle-loans');
const db=new Database(path);
const cases=[
  {name:'Business',table:'business_loan_leads',router:businessLoansRouter,input:{phoneNumber:'9876543210',fullName:'Retry Business',businessType:'Retail',loanPurpose:'Expansion',loanAmountRequired:'100000'}},
  {name:'Life',table:'life_insurance_leads',router:lifeInsuranceRouter,input:{phoneNumber:'9876543210',fullName:'Retry Life',selectedLifeInsurer:'Test',policyType:'Term Insurance',premiumSlab:'₹10,000',premiumOtherAmount:''}},
  {name:'Vehicle',table:'vehicle_loan_leads',router:vehicleLoansRouter,input:{phoneNumber:'9876543210',fullName:'Retry Vehicle',cibil:'750',occupation:'Business',dateOfBirth:'15/01/2000',city:'Hyderabad',state:'Telangana',monthlyIncome:'50000',loanAmountRequired:'100000',existingEmi:'0',vehicleCondition:'New Vehicle',vehicleType:'Car'}},
] as const;
const options=(input:object,key?:string)=>({method:'POST',headers:{'Content-Type':'application/json',...(key?{'Idempotency-Key':key}:{})},body:JSON.stringify(input)});
for(const c of cases){
  test(c.name+' lost-response/concurrent retries save once, conflicts do not overwrite, and failures remain retryable',async()=>{
    const key=crypto.randomUUID();
    const first=await c.router.request('/leads',options(c.input,key));expect(first.status).toBe(200);
    // The caller loses the first response; the server already committed the row.
    const original=(await first.json() as any).data;
    const retries=await Promise.all(Array.from({length:6},()=>c.router.request('/leads',options(c.input,key))));
    for(const response of retries){expect(response.status).toBe(200);const saved=(await response.json() as any).data;expect(saved.id).toBe(original.id);expect(saved.createdAt).toBe(original.createdAt);}
    expect(db.query(`SELECT count(*) AS n FROM ${c.table} WHERE idempotency_key=?`).get(key)).toEqual({n:1});
    const conflict=await c.router.request('/leads',options({...c.input,fullName:'Changed applicant'},key));expect(conflict.status).toBe(409);expect((await conflict.json() as any).success).toBe(false);
    expect(db.query(`SELECT fullName FROM ${c.table} WHERE id=?`).get(original.id)).toEqual({fullName:c.input.fullName});
    const failedKey=crypto.randomUUID();db.run(`CREATE TRIGGER fail_${c.table} BEFORE INSERT ON ${c.table} BEGIN SELECT RAISE(FAIL,'synthetic failure'); END`);
    const failed=await c.router.request('/leads',options(c.input,failedKey));expect(failed.status).toBe(500);expect((await failed.json() as any).success).toBe(false);
    expect(db.query(`SELECT count(*) AS n FROM ${c.table} WHERE idempotency_key=?`).get(failedKey)).toEqual({n:0});
    db.run(`DROP TRIGGER fail_${c.table}`);
    expect((await c.router.request('/leads',options(c.input,failedKey))).status).toBe(200);
    expect((await c.router.request('/leads',options(c.input,'bad'))).status).toBe(400);
  });
}
test('new Life/Vehicle endpoints require keys while the deployed unkeyed Business contract is retained',async()=>{
  for(const c of cases) expect((await c.router.request('/leads',options(c.input))).status).toBe(c.name==='Business'?200:400);
});
