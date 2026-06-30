import { Database } from "bun:sqlite";

export type UserProfileRow = {
  phoneNumber: string;
  name: string;
  email: string;
  occupation: string;
  qualification: string;
  annualIncome: string;
  pincode: string;
  panCard: string | null;
  cibilScore: string | null;
  dateOfBirth: string | null;
  kycStatus: string;
  createdAt: string;
  updatedAt: string;
};

export type UserProfileInput = {
  phoneNumber: string;
  name: string;
  email: string;
  occupation: string;
  qualification: string;
  annualIncome: string;
  pincode: string;
  panCard?: string;
  cibilScore?: string;
  dateOfBirth?: unknown;
};

const db = new Database(process.env.USER_DB ?? process.env.TXN_DB ?? "payments.db");

db.run(`CREATE TABLE IF NOT EXISTS user_profiles (
  phoneNumber   TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  occupation    TEXT NOT NULL,
  qualification TEXT NOT NULL,
  annualIncome  TEXT NOT NULL,
  pincode       TEXT NOT NULL,
  panCard       TEXT,
  cibilScore    TEXT,
  dateOfBirth   TEXT,
  kycStatus     TEXT NOT NULL DEFAULT 'not_started',
  createdAt     TEXT NOT NULL,
  updatedAt     TEXT NOT NULL
)`);

const now = () => new Date().toISOString();

function normalizePhone(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, "").slice(-10);
}

export function saveUserProfile(input: UserProfileInput): UserProfileRow {
  const phoneNumber = normalizePhone(input.phoneNumber);
  const existing = getUserProfile(phoneNumber);
  const createdAt = existing?.createdAt ?? now();
  const updatedAt = now();
  const dateOfBirth =
    input.dateOfBirth === undefined || input.dateOfBirth === null
      ? null
      : JSON.stringify(input.dateOfBirth);

  db.run(
    `INSERT INTO user_profiles (
      phoneNumber,name,email,occupation,qualification,annualIncome,pincode,
      panCard,cibilScore,dateOfBirth,kycStatus,createdAt,updatedAt
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(phoneNumber) DO UPDATE SET
      name=excluded.name,
      email=excluded.email,
      occupation=excluded.occupation,
      qualification=excluded.qualification,
      annualIncome=excluded.annualIncome,
      pincode=excluded.pincode,
      panCard=excluded.panCard,
      cibilScore=excluded.cibilScore,
      dateOfBirth=excluded.dateOfBirth,
      updatedAt=excluded.updatedAt`,
    [
      phoneNumber,
      input.name.trim(),
      input.email.trim(),
      input.occupation,
      input.qualification,
      input.annualIncome,
      input.pincode,
      input.panCard ?? null,
      input.cibilScore ?? null,
      dateOfBirth,
      existing?.kycStatus ?? "not_started",
      createdAt,
      updatedAt,
    ],
  );

  return getUserProfile(phoneNumber)!;
}

export function getUserProfile(phoneNumber: string): UserProfileRow | null {
  return db
    .query<UserProfileRow, [string]>(`SELECT * FROM user_profiles WHERE phoneNumber = ?`)
    .get(normalizePhone(phoneNumber));
}

export function updateUserKycStatus(phoneNumber: string, kycStatus: string): UserProfileRow | null {
  db.run(`UPDATE user_profiles SET kycStatus = ?, updatedAt = ? WHERE phoneNumber = ?`, [
    kycStatus,
    now(),
    normalizePhone(phoneNumber),
  ]);
  return getUserProfile(phoneNumber);
}

export function listUserProfiles(limit = 100): UserProfileRow[] {
  return db
    .query<UserProfileRow, [number]>(`SELECT * FROM user_profiles ORDER BY updatedAt DESC LIMIT ?`)
    .all(limit);
}
