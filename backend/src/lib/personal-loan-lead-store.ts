import { Database } from "bun:sqlite";

export type PersonalLoanLeadInput = {
  phoneNumber: string;
  fullName?: string;
  cibil?: string;
  dateOfBirth?: string;
  city?: string;
  state?: string;
  companyName?: string;
  monthlyIncome: string;
  loanAmountRequired?: string;
  existingEmi: string;
  employmentType?: string;
  source?: string;
};

export type PersonalLoanLeadRow = PersonalLoanLeadInput & {
  id: string;
  createdAt: string;
};

const dbUrl = process.env.PERSONAL_LOANS_DATABASE_URL ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
const sqlite = dbUrl ? null : new Database(process.env.LEADS_DB ?? process.env.TXN_DB ?? "payments.db");
const dynamicImport = new Function("specifier", "return import(specifier)") as (
  specifier: string,
) => Promise<any>;
let pgClientPromise: Promise<any> | null = null;

sqlite?.run(`CREATE TABLE IF NOT EXISTS personal_loan_leads (
  id                         TEXT PRIMARY KEY,
  phoneNumber                TEXT NOT NULL,
  fullName                   TEXT,
  cibil                      TEXT,
  dateOfBirth                TEXT,
  city                       TEXT,
  state                      TEXT,
  companyName                TEXT,
  monthlyIncome              TEXT NOT NULL,
  loanAmountRequired         TEXT,
  existingEmi                TEXT NOT NULL,
  source                     TEXT NOT NULL DEFAULT 'personal-loans-details',
  createdAt                  TEXT NOT NULL
)`);

function normalizePhone(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, "").slice(-10);
}

function now() {
  return new Date().toISOString();
}

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
    CREATE TABLE IF NOT EXISTS personal_loan_leads (
      id                          BIGSERIAL PRIMARY KEY,
      phone_number                TEXT NOT NULL,
      monthly_income              TEXT NOT NULL,
      existing_emi                TEXT NOT NULL,
      source                      TEXT NOT NULL DEFAULT 'personal-loans-details',
      payload                     JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  return sql;
}

export async function savePersonalLoanLead(input: PersonalLoanLeadInput): Promise<PersonalLoanLeadRow> {
  const normalized: PersonalLoanLeadInput = {
    ...input,
    phoneNumber: normalizePhone(input.phoneNumber),
    source: input.source || "personal-loans-details",
  };

  if (!/^\d{10}$/.test(normalized.phoneNumber)) {
    throw new Error("A valid phone number is required");
  }

  const sql = await getPgClient();
  if (sql) {
    const rows = await sql`
      INSERT INTO personal_loan_leads (
        phone_number,
        monthly_income,
        existing_emi,
        source,
        payload
      )
      VALUES (
        ${normalized.phoneNumber},
        ${normalized.monthlyIncome},
        ${normalized.existingEmi},
        ${normalized.source},
        ${sql.json(normalized)}
      )
      RETURNING
        id::text,
        phone_number AS "phoneNumber",
        monthly_income AS "monthlyIncome",
        existing_emi AS "existingEmi",
        source,
        created_at AS "createdAt"
    `;
    return rows[0] as PersonalLoanLeadRow;
  }

  const id = crypto.randomUUID();
  const createdAt = now();
  sqlite!.run(
    `INSERT INTO personal_loan_leads (
      id,phoneNumber,fullName,cibil,dateOfBirth,city,state,companyName,
      monthlyIncome,loanAmountRequired,existingEmi,source,createdAt
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      normalized.phoneNumber,
      normalized.fullName || null,
      normalized.cibil || null,
      normalized.dateOfBirth || null,
      normalized.city || null,
      normalized.state || null,
      normalized.companyName || null,
      normalized.monthlyIncome,
      normalized.loanAmountRequired || null,
      normalized.existingEmi,
      normalized.source,
      createdAt,
    ],
  );

  return {
    ...normalized,
    id,
    createdAt,
  };
}
