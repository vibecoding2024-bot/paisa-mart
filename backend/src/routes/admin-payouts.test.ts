import { test, expect } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHmac } from 'node:crypto';
for (const key of ['DATABASE_URL','POSTGRES_URL','HOME_LOANS_DATABASE_URL','PERSONAL_LOANS_DATABASE_URL','BUSINESS_LOANS_DATABASE_URL','VEHICLE_LOANS_DATABASE_URL']) delete process.env[key];
process.env.LEADS_DB = process.env.TXN_DB = join(mkdtempSync(join(tmpdir(), 'payout-test-')), 'db.sqlite');
process.env.HOME_LOAN_ADMIN_TOKEN_SECRET = 'test-admin-secret';
process.env.AUTH_TOKEN_SECRET = 'test-customer-secret';
process.env.HOME_LOAN_ADMIN_PASSWORD = 'test-admin-password';
process.env.ADMIN_EMAIL = 'admin@paisamart.com';
const { adminRouter: app } = await import('./admin');
const { customerPayoutsRouter: customer } = await import('./customer-payouts');
const store = await import('../lib/admin-operations');
const { saveBusinessLoanLead } = await import('../lib/business-loan-lead-store');
const { saveHomeLoanLead } = await import('../lib/home-loan-lead-store');
const { savePersonalApplication } = await import('../lib/personal-loan-application-store');
const { saveVehicleLoanLead } = await import('../lib/vehicle-loan-lead-store');
const { saveServiceApplication } = await import('../lib/service-application-store');
const tokens: Record<string,string> = {}, staffIds: Record<string,string> = {};
const json = (data: unknown) => ({ headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
async function login(email: string, password: string) {
  const response = await app.request('/auth/login', { method:'POST', ...json({email,password}) });
  expect(response.status).toBe(200); return (await response.json()).token;
}
tokens.admin = await login('admin@paisamart.com','test-admin-password');
function req(path: string, role = 'admin', data?: object, method = 'POST') {
  return app.request('/operations' + path, { method: data ? method : 'GET', headers: { Authorization: 'Bearer ' + tokens[role], 'Content-Type': 'application/json' }, ...(data ? {body:JSON.stringify(data)} : {}) });
}
for (const role of ['ops','viewer','executive','manager']) {
  const response = await req('/staff','admin',{ name:role,email:role+'@example.test',password:'test-staff-password',role });
  expect(response.status).toBe(200); staffIds[role]=(await response.json()).id;
  tokens[role]=await login(role+'@example.test','test-staff-password');
}
const applicant = '9000000000';
function customerToken(phone = applicant) {
 const header=Buffer.from(JSON.stringify({alg:'HS256'})).toString('base64url');
 const payload=Buffer.from(JSON.stringify({sub:'+91'+phone,exp:Math.floor(Date.now()/1000)+3600})).toString('base64url');
 return header+'.'+payload+'.'+createHmac('sha256',process.env.AUTH_TOKEN_SECRET!).update(header+'.'+payload).digest('base64url');
}
async function visible(phone = applicant) {
 const response=await customer.request('/',{headers:{Authorization:'Bearer '+customerToken(phone)}});
 expect(response.status).toBe(200);expect(response.headers.get('cache-control')).toBe('no-store');return (await response.json()).data;
}
async function row(id:string,role='admin') {return (await (await req('/applications?search='+id,role)).json()).data.find((r:any)=>r.id===id);}
const common={fullName:'Payout Customer',phoneNumber:applicant,cibil:'750',dateOfBirth:'01/01/1990',city:'Hyderabad',state:'Telangana',monthlyIncome:'50000',loanAmountRequired:'100000',existingEmi:'0'};
async function create(product='business-loans') {
 if(product==='home-loans') return 'HL-'+(await saveHomeLoanLead({...common,loanType:'House Purchase'})).id;
 if(product==='personal-loans') return 'PL-'+(await savePersonalApplication({...common,companyName:'Test',employmentType:'Private'},crypto.randomUUID())).id;
 if(product==='vehicle-loans') return 'VL-'+(await saveVehicleLoanLead({...common,occupation:'Salaried',vehicleType:'Car',vehicleCondition:'New Vehicle'})).id;
 if(product==='bank-accounts') return 'BA-'+(await saveServiceApplication('bank-accounts',{...common,provider:'Test bank',productName:'Savings'},crypto.randomUUID())).id;
 return 'BL-'+(await saveBusinessLoanLead({...common,businessType:'Retail',loanPurpose:'Expansion'})).id;
}
async function stage(id:string,value:string) {
 const r=await row(id);
 if(id.startsWith('HL-')) return app.request('/home-loans/'+id.slice(3),{method:'PATCH',headers:{Authorization:'Bearer '+tokens.admin,'Content-Type':'application/json'},body:JSON.stringify({version:r.homeVersion,stage:value,loanAmountRequired:'100000',note:'Test stage'})});
 return req('/applications/'+id,'admin',{version:r.version,stage:value,...(id.startsWith('BA-')&&value==='approved'?{provider:'Test bank',providerDecision:'approved',providerEvidence:'Activation reference'}:{})},'PATCH');
}
async function save(id:string,customerAmount='1250.25',paisamartAmount='400.75',role='ops',version?:number) {
 const r=await row(id);return req('/applications/'+id+'/payout',role,{version:version??r.version,homeVersion:r.homeVersion,customerAmount,paisamartAmount},'PUT');
}
async function approve(id:string,role:string,version?:number) { const r=await row(id);return req('/applications/'+id+'/payout/approve',role,{version:version??r.version,homeVersion:r.homeVersion}); }

test('all five products require their milestone; both approvals gate applicant-only amounts and edits reset approvals',async()=>{
 for(const product of ['home-loans','business-loans','personal-loans','vehicle-loans','bank-accounts']) {
  const id=await create(product);
  expect((await save(id)).status).toBe(400);
  expect((await approve(id,'executive')).status).toBe(400);
  expect((await stage(id,product==='bank-accounts'?'approved':'disbursed')).status).toBe(200);
  expect((await save(id)).status).toBe(200);
  expect((await row(id)).payout.customerAmount).toBe('1250.25');
  expect((await row(id,'executive')).payout.paisamartAmount).toBe('400.75');
  expect((await row(id,'viewer')).payout).toBeUndefined();
  expect((await visible()).some((r:any)=>r.referenceNumber===id)).toBe(false);
  expect((await approve(id,'manager')).status).toBe(200);
  expect((await visible()).some((r:any)=>r.referenceNumber===id)).toBe(false);
  expect((await approve(id,'executive')).status).toBe(200);
  const displayed=(await visible()).find((r:any)=>r.referenceNumber===id);
  expect(displayed).toEqual({referenceNumber:id,productType:product,customerAmount:'1250.25',currency:'INR'});
  expect((await visible('9000000001')).some((r:any)=>r.referenceNumber===id)).toBe(false);
  expect((await approve(id,'executive')).status).toBe(409);
  expect((await save(id,'0','999.99')).status).toBe(200);
  expect((await row(id)).payout.approvals).toEqual({});
  expect((await visible()).some((r:any)=>r.referenceNumber===id)).toBe(false);
  expect((await approve(id,'executive')).status).toBe(200);
  expect((await visible()).some((r:any)=>r.referenceNumber===id)).toBe(false);
  expect((await approve(id,'manager')).status).toBe(200);
  expect((await visible()).find((r:any)=>r.referenceNumber===id).customerAmount).toBe('0.00');
  expect((await row(id)).stage).toBe(product==='bank-accounts'?'approved':'disbursed');
 }
});

test('backend denies unauthorized edits/approvals, forged role fields and invalid currency',async()=>{
 const id=await create(); await stage(id,'disbursed');
 for(const role of ['viewer','executive','manager']) expect((await save(id,'1','2',role)).status).toBe(403);
 for(const role of ['admin','ops','viewer']) expect((await approve(id,role)).status).toBe(403);
 for(const value of ['-1','1.001','NaN','Infinity','1e3','+1',' 1','1,000','','01','1000000000000']) {
  expect((await save(id,value,'2')).status).toBe(400);expect((await save(id,'2',value)).status).toBe(400);
 }
 expect((await req('/applications/'+id+'/payout','admin',{version:0,customerAmount:1,paisamartAmount:2},'PUT')).status).toBe(400);
 expect((await req('/applications/'+id+'/payout/approve','admin',{version:0,role:'executive'})).status).toBe(400);
 expect((await customer.request('/')).status).toBe(401);
 expect((await customer.request('/',{headers:{Authorization:'Bearer '+tokens.admin}})).status).toBe(401);
 expect((await req('/applications/'+id,'executive',{version:(await row(id)).version,stage:'rejected'},'PATCH')).status).toBe(403);
 expect((await save(id,'999999999999.99','0')).status).toBe(200);
});

test('stale amount edits and approvals cannot overwrite reviewed amounts; audit is atomic',async()=>{
 const id=await create();await stage(id,'disbursed');await save(id);
 const version=(await row(id)).version;
 const responses=await Promise.all([save(id,'1','2','ops',version),save(id,'3','4','admin',version)]);
 expect(responses.map(r=>r.status).sort()).toEqual([200,409]);
 expect((await approve(id,'executive',version)).status).toBe(409);
 const current=(await row(id)).version;
 const approvals=await Promise.all([approve(id,'executive',current),approve(id,'manager',current)]);
 expect(approvals.map(r=>r.status).sort()).toEqual([200,409]);
 expect((await visible()).some((r:any)=>r.referenceNumber===id)).toBe(false);
 const before=await row(id);
 await store.query("CREATE TRIGGER fail_payout_audit BEFORE INSERT ON admin_audit WHEN NEW.action='payout_amount_edit' BEGIN SELECT RAISE(FAIL,'test failure'); END");
 expect((await save(id,'50','60')).status).toBe(503);
 expect(await row(id)).toEqual(before);
 await store.query('DROP TRIGGER fail_payout_audit');
 const events=(await (await req('/audit')).json()).data.filter((r:any)=>r.entityId===id);
 expect(events.some((r:any)=>r.action==='payout_amount_edit'&&r.details.before?.customerAmount==='1250.25')).toBe(true);
 expect(events.some((r:any)=>r.action==='payout_approval'&&r.details.revision===before.payout.revision)).toBe(true);
});

test('stage regression and Home pipeline versions invalidate visibility and stale Home edits',async()=>{
 for(const product of ['business-loans','home-loans','bank-accounts']) {
  const id=await create(product);await stage(id,product==='bank-accounts'?'approved':'disbursed');await save(id);await approve(id,'executive');await approve(id,'manager');
  const before=await row(id);
  expect((await stage(id,'new')).status).toBe(200);
  expect((await visible()).some((r:any)=>r.referenceNumber===id)).toBe(false);
  expect((await approve(id,'executive')).status).toBe(400);
  await stage(id,product==='bank-accounts'?'approved':'disbursed');
  expect((await visible()).some((r:any)=>r.referenceNumber===id)).toBe(false);
  if(product==='home-loans') {
   expect((await req('/applications/'+id+'/payout','ops',{version:before.version,homeVersion:before.homeVersion,customerAmount:'1',paisamartAmount:'2'},'PUT')).status).toBe(409);
   expect((await req('/applications/'+id+'/payout/approve','executive',{version:before.version,homeVersion:before.homeVersion})).status).toBe(409);
  }
 }
});

test('SQLite restart retains approvals and amounts; access revocation invalidates approval signatures',async()=>{
 const id=await create();await stage(id,'disbursed');await save(id);await approve(id,'executive');await approve(id,'manager');
 const script="const {customerEligiblePayouts}=await import('./backend/src/lib/admin-operations.ts'); console.log(JSON.stringify(await customerEligiblePayouts('"+applicant+"')));";
 const processResult=Bun.spawnSync([process.execPath,'-e',script],{cwd:join(import.meta.dir,'../../..'),env:process.env});
 expect(processResult.exitCode).toBe(0);
 expect(JSON.parse(processResult.stdout.toString()).some((r:any)=>r.referenceNumber===id)).toBe(true);
 const staff=(await (await req('/staff')).json()).data.find((r:any)=>r.id===staffIds.executive);
 expect((await req('/staff','admin',{id:staff.id,version:staff.version,name:staff.name,email:staff.email,role:'executive',active:false})).status).toBe(200);
 expect((await visible()).some((r:any)=>r.referenceNumber===id)).toBe(false);
 expect((await row(id)).payout.approvals).toEqual({});
 expect((await approve(id,'executive')).status).toBe(401);
});


test('one identity cannot supply both approvals through role changes or approve their own edit', async () => {
 const created=await req('/staff','admin',{name:'Dual role test',email:'dual@example.test',password:'test-staff-password',role:'ops'});
 const staffId=(await created.json()).id;
 tokens.dual=await login('dual@example.test','test-staff-password');
 const own=await create();await stage(own,'disbursed');expect((await save(own,'1','2','dual')).status).toBe(200);
 async function changeRole(role:string) {
  const staff=(await (await req('/staff')).json()).data.find((r:any)=>r.id===staffId);
  expect((await req('/staff','admin',{id:staffId,version:staff.version,name:staff.name,email:staff.email,role,active:true})).status).toBe(200);
 }
 await changeRole('executive');
 expect((await approve(own,'dual')).status).toBe(403);
 const other=await create();await stage(other,'disbursed');await save(other);
 expect((await approve(other,'dual')).status).toBe(200);
 await changeRole('manager');
 expect((await row(other)).payout.approvals).toEqual({});
 expect((await approve(other,'dual')).status).toBe(200);
 expect((await visible()).some((r:any)=>r.referenceNumber===other)).toBe(false);
 const result=await req('/applications/'+other,'admin',{version:(await row(other)).version,payout:{customerAmount:'999',approvals:{executive:{actorId:staffId}}}},'PATCH');
 expect(result.status).toBe(400);
});
