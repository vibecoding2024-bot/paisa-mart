import { Database } from "bun:sqlite";

export type PersonalLoanLeadInput = {
  phoneNumber: string;
  employmentType: string;
  creditScoreRange?: string;
  monthlyIncome: string;
  totalMonthlyEmi: string;
  totalOutstandingBalance: string;
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
  employmentType             TEXT NOT NULL,
  creditScoreRange           TEXT,
  monthlyIncome              TEXT NOT NULL,
  totalMonthlyEmi            TEXT NOT NULL,
  totalOutstandingBalance    TEXT NOT NULL,
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
      employment_type             TEXT NOT NULL,
      credit_score_range          TEXT,
      monthly_income              TEXT NOT NULL,
      total_monthly_emi           TEXT NOT NULL,
      total_outstanding_balance   TEXT NOT NULL,
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
    creditScoreRange: input.creditScoreRange?.trim() || "",
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
        employment_type,
        credit_score_range,
        monthly_income,
        total_monthly_emi,
        total_outstanding_balance,
        source,
        payload
      )
      VALUES (
        ${normalized.phoneNumber},
        ${normalized.employmentType},
        ${normalized.creditScoreRange || null},
        ${normalized.monthlyIncome},
        ${normalized.totalMonthlyEmi},
        ${normalized.totalOutstandingBalance},
        ${normalized.source},
        ${sql.json(normalized)}
      )
      RETURNING
        id::text,
        phone_number AS "phoneNumber",
        employment_type AS "employmentType",
        credit_score_range AS "creditScoreRange",
        monthly_income AS "monthlyIncome",
        total_monthly_emi AS "totalMonthlyEmi",
        total_outstanding_balance AS "totalOutstandingBalance",
        source,
        created_at AS "createdAt"
    `;
    return rows[0] as PersonalLoanLeadRow;
  }

  const id = crypto.randomUUID();
  const createdAt = now();
  sqlite!.run(
    `INSERT INTO personal_loan_leads (
      id,phoneNumber,employmentType,creditScoreRange,monthlyIncome,
      totalMonthlyEmi,totalOutstandingBalance,source,createdAt
    ) VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      id,
      normalized.phoneNumber,
      normalized.employmentType,
      normalized.creditScoreRange || null,
      normalized.monthlyIncome,
      normalized.totalMonthlyEmi,
      normalized.totalOutstandingBalance,
      normalized.source,
      createdAt,
    ],
  );

  return {
    ...normalized,
    id,
    creditScoreRange: normalized.creditScoreRange || "",
    createdAt,
  };
}
