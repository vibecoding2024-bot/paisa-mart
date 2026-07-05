import { Database } from "bun:sqlite";

export type BusinessLoanLeadInput = {
  phoneNumber: string;
  businessType: string;
  loanAmountRequired: string;
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
  businessType               TEXT NOT NULL,
  loanAmountRequired         TEXT NOT NULL,
  loanPurpose                TEXT NOT NULL,
  loanPurposeOtherText       TEXT,
  source                     TEXT NOT NULL DEFAULT 'business-loans-details',
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
    CREATE TABLE IF NOT EXISTS business_loan_leads (
      id                         BIGSERIAL PRIMARY KEY,
      phone_number               TEXT NOT NULL,
      business_type              TEXT NOT NULL,
      loan_amount_required       TEXT NOT NULL,
      loan_purpose               TEXT NOT NULL,
      loan_purpose_other_text    TEXT,
      source                     TEXT NOT NULL DEFAULT 'business-loans-details',
      payload                    JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  return sql;
}

export async function saveBusinessLoanLead(input: BusinessLoanLeadInput): Promise<BusinessLoanLeadRow> {
  const normalized: BusinessLoanLeadInput = {
    ...input,
    phoneNumber: normalizePhone(input.phoneNumber),
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
        business_type,
        loan_amount_required,
        loan_purpose,
        loan_purpose_other_text,
        source,
        payload
      )
      VALUES (
        ${normalized.phoneNumber},
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
        business_type AS "businessType",
        loan_amount_required AS "loanAmountRequired",
        loan_purpose AS "loanPurpose",
        loan_purpose_other_text AS "loanPurposeOtherText",
        source,
        created_at AS "createdAt"
    `;
    return rows[0] as BusinessLoanLeadRow;
  }

  const id = crypto.randomUUID();
  const createdAt = now();
  sqlite!.run(
    `INSERT INTO business_loan_leads (
      id,phoneNumber,businessType,loanAmountRequired,loanPurpose,
      loanPurposeOtherText,source,createdAt
    ) VALUES (?,?,?,?,?,?,?,?)`,
    [
      id,
      normalized.phoneNumber,
      normalized.businessType,
      normalized.loanAmountRequired,
      normalized.loanPurpose,
      normalized.loanPurposeOtherText || null,
      normalized.source,
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
