import { expect, test } from 'bun:test';
import { Database } from 'bun:sqlite';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('upgrade from populated October SQLite preserves rows and constraints and is repeatable', async () => {
  const path=join(mkdtempSync(join(tmpdir(),'paisa-upgrade-')),'payments.db');
  let db=new Database(path);
  // Exact October Business columns, including its NOT NULL amount constraint.
  db.run(`CREATE TABLE business_loan_leads (id TEXT PRIMARY KEY, phoneNumber TEXT NOT NULL,
    businessType TEXT NOT NULL, loanAmountRequired TEXT NOT NULL, loanPurpose TEXT NOT NULL,
    loanPurposeOtherText TEXT, source TEXT NOT NULL DEFAULT 'business-loans-details', createdAt TEXT NOT NULL)`);
  db.run("INSERT INTO business_loan_leads VALUES ('existing','9876543210','Retail','100000','Expansion',NULL,'business-loans-details','2026-10-21T00:00:00.000Z')");
  db.run("INSERT INTO business_loan_leads SELECT 'existing-second',phoneNumber,businessType,loanAmountRequired,loanPurpose,loanPurposeOtherText,source,createdAt FROM business_loan_leads WHERE id='existing'");
  db.run('CREATE TABLE personal_loan_applications(id TEXT PRIMARY KEY, payload TEXT NOT NULL)');
  db.run("INSERT INTO personal_loan_applications VALUES ('preserved','existing customer data')");
  db.run('CREATE TABLE admin_audit(id TEXT PRIMARY KEY, actor TEXT NOT NULL, at TEXT NOT NULL, action TEXT NOT NULL, entity TEXT NOT NULL, details TEXT NOT NULL)');
  db.run("INSERT INTO admin_audit VALUES ('old','existing actor','2026-10-21','existing action','existing','{}')");
  const old=db.query('SELECT * FROM business_loan_leads').get() as any;
  const modules=['business-loan-lead-store','insurance-lead-store','vehicle-loan-lead-store','service-application-store','admin-operations'];
  const script=modules.map(name=>`const m_${name.replaceAll('-','_')}=await import(${JSON.stringify(new URL('../lib/'+name+'.ts',import.meta.url).href)});`).join('\n')+
    '\nawait m_service_application_store.initializeServiceApplications();await m_admin_operations.migrate();';
  const env={...process.env,LEADS_DB:path,TXN_DB:path};
  for(const key of ['DATABASE_URL','POSTGRES_URL','HOME_LOANS_DATABASE_URL','PERSONAL_LOANS_DATABASE_URL','BUSINESS_LOANS_DATABASE_URL','LIFE_INSURANCE_DATABASE_URL','VEHICLE_LOANS_DATABASE_URL']) delete env[key];
  for(let i=0;i<2;i++) {
    const child=Bun.spawn([process.execPath,'-e',script],{env,stdout:'pipe',stderr:'pipe'});
    const stderr=await new Response(child.stderr).text();expect(await child.exited,stderr).toBe(0);
  }
  db.close(); db=new Database(path); // refresh cached SELECT * metadata after the separate migration process
  const row=db.query('SELECT * FROM business_loan_leads').get() as any;
  for(const [key,value] of Object.entries(old)) expect(row[key]).toBe(value);
  expect(row.fullName).toBeNull();
  expect(db.query('SELECT count(*) AS n FROM business_loan_leads WHERE idempotency_key IS NULL AND request_hash IS NULL').get()).toEqual({n:2});
  for (const table of ['business_loan_leads','life_insurance_leads','vehicle_loan_leads']) {
    const columns=db.query(`PRAGMA table_info(${table})`).all() as {name:string}[];
    expect(columns.some(c=>c.name==='idempotency_key')).toBe(true);
    expect(columns.some(c=>c.name==='request_hash')).toBe(true);
    expect((db.query(`PRAGMA index_list(${table})`).all() as any[]).some(i=>i.name===table+'_submission_key'&&i.unique===1)).toBe(true);
  }
  expect(db.query('SELECT payload FROM personal_loan_applications').get()).toEqual({payload:'existing customer data'});
  expect(db.query('SELECT action FROM admin_audit').get()).toEqual({action:'existing action'});
  expect(db.query('PRAGMA integrity_check').all()).toEqual([{integrity_check:'ok'}]);
  for(const table of ['credit_card_applications','bank_account_applications','insta_loan_applications','health_insurance_applications','motor_insurance_applications','life_insurance_leads','vehicle_loan_leads'])
    expect(db.query(`SELECT count(*) AS n FROM ${table}`).get()).toEqual({n:0});
  db.close();
});
