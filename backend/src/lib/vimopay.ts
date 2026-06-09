import crypto from "node:crypto";
import { Buffer } from "node:buffer";

// VimoPay (Vidual Communications) payment gateway client.
// All secrets come from env (.env) — never hard-code or ship them in the app.
const BASE_URL = process.env.VIMOPAY_BASE_URL ?? "https://gateway.vimopay.in";
const SECRET_KEY = process.env.VIMOPAY_SECRET_KEY ?? "";
const SALT_KEY = process.env.VIMOPAY_SALT_KEY ?? "";
const ED_KEY = process.env.VIMOPAY_ED_KEY ?? ""; // encryptdecryptKey — auth header only
const USER_ID = process.env.VIMOPAY_USER_ID ?? "";
const TAG_LEN = 16;

// AES-256-GCM. NOTE: despite the doc's naming, the payload key/IV are the
// secretKey (key) and saltKey (IV); encryptdecryptKey is only an auth header.
// Output is base64( ciphertext || 16-byte GCM tag ).
export function encrypt(plainText: string): string {
  const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(SECRET_KEY, "utf8"), Buffer.from(SALT_KEY, "utf8"));
  const enc = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  return Buffer.concat([enc, cipher.getAuthTag()]).toString("base64");
}

export function decrypt(encB64: string): string {
  const raw = Buffer.from(encB64, "base64");
  const data = raw.subarray(0, raw.length - TAG_LEN);
  const tag = raw.subarray(raw.length - TAG_LEN);
  const d = crypto.createDecipheriv("aes-256-gcm", Buffer.from(SECRET_KEY, "utf8"), Buffer.from(SALT_KEY, "utf8"));
  d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]).toString("utf8");
}

export function config() {
  return {
    baseUrl: BASE_URL,
    haveSecret: !!SECRET_KEY,
    haveSalt: !!SALT_KEY,
    haveEd: !!ED_KEY,
    haveUser: !!USER_ID,
    secretLen: SECRET_KEY.length,
    saltLen: SALT_KEY.length,
  };
}

// Step 1: partner authorization. The response `data` is the OPAQUE Bearer token
// (do NOT decrypt it). Must be called over HTTPS — the http endpoint 307-redirects
// to https and fetch drops the Authorization header on the way.
export async function authorize() {
  const res = await fetch(`${BASE_URL}/pgapi/api/signature/authorizeuat`, {
    method: "POST",
    headers: {
      secretKey: SECRET_KEY,
      saltKey: SALT_KEY,
      encryptdecryptKey: ED_KEY,
      userId: USER_ID,
      "Content-Type": "application/json",
    },
    body: "{}", // IIS returns 411 without a body / Content-Length
  });
  const json: any = await res.json().catch(() => ({}));
  const token = String(json?.data ?? "");
  return { httpStatus: res.status, raw: json, token, decryptOk: !!token, decErr: "" };
}

// Step 2: state list for the beneficiary-location dropdown.
export async function getStates(token: string) {
  const res = await fetch(`${BASE_URL}/masterapi/api/master/statelistuat`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}`, userId: USER_ID },
  });
  const json: any = await res.json().catch(() => ({}));
  let data: any = null;
  let decErr = "";
  try {
    data = JSON.parse(decrypt(json?.data ?? ""));
  } catch (e: any) {
    decErr = String(e?.message ?? e);
  }
  return { httpStatus: res.status, raw: json, data, decErr };
}

// Step 3: create a payment -> returns a paymentUrl to open in the app.
export async function createPayment(token: string, payload: Record<string, unknown>) {
  const requestBody = encrypt(JSON.stringify(payload));
  const res = await fetch(`${BASE_URL}/pgapi/api/payment/paymentgatewayuat`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, userId: USER_ID, "Content-Type": "application/json" },
    body: JSON.stringify({ requestBody }),
  });
  const json: any = await res.json().catch(() => ({}));
  let data: any = null;
  let decErr = "";
  try {
    data = JSON.parse(decrypt(json?.data ?? ""));
  } catch (e: any) {
    decErr = String(e?.message ?? e);
  }
  return { httpStatus: res.status, raw: json, data, decErr };
}
