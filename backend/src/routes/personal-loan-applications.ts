import { Hono } from 'hono';
import { z } from 'zod';
import { ApplicationConflict, getPersonalApplication, savePersonalApplication } from '../lib/personal-loan-application-store';

const money = z.string().regex(/^\d{1,12}$/);
const positiveMoney = money.refine(value => Number(value) > 0);
const birthDate = z.string().refine(value => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return false;
  const [day, month, year] = match.slice(1).map(Number);
  const date = new Date(year!, month! - 1, day);
  return year! >= 1900 && date.getFullYear() === year && date.getMonth() === month! - 1 && date.getDate() === day && date <= new Date();
});
const schema = z.object({
  requestKey: z.string().uuid(), fullName: z.string().trim().min(1).max(150),
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/),
  cibil: z.string().regex(/^\d{3}$/).refine(value => Number(value) >= 300 && Number(value) <= 900),
  dateOfBirth: birthDate, city: z.string().trim().min(1).max(100), state: z.string().trim().min(1).max(100),
  companyName: z.string().trim().min(1).max(200), monthlyIncome: positiveMoney,
  loanAmountRequired: positiveMoney, existingEmi: money, employmentType: z.enum(['Private', 'Government']),
});
export const personalApplicationsRouter = new Hono();
personalApplicationsRouter.post('/', async c => {
  const parsed = schema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ success: false, message: 'Please check your personal loan details.', errors: parsed.error.flatten() }, 400);
  const { requestKey, ...input } = parsed.data;
  try {
    return c.json({ success: true, data: await savePersonalApplication(input, requestKey) });
  } catch (error) {
    if (error instanceof ApplicationConflict) return c.json({ success: false, message: error.message }, 409);
    console.error('[PERSONAL APPLICATION] save failed');
    return c.json({ success: false, message: 'Could not save your application. Please retry with the same details.' }, 500);
  }
});
personalApplicationsRouter.get('/:id', async c => {
  const id = c.req.param('id'), key = c.req.header('Authorization')?.replace(/^Bearer /, '') ?? '';
  if (!z.string().uuid().safeParse(id).success || !z.string().uuid().safeParse(key).success) return c.json({ success: false, message: 'Application receipt required.' }, 401);
  c.header('Cache-Control', 'no-store');
  try {
    const data = await getPersonalApplication(id, key);
    return data ? c.json({ success: true, data }) : c.json({ success: false, message: 'Application not found.' }, 404);
  } catch {
    return c.json({ success: false, message: 'Status is unavailable. Please try again.' }, 503);
  }
});
