import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Google Play review account (docs/play-store-remediation-20261122/REVIEWER_ACCESS_DESIGN.md).
 *
 * One designated phone number, configured only in the server environment, may sign in with one
 * pre-shared 6-digit code while the review window is enabled and unexpired. The code is never stored
 * in plain text: only HMAC-SHA256(REVIEW_ACCOUNT_HMAC_KEY, code) is configured. The code is accepted
 * for that phone only (never universal), and the path locks after repeated failures.
 *
 * Restrictions (isReviewPhone) apply whenever REVIEW_ACCOUNT_PHONE is configured, even when sign-in is
 * disabled or expired, so records made by the review account never become payout-eligible.
 */

const PHONE = /^[6-9]\d{9}$/;
const HASH = /^[0-9a-f]{64}$/;
export const REVIEW_MAX_FAILURES = 10;
export const REVIEW_ACCOUNT_REFUSAL = "Not available for the demo account";

let failures = 0;

function configuredPhone(): string | null {
  const phone = (process.env.REVIEW_ACCOUNT_PHONE || "").trim();
  return PHONE.test(phone) ? phone : null;
}

/** True when the phone is the configured review phone (regardless of the sign-in window). */
export function isReviewPhone(phone: unknown): boolean {
  const review = configuredPhone();
  if (!review || typeof phone !== "string") return false;
  const digits = phone.replace(/\D/g, "");
  return (digits.length > 10 ? digits.slice(-10) : digits) === review;
}

/** Review sign-in is active only when every setting is present and valid and the window is open. */
export function reviewLoginActive(now = Date.now()): boolean {
  if (process.env.REVIEW_ACCOUNT_ENABLED !== "true") return false;
  if (!configuredPhone()) return false;
  if (!HASH.test((process.env.REVIEW_ACCOUNT_CODE_HASH || "").trim().toLowerCase())) return false;
  if ((process.env.REVIEW_ACCOUNT_HMAC_KEY || "").length < 32) return false;
  const expires = Date.parse(process.env.REVIEW_ACCOUNT_EXPIRES_AT || "");
  if (!Number.isFinite(expires) || expires <= now) return false;
  return failures < REVIEW_MAX_FAILURES;
}

/** Review window open: enabled and unexpired (used to revoke already-issued review tokens). */
export function reviewWindowOpen(now = Date.now()): boolean {
  if (process.env.REVIEW_ACCOUNT_ENABLED !== "true" || !configuredPhone()) return false;
  const expires = Date.parse(process.env.REVIEW_ACCOUNT_EXPIRES_AT || "");
  return Number.isFinite(expires) && expires > now;
}

/** Review tokens never outlive the configured window (seconds since epoch). */
export function reviewTokenExpiry(): number {
  return Math.floor(Date.parse(process.env.REVIEW_ACCOUNT_EXPIRES_AT || "") / 1000);
}

/** True when this request should use the review path (never for any other phone). */
export function usesReviewLogin(phone: string): boolean {
  return reviewLoginActive() && isReviewPhone(phone);
}

export function reviewCodeHash(code: string, key: string): string {
  return createHmac("sha256", key).update(code).digest("hex");
}

/** Timing-safe check of the review code. Counts failures; locks after REVIEW_MAX_FAILURES. */
export function verifyReviewCode(phone: string, code: string): boolean {
  if (!usesReviewLogin(phone)) return false;
  const expected = Buffer.from((process.env.REVIEW_ACCOUNT_CODE_HASH || "").trim().toLowerCase(), "hex");
  const actual = Buffer.from(reviewCodeHash(code, process.env.REVIEW_ACCOUNT_HMAC_KEY!), "hex");
  const ok = expected.length === actual.length && timingSafeEqual(expected, actual);
  if (ok) failures = 0;
  else {
    failures += 1;
    if (failures >= REVIEW_MAX_FAILURES) console.warn("Play review sign-in locked after repeated failures; restart or re-enable to unlock");
  }
  return ok;
}

export function maskedReviewPhone(phone: string): string {
  return `${phone.slice(0, 2)}******${phone.slice(-2)}`;
}

/** Test hook only. */
export function resetReviewFailuresForTests() {
  failures = 0;
}
