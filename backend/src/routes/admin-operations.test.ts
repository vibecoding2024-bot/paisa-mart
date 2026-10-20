import { test, expect } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const path = join(mkdtempSync(join(tmpdir(), "dashboard-test-")), "db.sqlite");
process.env.LEADS_DB = path;
process.env.TXN_DB = path;
process.env.USER_DB = path;
for (const key of [
  "DATABASE_URL",
  "POSTGRES_URL",
  "HOME_LOANS_DATABASE_URL",
  "PERSONAL_LOANS_DATABASE_URL",
  "BUSINESS_LOANS_DATABASE_URL",
])
  delete process.env[key];
process.env.HOME_LOAN_ADMIN_PASSWORD = "isolated-admin-password";
process.env.HOME_LOAN_ADMIN_TOKEN_SECRET = "isolated-token-secret";
process.env.ADMIN_EMAIL = "admin@paisamart.com";
const { adminRouter: app } = await import("./admin");
const { personalApplicationsRouter: personal } =
  await import("./personal-loan-applications");
const { homeLoansRouter: home } = await import("./home-loans");
const { savePersonalLoanLead } =
  await import("../lib/personal-loan-lead-store");
const { saveBusinessLoanLead } =
  await import("../lib/business-loan-lead-store");
const store = await import("../lib/admin-operations");
const body = (data: any) => ({
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
const login = async (email: string, password: string) => {
  const r = await app.request("/auth/login", {
    method: "POST",
    ...body({ email, password }),
  });
  expect(r.status).toBe(200);
  return (await r.json()).token as string;
};
let admin = await login("admin@paisamart.com", "isolated-admin-password");
const request = (path: string, token = admin, data?: any, method?: string) =>
  app.request("/operations" + path, {
    method: method || (data ? "POST" : "GET"),
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
  });
let id = "",
  key = crypto.randomUUID(),
  viewer = "",
  ops = "",
  staffId = "";
const payload = {
  requestKey: key,
  fullName: "Synthetic Customer",
  phoneNumber: "9000000000",
  cibil: "750",
  dateOfBirth: "15/01/1990",
  city: "Hyderabad",
  state: "Telangana",
  companyName: "Synthetic Company",
  monthlyIncome: "50000",
  loanAmountRequired: "300000",
  existingEmi: "0",
  employmentType: "Private",
};
test("submission persists and all supported sources reach admin without phone-based merging", async () => {
  const response = await personal.request("/", {
    method: "POST",
    ...body(payload),
  });
  expect(response.status).toBe(200);
  id = (await response.json()).data.referenceNumber;
  await savePersonalLoanLead({
    phoneNumber: "9000000000",
    fullName: "Legacy customer",
    monthlyIncome: "40000",
    existingEmi: "0",
  });
  await saveBusinessLoanLead({
    phoneNumber: "9000000001",
    businessType: "Retail",
    loanAmountRequired: "100000",
    loanPurpose: "Expansion",
  });
  const h = await home.request("/leads", {
    method: "POST",
    ...body({
      phoneNumber: "9000000002",
      fullName: "Home Customer",
      dateOfBirth: "01/01/1990",
      monthlyIncome: "50000",
      existingEmi: "0",
      loanAmountRequired: "1000000",
      loanType: "House Purchase",
      city: "Hyderabad",
    }),
  });
  expect(h.status).toBe(200);
  const result = await (await request("/applications")).json();
  expect(result.total).toBe(4);
  expect(result.summary.total).toBe(result.data.length);
  expect(result.data.some((r: any) => r.id === id)).toBe(true);
  expect(JSON.stringify(result)).not.toContain(key);
  const duplicate = await (
    await personal.request("/", { method: "POST", ...body(payload) })
  ).json();
  expect(duplicate.data.referenceNumber).toBe(id);
  expect((await (await request("/applications")).json()).total).toBe(4);
});
test("create least-privilege staff and enforce direct API restrictions", async () => {
  for (const role of ["viewer", "ops"]) {
    const r = await request("/staff", admin, {
      name: role,
      email: role + "@example.test",
      role,
      password: "synthetic-password-123",
    });
    expect(r.status).toBe(200);
    if (role === "ops") staffId = (await r.json()).id;
  }
  viewer = await login("viewer@example.test", "synthetic-password-123");
  ops = await login("ops@example.test", "synthetic-password-123");
  expect((await request("/applications", "invalid")).status).toBe(401);
  expect(
    (
      await request(
        "/applications/" + id,
        viewer,
        { version: 0, note: "not allowed" },
        "PATCH",
      )
    ).status,
  ).toBe(403);
  expect((await request("/export", viewer)).status).toBe(403);
  expect((await request("/audit", ops)).status).toBe(403);
  const data = await (await request("/applications", viewer)).json();
  expect(data.data.find((r: any) => r.id === id).mobile).toBe("******0000");
  expect(
    (
      await request("/staff", ops, {
        name: "bad",
        email: "bad@example.test",
        role: "admin",
        password: "synthetic-password-123",
      })
    ).status,
  ).toBe(403);
});
test("assignment, note, follow-up and status persist with audit and customer consistency", async () => {
  const r = await request(
    "/applications/" + id,
    ops,
    {
      version: 0,
      assignedOwner: "ops@example.test",
      stage: "eligibility_check",
      note: "Synthetic note",
      followUpDate: "2030-01-01T10:00:00.000Z",
    },
    "PATCH",
  );
  expect(r.status).toBe(200);
  const row = (await (await request("/applications")).json()).data.find(
    (r: any) => r.id === id,
  );
  expect(row.version).toBe(1);
  expect(row.assignedOwner).toBe("ops@example.test");
  expect(row.notes[0].text).toBe("Synthetic note");
  expect(row.stageHistory.length).toBe(1);
  const receipt = await personal.request("/" + id.slice(3), {
    headers: { Authorization: "Bearer " + key },
  });
  expect((await receipt.json()).data.status).toBe("Under review");
  const events = await (await request("/audit")).json();
  expect(
    events.data.some(
      (r: any) => r.entityId === id && r.action === "application_update",
    ),
  ).toBe(true);
  expect(JSON.stringify(events)).not.toContain("Synthetic note");
  const newToken = await login("ops@example.test", "synthetic-password-123");
  expect(
    (await (await request("/applications", newToken)).json()).data.find(
      (r: any) => r.id === id,
    ).version,
  ).toBe(1);
});
test("concurrent stale writes have one winner and reject unconfirmed provider approval", async () => {
  const responses = await Promise.all([
    request("/applications/" + id, ops, { version: 1, note: "A" }, "PATCH"),
    request("/applications/" + id, ops, { version: 1, note: "B" }, "PATCH"),
  ]);
  expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
  expect(
    (
      await request(
        "/applications/" + id,
        ops,
        { version: 2, stage: "approved" },
        "PATCH",
      )
    ).status,
  ).toBe(400);
  expect(
    (
      await request(
        "/applications/" + id,
        ops,
        { version: 2, providerDecision: "approved" },
        "PATCH",
      )
    ).status,
  ).toBe(400);
  const r = await request(
    "/applications/" + id,
    ops,
    {
      version: 2,
      providerDecision: "approved",
      provider: "Synthetic Provider",
      providerEvidence: "Synthetic reference",
    },
    "PATCH",
  );
  expect(r.status).toBe(200);
});
test("filters, pagination and KPI totals use the same rows; export is audited and contact-free", async () => {
  const result = await (
    await request("/applications?product=personal-loans&pageSize=1")
  ).json();
  expect(result.total).toBe(2);
  expect(result.totalPages).toBe(2);
  expect(result.summary.total).toBe(2);
  expect(result.data.length).toBe(1);
  const search = await (
    await request("/applications?search=" + encodeURIComponent(id))
  ).json();
  expect(search.total).toBe(1);
  const csv = await (await request("/export?product=personal-loans")).json();
  expect(csv.count).toBe(2);
  expect(csv.csv).not.toContain("9000000000");
  expect(csv.csv).not.toContain(key);
});
test("tickets and complaints persist ownership, escalation reasons and optimistic versions", async () => {
  const r = await request("/records/complaint", ops, {
    title: "Synthetic complaint",
    owner: "ops@example.test",
    applicationId: id,
    note: "Test note",
  });
  expect(r.status).toBe(200);
  const recordId = (await r.json()).id;
  expect(
    (
      await request("/records/complaint", ops, {
        id: recordId,
        version: 0,
        title: "Synthetic complaint",
        status: "escalated",
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await request("/records/complaint", ops, {
        id: recordId,
        version: 0,
        title: "Synthetic complaint",
        status: "escalated",
        reason: "Needs review",
        owner: "ops@example.test",
      })
    ).status,
  ).toBe(200);
  expect(
    (
      await request("/records/complaint", ops, {
        id: recordId,
        version: 0,
        title: "Synthetic complaint",
        status: "resolved",
      })
    ).status,
  ).toBe(409);
});
test("permission revocation applies to existing signed tokens; migrations are repeatable", async () => {
  await store.migrate();
  await store.migrate();
  const r = await request("/staff", admin, {
    id: staffId,
    version: 0,
    name: "ops",
    email: "ops@example.test",
    role: "ops",
    active: false,
  });
  expect(r.status).toBe(200);
  expect((await request("/applications", ops)).status).toBe(401);
});
test("failed database mutation rolls back record and audit atomically", async () => {
  const before = (await (await request("/applications")).json()).data.find(
    (r: any) => r.id === id,
  );
  await store.query(
    "CREATE TRIGGER reject_audit BEFORE INSERT ON admin_audit BEGIN SELECT RAISE(FAIL, 'synthetic failure'); END",
  );
  expect(
    (
      await request(
        "/applications/" + id,
        admin,
        { version: before.version, note: "Must not save" },
        "PATCH",
      )
    ).status,
  ).toBe(503);
  const after = (await (await request("/applications")).json()).data.find(
    (r: any) => r.id === id,
  );
  expect(after.version).toBe(before.version);
  expect(after.notes.some((n: any) => n.text === "Must not save")).toBe(false);
  await store.query("DROP TRIGGER reject_audit");
});

test("record edits retain links, notes and history; viewer cannot read internal record history", async () => {
  const r = await request("/records/ticket", admin, {
    title: "Retention",
    applicationId: id,
    note: "Private note",
  });
  const recordId = (await r.json()).id;
  expect(
    (
      await request("/records/ticket", admin, {
        id: recordId,
        version: 0,
        title: "Retention",
        status: "resolved",
      })
    ).status,
  ).toBe(200);
  const row = (await (await request("/records/ticket")).json()).data.find(
    (r: any) => r.id === recordId,
  );
  expect(row.applicationId).toBe(id);
  expect(row.note).toBe("Private note");
  expect(row.history.length).toBe(2);
  expect(
    JSON.stringify(await (await request("/records/ticket", viewer)).json()),
  ).not.toContain("Private note");
});
test("calendar periods use India midnight, invalid inputs fail and finance remains unconfigured", async () => {
  const today = new Date(
    new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) +
      "T00:00:00+05:30",
  ).getTime();
  const rows = [
    { id: "before", createdAt: new Date(today - 1).toISOString() },
    { id: "today", createdAt: new Date(today).toISOString() },
  ];
  expect(
    store.filterApplications(rows, { period: "today" }).map((r) => r.id),
  ).toEqual(["today"]);
  expect((await request("/applications?page=0")).status).toBe(400);
  expect((await (await request("/finance")).json()).available).toBe(false);
  expect((await store.query("SELECT * FROM admin_finance_ledger")).length).toBe(
    0,
  );
});

test("Home timestamps follow the latest assignment or workflow update and history keeps previous stages", async () => {
  const { setSystemTime } = await import("bun:test");
  const start = Date.now() + 60000;
  const response = await home.request("/leads", {
    method: "POST",
    ...body({
      phoneNumber: "9000000099",
      fullName: "Synthetic Home regression",
      monthlyIncome: "50000",
      existingEmi: "0",
      loanAmountRequired: "1000000",
      loanType: "House Purchase",
    }),
  });
  const saved = (await response.json()).data;
  const read = async () =>
    (
      await (
        await request("/applications?search=" + saved.referenceNumber)
      ).json()
    ).data[0];
  const step = async (stage: string, version: number) =>
    app.request("/home-loans/" + saved.id, {
      method: "PATCH",
      headers: {
        Authorization: "Bearer " + admin,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stage,
        version,
        loanAmountRequired: "1000000",
        note: "Synthetic regression event",
      }),
    });
  try {
    setSystemTime(new Date(start));
    expect(
      (
        await request(
          "/applications/" + saved.referenceNumber,
          admin,
          {
            version: 0,
            assignedOwner: "admin@paisamart.com",
            note: "Assigned",
          },
          "PATCH",
        )
      ).status,
    ).toBe(200);
    expect((await read()).updatedAt).toBe(new Date(start).toISOString());
    setSystemTime(new Date(start + 1000));
    expect((await step("contacted", 0)).status).toBe(200);
    let row = await read();
    expect(row.updatedAt).toBe(new Date(start + 1000).toISOString());
    expect(row.assignedOwner).toBe("admin@paisamart.com");
    expect(row.stageHistory.map((e: any) => [e.fromStage, e.toStage])).toEqual([
      ["new", "eligibility_check"],
    ]);
    setSystemTime(new Date(start + 2000));
    expect((await step("documents_pending", 1)).status).toBe(200);
    row = await read();
    expect(row.updatedAt).toBe(new Date(start + 2000).toISOString());
    expect(row.homeStage).toBe("documents_pending");
    expect(row.stageHistory.map((e: any) => [e.fromStage, e.toStage])).toEqual([
      ["new", "eligibility_check"],
      ["eligibility_check", "kyc_pending"],
    ]);
    setSystemTime(new Date(start + 3000));
    expect(
      (
        await request(
          "/applications/" + saved.referenceNumber,
          admin,
          { version: 1, note: "Follow-up assignment note" },
          "PATCH",
        )
      ).status,
    ).toBe(200);
    expect((await read()).updatedAt).toBe(new Date(start + 3000).toISOString());
    setSystemTime(new Date(start + 4000));
    expect((await step("documents_pending", 2)).status).toBe(200);
    row = await read();
    expect(row.updatedAt).toBe(new Date(start + 4000).toISOString());
    expect(row.stageHistory.at(-1).fromStage).toBe("kyc_pending");
    expect(row.stageHistory.at(-1).toStage).toBe("kyc_pending");
    expect(row.notes).toHaveLength(2);
    expect(row.stageHistory).toHaveLength(3);
    const raw = (
      await store.query(
        "SELECT history FROM home_loan_workflow WHERE lead_id=?",
        [saved.id],
      )
    )[0];
    expect(JSON.parse(raw.history).map((e: any) => e.stage)).toEqual([
      "contacted",
      "documents_pending",
      "documents_pending",
    ]);
    const freshAdmin = await login(
      "admin@paisamart.com",
      "isolated-admin-password",
    );
    const fresh = (
      await (
        await request(
          "/applications?search=" + saved.referenceNumber,
          freshAdmin,
        )
      ).json()
    ).data[0];
    expect(fresh.updatedAt).toBe(row.updatedAt);
    expect(fresh.stageHistory).toEqual(row.stageHistory);
  } finally {
    setSystemTime();
  }
});
