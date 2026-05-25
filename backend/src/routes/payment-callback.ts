import { Hono } from "hono";
import { z } from "zod";

const paymentCallbackRouter = new Hono();

interface CallbackRecord {
  id: string;
  partnerRefId: string;
  txnId: string;
  status: string;
  amount: number | undefined;
  productType: string | undefined;
  applicantName: string | undefined;
  mobile: string | undefined;
  responseCode: string;
  message: string;
  receivedAt: string;
}

const callbackStore: CallbackRecord[] = [];

const callbackSchema = z.object({
  partnerRefId: z.string().min(1),
  txnId: z.string().min(1),
  status: z.string().min(1),
  amount: z.number().optional(),
  productType: z.string().optional(),
  applicantName: z.string().optional(),
  mobile: z.string().optional(),
  responseCode: z.string().optional(),
  message: z.string().optional(),
});

paymentCallbackRouter.post("/", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ successStatus: false, message: "Invalid JSON", responseCode: "400" }, 400);
  }

  const parsed = callbackSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ successStatus: false, message: "Invalid request", responseCode: "400" }, 400);
  }

  const data = parsed.data;
  const record: CallbackRecord = {
    id: `CB-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    partnerRefId: data.partnerRefId,
    txnId: data.txnId,
    status: data.status,
    amount: data.amount,
    productType: data.productType,
    applicantName: data.applicantName,
    mobile: data.mobile,
    responseCode: data.responseCode ?? "000",
    message: data.message ?? "Success",
    receivedAt: new Date().toISOString(),
  };

  callbackStore.push(record);
  console.log(`[Callback] txnId=${record.txnId} status=${record.status} ref=${record.partnerRefId}`);

  return c.json({ successStatus: true, message: "Success", responseCode: "000" });
});

paymentCallbackRouter.get("/", (c) => {
  const params = c.req.query();
  const pRef = params["partnerRefId"];
  const tId = params["txnId"];
  const st = params["status"];

  let results = callbackStore.slice();
  if (pRef) results = results.filter((r) => r.partnerRefId === pRef);
  if (tId) results = results.filter((r) => r.txnId === tId);
  if (st) results = results.filter((r) => r.status.toLowerCase() === st.toLowerCase());

  return c.json({ successStatus: true, message: "Success", responseCode: "000", data: results, total: results.length });
});

paymentCallbackRouter.get("/:partnerRefId", (c) => {
  const ref = c.req.param("partnerRefId");
  const record = callbackStore.find((r) => r.partnerRefId === ref);

  if (!record) {
    return c.json({ successStatus: false, message: "Callback not found", responseCode: "404" }, 404);
  }

  return c.json({ successStatus: true, message: "Success", responseCode: "000", data: record });
});

export { paymentCallbackRouter };
