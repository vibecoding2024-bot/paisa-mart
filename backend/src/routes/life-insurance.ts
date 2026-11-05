import { Hono } from "hono";
import { z } from "zod";
import { saveLifeInsuranceLead } from "../lib/insurance-lead-store";
import { SubmissionConflict } from '../lib/service-application-store';

const router = new Hono();
const schema = z.object({
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/),
  fullName: z.string().trim().min(1).max(120),
  selectedLifeInsurer: z.string().trim().max(120).default(""),
  policyType: z.enum([
    "Term Insurance",
    "Money Back / Pension Scheme",
    "Lump Sum Plan",
    "Child Education Policies",
  ]),
  premiumSlab: z.enum([
    "₹10,000", "₹20,000", "₹30,000", "₹40,000", "₹50,000", "₹60,000",
    "₹70,000", "₹80,000", "₹90,000", "₹1,00,000", "Others Amount",
  ]),
  premiumOtherAmount: z.string().trim().max(80).default(""),
}).refine((value) => value.premiumSlab !== "Others Amount" || /^[1-9]\d{0,11}$/.test(value.premiumOtherAmount), {
  path: ["premiumOtherAmount"],
  message: "Enter the custom monthly premium amount",
});

router.post("/leads", async (c) => {
  const key = c.req.header('Idempotency-Key');
  if (!key || !/^[a-zA-Z0-9-]{16,128}$/.test(key)) return c.json({ success:false, message:'A submission key is required' },400);
  const parsed = schema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ success: false, message: "Invalid life insurance details" }, 400);
  try {
    const data = await saveLifeInsuranceLead(parsed.data, key);
    return c.json({ success: true, data });
  } catch (error) {
    if (error instanceof SubmissionConflict) return c.json({ success:false, message:error.message },409);
    return c.json({ success: false, message: "Could not save life insurance details" }, 500);
  }
});

export { router as lifeInsuranceRouter };
