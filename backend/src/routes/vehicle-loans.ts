import { Hono } from "hono";
import { z } from "zod";
import { saveVehicleLoanLead } from "../lib/vehicle-loan-lead-store";

const router = new Hono();
const dateOfBirthSchema = z.string().refine((value) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return false;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return year >= 1900 &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date <= new Date();
}, "Select a valid date of birth");

const schema = z.object({
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/),
  fullName: z.string().trim().min(1).max(120),
  cibil: z.string().regex(/^\d{3}$/).refine((value) => Number(value) >= 300 && Number(value) <= 900),
  occupation: z.string().trim().min(1).max(120),
  dateOfBirth: dateOfBirthSchema,
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().min(1).max(120),
  monthlyIncome: z.string().regex(/^[1-9]\d{0,11}$/),
  loanAmountRequired: z.string().regex(/^[1-9]\d{0,11}$/),
  existingEmi: z.string().regex(/^\d{1,12}$/),
  vehicleType: z.string().trim().min(1).max(120),
});

router.post("/leads", async (c) => {
  const parsed = schema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    return c.json({ success: false, message: "Invalid vehicle loan details" }, 400);
  }
  try {
    return c.json({ success: true, data: await saveVehicleLoanLead(parsed.data) });
  } catch (error) {
    console.error("[VEHICLE LOAN LEAD] save failed", error);
    return c.json({ success: false, message: "Could not save vehicle loan details" }, 500);
  }
});

export { router as vehicleLoansRouter };
