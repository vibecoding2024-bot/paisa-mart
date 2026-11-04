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
export async function serviceReceipt(product: ServiceProduct, id: string) {
  await initializeServiceApplications();
  const { table, prefix } = source(product);
  const row = (await query(`SELECT id,created_at FROM ${table} WHERE id=?`, [id]))[0];
  // A receipt contains no applicant, contact, policy or health information.
  return row ? { id: row.id, referenceNumber: `${prefix}-${row.id}`, createdAt: row.created_at } : null;
}
