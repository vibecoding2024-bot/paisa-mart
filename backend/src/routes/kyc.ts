import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { Hono } from "hono";
import { z } from "zod";
import { getUserProfile, updateUserKycStatus } from "../lib/user-profile-store";

const kycRouter = new Hono();

type DigiLockerSessionStatus = "pending" | "verified" | "failed";

type DigiLockerSession = {
  id: string;
  phoneNumber: string;
  status: DigiLockerSessionStatus;
  createdAt: number;
  updatedAt: number;
  error?: string;
};

const SESSION_TTL_MS = 15 * 60_000;
const sessions = new Map<string, DigiLockerSession>();

const startSchema = z.object({
  phoneNumber: z.string().regex(/^\d{10}$/),
});

function configuredBackendUrl(c: any) {
  const fromEnv = process.env.BACKEND_URL || process.env.PUBLIC_BACKEND_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return new URL(c.req.url).origin;
}

function getDigiLockerConfig(c: any) {
  const backendUrl = configuredBackendUrl(c);
  const clientId = process.env.DIGILOCKER_CLIENT_ID;
  const clientSecret = process.env.DIGILOCKER_CLIENT_SECRET;
  const redirectUri =
    process.env.DIGILOCKER_REDIRECT_URI ||
    `${backendUrl}/api/kyc/digilocker/callback`;
  const authUrl =
    process.env.DIGILOCKER_AUTH_URL ||
    "https://api.digitallocker.gov.in/public/oauth2/1/authorize";
  const tokenUrl =
    process.env.DIGILOCKER_TOKEN_URL ||
    "https://api.digitallocker.gov.in/public/oauth2/1/token";
  const scope = process.env.DIGILOCKER_SCOPE || "openid";

  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret, redirectUri, authUrl, tokenUrl, scope };
}

function signingSecret() {
  return process.env.AUTH_TOKEN_SECRET || process.env.DIGILOCKER_STATE_SECRET || "paisa-mart-local-state";
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

async function exchangeCodeForToken(code: string, config: NonNullable<ReturnType<typeof getDigiLockerConfig>>) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json",
    },
    body,
  });
  const data = await response.json().catch(() => ({})) as Record<string, unknown>;
  const safeData = JSON.stringify(data, (key, value) => (/token|secret/i.test(key) ? "[redacted]" : value));

  if (!response.ok || typeof data.access_token !== "string") {
    console.error("DigiLocker token exchange failed", { status: response.status, body: safeData });
    throw new Error("DigiLocker verification failed");
  }

  console.log("DigiLocker token exchange succeeded", { status: response.status });
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

kycRouter.post("/digilocker/start", async (c) => {
  cleanupSessions();
  const parsed = startSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ success: false, error: "Invalid phone number" }, 400);

  const profile = getUserProfile(parsed.data.phoneNumber);
  if (!profile) return c.json({ success: false, error: "Complete profile before KYC" }, 404);

  const config = getDigiLockerConfig(c);
  if (!config) {
    return c.json(
      {
        success: false,
        error: "DigiLocker is not configured. Add DIGILOCKER_CLIENT_ID and DIGILOCKER_CLIENT_SECRET.",
      },
      503,
    );
  }

  const sessionId = randomUUID();
  const state = makeState(sessionId, parsed.data.phoneNumber);
  sessions.set(sessionId, {
    id: sessionId,
    phoneNumber: parsed.data.phoneNumber,
    status: "pending",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  updateUserKycStatus(parsed.data.phoneNumber, "submitted");

  const authUrl = new URL(config.authUrl);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", config.clientId);
  authUrl.searchParams.set("redirect_uri", config.redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("scope", config.scope);

  return c.json({ success: true, sessionId, authUrl: authUrl.toString(), status: "pending" });
});

kycRouter.get("/digilocker/status/:sessionId", (c) => {
  cleanupSessions();
  const session = sessions.get(c.req.param("sessionId"));
  if (!session) return c.json({ success: false, error: "KYC session expired" }, 404);

  const profile = getUserProfile(session.phoneNumber);
  return c.json({
    success: true,
    sessionId: session.id,
    status: session.status,
    kycStatus: profile?.kycStatus || "submitted",
    error: session.error,
  });
});

kycRouter.get("/digilocker/callback", async (c) => {
  const state = c.req.query("state");
  const code = c.req.query("code");
  const error = c.req.query("error");

  if (!state) {
    return c.html(callbackHtml("KYC failed", "Missing DigiLocker state. Please return to Paisa Mart and try again."), 400);
  }

  const verifiedState = verifyState(state);
  if (!verifiedState) {
    return c.html(callbackHtml("KYC failed", "Invalid DigiLocker session. Please return to Paisa Mart and try again."), 400);
  }

  const session = sessions.get(verifiedState.sessionId);
  if (!session || session.phoneNumber !== verifiedState.phoneNumber) {
    return c.html(callbackHtml("KYC failed", "This DigiLocker session has expired. Please return to Paisa Mart and try again."), 410);
  }

  if (error || !code) {
    session.status = "failed";
    session.error = error || "DigiLocker did not return an authorization code";
    session.updatedAt = Date.now();
    updateUserKycStatus(session.phoneNumber, "rejected");
    return c.html(callbackHtml("KYC failed", "DigiLocker verification was not completed. Please return to Paisa Mart and try again."), 400);
  }

  const config = getDigiLockerConfig(c);
  if (!config) {
    session.status = "failed";
    session.error = "DigiLocker backend is not configured";
    session.updatedAt = Date.now();
    return c.html(callbackHtml("KYC failed", "DigiLocker is not configured. Please contact support."), 503);
  }

  try {
    await exchangeCodeForToken(code, config);
    session.status = "verified";
    session.updatedAt = Date.now();
    updateUserKycStatus(session.phoneNumber, "verified");
    return c.html(callbackHtml("KYC verified", "Your DigiLocker KYC is complete. You can return to Paisa Mart."));
  } catch (exchangeError) {
    session.status = "failed";
    session.error = exchangeError instanceof Error ? exchangeError.message : "DigiLocker verification failed";
    session.updatedAt = Date.now();
    updateUserKycStatus(session.phoneNumber, "rejected");
    return c.html(callbackHtml("KYC failed", "DigiLocker verification failed. Please return to Paisa Mart and try again."), 400);
  }
});

export { kycRouter };
