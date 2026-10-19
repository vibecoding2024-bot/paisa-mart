import { createHash } from "node:crypto";
import { Hono } from "hono";
import { z } from "zod";
import { bearerToken, verifyAuthToken } from "../lib/auth-token";
import {
  localDirectory,
  actorFromClaims,
  applications,
  audit,
  auditList,
  exclusive,
  filterApplications,
  migrate,
  OperationsError,
  records,
  saveRecord,
  saveStaff,
  staffList,
  updateApplication,
  type Actor,
} from "../lib/admin-operations";
export const operationsRouter = new Hono<{ Variables: { actor: Actor } }>();
operationsRouter.onError((error, c) =>
  c.json(
    {
      success: false,
      message:
        error instanceof OperationsError
          ? error.message
          : "Operations are unavailable. No success has been confirmed.",
    },
    (error instanceof OperationsError ? error.status : 503) as any,
  ),
);
operationsRouter.use("*", async (c, next) =>
  exclusive(async () => {
    c.header("Cache-Control", "no-store");
    try {
      const token = bearerToken(c.req.header("authorization"));
      const actor = await actorFromClaims(
        token ? await verifyAuthToken(token).catch(() => null) : null,
      );
      if (!actor)
        return c.json(
          { success: false, message: "Please sign in again." },
          401,
        );
      c.set("actor", actor);
      await migrate();
      await next();
    } catch (e) {
      const status = e instanceof OperationsError ? e.status : 503;
      return c.json(
        {
          success: false,
          message:
            e instanceof OperationsError
              ? e.message
              : "Operations are unavailable. No success has been confirmed.",
        },
        status as any,
      );
    }
  }),
);
const filters = z.object({
  search: z.string().max(120).default(""),
  product: z.string().max(60).default("all"),
  stage: z.string().max(50).default("all"),
  owner: z.string().max(160).optional(),
  outcome: z.string().max(30).optional(),
  priority: z.string().max(20).optional(),
  period: z.enum(["all", "today", "7days", "30days"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(100),
});
operationsRouter.get("/session", async (c) =>
  c.json({ success: true, user: c.get("actor") }),
);
operationsRouter.get("/applications", async (c) => {
  const f = filters.safeParse(c.req.query());
  if (!f.success)
    return c.json({ success: false, message: "Invalid filters" }, 400);
  const result = await applications(c.get("actor"));
  const rows = filterApplications(result.data, f.data);
  const byProduct: Record<string, number> = {},
    byStage: Record<string, number> = {};
  for (const r of rows) {
    byProduct[r.productType] = (byProduct[r.productType] ?? 0) + 1;
    byStage[r.stage] = (byStage[r.stage] ?? 0) + 1;
  }
  return c.json({
    success: true,
    snapshot: createHash("sha256").update(JSON.stringify(rows)).digest("hex"),
    data: rows.slice(
      (f.data.page - 1) * f.data.pageSize,
      f.data.page * f.data.pageSize,
    ),
    total: rows.length,
    totalPages: Math.max(1, Math.ceil(rows.length / f.data.pageSize)),
    summary: {
      total: rows.length,
      byProduct,
      byStage,
      timezone: "Asia/Kolkata",
      period: f.data.period,
      providerApprovalCount: rows.filter(
        (r) => r.providerDecision === "approved",
      ).length,
    },
    availability: result.availability,
  });
});
const change = z
  .object({
    version: z.number().int().min(0),
    stage: z
      .enum([
        "new",
        "eligibility_check",
        "kyc_pending",
        "kyc_completed",
        "submitted",
        "closed",
      ])
      .optional(),
    assignedOwner: z.string().max(160).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    followUpDate: z.union([z.iso.datetime(), z.literal("")]).optional(),
    note: z.string().trim().min(1).max(2000).optional(),
    provider: z.string().trim().min(1).max(150).optional(),
    providerDecision: z
      .enum(["unconfirmed", "approved", "rejected", "disbursed"])
      .optional(),
    providerEvidence: z.string().trim().max(500).optional(),
  })
  .strict();
operationsRouter.patch("/applications/:id", async (c) => {
  const p = change.safeParse(await c.req.json().catch(() => null));
  if (!p.success)
    return c.json(
      {
        success: false,
        message:
          "Invalid change. Provider decisions must be recorded separately from processing stages.",
      },
      400,
    );
  return c.json({
    success: true,
    ...(await updateApplication(c.req.param("id"), p.data, c.get("actor"))),
  });
});
operationsRouter.get("/staff", async (c) =>
  c.json({
    success: true,
    data: [
      {
        id: "admin-1",
        name: "Environment administrator",
        email: (process.env.ADMIN_EMAIL || "admin@paisamart.com").toLowerCase(),
        role: "admin",
        active: 1,
        version: 0,
      },
      ...(await staffList()),
    ],
  }),
);
operationsRouter.post("/staff", async (c) => {
  const p = z
    .object({
      id: z.string().uuid().optional(),
      version: z.number().int().min(0).optional(),
      name: z.string().trim().min(1).max(120),
      email: z.email(),
      role: z.enum(["admin", "ops", "viewer"]),
      password: z.string().min(12).max(200).optional(),
      active: z.boolean().default(true),
    })
    .strict()
    .safeParse(await c.req.json().catch(() => null));
  if (!p.success)
    return c.json(
      {
        success: false,
        message:
          "Valid name, email, role and a password of at least 12 characters are required for new staff.",
      },
      400,
    );
  return c.json({
    success: true,
    ...(await saveStaff(p.data, c.get("actor"))),
  });
});
operationsRouter.get("/audit", async (c) => {
  if (c.get("actor").role !== "admin")
    return c.json(
      { success: false, message: "Administrator access required" },
      403,
    );
  return c.json({ success: true, data: await auditList() });
});
const record = z
  .object({
    id: z.string().uuid().optional(),
    version: z.number().int().min(0).optional(),
    title: z.string().trim().min(1).max(150),
    applicationId: z.string().max(100).optional(),
    owner: z.string().max(160).optional(),
    status: z
      .enum([
        "open",
        "in_progress",
        "resolved",
        "escalated",
        "active",
        "inactive",
      ])
      .optional(),
    note: z.string().trim().max(2000).optional(),
    reason: z.string().trim().max(500).optional(),
    dueAt: z.union([z.iso.datetime(), z.literal("")]).optional(),
  })
  .strict();
operationsRouter.get("/records/:kind", async (c) => {
  const kind = c.req.param("kind");
  if (!["ticket", "complaint", "partner"].includes(kind))
    return c.json({ success: false }, 404);
  const rows = await records(kind);
  return c.json({
    success: true,
    data:
      c.get("actor").role === "viewer"
        ? rows.map(({ note, reason, history, ...r }) => r)
        : rows,
  });
});
operationsRouter.post("/records/:kind", async (c) => {
  const kind = c.req.param("kind");
  if (!["ticket", "complaint", "partner"].includes(kind))
    return c.json({ success: false }, 404);
  const p = record.safeParse(await c.req.json().catch(() => null));
  if (!p.success)
    return c.json({ success: false, message: "Invalid record" }, 400);
  if (p.data.status === "escalated" && !p.data.reason)
    return c.json(
      { success: false, message: "Escalation reason required" },
      400,
    );
  if (
    p.data.owner &&
    ![
      ...(await staffList()),
      {
        email: (process.env.ADMIN_EMAIL || "admin@paisamart.com").toLowerCase(),
        active: 1,
      },
    ].some((s) => s.active && s.email === p.data.owner)
  )
    return c.json({ success: false, message: "Select an active owner" }, 400);
  if (
    p.data.applicationId &&
    !(await applications(c.get("actor"))).data.some(
      (r) => r.id === p.data.applicationId,
    )
  )
    return c.json({ success: false, message: "Application not found" }, 400);
  return c.json({
    success: true,
    ...(await saveRecord(kind, p.data, c.get("actor"))),
  });
});
operationsRouter.get("/export", async (c) => {
  const actor = c.get("actor");
  if (actor.role !== "admin")
    return c.json(
      { success: false, message: "Export requires administrator access" },
      403,
    );
  const p = filters.safeParse(c.req.query());
  if (!p.success) return c.json({ success: false }, 400);
  const rows = filterApplications((await applications(actor)).data, p.data);
  const cell = (s: unknown) =>
    '"' +
    String(s ?? "")
      .replace(/^[=+@\-\t\r]/, "' $&")
      .replace(/"/g, '""') +
    '"';
  const csv = [
    [
      "Reference",
      "Product",
      "Internal stage",
      "Provider decision",
      "Submitted",
    ],
    ...rows.map((r) => [
      r.id,
      r.productType,
      r.homeStage ?? r.stage,
      r.providerDecision,
      r.createdAt,
    ]),
  ]
    .map((r) => r.map(cell).join(","))
    .join("\r\n");
  await audit(actor, "export", "applications", {
    count: rows.length,
    period: p.data.period,
    product: p.data.product,
  });
  return c.json({ success: true, csv, count: rows.length });
});
operationsRouter.get("/finance", (c) =>
  c.json({
    success: true,
    available: false,
    message:
      "Commission rates, provider agreements, approval responsibilities and settlement rules have not been configured. No payable or paid amount is inferred.",
    states: [
      "estimated",
      "earned",
      "approved",
      "payable",
      "paid",
      "reversed",
      "disputed",
    ],
  }),
);

operationsRouter.get("/customers", (c) =>
  c.json({ success: true, ...localDirectory("customers", c.get("actor")) }),
);
operationsRouter.get("/transactions", (c) =>
  c.json({ success: true, ...localDirectory("transactions", c.get("actor")) }),
);
