/**
 * The ONLY place the app decides which backend it talks to. Every API client imports API_BASE from here
 * (enforced by scripts/check-api-isolation.mjs).
 *
 * Production release scripts set EXPO_PUBLIC_API_URL and EXPO_PUBLIC_BACKEND_URL to the production API.
 * Test builds set EXPO_PUBLIC_TEST_ENV=1 plus a test URL; a test build that would resolve to production
 * refuses to start, so automated or manual testing can never write to production by fallback.
 */
export const PRODUCTION_API_ORIGIN = 'https://paisa-mart.com';

// Each variable is referenced literally so Expo can inline it at build time.
const configured =
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ||
  '';

export const API_CONFIGURED = configured !== '';

export const IS_TEST_BUILD = process.env.EXPO_PUBLIC_TEST_ENV === '1';

export function resolveApiBase(value: string, testBuild: boolean): string {
  const base = (value || PRODUCTION_API_ORIGIN).replace(/\/+$/, '');
  if (testBuild) {
    let host = '';
    try {
      host = new URL(base).hostname.toLowerCase();
    } catch {
      throw new Error('Test build has an invalid API URL; refusing to start.');
    }
    if (host === 'paisa-mart.com' || host.endsWith('.paisa-mart.com')) {
      throw new Error('Test build resolved to the production API; refusing to start.');
    }
  }
  return base;
}

export const API_BASE = resolveApiBase(configured, IS_TEST_BUILD);
