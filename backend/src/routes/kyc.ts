import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { Hono } from "hono";
import { z } from "zod";
import { getUserProfile, updateUserKycStatus } from "../lib/user-profile-store";

const kycRouter = new Hono();

type KycSessionStatus = "pending" | "verified" | "failed";

type KycSession = {
  id: string;
  phoneNumber: string;
  providerRefId: string;
  status: KycSessionStatus;
  createdAt: number;
  updatedAt: number;
  error?: string;
  raw?: unknown;
};

const SESSION_TTL_MS = 30 * 60_000;
const sessions = new Map<string, KycSession>();

const startSchema = z.object({
  phoneNumber: z.string().regex(/^\d{10}$/),
});

function configuredBackendUrl(c: any) {
  const fromEnv = process.env.BACKEND_URL || process.env.PUBLIC_BACKEND_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return new URL(c.req.url).origin;
}

function signingSecret() {
  return process.env.AUTH_TOKEN_SECRET || process.env.VIMOPAY_KYC_STATE_SECRET || "paisa-mart-local-state";
}

function signState(payload: string) {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

function makeState(sessionId: string, phoneNumber: string) {
  const payload = `${sessionId}.${phoneNumber}`;
  return `${payload}.${signState(payload)}`;
}

function verifyState(state: string) {
  const parts = state.split(".");
  if (parts.length !== 3) return null;

  const [sessionId, phoneNumber, signature] = parts;
  const payload = `${sessionId}.${phoneNumber}`;
  const expected = signState(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (actualBuffer.length !== expectedBuffer.length) return null;
  if (!timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  return { sessionId, phoneNumber };
}

function cleanupSessions() {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now - session.createdAt > SESSION_TTL_MS) sessions.delete(id);
  }
}

function getVimoPayKycConfig(c: any) {
  const backendUrl = configuredBackendUrl(c);
  const callbackUrl =
    process.env.VIMOPAY_KYC_CALLBACK_URL ||
    `${backendUrl}/api/kyc/vimopay/callback`;
  const startUrl = process.env.VIMOPAY_KYC_START_URL;
  const statusUrl = process.env.VIMOPAY_KYC_STATUS_URL;
  const hostedUrlTemplate = process.env.VIMOPAY_KYC_URL_TEMPLATE;
  const authToken = process.env.VIMOPAY_KYC_AUTH_TOKEN;
  const apiKey = process.env.VIMOPAY_KYC_API_KEY;
  const userId = process.env.VIMOPAY_USER_ID;

  if (!startUrl && !hostedUrlTemplate) return null;
  return { callbackUrl, startUrl, statusUrl, hostedUrlTemplate, authToken, apiKey, userId };
}

function redact(value: unknown) {
  return JSON.stringify(value, (key, item) => (/token|secret|key|auth/i.test(key) ? "[redacted]" : item));
}

function statusFromProvider(value: unknown): KycSessionStatus {
  const status = String(value || "").toLowerCase();
  if (["verified", "success", "approved", "completed", "complete", "000"].includes(status)) return "verified";
  if (["failed", "failure", "rejected", "cancelled", "canceled", "error"].includes(status)) return "failed";
  return "pending";
}

function valueAt(data: any, keys: string[]) {
  for (const key of keys) {
    if (data && data[key] != null) return data[key];
    if (data?.data && data.data[key] != null) return data.data[key];
  }
  return undefined;
}

function findSessionFromCallback(params: Record<string, unknown>) {
  const state = String(params.state || "");
  if (state) {
    const verifiedState = verifyState(state);
    if (!verifiedState) return { error: "Invalid VimoPay KYC session" };

    const session = sessions.get(verifiedState.sessionId);
    if (!session || session.phoneNumber !== verifiedState.phoneNumber) {
      return { error: "This VimoPay KYC session has expired" };
    }
    return { session };
  }

  const sessionId = valueAt(params, ["sessionId", "kycSessionId"]);
  if (typeof sessionId === "string" && sessions.has(sessionId)) {
    return { session: sessions.get(sessionId) };
  }

  const providerRefId = valueAt(params, ["providerRefId", "partnerRefId", "merchantRefId", "referenceId"]);
  if (providerRefId != null) {
    const session = [...sessions.values()].find((item) => item.providerRefId === String(providerRefId));
    if (session) return { session };
  }

  const phoneNumber = String(valueAt(params, ["phoneNumber", "mobile", "custMobile"]) || "").replace(/\D/g, "").slice(-10);
  if (phoneNumber.length === 10) {
    const session = [...sessions.values()].find((item) => item.phoneNumber === phoneNumber);
    if (session) return { session };
  }

  return { error: "Unable to match VimoPay KYC session" };
}

function applyTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, encodeURIComponent(value)),
    template,
  );
}

