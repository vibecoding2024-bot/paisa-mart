import { Hono } from "hono";
import { z } from "zod";
import { saveBusinessLoanLead } from "../lib/business-loan-lead-store";

const businessLoansRouter = new Hono();

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

const leadSchema = z.object({
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/),
  fullName: z.string().trim().min(1).max(120).optional(),
  cibil: z.string().regex(/^\d{1,3}$/).refine((value) => Number(value) >= 300 && Number(value) <= 900).optional(),
  dateOfBirth: dateOfBirthSchema.optional(),
  city: z.string().trim().max(120).optional(),
  state: z.string().trim().max(120).optional(),
  monthlyIncome: z.string().regex(/^[1-9]\d{0,11}$/).optional(),
  existingEmi: z.string().regex(/^\d{1,12}$/).optional(),
  businessType: z.string().trim().min(1),
  loanAmountRequired: z.string().regex(/^[1-9]\d{0,11}$/).optional(),
  loanPurpose: z.string().trim().min(1),
  loanPurposeOtherText: z.string().trim().max(500).optional().default(""),
  source: z.string().optional(),
});

businessLoansRouter.post("/leads", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = leadSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, message: "Invalid business loan details", errors: parsed.error.flatten() },
      400,
    );
  }

  try {
    const lead = await saveBusinessLoanLead(parsed.data);
    return c.json({ success: true, data: lead });
  } catch (error) {
    console.error("[BUSINESS LOAN LEAD] save failed", error);
    return c.json({ success: false, message: "Could not save business loan details" }, 500);
  }
});

export { businessLoansRouter };
