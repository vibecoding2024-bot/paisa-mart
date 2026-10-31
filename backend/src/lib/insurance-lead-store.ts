import { Database } from "bun:sqlite";

export type LifeInsuranceLeadInput = {
  phoneNumber: string;
  fullName: string;
  selectedLifeInsurer: string;
  policyType: string;
  premiumSlab: string;
  premiumOtherAmount: string;
};

export type InsuranceLeadRow = {
  id: string;
  phoneNumber: string;
  fullName: string;
  source: string;
  createdAt: string;
} & Record<string, string>;

const dynamicImport = new Function("specifier", "return import(specifier)") as (
  specifier: string,
) => Promise<any>;
const clients = new Map<string, Promise<any>>();

function databaseUrl(environment: string) {
  return process.env[environment] ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
}

const sqlite = !databaseUrl("LIFE_INSURANCE_DATABASE_URL")
  ? new Database(process.env.LEADS_DB ?? process.env.TXN_DB ?? "payments.db")
  : null;
sqlite?.run(`CREATE TABLE IF NOT EXISTS life_insurance_leads (
  id TEXT PRIMARY KEY,
  phoneNumber TEXT NOT NULL,
  fullName TEXT NOT NULL,
  selectedLifeInsurer TEXT NOT NULL,
  policyType TEXT NOT NULL,
  premiumSlab TEXT NOT NULL,
  premiumOtherAmount TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'life-insurance-details',
  payload TEXT NOT NULL DEFAULT '{}',
  createdAt TEXT NOT NULL
)`);
async function getPgClient(environment: string, ddl: string) {
  const url = databaseUrl(environment);
  if (!url) return null;
  let client = clients.get(url);
  if (!client) {
    client = dynamicImport("postgres").then((mod) => {
      const postgres = mod.default ?? mod;
      return postgres(url, { max: 3 });
    });
    clients.set(url, client);
  }
  const sql = await client;
  await sql.unsafe(ddl);
  return sql;
}

function normalize<T extends { phoneNumber: string; fullName: string }>(
  input: T,
): Omit<T, "phoneNumber" | "fullName"> & { phoneNumber: string; fullName: string } {
  const phoneNumber = input.phoneNumber.replace(/\D/g, "").slice(-10);
  if (!/^[6-9]\d{9}$/.test(phoneNumber)) throw new Error("A valid phone number is required");
  return { ...input, phoneNumber, fullName: input.fullName.trim() };
}

export async function saveLifeInsuranceLead(input: LifeInsuranceLeadInput): Promise<InsuranceLeadRow> {
  const normalized = normalize(input);
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const source = "life-insurance-details";
  const payload = { ...normalized, source };
  const sql = await getPgClient("LIFE_INSURANCE_DATABASE_URL", `CREATE TABLE IF NOT EXISTS life_insurance_leads (
    id TEXT PRIMARY KEY, phone_number TEXT NOT NULL, full_name TEXT NOT NULL,
    selected_life_insurer TEXT NOT NULL, policy_type TEXT NOT NULL,
    premium_slab TEXT NOT NULL, premium_other_amount TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'life-insurance-details', payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  if (sql) {
    await sql`INSERT INTO life_insurance_leads
      (id, phone_number, full_name, selected_life_insurer, policy_type, premium_slab, premium_other_amount, source, payload, created_at)
      VALUES (${id}, ${normalized.phoneNumber}, ${normalized.fullName}, ${normalized.selectedLifeInsurer},
        ${normalized.policyType}, ${normalized.premiumSlab}, ${normalized.premiumOtherAmount}, ${source},
        ${sql.json(payload)}, ${createdAt})`;
  } else {
    sqlite!.run(`INSERT INTO life_insurance_leads
      (id, phoneNumber, fullName, selectedLifeInsurer, policyType, premiumSlab, premiumOtherAmount, source, payload, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      id, normalized.phoneNumber, normalized.fullName, normalized.selectedLifeInsurer,
      normalized.policyType, normalized.premiumSlab, normalized.premiumOtherAmount,
      source, JSON.stringify(payload), createdAt,
    ]);
  }
  return { ...payload, id, createdAt };
}
