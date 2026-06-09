import { Hono } from "hono";
import { authorize, getStates, createPayment, config } from "../lib/vimopay";
import { CHECKOUT_PAGE } from "../checkout-page";
import { savePending, getTxn } from "../lib/txn-store";

export const paymentRouter = new Hono();

// hosted checkout/initiation page
paymentRouter.get("/checkout", (c) => c.html(CHECKOUT_PAGE));

// sanity: are the env keys loaded?
paymentRouter.get("/config", (c) => c.json(config()));

// step 1: partner authorization -> bearer token
paymentRouter.get("/auth", async (c) => {
  const r = await authorize();
  return c.json({
    httpStatus: r.httpStatus,
    decryptOk: r.decryptOk,
    tokenPreview: r.token ? r.token.slice(0, 32) + "..." : null,
    raw: r.raw,
  });
});

// step 2: state list (needs token)
paymentRouter.get("/states", async (c) => {
  const a = await authorize();
  if (!a.token) return c.json({ error: "auth failed", auth: a }, 502);
  const s = await getStates(a.token);
  return c.json(s);
});

// step 3: create a payment -> returns paymentUrl to open in the app
paymentRouter.post("/create", async (c) => {
  const body: any = await c.req.json().catch(() => ({}));
  const a = await authorize();
  if (!a.token) return c.json({ error: "auth failed", auth: a }, 502);
  const merchantRefId = body.merchantRefId ?? "PM" + Date.now();
  const payload = {
    amount: body.amount ?? 10.0,
    merchantRefId,
    custMobile: body.custMobile ?? "9999999999",
    location: body.location ?? "UP",
    custName: body.custName ?? "Test User",
    email: body.email ?? "test@example.com",
    lat: body.lat ?? "28.627672",
    long: body.long ?? "77.369326",
    udf1: body.udf1 ?? "",
    udf2: body.udf2 ?? "",
    udf3: body.udf3 ?? "",
  };
  const r = await createPayment(a.token, payload);
  try {
    savePending({
      merchantRefId,
      txnId: r?.data?.txnId,
      amount: r?.data?.amount ?? payload.amount,
      txnStatusCode: r?.data?.txnStatusCode,
      responseMessage: r?.data?.responseMessage,
      raw: r?.data ?? r?.raw,
    });
  } catch (e) {
    console.error("[CREATE] persist failed", e);
  }
  return c.json({ merchantRefId, ...r });
});

// gateway/app return: query the stored status by merchantRefId. The authoritative
// status is written by the server-to-server callback; the return page polls this.
paymentRouter.get("/status/:ref", (c) => {
  const ref = c.req.param("ref");
  const txn = getTxn(ref);
  if (!txn) return c.json({ found: false, merchantRefId: ref, status: "Unknown" });
  return c.json({
    found: true,
    merchantRefId: txn.merchantRefId,
    txnId: txn.txnId,
    amount: txn.amount,
    status: txn.status,
    txnStatusCode: txn.txnStatusCode,
    responseMessage: txn.responseMessage,
    updatedAt: txn.updatedAt,
  });
});

// step 4: gateway -> us. VimoPay POSTs the final txn status here (plain JSON).
paymentRouter.post("/vimopay-callback", async (c) => {
  const body: any = await c.req.json().catch(() => ({}));
  console.log("[VIMOPAY CALLBACK]", JSON.stringify(body));
  // TODO: look up order by merchantRefId/txnId, mark success/failed via txnStatusCode (000/001/002)
  return c.json({ successStatus: true, message: "Success", responseCode: "000" });
});
