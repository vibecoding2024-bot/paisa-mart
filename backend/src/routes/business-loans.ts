import { Hono } from "hono";
import { z } from "zod";
import { saveBusinessLoanLead } from "../lib/business-loan-lead-store";

const businessLoansRouter = new Hono();

const leadSchema = z.object({
  phoneNumber: z.string().regex(/^\d{10}$/),
  businessType: z.string().trim().min(1),
  loanAmountRequired: z.string().regex(/^\d+$/),
  loanPurpose: z.string().trim().min(1),
  loanPurposeOtherText: z.string().optional().default(""),
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
