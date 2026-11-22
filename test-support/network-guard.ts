/**
 * Preloaded for every `bun test` run (see bunfig.toml at the repo root and in backend/).
 * Automated tests must never reach production or any external service by default:
 *  - client base URLs point at a closed loopback port, so a module that forgets to mock fetch cannot
 *    fall back to the production API;
 *  - the real fetch refuses any non-loopback host unless ALLOW_TEST_NETWORK=1 is set explicitly.
 * Tests that stub globalThis.fetch replace this guard for their own scope and restore it afterwards.
 */
const LOOPBACK = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
const DEAD_LOOPBACK = "http://127.0.0.1:9";

for (const key of ["EXPO_PUBLIC_API_URL", "EXPO_PUBLIC_BACKEND_URL", "EXPO_PUBLIC_VIBECODE_BACKEND_URL"]) {
  const value = process.env[key];
  if (!value || /paisa-mart\.com/i.test(value)) process.env[key] = DEAD_LOOPBACK;
}
process.env.EXPO_PUBLIC_TEST_ENV = "1";

const realFetch = globalThis.fetch;
const guarded = (async (input: any, init?: any) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, DEAD_LOOPBACK);
  if (!LOOPBACK.has(url.hostname) && process.env.ALLOW_TEST_NETWORK !== "1") {
    throw new Error(`Test network guard: blocked request to ${url.protocol}//${url.hostname} (set ALLOW_TEST_NETWORK=1 only for an isolated, intentional test)`);
  }
  return realFetch(input, init);
}) as typeof fetch;
globalThis.fetch = guarded;
