import { Hono } from "hono";
import { z } from "zod";
import { customerPhone } from "../lib/customer-token";
import { customerApplications } from "../lib/home-loan-pipeline";
import { saveHomeLoanLead } from "../lib/home-loan-lead-store";

const homeLoansRouter = new Hono();

const leadSchema = z.object({
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/),
  fullName: z.string().trim().max(120).optional(),
  cibil: z.string().regex(/^\d+$/).optional(),
  dateOfBirth: z.string().refine(value => {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
    if (!match) return false;
    const day = Number(match[1]), month = Number(match[2]), year = Number(match[3]);
    const date = new Date(year, month - 1, day);
    return year >= 1900 && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day && date <= new Date();
  }, 'Select a valid date of birth').optional(),
  monthlyIncome: z.string().regex(/^[1-9]\d{0,11}$/),
  existingEmi: z.string().regex(/^\d{1,12}$/),
  loanAmountRequired: z.string().regex(/^[1-9]\d{0,11}$/),
  loanType: z.string().trim().min(1),
  city: z.string().max(120).optional(),
  state: z.string().max(120).optional(),
  source: z.string().max(120).optional(),
});

homeLoansRouter.post("/leads", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = leadSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, message: "Invalid home loan details", errors: parsed.error.flatten() },
      400,
    );
  }

  try {
    const lead = await saveHomeLoanLead(parsed.data);
    return c.json({ success: true, data: { ...lead, referenceNumber: `HL-${lead.id}` } });
  } catch (error) {
    console.error("[HOME LOAN LEAD] save failed", error);
    return c.json({ success: false, message: "Could not save home loan details" }, 500);
  }
});

homeLoansRouter.get('/applications', async c => {
  c.header('Cache-Control', 'no-store');
  const phone = customerPhone(c.req.header('authorization'));
  if (!phone) return c.json({ success: false, message: 'Please sign in again to view your applications.' }, 401);
  try { return c.json({ success: true, data: await customerApplications(phone) }); }
  catch { return c.json({ success: false, message: 'Could not load application status.' }, 500); }
});

export { homeLoansRouter };
