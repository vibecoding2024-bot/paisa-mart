export type AuthClaims = {
  sub: string;
  role?: "customer" | "admin" | "ops" | "viewer";
  email?: string;
  iat: number;
  exp: number;
};

function base64Url(value: Uint8Array | string) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  return Buffer.from(bytes).toString("base64url");
}

function secret() {
  const value = process.env.HOME_LOAN_ADMIN_TOKEN_SECRET;
  if (!value) throw new Error("HOME_LOAN_ADMIN_TOKEN_SECRET is not configured");
  return value;
}

async function signature(data: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data)));
}

export async function issueAuthToken(
  subject: string,
  claims: Pick<AuthClaims, "role" | "email"> = {},
  ttlSeconds = 60 * 60 * 24 * 7,
) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({ sub: subject, ...claims, iat: now, exp: now + ttlSeconds }));
  const data = `${header}.${payload}`;
  return `${data}.${base64Url(await signature(data))}`;
}

export async function verifyAuthToken(token: string): Promise<AuthClaims> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid access token");
  const header = parts[0]!;
  const payload = parts[1]!;
  const providedSignature = parts[2]!;
  const expectedSignature = base64Url(await signature(`${header}.${payload}`));
  const provided = Buffer.from(providedSignature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    throw new Error("Invalid access token");
  }
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AuthClaims;
  if (!claims.sub || !claims.exp || claims.exp <= Math.floor(Date.now() / 1000)) {
    throw new Error("Access token expired");
  }
  return claims;
}

export function bearerToken(header?: string) {
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}
import { timingSafeEqual } from "node:crypto";
