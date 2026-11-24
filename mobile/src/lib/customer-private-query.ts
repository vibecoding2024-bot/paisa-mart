// Customer-owned lists (applications, statuses) must not outlive the screen that shows them.
// With the default cache time, a later sign-in on the same device (customer A logs out, customer B
// signs in) briefly rendered A's cached list on B's screen while B's own list was loading.
// gcTime 0 drops the data as soon as the screen unmounts, matching the customer payouts screen.
export const CUSTOMER_PRIVATE_QUERY = {
  staleTime: 0,
  gcTime: 0,
  refetchOnMount: 'always',
  retry: false,
} as const;
