import { Hono } from "hono";
import { z } from "zod";

const notifyInterestRouter = new Hono();

// In-memory store for notify interest (no DB setup required)
const notifyInterestStore: Array<{
  module_name: string;
  timestamp: string;
  created_at: string;
}> = [];

const notifyInterestSchema = z.object({
  module_name: z.string().min(1),
  timestamp: z.string(),
});

notifyInterestRouter.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = notifyInterestSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ success: false, message: "Invalid request" }, 400);
  }

  const { module_name, timestamp } = parsed.data;

  const entry = {
    module_name,
    timestamp,
    created_at: new Date().toISOString(),
  };

  notifyInterestStore.push(entry);

  console.log(
    `[NotifyInterest] New interest: module=${module_name}, time=${timestamp}`
  );

  return c.json({ success: true, message: "Interest recorded successfully" });
});

// Admin endpoint to view interests
notifyInterestRouter.get("/", (c) => {
  return c.json({
    success: true,
    data: notifyInterestStore,
    total: notifyInterestStore.length,
  });
});

export { notifyInterestRouter };
