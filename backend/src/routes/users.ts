import { Hono } from "hono";
import { z } from "zod";
import {
  getUserProfile,
  listUserProfiles,
  saveUserProfile,
  updateUserKycStatus,
} from "../lib/user-profile-store";

const usersRouter = new Hono();

const dobSchema = z
  .object({
    day: z.string().min(1),
    month: z.string().min(1),
    year: z.string().min(4),
  })
  .optional();

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

usersRouter.get("/profile/:phoneNumber", (c) => {
  const row = getUserProfile(c.req.param("phoneNumber"));
  if (!row) return c.json({ success: false, message: "Profile not found" }, 404);
  return c.json({ success: true, data: toClientProfile(row) });
});

usersRouter.post("/profile", async (c) => {
  const body = await c.req.json();
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, message: "Invalid profile data", errors: parsed.error.flatten() },
      400,
    );
  }

  const row = saveUserProfile(parsed.data);
  return c.json({ success: true, data: toClientProfile(row) });
});

usersRouter.patch("/profile/:phoneNumber/kyc", async (c) => {
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

usersRouter.get("/profiles", (c) => {
  const limit = Number(c.req.query("limit") ?? "100");
  return c.json({
    success: true,
    data: listUserProfiles(Number.isFinite(limit) ? limit : 100).map(toClientProfile),
  });
});

export { usersRouter };
