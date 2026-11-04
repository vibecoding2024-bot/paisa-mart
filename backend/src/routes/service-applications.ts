import { Hono } from 'hono';
import { z } from 'zod';
import { saveServiceApplication, serviceReceipt, SubmissionConflict, type ServiceProduct } from '../lib/service-application-store';

const common = {
  fullName: z.string().trim().min(1).max(120),
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/),
  provider: z.string().trim().max(160).default(''),
};
const year = z.string().regex(/^\d{4}$/).refine(v => +v >= 1900 && +v <= new Date().getFullYear() + 1);
const intake = z.object({ ...common, provider: z.string().trim().min(1).max(160), productName: z.string().trim().min(1).max(160) }).strict();
const health = z.object({
  ...common,
  selectedMembers: z.array(z.enum(['myself', 'spouse', 'children', 'parents'])).min(1).max(4),
  elderAge: z.string().max(2).default(''),
  childrenCount: z.number().int().min(0).max(10),
  pincode: z.string().regex(/^[1-9]\d{5}$/),
  preExistingDisease: z.enum(['Yes', 'No']),
}).strict().superRefine((v, ctx) => {
  if (new Set(v.selectedMembers).size !== v.selectedMembers.length) ctx.addIssue({ code: 'custom', message: 'Select each member once' });
  if (v.selectedMembers.some(m => ['myself', 'spouse'].includes(m)) && !/^(1[89]|[2-9]\d)$/.test(v.elderAge))
    ctx.addIssue({ code: 'custom', path: ['elderAge'], message: 'Age must be between 18 and 99' });
  if (v.selectedMembers.includes('children') ? v.childrenCount < 1 : v.childrenCount !== 0)
    ctx.addIssue({ code: 'custom', path: ['childrenCount'], message: 'Enter the selected children count' });
});
const motor = z.discriminatedUnion('form', [
  z.object({ ...common, form: z.literal('policy'),
    vehicleType: z.enum(['Car','Trucks','Buses','Taxis','Delivery Vans','Auto','Tractors','Harvesters','Ambulances','JCB','Cranes','Lorry','Others']),
    vehicleTypeOther: z.string().trim().max(120).default(''),
    insuranceType: z.enum(['Third Party Insurance', 'Full Insurance (Comprehensive)', 'Nil Depreciation (Nil Dep)']), modelYear: year,
  }).strict(),
  z.object({ ...common, form: z.literal('quote'), vehicleCategory: z.string().trim().min(1).max(120),
    vehicleType: z.string().trim().min(1).max(120), vehicleNumber: z.string().trim().toUpperCase().min(4).max(20),
    registrationYear: year, insuranceExpiryDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/).refine(value => {
      const [d,m,y] = value.split('/').map(Number); const date = new Date(Date.UTC(y!, m! - 1, d));
      return date.getUTCFullYear() === y && date.getUTCMonth() === m! - 1 && date.getUTCDate() === d;
    }), city: z.string().trim().min(1).max(120),
  }).strict(),
]).superRefine((v, ctx) => {
  if (v.form === 'policy' && v.vehicleType === 'Others' && !v.vehicleTypeOther)
    ctx.addIssue({ code: 'custom', path: ['vehicleTypeOther'], message: 'Enter the vehicle type' });
});
const schemas = { 'credit-cards': intake, 'bank-accounts': intake, 'insta-loans': intake, 'health-insurance': health, 'motor-insurance': motor };
export const serviceApplicationsRouter = new Hono();
serviceApplicationsRouter.use('*', async (c, next) => { c.header('Cache-Control', 'no-store'); await next(); });
serviceApplicationsRouter.post('/:product/applications', async c => {
  const product = c.req.param('product');
  if (!Object.hasOwn(schemas, product)) return c.json({ success: false, message: 'Unknown service' }, 404);
  const key = c.req.header('Idempotency-Key');
  if (!key || !/^[a-zA-Z0-9-]{16,128}$/.test(key)) return c.json({ success: false, message: 'A submission key is required' }, 400);
  const parsed = schemas[product as ServiceProduct].safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ success: false, message: parsed.error.issues[0]?.message || 'Check application details' }, 400);
  try {
    const data = await saveServiceApplication(product as ServiceProduct, parsed.data, key);
    return c.json({ success: true, data });
  } catch (error) {
    // Do not log applicant payloads or database URLs.
    return c.json({ success: false, message: error instanceof SubmissionConflict ? error.message : 'Could not save your application. Please retry.' }, error instanceof SubmissionConflict ? 409 : 503);
  }
});
serviceApplicationsRouter.get('/:product/receipts/:id', async c => {
  const { product, id } = c.req.param();
  const key = c.req.header('Authorization')?.match(/^Bearer ([a-zA-Z0-9-]{16,128})$/)?.[1];
  if (!key) return c.json({ success: false, message: 'Application receipt required' }, 401);
  if (!Object.hasOwn(schemas, product) || !z.string().uuid().safeParse(id).success) return c.json({ success: false }, 404);
  try {
    const data = await serviceReceipt(product as ServiceProduct, id, key);
    return data ? c.json({ success: true, data }) : c.json({ success: false, message: 'Saved application not found' }, 404);
  } catch { return c.json({ success: false, message: 'Unable to verify the saved application' }, 503); }
});