function requestHeaders(config: NonNullable<ReturnType<typeof getVimoPayKycConfig>>) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json",
  };
  if (config.authToken) headers.Authorization = `Bearer ${config.authToken}`;
  if (config.apiKey) headers["x-api-key"] = config.apiKey;
  if (config.userId) headers.userId = config.userId;
  return headers;
}

async function createVimoPaySession(
  config: NonNullable<ReturnType<typeof getVimoPayKycConfig>>,
  payload: { sessionId: string; phoneNumber: string; state: string },
) {
  const callbackUrl = config.callbackUrl;
  const partnerRefId = `PMKYC${Date.now()}${payload.phoneNumber.slice(-4)}`;

  if (config.hostedUrlTemplate && !config.startUrl) {
    return {
      providerRefId: partnerRefId,
      kycUrl: applyTemplate(config.hostedUrlTemplate, {
        sessionId: payload.sessionId,
        phoneNumber: payload.phoneNumber,
        partnerRefId,
        state: payload.state,
        callbackUrl,
      }),
      raw: { source: "VIMOPAY_KYC_URL_TEMPLATE" },
    };
  }

  const response = await fetch(config.startUrl!, {
    method: "POST",
    headers: requestHeaders(config),
    body: JSON.stringify({
      partnerRefId,
      merchantRefId: partnerRefId,
      phoneNumber: payload.phoneNumber,
      mobile: payload.phoneNumber,
      custMobile: payload.phoneNumber,
      callbackUrl,
      redirectUrl: callbackUrl,
      state: payload.state,
    }),
  });
  const data = await response.json().catch(() => ({})) as Record<string, unknown>;

  if (!response.ok) {
    console.error("VimoPay KYC start failed", { status: response.status, body: redact(data) });
    throw new Error("VimoPay KYC could not be started");
  }

  const kycUrl = valueAt(data, ["kycUrl", "authUrl", "redirectUrl", "url", "paymentUrl"]);
  const providerRefId = valueAt(data, ["providerRefId", "partnerRefId", "merchantRefId", "referenceId", "sessionId"]);
  if (typeof kycUrl !== "string") {
    console.error("VimoPay KYC start missing redirect URL", { status: response.status, body: redact(data) });
    throw new Error("VimoPay KYC did not return a verification URL");
  }

  return {
    providerRefId: typeof providerRefId === "string" ? providerRefId : partnerRefId,
    kycUrl,
    raw: data,
  };
}

async function fetchVimoPayStatus(config: NonNullable<ReturnType<typeof getVimoPayKycConfig>>, session: KycSession) {
  if (!config.statusUrl) return null;

  const statusUrl = applyTemplate(config.statusUrl, {
    sessionId: session.id,
    phoneNumber: session.phoneNumber,
    partnerRefId: session.providerRefId,
  });
  const response = await fetch(statusUrl, { headers: requestHeaders(config) });
  const data = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) {
    console.error("VimoPay KYC status failed", { status: response.status, body: redact(data) });
    return null;
  }

  const providerStatus = valueAt(data, ["kycStatus", "status", "txnStatusCode", "responseCode"]);
  const status = statusFromProvider(providerStatus);
  session.status = status;
  session.raw = data;
  session.updatedAt = Date.now();
  if (status === "verified") updateUserKycStatus(session.phoneNumber, "verified");
  if (status === "failed") {
    session.error = String(valueAt(data, ["error", "message", "responseMessage"]) || "VimoPay KYC failed");
    updateUserKycStatus(session.phoneNumber, "rejected");
  }
  return data;
}

