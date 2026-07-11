import { Hono } from "hono";
import { z } from "zod";
import { savePersonalLoanLead } from "../lib/personal-loan-lead-store";

const personalLoansRouter = new Hono();

const leadSchema = z.object({
  phoneNumber: z.string().regex(/^\d{10}$/),
  fullName: z.string().trim().optional(),
  mobileNumber: z.string().optional(),
  cibil: z.string().regex(/^\d+$/).optional(),
  dateOfBirth: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  companyName: z.string().optional(),
  monthlyIncome: z.string().regex(/^\d+$/).optional(),
  loanAmountRequired: z.string().regex(/^\d+$/).optional(),
  existingEmi: z.string().regex(/^\d+$/).optional(),
  employmentType: z.enum(["Private", "Government"]).optional(),
  source: z.string().optional(),
});

personalLoansRouter.post("/leads", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = leadSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { success: false, message: "Invalid personal loan details", errors: parsed.error.flatten() },
      400,
    );
  }

  try {
    const lead = await savePersonalLoanLead(parsed.data);
    return c.json({ success: true, data: lead });
  } catch (error) {
    console.error("[PERSONAL LOAN LEAD] save failed", error);
    return c.json({ success: false, message: "Could not save personal loan details" }, 500);
  }
});

export { personalLoansRouter };
