import { Database } from "bun:sqlite";

export type HomeLoanLeadInput = {
  phoneNumber: string;
  fullName?: string;
  cibil?: string;
  dateOfBirth?: string;
  monthlyIncome: string;
  existingEmi: string;
  loanAmountRequired: string;
  loanType: string;
  city?: string;
  state?: string;
  source?: string;
};

export type HomeLoanLeadRow = HomeLoanLeadInput & {
  id: string;
  createdAt: string;
};

const dbUrl = process.env.HOME_LOANS_DATABASE_URL ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
const sqlite = dbUrl ? null : new Database(process.env.LEADS_DB ?? process.env.TXN_DB ?? "payments.db");
const dynamicImport = new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<any>;
let pgClientPromise: Promise<any> | null = null;

sqlite?.run(`CREATE TABLE IF NOT EXISTS home_loan_leads (
  id                   TEXT PRIMARY KEY,
  phoneNumber          TEXT NOT NULL,
  fullName             TEXT,
  cibil                TEXT,
  dateOfBirth          TEXT,
  monthlyIncome        TEXT NOT NULL,
  existingEmi          TEXT NOT NULL,
  loanAmountRequired   TEXT NOT NULL,
  loanType             TEXT NOT NULL,
  city                 TEXT,
  state                TEXT,
  source               TEXT NOT NULL DEFAULT 'home-loans-details',
  createdAt            TEXT NOT NULL
)`);

function normalizePhone(p: string): string {
  return p.replace(/\D/g, "").slice(-10);
}
function now() { return new Date().toISOString(); }

async function getPgClient() {
  if (!dbUrl) return null;
  if (!pgClientPromise) {
    pgClientPromise = dynamicImport("postgres").then((mod) => {
      const postgres = mod.default ?? mod;
      return postgres(dbUrl, { max: 3 });
    });
  }
  const sql = await pgClientPromise;
  await sql`
    CREATE TABLE IF NOT EXISTS home_loan_leads (
      id                   BIGSERIAL PRIMARY KEY,
      phone_number         TEXT NOT NULL,
      monthly_income       TEXT NOT NULL,
      existing_emi         TEXT NOT NULL,
      loan_amount_required TEXT NOT NULL,
      loan_type            TEXT NOT NULL,
      source               TEXT NOT NULL DEFAULT 'home-loans-details',
      payload              JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  return sql;
}

export async function saveHomeLoanLead(input: HomeLoanLeadInput): Promise<HomeLoanLeadRow> {
  const normalized: HomeLoanLeadInput = {
    ...input,
    phoneNumber: normalizePhone(input.phoneNumber),
    source: input.source || "home-loans-details",
  };

  if (!/^\d{10}$/.test(normalized.phoneNumber)) {
    throw new Error("A valid phone number is required");
  }

  const sql = await getPgClient();
  if (sql) {
    const rows = await sql`
      INSERT INTO home_loan_leads (
        phone_number, monthly_income, existing_emi,
        loan_amount_required, loan_type, source, payload
      ) VALUES (
        ${normalized.phoneNumber}, ${normalized.monthlyIncome}, ${normalized.existingEmi},
        ${normalized.loanAmountRequired}, ${normalized.loanType}, ${normalized.source},
        ${sql.json(normalized)}
      )
      RETURNING
        id::text,
        phone_number       AS "phoneNumber",
        monthly_income     AS "monthlyIncome",
        existing_emi       AS "existingEmi",
        loan_amount_required AS "loanAmountRequired",
        loan_type          AS "loanType",
        source,
        created_at         AS "createdAt"
    `;
    return rows[0] as HomeLoanLeadRow;
  }

  const id = crypto.randomUUID();
  const createdAt = now();
  sqlite!.run(
    `INSERT INTO home_loan_leads (
      id,phoneNumber,fullName,cibil,dateOfBirth,monthlyIncome,
      existingEmi,loanAmountRequired,loanType,city,state,source,createdAt
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id, normalized.phoneNumber, normalized.fullName || null, normalized.cibil || null,
      normalized.dateOfBirth || null, normalized.monthlyIncome, normalized.existingEmi,
      normalized.loanAmountRequired, normalized.loanType, normalized.city || null,
      normalized.state || null, normalized.source, createdAt,
    ],
  );

  return { ...normalized, id, createdAt };
}
