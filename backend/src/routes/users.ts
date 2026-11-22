import { Hono } from "hono";
import { z } from "zod";
import {
  getUserProfile,
  listUserProfiles,
  saveUserProfile,
  updateUserKycStatus,
} from "../lib/user-profile-store";
import { customerPhone } from "../lib/customer-token";
import { bearerToken, verifyAuthToken } from "../lib/auth-token";
import { actorFromClaims } from "../lib/admin-operations";

/**
 * A-01: profile data is private. Customers may read and write only the profile whose phone matches their
 * OTP-verified token. KYC status can never be set by a customer (only by staff here, or by the server
 * after a provider-confirmed result in routes/kyc.ts). The full list is staff-only.
 */
const usersRouter = new Hono();

const dobSchema = z
  .object({
    day: z.string().min(1),
    month: z.string().min(1),
    year: z.string().min(4),
  })
  .optional();

// Unknown keys (for example kycStatus) are stripped by zod and never stored.
const profileSchema = z.object({
  phoneNumber: z.string().regex(/^\d{10}$/),
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  occupation: z.string().min(1),
  qualification: z.string().min(1),
  annualIncome: z.string().min(1),
  pincode: z.string().regex(/^\d{6}$/),
  panCard: z.string().optional(),
  cibilScore: z.string().optional(),
  dateOfBirth: dobSchema,
});

function toClientProfile(row: ReturnType<typeof getUserProfile>) {
  if (!row) return null;
  return {
    ...row,
    dateOfBirth: row.dateOfBirth ? JSON.parse(row.dateOfBirth) : undefined,
  };
}

const SIGN_IN = { success: false, message: "Please sign in again to continue." } as const;
const NOT_YOURS = { success: false, message: "You can only access your own profile." } as const;

function normalize(phone: string) {
  return phone.replace(/\D/g, "").slice(-10);
}

async function staffRole(authorization?: string) {
  const token = bearerToken(authorization);
  const claims = token ? await verifyAuthToken(token).catch(() => null) : null;
  return (await actorFromClaims(claims).catch(() => null))?.role ?? null;
}

usersRouter.use("*", async (c, next) => {
  c.header("Cache-Control", "no-store");
  await next();
});

usersRouter.get("/profile/:phoneNumber", (c) => {
  const phone = customerPhone(c.req.header("authorization"));
  if (!phone) return c.json(SIGN_IN, 401);
  if (normalize(c.req.param("phoneNumber")) !== phone) return c.json(NOT_YOURS, 403);
  const row = getUserProfile(phone);
  if (!row) return c.json({ success: false, message: "Profile not found" }, 404);
  return c.json({ success: true, data: toClientProfile(row) });
});

usersRouter.post("/profile", async (c) => {
  const phone = customerPhone(c.req.header("authorization"));
  if (!phone) return c.json(SIGN_IN, 401);
  const body = await c.req.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, message: "Invalid profile data", errors: parsed.error.flatten() },
      400,
    );
  }
  if (normalize(parsed.data.phoneNumber) !== phone) return c.json(NOT_YOURS, 403);

  const row = saveUserProfile({ ...parsed.data, phoneNumber: phone });
  return c.json({ success: true, data: toClientProfile(row) });
});

// Staff-only manual correction. Customers can never set their own KYC status.
usersRouter.patch("/profile/:phoneNumber/kyc", async (c) => {
  const role = await staffRole(c.req.header("authorization"));
  if (!role) return c.json({ success: false, message: "Staff authorization required" }, 401);
  if (!["admin", "ops"].includes(role)) return c.json({ success: false, message: "Admin or operations role required" }, 403);
  const body = await c.req.json().catch(() => ({}));
  const parsed = z
    .object({ status: z.enum(["not_started", "submitted", "verified", "rejected"]) })
    .safeParse(body);

  if (!parsed.success) {
    return c.json({ success: false, message: "Invalid KYC status" }, 400);
  }

  const row = updateUserKycStatus(c.req.param("phoneNumber"), parsed.data.status);
  if (!row) return c.json({ success: false, message: "Profile not found" }, 404);
  return c.json({ success: true, data: toClientProfile(row) });
});

usersRouter.get("/profiles", async (c) => {
  const role = await staffRole(c.req.header("authorization"));
  if (role !== "admin") return c.json({ success: false, message: "Admin authorization required" }, 401);
  const requested = Number(c.req.query("limit") ?? "100");
  const limit = Number.isFinite(requested) && requested > 0 ? Math.min(requested, 500) : 100;
  return c.json({
    success: true,
    data: listUserProfiles(limit).map(toClientProfile),
  });
});

export { usersRouter };
