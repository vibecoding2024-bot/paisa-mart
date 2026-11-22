import type { Context } from "hono";
import { getTxn } from "./txn-store";

/** The acknowledgement VimoPay expects from a callback receiver (spec p.19). */
export const GATEWAY_ACK = { successStatus: true, message: "Success", responseCode: "000" } as const;

export function isCallbackPath(pathname: string): boolean {
  return pathname.toLowerCase().includes("callback");
}

/**
 * A-03. Payment-gateway callbacks are unauthenticated: anyone can call these URLs with any body, the payment
 * client has no transaction-status API, and the AES-GCM helper uses a fixed IV, so neither a signature nor an
 * encrypted body can prove a callback came from VimoPay. A callback therefore NEVER creates a transaction or
 * changes its status, amount, ID or payload. It is only acknowledged (so the gateway does not retry or report a
 * 404) and logged without its body (it can carry customer name and phone). Transactions stay at the status
 * recorded by our own server-to-server create call until a verified status source is added.
 */
export async function acknowledgeGatewayCallback(c: Context) {
  const url = new URL(c.req.url);
  let body: Record<string, unknown> = {};
  if (c.req.method !== "GET" && c.req.method !== "HEAD") {
    const parsed = await c.req.json().catch(() => null);
    if (parsed && typeof parsed === "object") body = parsed as Record<string, unknown>;
  }
  const ref = String(body.merchantRefId ?? url.searchParams.get("merchantRefId") ?? "");
  console.warn("[VIMOPAY CALLBACK] received and acknowledged; not applied (unauthenticated)", {
    path: url.pathname,
    method: c.req.method,
    knownTransaction: ref !== "" && !!getTxn(ref),
  });
  return c.json(GATEWAY_ACK);
}
