import { Database } from "bun:sqlite";
import type { AuthClaims } from "./auth-token";

export type Role = "admin" | "ops" | "viewer";
export type Actor = { id: string; email: string; role: Role };
export class OperationsError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
const url =
  process.env.HOME_LOANS_DATABASE_URL ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL;
const db = url
  ? null
  : new Database(process.env.LEADS_DB ?? process.env.TXN_DB ?? "payments.db");
let sql: any;
let ready: Promise<void> | undefined;
let queue = Promise.resolve();
export async function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const previous = queue;
  let release!: () => void;
  queue = new Promise<void>((r) => {
    release = r;
  });
  await previous;
  try {
    return await fn();
  } finally {
    release();
  }
}
export async function query(
  text: string,
  params: any[] = [],
  tx?: any,
): Promise<any[]> {
  if (!url) return db!.query(text).all(...params) as any[];
  if (!sql) {
    const postgres = (await import("postgres")).default;
    sql = postgres(url, { max: 3 });
  }
  let i = 0;
  return (tx ?? sql).unsafe(
    text.replace(/\?/g, () => "$" + ++i),
    params,
  );
}
async function transaction<T>(fn: (tx?: any) => Promise<T>): Promise<T> {
  if (url) {
    await query("SELECT 1");
    return sql.begin(fn);
  }
  db!.run("BEGIN IMMEDIATE");
  try {
    const result = await fn();
    db!.run("COMMIT");
    return result;
  } catch (e) {
    db!.run("ROLLBACK");
    throw e;
  }
}
export async function migrate() {
  if (!ready)
    ready = (async () => {
      for (const ddl of [
        `CREATE TABLE IF NOT EXISTS admin_operations (id TEXT PRIMARY KEY, version INTEGER NOT NULL, payload TEXT NOT NULL)`,
        `CREATE TABLE IF NOT EXISTS admin_audit (id TEXT PRIMARY KEY, actor TEXT NOT NULL, at TEXT NOT NULL, action TEXT NOT NULL, entity TEXT NOT NULL, details TEXT NOT NULL)`,
        `CREATE TABLE IF NOT EXISTS admin_staff (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, role TEXT NOT NULL, password_hash TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, version INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)`,
        `CREATE TABLE IF NOT EXISTS admin_records (id TEXT PRIMARY KEY, kind TEXT NOT NULL, version INTEGER NOT NULL, payload TEXT NOT NULL)`,
        `CREATE TABLE IF NOT EXISTS admin_commission_rules (id TEXT PRIMARY KEY, provider TEXT NOT NULL, product TEXT NOT NULL, effective_from TEXT NOT NULL, effective_to TEXT, terms TEXT NOT NULL, approved_by TEXT, version INTEGER NOT NULL DEFAULT 0)`,
        `CREATE TABLE IF NOT EXISTS admin_finance_ledger (id TEXT PRIMARY KEY, application_id TEXT NOT NULL, rule_id TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('estimated','earned','approved','payable','paid','reversed','disputed')), amount_minor BIGINT NOT NULL, currency TEXT NOT NULL, reason TEXT NOT NULL, actor TEXT NOT NULL, approved_by TEXT, idempotency_key TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL)`,
      ])
        await query(ddl);
    })().catch((e) => {
      ready = undefined;
      throw e;
    });
  return ready;
}
export async function audit(
  actor: Actor,
  action: string,
  entity: string,
  details: object = {},
  tx?: any,
) {
  await query(
    "INSERT INTO admin_audit (id,actor,at,action,entity,details) VALUES (?,?,?,?,?,?)",
    [
      crypto.randomUUID(),
      actor.email,
      new Date().toISOString(),
      action,
      entity,
      JSON.stringify(details),
    ],
    tx,
  );
}
export async function actorFromClaims(
  claims: AuthClaims | null,
): Promise<Actor | null> {
  if (!claims || !["admin", "ops", "viewer"].includes(claims.role ?? ""))
    return null;
  await migrate();
  if (claims.sub.startsWith("staff:")) {
    const row = (
      await query(
        "SELECT id,email,role FROM admin_staff WHERE id = ? AND active = 1",
        [claims.sub.slice(6)],
      )
    )[0];
    return row && ["admin", "ops", "viewer"].includes(row.role) ? row : null;
  }
  // Preserve the existing environment-admin token contract; other staff must have a live database record.
  const email = (
    process.env.ADMIN_EMAIL || "admin@paisamart.com"
  ).toLowerCase();
  return claims.role === "admin" && claims.sub === "admin:" + email
    ? { id: "admin-1", email, role: "admin" }
    : null;
}
export async function staffLogin(email: string, password: string) {
  await migrate();
  const row = (
    await query("SELECT * FROM admin_staff WHERE email = ? AND active = 1", [
      email.toLowerCase(),
    ])
  )[0];
  if (!row || !(await Bun.password.verify(password, row.password_hash)))
    return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as Role,
    createdAt: row.created_at,
  };
}
export async function staffList() {
  return query(
    'SELECT id,email,name,role,active,version,created_at AS "createdAt" FROM admin_staff ORDER BY email',
  );
}
export async function saveStaff(input: any, actor: Actor) {
  if (actor.role !== "admin")
    throw new OperationsError("Administrator access required", 403);
  const passwordHash = input.password
    ? await Bun.password.hash(input.password)
    : null;
  return transaction(async (tx) => {
    const id = input.id ?? crypto.randomUUID();
    if (input.id) {
      if (actor.id === id)
        throw new OperationsError("You cannot change your own access");
      const row = (
        await query(
          "SELECT * FROM admin_staff WHERE id = ?" + (url ? " FOR UPDATE" : ""),
          [id],
          tx,
        )
      )[0];
      if (!row) throw new OperationsError("Staff member not found", 404);
      if (row.version !== input.version)
        throw new OperationsError("Staff record changed. Refresh first.", 409);
      await query(
        "UPDATE admin_staff SET name=?,role=?,active=?,password_hash=?,version=? WHERE id=?",
        [
          input.name,
          input.role,
          input.active ? 1 : 0,
          passwordHash ?? row.password_hash,
          row.version + 1,
          id,
        ],
        tx,
      );
    } else {
      if (!passwordHash)
        throw new OperationsError("An initial password is required");
      if (
        input.email.toLowerCase() ===
        (process.env.ADMIN_EMAIL || "admin@paisamart.com").toLowerCase()
      )
        throw new OperationsError("Reserved administrator email");
      if (
        (
          await query(
            "SELECT id FROM admin_staff WHERE email=?",
            [input.email.toLowerCase()],
            tx,
          )
        ).length
      )
        throw new OperationsError("Email already exists", 409);
      await query(
        "INSERT INTO admin_staff(id,email,name,role,password_hash,active,version,created_at) VALUES(?,?,?,?,?,1,0,?)",
        [
          id,
          input.email.toLowerCase(),
          input.name,
          input.role,
          passwordHash,
          new Date().toISOString(),
        ],
        tx,
      );
    }
    await audit(
      actor,
      "permission_change",
      id,
      { role: input.role, active: input.active ?? true },
      tx,
    );
    return { id };
  });
}
const sources = [
  {
    table: "home_loan_leads",
    kind: "home-loans",
    prefix: "HL",
    env: "HOME_LOANS_DATABASE_URL",
  },
  {
    table: "personal_loan_applications",
    kind: "personal-loans",
    prefix: "PL",
    env: "PERSONAL_LOANS_DATABASE_URL",
  },
  {
    table: "personal_loan_leads",
    kind: "personal-loans",
    prefix: "PL-LEGACY",
    env: "PERSONAL_LOANS_DATABASE_URL",
  },
  {
    table: "business_loan_leads",
    kind: "business-loans",
    prefix: "BL",
    env: "BUSINESS_LOANS_DATABASE_URL",
  },
] as const;
async function exists(table: string) {
  return url
    ? !!(await query("SELECT to_regclass(?) AS name", [table]))[0]?.name
    : !!(
        await query(
          "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
          [table],
        )
      )[0];
}
function parse(value: any) {
  return typeof value === "string" ? JSON.parse(value) : (value ?? {});
}
const homeMap: Record<string, string> = {
  new: "new",
  contacted: "eligibility_check",
  documents_pending: "kyc_pending",
  application_submitted: "submitted",
  underwriting: "kyc_completed",
  sanctioned: "approved",
  disbursed: "disbursed",
  rejected_dropped: "rejected",
};
export async function applications(actor: Actor) {
  await migrate();
  const rows: any[] = [];
  const availability: Record<string, string> = {};
  const metadata = new Map(
    (await query("SELECT * FROM admin_operations")).map((r) => [
      r.id,
      { ...parse(r.payload), version: r.version },
    ]),
  );
  const workflows = (await exists("home_loan_workflow"))
    ? new Map(
        (await query("SELECT * FROM home_loan_workflow")).map((r) => [
          r.lead_id,
          r,
        ]),
      )
    : new Map();
  for (const source of sources) {
    if (
      (process.env[source.env] ??
        process.env.DATABASE_URL ??
        process.env.POSTGRES_URL) !== url
    ) {
      availability[source.table] =
        "unavailable: separate service database requires an adapter";
      continue;
    }
    if (!(await exists(source.table))) {
      availability[source.table] = "unavailable: source table not initialized";
      continue;
    }
    availability[source.table] = "available";
    for (const row of await query("SELECT * FROM " + source.table)) {
      const payload = parse(row.payload);
      const field = (camel: string, snake: string = camel) =>
        row[camel] ?? row[snake] ?? payload[camel] ?? "";
      const id = source.prefix + "-" + row.id;
      const op = metadata.get(id) ?? {};
      const workflow = workflows.get(String(row.id));
      const homeStage =
        source.kind === "home-loans" ? (workflow?.stage ?? "new") : null;
      const createdAt = new Date(
        field("createdAt", "created_at"),
      ).toISOString();
      const history = homeStage
        ? parse(workflow?.history ?? "[]").map(
            (h: any, index: number, events: any[]) => ({
              fromStage: index === 0 ? "new" : homeMap[events[index - 1].stage],
              toStage: homeMap[h.stage],
              changedAt: h.at,
              changedBy: h.actor,
              note: h.note,
            }),
          )
        : (op.history ?? []);
      const phone = String(field("phoneNumber", "phone_number"));
      rows.push({
        id,
        sourceTable: source.table,
        sourceId: String(row.id),
        referenceNumber: id,
        userName: field("fullName", "full_name") || "Name not recorded",
        mobile: actor.role === "viewer" ? "******" + phone.slice(-4) : phone,
        email: "",
        productType: source.kind,
        provider: op.provider || "Not recorded",
        providerDecision: op.providerDecision ?? "unconfirmed",
        providerEvidence:
          actor.role === "viewer" ? "" : (op.providerEvidence ?? ""),
        stage: homeStage ? homeMap[homeStage] : (op.stage ?? "new"),
        homeStage,
        homeVersion: workflow?.version ?? 0,
        outcome:
          !op.providerDecision || op.providerDecision === "unconfirmed"
            ? "pending"
            : op.providerDecision,
        createdAt,
        // Assignment metadata and the Home pipeline update independently.
        // Neither timestamp may hide a later change from the other source.
        updatedAt: new Date(
          Math.max(
            Date.parse(createdAt),
            ...[op.updatedAt, ...history.map((event: any) => event.changedAt)]
              .map((value) => Date.parse(value))
              .filter(Number.isFinite),
          ),
        ).toISOString(),
        assignedOwner: op.assignedOwner ?? "",
        priority: op.priority ?? "medium",
        city: field("city"),
        state: field("state"),
        source: field("source") || source.table,
        followUpDate: op.followUpDate ?? undefined,
        notes: actor.role === "viewer" ? [] : (op.notes ?? []),
        stageHistory: actor.role === "viewer" ? [] : history,
        consentGiven: payload.consentGiven === true,
        consentStatus:
          payload.consentGiven === true ? "recorded" : "not recorded",
        version: op.version ?? 0,
        extraDetails: {
          "Loan Amount Required": String(
            field("loanAmountRequired", "loan_amount_required"),
          ),
          "Internal processing stage": homeStage ?? op.stage ?? "new",
          "Provider decision": op.providerDecision ?? "unconfirmed",
        },
      });
    }
  }
  // Source-qualified IDs retain legacy and current records; never guess duplicates from a phone number.
  return {
    data: rows.sort(
      (a, b) =>
        b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id),
    ),
    availability,
  };
}
export function filterApplications(rows: any[], filters: any) {
  const today = new Date(
    new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) +
      "T00:00:00+05:30",
  ).getTime();
  const start =
    filters.period === "today"
      ? today
      : filters.period === "7days"
        ? today - 6 * 86400000
        : filters.period === "30days"
          ? today - 29 * 86400000
          : -Infinity;
  const end = today + 86400000;
  return rows.filter(
    (r) =>
      (!filters.search ||
        [r.id, r.userName, r.mobile, r.provider].some((v) =>
          String(v).toLowerCase().includes(filters.search.toLowerCase()),
        )) &&
      (!filters.product ||
        filters.product === "all" ||
        r.productType === filters.product) &&
      (!filters.stage ||
        filters.stage === "all" ||
        r.stage === filters.stage) &&
      (!filters.owner || r.assignedOwner === filters.owner) &&
      (!filters.outcome ||
        filters.outcome === "all" ||
        r.outcome === filters.outcome) &&
      (!filters.priority ||
        filters.priority === "all" ||
        r.priority === filters.priority) &&
      new Date(r.createdAt).getTime() >= start &&
      (filters.period === "all" ||
        !filters.period ||
        new Date(r.createdAt).getTime() < end),
  );
}
export async function updateApplication(id: string, input: any, actor: Actor) {
  if (actor.role === "viewer")
    throw new OperationsError("Read-only access", 403);
  const lead = (await applications(actor)).data.find((x) => x.id === id);
  if (!lead) throw new OperationsError("Application not found", 404);
  if (input.stage && lead.productType === "home-loans")
    throw new OperationsError(
      "Use the existing Home Loan pipeline to preserve its stages",
    );
  if (input.assignedOwner) {
    const staff = await staffList();
    const valid = [
      (process.env.ADMIN_EMAIL || "admin@paisamart.com").toLowerCase(),
      ...staff
        .filter((x) => x.active && x.role !== "viewer")
        .map((x) => x.email),
    ];
    if (!valid.includes(input.assignedOwner))
      throw new OperationsError("Select an active operations owner");
  }
  if (
    input.providerDecision &&
    input.providerDecision !== "unconfirmed" &&
    (!input.providerEvidence?.trim() || !input.provider?.trim())
  )
    throw new OperationsError("Recorded provider and evidence are required");
  return transaction(async (tx) => {
    if (url) await query("SELECT pg_advisory_xact_lock(hashtext(?))", [id], tx);
    const row = (
      await query("SELECT * FROM admin_operations WHERE id=?", [id], tx)
    )[0];
    const current = parse(row?.payload);
    const version = row?.version ?? 0;
    if (version !== input.version)
      throw new OperationsError(
        "Application changed. Refresh and try again.",
        409,
      );
    const at = new Date().toISOString();
    const next = { ...current, updatedAt: at };
    for (const key of [
      "stage",
      "assignedOwner",
      "priority",
      "followUpDate",
      "provider",
      "providerDecision",
      "providerEvidence",
    ])
      if (input[key] !== undefined) next[key] = input[key];
    if (input.note)
      next.notes = [
        ...(current.notes ?? []),
        {
          id: crypto.randomUUID(),
          text: input.note,
          createdBy: actor.email,
          createdAt: at,
        },
      ];
    if (input.stage)
      next.history = [
        ...(current.history ?? []),
        {
          fromStage: current.stage ?? "new",
          toStage: input.stage,
          changedBy: actor.email,
          changedAt: at,
          note: input.note ?? "",
        },
      ];
    await query(
      "INSERT INTO admin_operations(id,version,payload) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET version=excluded.version,payload=excluded.payload",
      [id, version + 1, JSON.stringify(next)],
      tx,
    );
    if (lead.sourceTable === "personal_loan_applications" && input.stage) {
      const labels: Record<string, string> = {
        new: "Received",
        eligibility_check: "Under review",
        kyc_pending: "Documents pending",
        kyc_completed: "Documents reviewed",
        submitted: "Submitted for processing",
        closed: "Closed",
      };
      await query(
        "UPDATE personal_loan_applications SET status=? WHERE id=?",
        [labels[input.stage] ?? input.stage, lead.sourceId],
        tx,
      );
    }
    await audit(
      actor,
      "application_update",
      id,
      {
        fields: Object.keys(input).filter(
          (k) => k !== "version" && k !== "note",
        ),
        fromVersion: version,
        toVersion: version + 1,
      },
      tx,
    );
    return { version: version + 1 };
  });
}
export async function records(kind: string) {
  return (
    await query("SELECT * FROM admin_records WHERE kind=? ORDER BY id", [kind])
  ).map((r) => ({ id: r.id, kind, version: r.version, ...parse(r.payload) }));
}
export async function saveRecord(kind: string, input: any, actor: Actor) {
  if (actor.role === "viewer" || (kind === "partner" && actor.role !== "admin"))
    throw new OperationsError("Permission denied", 403);
  return transaction(async (tx) => {
    const id = input.id ?? crypto.randomUUID();
    if (url) await query("SELECT pg_advisory_xact_lock(hashtext(?))", [id], tx);
    const row = (
      await query("SELECT * FROM admin_records WHERE id=?", [id], tx)
    )[0];
    if (input.id && (!row || row.kind !== kind))
      throw new OperationsError("Record not found", 404);
    if (row && row.version !== input.version)
      throw new OperationsError("Record changed. Refresh first.", 409);
    const { id: unused, version: unusedVersion, ...fields } = input;
    const previous = parse(row?.payload);
    const payload = {
      status: "open",
      applicationId: "",
      owner: "",
      note: "",
      reason: "",
      dueAt: "",
      ...previous,
      ...fields,
      updatedAt: new Date().toISOString(),
      updatedBy: actor.email,
    };
    payload.history = [
      ...(previous.history ?? []),
      { at: payload.updatedAt, actor: actor.email, changes: fields },
    ];
    if (!row) {
      payload.createdAt = payload.updatedAt;
      payload.createdBy = actor.email;
    }
    await query(
      "INSERT INTO admin_records(id,kind,version,payload) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET version=excluded.version,payload=excluded.payload",
      [id, kind, (row?.version ?? -1) + 1, JSON.stringify(payload)],
      tx,
    );
    await audit(
      actor,
      kind + "_update",
      id,
      { fields: Object.keys(fields) },
      tx,
    );
    return { id };
  });
}
export async function auditList() {
  return (
    await query("SELECT * FROM admin_audit ORDER BY at DESC LIMIT 500")
  ).map((r) => ({
    id: r.id,
    adminUser: r.actor,
    timestamp: r.at,
    action: r.action,
    entityId: r.entity,
    entityType: "lead",
    details: parse(r.details),
  }));
}
// Read only the existing local customer/transaction stores. Never return raw gateway payloads or KYC identifiers.
export function localDirectory(
  kind: "customers" | "transactions",
  actor: Actor,
) {
  const path =
    kind === "customers"
      ? (process.env.USER_DB ?? process.env.TXN_DB ?? "payments.db")
      : (process.env.TXN_DB ?? "payments.db");
  let connection: Database;
  try {
    connection = new Database(path, { readonly: true });
  } catch {
    return {
      available: false,
      data: [],
      message: "Configured source database is unavailable",
    };
  }
  try {
    const table = kind === "customers" ? "user_profiles" : "txns";
    if (
      !connection
        .query("SELECT name FROM sqlite_master WHERE type='table' AND name=?")
        .get(table)
    )
      return {
        available: false,
        data: [],
        message: "Source table is not initialized",
      };
    if (kind === "transactions")
      return {
        available: true,
        data: connection
          .query(
            "SELECT merchantRefId,txnId,amount,status,createdAt,updatedAt FROM txns ORDER BY createdAt DESC",
          )
          .all(),
      };
    const rows = connection
      .query(
        "SELECT phoneNumber,name,email,kycStatus,createdAt,updatedAt FROM user_profiles ORDER BY name",
      )
      .all() as any[];
    return {
      available: true,
      data: rows.map((r) => ({
        ...r,
        phoneNumber:
          actor.role === "viewer"
            ? "******" + r.phoneNumber.slice(-4)
            : r.phoneNumber,
        email: actor.role === "viewer" ? "Restricted" : r.email,
      })),
    };
  } finally {
    connection.close();
  }
}
