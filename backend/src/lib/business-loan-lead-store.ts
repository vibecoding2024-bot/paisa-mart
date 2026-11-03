import { Database } from "bun:sqlite";

export type BusinessLoanLeadInput = {
  phoneNumber: string;
  fullName?: string;
  cibil?: string;
  dateOfBirth?: string;
  city?: string;
  state?: string;
  monthlyIncome?: string;
  existingEmi?: string;
  businessType: string;
  loanAmountRequired?: string;
  loanPurpose: string;
  loanPurposeOtherText?: string;
  source?: string;
};

export type BusinessLoanLeadRow = BusinessLoanLeadInput & {
  id: string;
  createdAt: string;
};

const dbUrl = process.env.BUSINESS_LOANS_DATABASE_URL ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
const sqlite = dbUrl ? null : new Database(process.env.LEADS_DB ?? process.env.TXN_DB ?? "payments.db");
const dynamicImport = new Function("specifier", "return import(specifier)") as (
  specifier: string,
) => Promise<any>;
let pgClientPromise: Promise<any> | null = null;

sqlite?.run(`CREATE TABLE IF NOT EXISTS business_loan_leads (
  id                         TEXT PRIMARY KEY,
  phoneNumber                TEXT NOT NULL,
  fullName                   TEXT,
  cibil                      TEXT,
  dateOfBirth                TEXT,
  city                       TEXT,
  state                      TEXT,
  monthlyIncome              TEXT,
  existingEmi                TEXT,
  businessType               TEXT NOT NULL,
  loanAmountRequired         TEXT,
  loanPurpose                TEXT NOT NULL,
  loanPurposeOtherText       TEXT,
  source                     TEXT NOT NULL DEFAULT 'business-loans-details',
  createdAt                  TEXT NOT NULL
)`);

const existingColumns = new Set(
  (sqlite?.query("PRAGMA table_info(business_loan_leads)").all() as { name: string }[] | undefined)
    ?.map((column) => column.name) ?? [],
);
for (const column of ["fullName", "cibil", "dateOfBirth", "city", "state", "monthlyIncome", "existingEmi"]) {
  if (sqlite && !existingColumns.has(column)) {
    sqlite.run(`ALTER TABLE business_loan_leads ADD COLUMN ${column} TEXT`);
  }
}

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
    CREATE TABLE IF NOT EXISTS business_loan_leads (
      id                         BIGSERIAL PRIMARY KEY,
      phone_number               TEXT NOT NULL,
      full_name                  TEXT,
      cibil                      TEXT,
      date_of_birth              TEXT,
      city                       TEXT,
      state                      TEXT,
      monthly_income              TEXT,
      existing_emi                TEXT,
      business_type              TEXT NOT NULL,
      loan_amount_required       TEXT NOT NULL,
      loan_purpose               TEXT NOT NULL,
      loan_purpose_other_text    TEXT,
      source                     TEXT NOT NULL DEFAULT 'business-loans-details',
      payload                    JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  for (const column of [
    "full_name",
    "cibil",
    "date_of_birth",
    "city",
    "state",
    "monthly_income",
    "existing_emi",
  ]) {
    await sql.unsafe(`ALTER TABLE business_loan_leads ADD COLUMN IF NOT EXISTS ${column} TEXT`);
  }
  return sql;
}

export async function saveBusinessLoanLead(input: BusinessLoanLeadInput): Promise<BusinessLoanLeadRow> {
  const normalized: BusinessLoanLeadInput = {
    ...input,
    phoneNumber: normalizePhone(input.phoneNumber),
    fullName: input.fullName?.trim(),
    city: input.city?.trim(),
    state: input.state?.trim(),
    loanAmountRequired: input.loanAmountRequired ?? "",
    loanPurposeOtherText: input.loanPurposeOtherText?.trim() || "",
    source: input.source || "business-loans-details",
  };

  if (!/^\d{10}$/.test(normalized.phoneNumber)) {
    throw new Error("A valid phone number is required");
  }

  const sql = await getPgClient();
  if (sql) {
    const rows = await sql`
      INSERT INTO business_loan_leads (
        phone_number,
        full_name,
        cibil,
        date_of_birth,
        city,
        state,
        monthly_income,
        existing_emi,
        business_type,
        loan_amount_required,
        loan_purpose,
        loan_purpose_other_text,
        source,
        payload
      )
      VALUES (
        ${normalized.phoneNumber},
        ${normalized.fullName ?? null},
        ${normalized.cibil ?? null},
        ${normalized.dateOfBirth ?? null},
        ${normalized.city ?? null},
        ${normalized.state ?? null},
        ${normalized.monthlyIncome ?? null},
        ${normalized.existingEmi ?? null},
        ${normalized.businessType},
        ${normalized.loanAmountRequired},
        ${normalized.loanPurpose},
        ${normalized.loanPurposeOtherText || null},
        ${normalized.source},
        ${sql.json(normalized)}
      )
      RETURNING
        id::text,
        phone_number AS "phoneNumber",
        full_name AS "fullName",
        cibil,
        date_of_birth AS "dateOfBirth",
        city,
        state,
        monthly_income AS "monthlyIncome",
        existing_emi AS "existingEmi",
        business_type AS "businessType",
        loan_amount_required AS "loanAmountRequired",
        loan_purpose AS "loanPurpose",
        loan_purpose_other_text AS "loanPurposeOtherText",
        source,
        created_at AS "createdAt"
    `;
    return { ...normalized, ...rows[0] } as BusinessLoanLeadRow;
  }

  const id = crypto.randomUUID();
  const createdAt = now();
  sqlite!.run(
    `INSERT INTO business_loan_leads (
      id,phoneNumber,fullName,cibil,dateOfBirth,city,state,monthlyIncome,existingEmi,
      businessType,loanAmountRequired,loanPurpose,
      loanPurposeOtherText,source,createdAt
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      normalized.phoneNumber,
      normalized.fullName ?? null,
      normalized.cibil ?? null,
      normalized.dateOfBirth ?? null,
      normalized.city ?? null,
      normalized.state ?? null,
      normalized.monthlyIncome ?? null,
      normalized.existingEmi ?? null,
      normalized.businessType,
      normalized.loanAmountRequired ?? "",
      normalized.loanPurpose,
      normalized.loanPurposeOtherText || null,
      normalized.source ?? 'business-loans-details',
      createdAt,
    ],
  );

  return {
    ...normalized,
    id,
    loanPurposeOtherText: normalized.loanPurposeOtherText || "",
    createdAt,
  };
}
