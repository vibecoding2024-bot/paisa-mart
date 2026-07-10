import { Hono } from "hono";
import { z } from "zod";
import { saveHomeLoanLead } from "../lib/home-loan-lead-store";

const homeLoansRouter = new Hono();

const leadSchema = z.object({
  phoneNumber: z.string().regex(/^\d{10}$/),
  fullName: z.string().trim().optional(),
  cibil: z.string().regex(/^\d+$/).optional(),
  dateOfBirth: z.string().optional(),
  monthlyIncome: z.string().regex(/^\d+$/),
  existingEmi: z.string().regex(/^\d+$/),
  loanAmountRequired: z.string().regex(/^\d+$/),
  loanType: z.string().trim().min(1),
  city: z.string().optional(),
  state: z.string().optional(),
  source: z.string().optional(),
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
    return c.json({ success: true, data: lead });
  } catch (error) {
    console.error("[HOME LOAN LEAD] save failed", error);
    return c.json({ success: false, message: "Could not save home loan details" }, 500);
  }
});

export { homeLoansRouter };
