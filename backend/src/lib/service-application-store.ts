import { Database } from 'bun:sqlite';
import { createHash } from 'node:crypto';

// These intakes share the dashboard database, so saved records and their audit
// metadata cannot silently land in different service databases.
export const SERVICE_SOURCES = [
  { kind: 'credit-cards', table: 'credit_card_applications', prefix: 'CC' },
  { kind: 'bank-accounts', table: 'bank_account_applications', prefix: 'BA' },
  { kind: 'insta-loans', table: 'insta_loan_applications', prefix: 'IL' },
  { kind: 'health-insurance', table: 'health_insurance_applications', prefix: 'HI' },
  { kind: 'motor-insurance', table: 'motor_insurance_applications', prefix: 'MI' },
] as const;
export type ServiceProduct = typeof SERVICE_SOURCES[number]['kind'];
const url = process.env.HOME_LOANS_DATABASE_URL ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
const db = url ? null : new Database(process.env.LEADS_DB ?? process.env.TXN_DB ?? 'payments.db');
let sql: any;
let ready: Promise<void> | undefined;
async function query(text: string, params: any[] = []): Promise<any[]> {
  if (db) return db.query(text).all(...params) as any[];
  if (!sql) sql = (await import('postgres')).default(url!, { max: 3 });
  let i = 0;
  return sql.unsafe(text.replace(/\?/g, () => '$' + ++i), params);
}
export async function initializeServiceApplications() {
  if (!ready) ready = (async () => {
    for (const { table } of SERVICE_SOURCES) await query(`CREATE TABLE IF NOT EXISTS ${table} (
      id TEXT PRIMARY KEY, full_name TEXT NOT NULL, phone_number TEXT NOT NULL,
      provider TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE, request_hash TEXT NOT NULL
    )`);
  })().catch(error => { ready = undefined; throw error; });
  await ready;
}
export class SubmissionConflict extends Error {}
const legacyTables = ['business_loan_leads', 'life_insurance_leads', 'vehicle_loan_leads'];
export function initializeLeadIdempotency(database: Database | null, table: string) {
  if (!legacyTables.includes(table)) throw new Error('Unsupported lead source');
  if (!database) return;
  const columns = new Set((database.query(`PRAGMA table_info(${table})`).all() as {name:string}[]).map(c => c.name));
  for (const column of ['idempotency_key', 'request_hash'])
    if (!columns.has(column)) database.run(`ALTER TABLE ${table} ADD COLUMN ${column} TEXT`);
  database.run(`CREATE UNIQUE INDEX IF NOT EXISTS ${table}_submission_key ON ${table}(idempotency_key)`);
}
export async function initializePgLeadIdempotency(client: any, table: string) {
  if (!legacyTables.includes(table)) throw new Error('Unsupported lead source');
  for (const column of ['idempotency_key', 'request_hash'])
    await client.unsafe(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} TEXT`);
  await client.unsafe(`CREATE UNIQUE INDEX IF NOT EXISTS ${table}_submission_key ON ${table}(idempotency_key)`);
}
export function leadRequestHash(input: object) {
  return createHash('sha256').update(JSON.stringify(input)).digest('hex');
}
export function replayLeadReceipt(row: any, hash: string): { id: string; createdAt: string } {
  if (!row || row.request_hash !== hash) throw new SubmissionConflict('Submission details changed. Retry with the original details.');
  return { id: String(row.id), createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt };
}
function source(product: ServiceProduct) {
  const value = SERVICE_SOURCES.find(s => s.kind === product);
  if (!value) throw new Error('Unsupported application type');
  return value;
}
export async function saveServiceApplication(product: ServiceProduct, input: {
  fullName: string; phoneNumber: string; provider: string; [key: string]: unknown;
}, key: string) {
  await initializeServiceApplications();
  const { table, prefix } = source(product);
  const payload = JSON.stringify(input);
  const hash = createHash('sha256').update(payload).digest('hex');
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  // Atomic unique-key insertion: a concurrent retry gets the original receipt.
  await query(`INSERT INTO ${table} (id,full_name,phone_number,provider,payload,created_at,idempotency_key,request_hash)
    VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(idempotency_key) DO NOTHING`,
  [id, input.fullName, input.phoneNumber, input.provider, payload, createdAt, key, hash]);
  const row = (await query(`SELECT id,created_at,request_hash FROM ${table} WHERE idempotency_key=?`, [key]))[0];
  if (!row || row.request_hash !== hash) throw new SubmissionConflict('Submission details changed. Start a new submission.');
  return { id: row.id as string, referenceNumber: `${prefix}-${row.id}`, createdAt: row.created_at as string };
}
export async function serviceReceipt(product: ServiceProduct, id: string, key: string) {
  await initializeServiceApplications();
  const { table, prefix } = source(product);
  const row = (await query(`SELECT id,created_at FROM ${table} WHERE id=? AND idempotency_key=?`, [id, key]))[0];
  // A receipt contains no applicant, contact, policy or health information.
  return row ? { id: row.id, referenceNumber: `${prefix}-${row.id}`, createdAt: row.created_at } : null;
}
