// Preloaded before the real backend: any fetch to a non-loopback host is refused and recorded.
import { appendFileSync } from 'node:fs';
const original = globalThis.fetch;
const log = process.env.OUTBOUND_LOG!;
globalThis.fetch = (async (input: any, init?: any) => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
    appendFileSync(log, new Date().toISOString() + ' BLOCKED ' + url.origin + url.pathname + '\n');
    throw new Error('Outbound network blocked in local verification: ' + url.hostname);
  }
  return original(input, init);
}) as typeof fetch;
