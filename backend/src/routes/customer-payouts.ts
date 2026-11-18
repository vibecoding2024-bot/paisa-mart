import { Hono } from 'hono';
import { customerPhone } from '../lib/customer-token';
import { customerEligiblePayouts, exclusive } from '../lib/admin-operations';
export const customerPayoutsRouter = new Hono();
customerPayoutsRouter.get('/', async c => {
  c.header('Cache-Control', 'no-store');
  const phone = customerPhone(c.req.header('authorization'));
  if (!phone) return c.json({ success: false, message: 'Please sign in to view your payout details' }, 401);
  try { return c.json({ success: true, data: await exclusive(() => customerEligiblePayouts(phone)) }); }
  catch { return c.json({ success: false, message: 'Payout details are unavailable. Please retry.' }, 503); }
});
