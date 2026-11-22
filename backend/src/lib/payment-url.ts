/**
 * A-42: the gateway's paymentUrl is the only navigation target the checkout page offers. It is accepted only if it
 * is an https URL without credentials on an allowlisted gateway host: vimopay.in (and subdomains), the host of
 * VIMOPAY_BASE_URL, and any hosts in VIMOPAY_PAYMENT_URL_HOSTS (comma-separated, for a gateway domain change).
 */
const DEFAULT_PAYMENT_HOSTS = ["vimopay.in"];

export function allowedPaymentHosts(): string[] {
  const hosts = new Set(DEFAULT_PAYMENT_HOSTS);
  try {
    hosts.add(new URL(process.env.VIMOPAY_BASE_URL ?? "https://gateway.vimopay.in").hostname.toLowerCase());
  } catch {}
  for (const host of (process.env.VIMOPAY_PAYMENT_URL_HOSTS ?? "").split(",")) {
    if (host.trim()) hosts.add(host.trim().toLowerCase());
  }
  return [...hosts];
}

export function safePaymentUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  return allowedPaymentHosts().some((allowed) => host === allowed || host.endsWith("." + allowed)) ? url.href : null;
}

/** Merchant references are shown on the checkout page and used in URLs: plain identifiers only. */
export const MERCHANT_REF_PATTERN = /^[A-Za-z0-9_-]{1,40}$/;