function callbackHtml(title: string, message: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;min-height:100vh;display:grid;place-items:center;background:#f8fafc;color:#111827}
      main{max-width:420px;padding:28px;text-align:center}
      h1{font-size:22px;margin:0 0 8px;color:#0A3D91}
      p{font-size:15px;line-height:1.5;color:#4b5563;margin:0}
    </style>
  </head>
  <body>
    <main>
      <h1>${title}</h1>
      <p>${message}</p>
    </main>
    <script>setTimeout(function(){ window.close(); }, 1800);</script>
  </body>
</html>`;
}

function updateSessionFromCallback(params: Record<string, unknown>) {
  const matched = findSessionFromCallback(params);
  if (!matched.session) return { ok: false as const, error: matched.error || "Unable to match VimoPay KYC session" };
  const session = matched.session;

  const providerStatus = valueAt(params, ["kycStatus", "status", "txnStatusCode", "responseCode"]);
  const status = statusFromProvider(providerStatus);
  session.status = status;
  session.raw = params;
  session.updatedAt = Date.now();

  if (status === "verified") {
    updateUserKycStatus(session.phoneNumber, "verified");
  } else if (status === "failed") {
    session.error = String(valueAt(params, ["error", "message", "responseMessage"]) || "VimoPay KYC failed");
    updateUserKycStatus(session.phoneNumber, "rejected");
  }

  return { ok: true as const, session };
}

kycRouter.post("/vimopay/start", async (c) => {
  cleanupSessions();
  const parsed = startSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ success: false, error: "Invalid phone number" }, 400);

  const profile = getUserProfile(parsed.data.phoneNumber);
  if (!profile) return c.json({ success: false, error: "Complete profile before KYC" }, 404);

  const config = getVimoPayKycConfig(c);
  if (!config) {
    return c.json(
      {
        success: false,
        error: "VimoPay KYC is not configured. Add VIMOPAY_KYC_START_URL or VIMOPAY_KYC_URL_TEMPLATE.",
      },
      503,
    );
  }

  const sessionId = randomUUID();
  const state = makeState(sessionId, parsed.data.phoneNumber);

  try {
    const providerSession = await createVimoPaySession(config, {
      sessionId,
      phoneNumber: parsed.data.phoneNumber,
      state,
    });

    sessions.set(sessionId, {
      id: sessionId,
      phoneNumber: parsed.data.phoneNumber,
      providerRefId: providerSession.providerRefId,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      raw: providerSession.raw,
    });

    updateUserKycStatus(parsed.data.phoneNumber, "submitted");

    return c.json({
      success: true,
      sessionId,
      providerRefId: providerSession.providerRefId,
      kycUrl: providerSession.kycUrl,
      status: "pending",
    });
  } catch (error) {
    return c.json(
      { success: false, error: error instanceof Error ? error.message : "Unable to start VimoPay KYC" },
      502,
    );
  }
});

kycRouter.get("/vimopay/status/:sessionId", async (c) => {
  cleanupSessions();
  const session = sessions.get(c.req.param("sessionId"));
  if (!session) return c.json({ success: false, error: "KYC session expired" }, 404);

  const config = getVimoPayKycConfig(c);
  if (config) await fetchVimoPayStatus(config, session);

  const profile = getUserProfile(session.phoneNumber);
  return c.json({
    success: true,
    sessionId: session.id,
    providerRefId: session.providerRefId,
    status: session.status,
    kycStatus: profile?.kycStatus || "submitted",
    error: session.error,
  });
});

kycRouter.get("/vimopay/callback", (c) => {
  const result = updateSessionFromCallback(Object.fromEntries(new URL(c.req.url).searchParams.entries()));
  if (!result.ok) return c.html(callbackHtml("KYC failed", `${result.error}. Please return to Paisa Mart and try again.`), 400);

  if (result.session.status === "verified") {
    return c.html(callbackHtml("KYC verified", "Your VimoPay KYC is complete. You can return to Paisa Mart."));
  }

  if (result.session.status === "failed") {
    return c.html(callbackHtml("KYC failed", "VimoPay KYC was not completed. Please return to Paisa Mart and try again."), 400);
  }

  return c.html(callbackHtml("KYC pending", "VimoPay KYC is still being processed. Please return to Paisa Mart."));
});

kycRouter.post("/vimopay/callback", async (c) => {
  const body = await c.req.json().catch(() => ({})) as Record<string, unknown>;
  const result = updateSessionFromCallback(body);
  if (!result.ok) return c.json({ success: false, error: result.error }, 400);
  return c.json({ success: true, status: result.session.status });
});

export { kycRouter };
