import { Hono } from "hono";
import { z } from "zod";

const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, "Enter a valid Indian mobile number");
const otpChannelSchema = z.enum(["mobile", "web"]).default("mobile");
const sendSchema = z.object({ phone: phoneSchema, channel: otpChannelSchema.optional() });
const verifySchema = z.object({
  phone: phoneSchema,
  otp: z.string().regex(/^\d{6}$/),
  channel: otpChannelSchema.optional(),
  reqId: z.string().optional(),
});
const verifyTokenSchema = z.object({
  accessToken: z.string().min(1, "Missing accessToken"),
  channel: otpChannelSchema.optional(),
  phone: phoneSchema.optional(),
});
type OtpChannel = z.infer<typeof otpChannelSchema>;

type RateEntry = { count: number; resetAt: number };
const rates = new Map<string, RateEntry>();

const SEND_DEDUPE_WINDOW_MS = 10_000;
const otpStore = new Map<string, { otp?: string; expiresAt: number; lastSentAt: number; reqId?: string }>();

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

function providerConfig(channel: OtpChannel) {
  const authKey =
    channel === "web"
      ? process.env.MSG91_WEB_AUTH_KEY || process.env.MSG91_AUTH_KEY
      : process.env.MSG91_MOBILE_AUTH_KEY || process.env.MSG91_AUTH_KEY;
  const templateId =
    channel === "web"
      ? process.env.MSG91_WEB_OTP_TEMPLATE_ID || process.env.MSG91_OTP_TEMPLATE_ID
      : process.env.MSG91_MOBILE_OTP_TEMPLATE_ID || process.env.MSG91_OTP_TEMPLATE_ID;
  if (authKey && templateId) return { type: "template" as const, authKey, templateId };
  return null;
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function maskedMobile(mobile: string): string {
  return `${mobile.slice(0, 4)}****${mobile.slice(-2)}`;
}

function providerTokenKey(channel: OtpChannel) {
  if (channel === "web") {
    return (
      process.env.MSG91_WEB_WIDGET_SERVER_KEY ||
      process.env.MSG91_WEB_WIDGET_TOKEN_AUTH ||
      process.env.MSG91_SERVER_KEY ||
      process.env.MSG91_WIDGET_TOKEN_AUTH ||
      process.env.MSG91_AUTH_KEY
    );
  }
  return (
    process.env.MSG91_MOBILE_WIDGET_SERVER_KEY ||
    process.env.MSG91_MOBILE_WIDGET_TOKEN_AUTH ||
    process.env.MSG91_WEB_WIDGET_SERVER_KEY ||
    process.env.MSG91_WEB_WIDGET_TOKEN_AUTH ||
    process.env.MSG91_SERVER_KEY ||
    process.env.MSG91_WIDGET_TOKEN_AUTH ||
    process.env.MSG91_AUTH_KEY
  );
}

function widgetConfig(channel: OtpChannel) {
  const tokenAuth = providerTokenKey(channel);
  const widgetId =
    channel === "web"
      ? process.env.MSG91_WEB_WIDGET_ID || process.env.EXPO_PUBLIC_MSG91_WEB_WIDGET_ID || process.env.MSG91_OTP_TEMPLATE_ID
      : process.env.MSG91_MOBILE_WIDGET_ID ||
        process.env.EXPO_PUBLIC_MSG91_MOBILE_WIDGET_ID ||
        process.env.MSG91_WEB_WIDGET_ID ||
        process.env.EXPO_PUBLIC_MSG91_WEB_WIDGET_ID ||
        process.env.MSG91_OTP_TEMPLATE_ID;
  if (tokenAuth && widgetId) return { tokenAuth, widgetId };
  return null;
}

async function msg91(path: string, authKey: string, channel: OtpChannel) {
  const response = await fetch(`https://control.msg91.com${path}`, {
    method: "POST",
    headers: { authkey: authKey, "content-type": "application/json" },
  });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  const safeBody = JSON.stringify(body, (key, value) => {
    if (/auth|key|token|otp/i.test(key)) return "[redacted]";
    return value;
  });
  if (!response.ok || body.type === "error") {
    console.error("MSG91 OTP provider rejected the request", { channel, status: response.status, body: safeBody });
    throw new Error("OTP provider rejected the request");
  }
  console.log("MSG91 OTP provider accepted the request", { channel, status: response.status, body: safeBody });
  return body;
}

async function msg91Widget(path: string, body: Record<string, string>, channel: OtpChannel) {
  const response = await fetch(`https://control.msg91.com/api/v5/widget/${path}`, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({})) as Record<string, unknown>;
  const safeBody = JSON.stringify(data, (key, value) => {
    if (/auth|key|token|otp/i.test(key)) return "[redacted]";
    return value;
  });
  if (!response.ok || data.type === "error") {
    console.error("MSG91 widget provider rejected the request", { channel, path, status: response.status, body: safeBody });
    throw new Error("OTP provider rejected the request");
  }
  console.log("MSG91 widget provider accepted the request", { channel, path, status: response.status, body: safeBody });
  return data;
}

function findReqId(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  for (const key of ["reqId", "req_id", "requestId", "request_id", "message"]) {
    const raw = record[key];
    if (typeof raw === "string" && raw.trim()) return raw;
  }
  for (const key of ["data", "result", "response"]) {
    const nested = findReqId(record[key]);
    if (nested) return nested;
  }
  return null;
}

async function msg91VerifyAccessToken(accessToken: string, channel: OtpChannel) {
  const serverKey = providerTokenKey(channel);
  if (!serverKey) throw new Error(`MSG91 ${channel} widget server key is not configured`);

  const response = await fetch("https://api.msg91.com/v5/otp/verify/token", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${serverKey}`,
    },
    body: JSON.stringify({ accessToken }),
  });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  const safeBody = JSON.stringify(body, (key, value) => {
    if (/auth|key|token|otp/i.test(key)) return "[redacted]";
    return value;
  });
  if (!response.ok || body.type === "error") {
    console.error("MSG91 access token verification failed", { channel, status: response.status, body: safeBody });
    throw new Error("Invalid OTP token");
  }
  console.log("MSG91 access token verified", { channel, status: response.status, body: safeBody });
  return body;
}

function findProviderPhone(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const directKeys = ["phone", "mobile", "phoneNumber", "mobileNumber", "number"];
  for (const key of directKeys) {
    const raw = record[key];
    if (typeof raw === "string") {
      const digits = raw.replace(/\D/g, "");
      const phone = digits.length > 10 ? digits.slice(-10) : digits;
      if (phoneSchema.safeParse(phone).success) return phone;
    }
  }
  for (const key of ["data", "user", "result"]) {
    const nested = findProviderPhone(record[key]);
    if (nested) return nested;
  }
  return null;
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
  
  const channel = parsed.data.channel || "mobile";
  const widget = widgetConfig(channel);
  const config = providerConfig(channel);
  const isDev = !widget && !config;

  const ip = clientIp(c);
  if (!allow(`send-ip:${ip}`, 8, 15 * 60_000) || !allow(`send-phone:${parsed.data.phone}`, 3, 15 * 60_000)) {
    return c.json({ error: "Too many OTP requests. Please try again later." }, 429);
  }

  try {
    const mobile = `91${parsed.data.phone}`;
    const existing = otpStore.get(mobile);
    if (existing && existing.expiresAt > Date.now() && Date.now() - existing.lastSentAt < SEND_DEDUPE_WINDOW_MS) {
      console.log("OTP send skipped; active OTP was recently sent", { channel, mobile: maskedMobile(mobile) });
      return c.json({
        success: true,
        ...(existing.reqId ? { reqId: existing.reqId } : {}),
        ...(isDev && existing.otp ? { message: "OTP sent (dev mode)", devOtp: existing.otp } : {}),
      });
    }
    
    if (widget) {
      const data = await msg91Widget("sendOtp", {
        tokenAuth: widget.tokenAuth,
        widgetId: widget.widgetId,
        identifier: mobile,
      }, channel);
      const reqId = findReqId(data);
      otpStore.set(mobile, { reqId: reqId || undefined, expiresAt: Date.now() + 10 * 60_000, lastSentAt: Date.now() });
      return c.json(reqId ? { success: true, reqId } : { success: true });
    } else if (isDev) {
      const otp = generateOtp();
      // Development mode: store OTP in memory
      otpStore.set(mobile, { otp, expiresAt: Date.now() + 10 * 60_000, lastSentAt: Date.now() }); // 10 min expiry
      console.log(`📱 DEV OTP for ${mobile}: ${otp}`);
      return c.json({ success: true, message: "OTP sent (dev mode)", devOtp: otp });
    } else {
      const params = new URLSearchParams({
        template_id: config.templateId,
        mobile,
        otp_length: "6",
        otp_expiry: "10",
      });
      await msg91(`/api/v5/otp?${params.toString()}`, config.authKey, channel);
      otpStore.set(mobile, { expiresAt: Date.now() + 10 * 60_000, lastSentAt: Date.now() });
      return c.json({ success: true });
    }
  } catch (error) {
    console.error("OTP send failed", error instanceof Error ? error.message : "unknown error");
    return c.json({ error: "Unable to send OTP right now. Please try again." }, 502);
  }
});

authRouter.post("/verify-otp", async (c) => {
  const parsed = verifySchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "Enter the valid 6-digit OTP" }, 400);
  const channel = parsed.data.channel || "mobile";
  
  const ip = clientIp(c);
  if (!allow(`verify-ip:${ip}`, 20, 15 * 60_000) || !allow(`verify-phone:${parsed.data.phone}`, 8, 15 * 60_000)) {
    return c.json({ error: "Too many verification attempts. Please request a new OTP." }, 429);
  }

  try {
    const mobile = `91${parsed.data.phone}`;
    const widget = widgetConfig(channel);
    const config = providerConfig(channel);

    if (widget) {
      if (!parsed.data.reqId) throw new Error("Missing OTP request id");
      await msg91Widget("verifyOtp", {
        tokenAuth: widget.tokenAuth,
        widgetId: widget.widgetId,
        reqId: parsed.data.reqId,
        otp: parsed.data.otp,
      }, channel);
      const token = await issueToken(parsed.data.phone);
      return c.json({ success: true, token });
    }

    if (config) {
      const params = new URLSearchParams({
        otp: parsed.data.otp,
        mobile,
      });
      await msg91(`/api/v5/otp/verify?${params.toString()}`, config.authKey, channel);
      const token = await issueToken(parsed.data.phone);
      return c.json({ success: true, token });
    }

    const stored = otpStore.get(mobile);
    if (!stored || Date.now() > stored.expiresAt) {
      return c.json({ error: "The OTP is incorrect or has expired" }, 401);
    }
    if (stored.otp !== parsed.data.otp) {
      return c.json({ error: "The OTP is incorrect or has expired" }, 401);
    }
    otpStore.delete(mobile); // Clear used OTP
    const token = await issueToken(parsed.data.phone);
    return c.json({ success: true, token });
  } catch (error) {
    console.error("OTP verify failed", error instanceof Error ? error.message : "unknown error");
    return c.json({ error: "The OTP is incorrect or has expired" }, 401);
  }
});

authRouter.post("/verify-otp-token", async (c) => {
  const parsed = verifyTokenSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message || "Missing accessToken" }, 400);
  const channel = parsed.data.channel || "web";

  const ip = clientIp(c);
  if (!allow(`verify-token-ip:${channel}:${ip}`, 20, 15 * 60_000)) {
    return c.json({ error: "Too many verification attempts. Please request a new OTP." }, 429);
  }

  try {
    const data = await msg91VerifyAccessToken(parsed.data.accessToken, channel);
    const providerPhone = findProviderPhone(data);
    const phone = providerPhone || parsed.data.phone;
    if (!phone) throw new Error("Verified OTP token did not include a phone number");
    if (providerPhone && parsed.data.phone && providerPhone !== parsed.data.phone) {
      return c.json({ error: "OTP token does not match this mobile number" }, 401);
    }
    const token = await issueToken(phone);
    return c.json({ success: true, token, phone, data });
  } catch (error) {
    console.error("OTP token verify failed", error instanceof Error ? error.message : "unknown error");
    return c.json({ error: "Invalid token" }, 401);
  }
});
