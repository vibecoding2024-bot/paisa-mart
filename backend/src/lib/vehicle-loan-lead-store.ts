import { Database } from "bun:sqlite";
import { initializeLeadIdempotency, initializePgLeadIdempotency, leadRequestHash, replayLeadReceipt } from './service-application-store';

export type VehicleLoanLeadInput = {
  phoneNumber: string;
  fullName: string;
  cibil: string;
  occupation: string;
  dateOfBirth: string;
  city: string;
  state: string;
  monthlyIncome: string;
  loanAmountRequired: string;
  existingEmi: string;
  vehicleCondition: 'New Vehicle' | 'Used Vehicle';
  vehicleType: string;
  source?: string;
};

export type VehicleLoanLeadRow = VehicleLoanLeadInput & {
  id: string;
  createdAt: string;
};

const dbUrl =
  process.env.VEHICLE_LOANS_DATABASE_URL ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL;
const sqlite = dbUrl
  ? null
  : new Database(process.env.LEADS_DB ?? process.env.TXN_DB ?? "payments.db");
const dynamicImport = new Function("specifier", "return import(specifier)") as (
  specifier: string,
) => Promise<any>;
let pgClientPromise: Promise<any> | null = null;

sqlite?.run(`CREATE TABLE IF NOT EXISTS vehicle_loan_leads (
  id TEXT PRIMARY KEY,
  phoneNumber TEXT NOT NULL,
  fullName TEXT NOT NULL,
  cibil TEXT NOT NULL,
  occupation TEXT NOT NULL,
  dateOfBirth TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  monthlyIncome TEXT NOT NULL,
  loanAmountRequired TEXT NOT NULL,
  existingEmi TEXT NOT NULL,
  vehicleType TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'vehicle-loans-details',
  payload TEXT NOT NULL DEFAULT '{}',
  createdAt TEXT NOT NULL
)`);
initializeLeadIdempotency(sqlite, 'vehicle_loan_leads');

async function getPgClient() {
  if (!dbUrl) return null;
  if (!pgClientPromise) {
    pgClientPromise = dynamicImport("postgres").then((mod) => {
      const postgres = mod.default ?? mod;
      return postgres(dbUrl, { max: 3 });
    });
  }
  const sql = await pgClientPromise;
  await sql`CREATE TABLE IF NOT EXISTS vehicle_loan_leads (
    id BIGSERIAL PRIMARY KEY,
    phone_number TEXT NOT NULL,
    full_name TEXT NOT NULL,
    cibil TEXT NOT NULL,
    occupation TEXT NOT NULL,
    date_of_birth TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    monthly_income TEXT NOT NULL,
    loan_amount_required TEXT NOT NULL,
    existing_emi TEXT NOT NULL,
    vehicle_type TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'vehicle-loans-details',
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await initializePgLeadIdempotency(sql, 'vehicle_loan_leads');
  return sql;
}

export async function saveVehicleLoanLead(
  input: VehicleLoanLeadInput,
  key?: string,
): Promise<VehicleLoanLeadRow> {
  const normalized: VehicleLoanLeadInput = {
    ...input,
    phoneNumber: input.phoneNumber.replace(/\D/g, "").slice(-10),
    fullName: input.fullName.trim(),
    occupation: input.occupation.trim(),
    city: input.city.trim(),
    state: input.state.trim(),
    vehicleType: input.vehicleType.trim(),
    source: input.source || "vehicle-loans-details",
  };
  if (!/^[6-9]\d{9}$/.test(normalized.phoneNumber)) {
    throw new Error("A valid phone number is required");
  }

  const createdAt = new Date().toISOString();
  const hash = leadRequestHash(normalized);
  const sql = await getPgClient();
  if (sql) {
    const rows = await sql`
      INSERT INTO vehicle_loan_leads (
        phone_number, full_name, cibil, occupation, date_of_birth, city, state,
        monthly_income, loan_amount_required, existing_emi, vehicle_type, source, payload, idempotency_key, request_hash
      ) VALUES (
        ${normalized.phoneNumber}, ${normalized.fullName}, ${normalized.cibil},
        ${normalized.occupation}, ${normalized.dateOfBirth}, ${normalized.city},
        ${normalized.state}, ${normalized.monthlyIncome}, ${normalized.loanAmountRequired},
        ${normalized.existingEmi}, ${normalized.vehicleType}, ${normalized.source},
        ${sql.json(normalized)}, ${key ?? null}, ${key ? hash : null}
      )
      ON CONFLICT(idempotency_key) DO NOTHING
      RETURNING id::text, phone_number AS "phoneNumber", full_name AS "fullName",
        cibil, occupation, date_of_birth AS "dateOfBirth", city, state,
        monthly_income AS "monthlyIncome", loan_amount_required AS "loanAmountRequired",
        existing_emi AS "existingEmi", vehicle_type AS "vehicleType", source,
        created_at AS "createdAt"
    `;
    if (key) {
      const saved = await sql`SELECT id::text, created_at AS "createdAt", request_hash FROM vehicle_loan_leads WHERE idempotency_key=${key}`;
      return { ...normalized, ...replayLeadReceipt(saved[0], hash) };
    }
    return { ...normalized, ...rows[0] } as VehicleLoanLeadRow;
  }

  const id = crypto.randomUUID();
  sqlite!.run(`INSERT INTO vehicle_loan_leads (
    id, phoneNumber, fullName, cibil, occupation, dateOfBirth, city, state,
    monthlyIncome, loanAmountRequired, existingEmi, vehicleType, source, payload, createdAt, idempotency_key, request_hash
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(idempotency_key) DO NOTHING`, [
    id, normalized.phoneNumber, normalized.fullName, normalized.cibil,
    normalized.occupation, normalized.dateOfBirth, normalized.city, normalized.state,
    normalized.monthlyIncome, normalized.loanAmountRequired, normalized.existingEmi,
    normalized.vehicleType, normalized.source ?? 'vehicle-loans-details', JSON.stringify(normalized), createdAt, key ?? null, key ? hash : null,
  ]);
  if (key) return { ...normalized, ...replayLeadReceipt(sqlite!.query('SELECT id, createdAt, request_hash FROM vehicle_loan_leads WHERE idempotency_key=?').get(key), hash) };
  return { ...normalized, id, createdAt };
}
