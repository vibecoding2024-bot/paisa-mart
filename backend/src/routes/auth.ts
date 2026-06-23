import { Hono } from "hono";
import { z } from "zod";

const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, "Enter a valid Indian mobile number");
const sendSchema = z.object({ phone: phoneSchema });
const verifySchema = z.object({ phone: phoneSchema, otp: z.string().regex(/^\d{6}$/) });

type RateEntry = { count: number; resetAt: number };
const rates = new Map<string, RateEntry>();

function allow(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = rates.get(key);
  if (!current || current.resetAt <= now) {
    rates.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

function clientIp(c: any) {
  return c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function providerConfig() {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_OTP_TEMPLATE_ID;
  return authKey && templateId ? { authKey, templateId } : null;
}

async function msg91(path: string, authKey: string) {
  const response = await fetch(`https://control.msg91.com${path}`, {
    method: "POST",
    headers: { authkey: authKey, "content-type": "application/json" },
  });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok || body.type === "error") throw new Error("OTP provider rejected the request");
  return body;
}

function base64Url(value: Uint8Array | string) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  return Buffer.from(bytes).toString("base64url");
}

async function issueToken(phone: string) {
  const secret = process.env.AUTH_TOKEN_SECRET;
  if (!secret) throw new Error("AUTH_TOKEN_SECRET is not configured");
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({ sub: `+91${phone}`, iat: now, exp: now + 60 * 60 * 24 * 7 }));
  const data = `${header}.${payload}`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return `${data}.${base64Url(new Uint8Array(signature))}`;
}

export const authRouter = new Hono();

authRouter.post("/send-otp", async (c) => {
  const parsed = sendSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, 400);
  const config = providerConfig();
  if (!config) return c.json({ error: "Mobile OTP is not configured on the server" }, 503);

  const ip = clientIp(c);
  if (!allow(`send-ip:${ip}`, 8, 15 * 60_000) || !allow(`send-phone:${parsed.data.phone}`, 3, 15 * 60_000)) {
    return c.json({ error: "Too many OTP requests. Please try again later." }, 429);
  }

  try {
    const mobile = `91${parsed.data.phone}`;
    await msg91(`/api/v5/otp?template_id=${encodeURIComponent(config.templateId)}&mobile=${mobile}&otp_length=6`, config.authKey);
    return c.json({ success: true });
  } catch (error) {
    console.error("OTP send failed", error instanceof Error ? error.message : "unknown error");
    return c.json({ error: "Unable to send OTP right now. Please try again." }, 502);
  }
});

authRouter.post("/verify-otp", async (c) => {
  const parsed = verifySchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "Enter the valid 6-digit OTP" }, 400);
  const config = providerConfig();
  if (!config) return c.json({ error: "Mobile OTP is not configured on the server" }, 503);

  const ip = clientIp(c);
  if (!allow(`verify-ip:${ip}`, 20, 15 * 60_000) || !allow(`verify-phone:${parsed.data.phone}`, 8, 15 * 60_000)) {
    return c.json({ error: "Too many verification attempts. Please request a new OTP." }, 429);
  }

  try {
    const mobile = `91${parsed.data.phone}`;
    await msg91(`/api/v5/otp/verify?otp=${parsed.data.otp}&mobile=${mobile}`, config.authKey);
    return c.json({ success: true, token: await issueToken(parsed.data.phone) });
  } catch {
    return c.json({ error: "The OTP is incorrect or has expired" }, 401);
  }
});
