import { Hono } from 'hono';
import { z } from 'zod';
import { timingSafeEqual } from 'node:crypto';
import { bearerToken, verifyAuthToken, issueAuthToken } from '../lib/auth-token';
import { listPipeline, updatePipeline, PipelineConflict } from '../lib/home-loan-pipeline';
import { HOME_LOAN_STAGES } from '../lib/home-loan-stages';
export const adminRouter = new Hono();
adminRouter.post('/auth/login', async c => {
  const data = z.object({ email: z.string().email(), password: z.string().min(1).max(200) }).safeParse(await c.req.json().catch(() => null));
  if (!data.success) return c.json({ success: false }, 400);
  const configured = process.env.HOME_LOAN_ADMIN_PASSWORD;
  if (!configured || !process.env.HOME_LOAN_ADMIN_TOKEN_SECRET) return c.json({ success: false, message: 'Admin sign-in is not configured' }, 503);
  const a = Buffer.from(data.data.password); const b = Buffer.from(configured);
  if (data.data.email.toLowerCase() !== (process.env.ADMIN_EMAIL || 'admin@paisamart.com').toLowerCase() || a.length !== b.length || !timingSafeEqual(a,b)) return c.json({ success: false }, 401);
  const user = { id: 'admin-1', email: data.data.email.toLowerCase(), name: 'Super Admin', role: 'admin', createdAt: new Date().toISOString() };
  return c.json({ success: true, user, token: await issueAuthToken('admin:' + user.email, { role: 'admin', email: user.email }, 43200) });
});
adminRouter.get('/home-loans', async c => {
  const token = bearerToken(c.req.header('authorization'));
  const claims = token ? await verifyAuthToken(token).catch(() => null) : null;
  if (claims?.role !== 'admin') return c.json({ success: false, message: 'Please sign out and sign in again.' }, 401);
  const parsed = z.object({ search: z.string().max(120).default(''), stage: z.enum(HOME_LOAN_STAGES).optional(), page: z.coerce.number().int().min(1).default(1) }).safeParse(c.req.query());
  if (!parsed.success) return c.json({ success: false }, 400);
  try { return c.json({ success: true, ...await listPipeline(parsed.data.search, parsed.data.stage, parsed.data.page) }); }
  catch { return c.json({ success: false, message: 'Could not load leads' }, 500); }
});

adminRouter.patch('/home-loans/:id', async c => {
  const token = bearerToken(c.req.header('authorization'));
  const claims = token ? await verifyAuthToken(token).catch(() => null) : null;
  if (claims?.role !== 'admin') return c.json({ success: false, message: 'Admin authorization required' }, 401);
  const parsed = z.object({ stage: z.enum(HOME_LOAN_STAGES), version: z.number().int().min(0), loanAmountRequired: z.string().regex(/^[1-9]\d{0,11}$/), note: z.string().trim().max(2000).default('') }).safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ success: false, message: 'Please check the stage and loan amount.' }, 400);
  try {
    await updatePipeline(c.req.param('id'), parsed.data, claims.email ?? claims.sub);
    return c.json({ success: true });
  } catch (error) {
    if (error instanceof PipelineConflict) return c.json({ success: false, message: error.message }, 409);
    if (error instanceof Error && error.message === 'Lead not found') return c.json({ success: false, message: error.message }, 404);
    return c.json({ success: false, message: 'Could not update lead. Please try again.' }, 500);
  }
});
