import { Database } from 'bun:sqlite';

export type PersonalApplicationInput = {
  fullName: string; phoneNumber: string; cibil: string; dateOfBirth: string;
  city: string; state: string; companyName: string; monthlyIncome: string;
  loanAmountRequired: string; existingEmi: string; employmentType: 'Private' | 'Government';
};
export type PersonalApplicationReceipt = {
  id: string; referenceNumber: string; status: string; createdAt: string;
};
type Stored = { id: string; payload: string | PersonalApplicationInput; status: string; createdAt: string | Date };
const dbUrl = process.env.PERSONAL_LOANS_DATABASE_URL ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
const sqlite = dbUrl ? null : new Database(process.env.LEADS_DB ?? process.env.TXN_DB ?? 'payments.db');
// Keep legacy lead records intact; application receipts require atomic retry protection.
sqlite?.run(`CREATE TABLE IF NOT EXISTS personal_loan_applications (
  id TEXT PRIMARY KEY, request_key TEXT NOT NULL UNIQUE, payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Received', created_at TEXT NOT NULL
)`);
let pgPromise: Promise<any> | undefined;
async function pg() {
  if (!dbUrl) return null;
  if (!pgPromise) pgPromise = (async () => {
    const { default: postgres } = await import('postgres');
    const sql = postgres(dbUrl, { max: 3 });
    await sql`CREATE TABLE IF NOT EXISTS personal_loan_applications (
      id TEXT PRIMARY KEY, request_key TEXT NOT NULL UNIQUE, payload JSONB NOT NULL,
      status TEXT NOT NULL DEFAULT 'Received', created_at TIMESTAMPTZ NOT NULL
    )`;
    return sql;
  })().catch(error => { pgPromise = undefined; throw error; });
  return pgPromise;
}
function receipt(row: Stored): PersonalApplicationReceipt {
  return { id: row.id, referenceNumber: `PL-${row.id}`, status: row.status, createdAt: new Date(row.createdAt).toISOString() };
}
export class ApplicationConflict extends Error {}
export async function savePersonalApplication(input: PersonalApplicationInput, requestKey: string) {
  const id = crypto.randomUUID(), createdAt = new Date().toISOString();
  const sql = await pg();
  let row: Stored;
  if (sql) {
    await sql`INSERT INTO personal_loan_applications (id, request_key, payload, created_at)
      VALUES (${id}, ${requestKey}, ${sql.json(input)}, ${createdAt}) ON CONFLICT (request_key) DO NOTHING`;
    [row] = await sql`SELECT id, payload, status, created_at AS "createdAt" FROM personal_loan_applications WHERE request_key = ${requestKey}`;
  } else {
    row = sqlite!.transaction(() => {
      sqlite!.run('INSERT INTO personal_loan_applications (id, request_key, payload, created_at) VALUES (?, ?, ?, ?) ON CONFLICT (request_key) DO NOTHING', [id, requestKey, JSON.stringify(input), createdAt]);
      return sqlite!.query('SELECT id, payload, status, created_at AS createdAt FROM personal_loan_applications WHERE request_key = ?').get(requestKey) as Stored;
    })();
  }
  const saved = typeof row!.payload === 'string' ? JSON.parse(row!.payload) : row!.payload;
  if (Object.keys(input).some(key => saved[key] !== input[key as keyof PersonalApplicationInput])) {
    throw new ApplicationConflict('This submission was already saved with different details. Please contact support before submitting again.');
  }
  return receipt(row!);
}
export async function getPersonalApplication(id: string, requestKey: string) {
  const sql = await pg();
  const row = sql
    ? (await sql`SELECT id, status, created_at AS "createdAt" FROM personal_loan_applications WHERE id = ${id} AND request_key = ${requestKey}`)[0]
    : sqlite!.query('SELECT id, status, created_at AS createdAt FROM personal_loan_applications WHERE id = ? AND request_key = ?').get(id, requestKey);
  return row ? receipt(row as Stored) : null;
}
