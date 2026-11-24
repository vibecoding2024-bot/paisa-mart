import { expect, test } from 'bun:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { CUSTOMER_PRIVATE_QUERY, customerQueryKey } from '../mobile/src/lib/customer-private-query';
// Resolve React Query exactly as the app does (from the mobile workspace).
const { QueryClient, QueryObserver } = createRequire(new URL('../mobile/package.json', import.meta.url))('@tanstack/react-query');

const tick = (ms = 20) => new Promise(resolve => setTimeout(resolve, ms));
const A = '9000000001', B = '9000000002';

// Customer A opens the list and it loads; the screen unmounts (logout); customer B opens the same screen.
async function afterSettledLogout(options: object, keyFor: (phone: string) => readonly unknown[]) {
  const client = new QueryClient();
  const a = new QueryObserver(client, { queryKey: keyFor(A), queryFn: async () => ['HL-customer-A'], ...options });
  const unsubscribe = a.subscribe(() => {});
  await tick();
  expect(a.getCurrentResult().data).toEqual(['HL-customer-A']);
  unsubscribe();
  await tick();
  const b = new QueryObserver(client, { queryKey: keyFor(B), queryFn: () => new Promise(() => {}), ...options });
  return b.getOptimisticResult(b.options).data;
}

// A's request is still in flight when A logs out; B opens the screen; A's response arrives afterwards.
async function afterInFlightLogout(keyFor: (phone: string) => readonly unknown[]) {
  const client = new QueryClient();
  let releaseA!: (rows: string[]) => void;
  const a = new QueryObserver(client, { queryKey: keyFor(A), queryFn: () => new Promise<string[]>(r => { releaseA = r; }), ...CUSTOMER_PRIVATE_QUERY });
  const unsubscribe = a.subscribe(() => {});
  await tick();
  unsubscribe(); // logout while A's request is pending
  await tick();
  const seen: unknown[] = [];
  const b = new QueryObserver(client, { queryKey: keyFor(B), queryFn: () => new Promise(r => setTimeout(() => r(['BL-customer-B']), 60)), ...CUSTOMER_PRIVATE_QUERY });
  const stop = b.subscribe((result: any) => seen.push(result.data));
  seen.push(b.getCurrentResult().data);
  releaseA(['HL-customer-A']); // stale response arrives during B's session
  await tick(150);
  stop();
  return seen.filter(Boolean);
}

test("a later customer never renders the previous customer's cached applications", async () => {
  expect(await afterSettledLogout(CUSTOMER_PRIVATE_QUERY, p => customerQueryKey('my-applications', p))).toBeUndefined();
  // Control: the original options and shared key rendered the previous account's list.
  expect(await afterSettledLogout({ staleTime: 0, refetchOnMount: 'always', retry: false }, () => ['my-applications'])).toEqual(['HL-customer-A']);
});

test("a request still in flight at logout never resolves into the next customer's screen", async () => {
  expect(await afterInFlightLogout(p => customerQueryKey('my-applications', p))).toEqual([['BL-customer-B']]);
  // Control: with a shared key (gcTime 0 only), B joins A's pending request and renders A's rows.
  expect((await afterInFlightLogout(() => ['my-applications'])).some(d => JSON.stringify(d).includes('customer-A'))).toBe(true);
});

test('customer application/status list screens use identity-scoped private queries', () => {
  for (const screen of ['my-applications.tsx', 'home-loan-applications.tsx']) {
    const source = readFileSync(new URL('../mobile/src/app/' + screen, import.meta.url), 'utf8');
    expect(source).toContain('...CUSTOMER_PRIVATE_QUERY');
    expect(source).toContain('customerQueryKey(');
    expect(source).toContain('enabled: !!phone');
  }
});
