import { Hono } from 'hono';
import { customerPhone } from '../lib/customer-token';
import { customerApplications, exclusive } from '../lib/admin-operations';
export const customerApplicationsRouter = new Hono();
customerApplicationsRouter.get('/', async c => {
  c.header('Cache-Control', 'no-store');
  const phone = customerPhone(c.req.header('authorization'));
  if (!phone) return c.json({ success: false, message: 'Please sign in to view your applications' }, 401);
  try { return c.json({ success: true, data: await exclusive(() => customerApplications(phone)) }); }
  catch { return c.json({ success: false, message: 'Your applications are unavailable. Please retry.' }, 503); }
});
