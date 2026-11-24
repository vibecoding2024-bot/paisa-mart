import { expect, test } from 'bun:test';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { CUSTOMER_PRIVATE_QUERY } from '../mobile/src/lib/customer-private-query';
// Resolve React Query exactly as the app does (from the mobile workspace).
const { QueryClient, QueryObserver } = createRequire(new URL('../mobile/package.json', import.meta.url))('@tanstack/react-query');

const tick = () => new Promise(resolve => setTimeout(resolve, 20));
// Customer A opens the list, the screen unmounts (logout), then customer B opens the same screen.
async function nextCustomerSees(options: object) {
  const client = new QueryClient();
  const a = new QueryObserver(client, { queryKey: ['my-applications'], queryFn: async () => ['HL-customer-A'], ...options });
  const unsubscribe = a.subscribe(() => {});
  await tick();
  expect(a.getCurrentResult().data).toEqual(['HL-customer-A']);
  unsubscribe();
  await tick();
  const b = new QueryObserver(client, { queryKey: ['my-applications'], queryFn: () => new Promise(() => {}), ...options });
  return b.getOptimisticResult(b.options).data;
}

test("a later customer never renders the previous customer's cached applications", async () => {
  expect(await nextCustomerSees(CUSTOMER_PRIVATE_QUERY)).toBeUndefined();
  // Control: the previous options (default cache time) rendered the previous account's list.
  expect(await nextCustomerSees({ staleTime: 0, refetchOnMount: 'always', retry: false })).toEqual(['HL-customer-A']);
});

test('every customer application/status list screen uses the private query options', () => {
  for (const screen of ['my-applications.tsx', 'home-loan-applications.tsx', 'customer-payouts.tsx']) {
    const source = readFileSync(new URL('../mobile/src/app/' + screen, import.meta.url), 'utf8');
    expect(source.includes('...CUSTOMER_PRIVATE_QUERY') || source.includes('gcTime: 0')).toBe(true);
  }
});
