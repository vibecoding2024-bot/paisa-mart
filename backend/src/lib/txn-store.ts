// Transaction store (Bun's built-in SQLite). Implements the VimoPay lifecycle:
// create -> Pending, then the gateway callback -> Success/Failed (spec p.19).
import { Database } from "bun:sqlite";

const db = new Database(process.env.TXN_DB ?? "payments.db");
db.run(`CREATE TABLE IF NOT EXISTS txns (
  merchantRefId   TEXT PRIMARY KEY,
  txnId           TEXT,
  amount          TEXT,
  status          TEXT,
  txnStatusCode   TEXT,
  responseMessage TEXT,
  payload         TEXT,
  createdAt       TEXT,
  updatedAt       TEXT
)`);

const now = () => new Date().toISOString();

// status code -> human status (spec p.44)
export function mapStatus(code?: string, fallback?: string): string {
  switch (code) {
    case "000": return "Success";
    case "001": return "Failed";
    case "002": return "Pending";
    case "003": return "ValidationFailed";
    case "004": return "Queued";
    default: return fallback || "Pending";
  }
}

// called on /create — record the transaction as in-progress
export function savePending(t: {
  merchantRefId: string; txnId?: string; amount?: unknown;
  txnStatusCode?: string; responseMessage?: string; raw?: unknown;
}) {
  db.run(
    `INSERT INTO txns (merchantRefId,txnId,amount,status,txnStatusCode,responseMessage,payload,createdAt,updatedAt)
     VALUES (?,?,?,?,?,?,?,?,?)
     ON CONFLICT(merchantRefId) DO UPDATE SET
       txnId=excluded.txnId, amount=excluded.amount, status=excluded.status,
       txnStatusCode=excluded.txnStatusCode, responseMessage=excluded.responseMessage,
       payload=excluded.payload, updatedAt=excluded.updatedAt`,
    [
      t.merchantRefId, t.txnId ?? "", String(t.amount ?? ""),
      mapStatus(t.txnStatusCode, "Pending"), t.txnStatusCode ?? "002",
      t.responseMessage ?? "Transaction in progress", JSON.stringify(t.raw ?? {}), now(), now(),
    ],
  );
}

// called on /vimopay-callback — upsert the final status
export function applyCallback(cb: any) {
  const ref = String(cb?.merchantRefId ?? cb?.txnId ?? "unknown");
  const status = mapStatus(cb?.txnStatusCode, cb?.txnStatus);
  const existing = getTxn(ref);
  if (existing) {
    db.run(
      `UPDATE txns SET status=?, txnStatusCode=?, txnId=COALESCE(NULLIF(?,''),txnId),
         responseMessage=?, payload=?, updatedAt=? WHERE merchantRefId=?`,
      [status, cb?.txnStatusCode ?? "", cb?.txnId ?? "", cb?.responseMessage ?? "", JSON.stringify(cb), now(), ref],
    );
  } else {
    db.run(
      `INSERT INTO txns (merchantRefId,txnId,amount,status,txnStatusCode,responseMessage,payload,createdAt,updatedAt)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [ref, cb?.txnId ?? "", String(cb?.amount ?? ""), status, cb?.txnStatusCode ?? "", cb?.responseMessage ?? "", JSON.stringify(cb), now(), now()],
    );
  }
  return { merchantRefId: ref, status };
}

export function getTxn(merchantRefId: string): any {
  return db.query(`SELECT * FROM txns WHERE merchantRefId = ?`).get(merchantRefId);
}

export function recentTxns(limit = 50): any[] {
  return db.query(`SELECT * FROM txns ORDER BY updatedAt DESC LIMIT ?`).all(limit);
}
