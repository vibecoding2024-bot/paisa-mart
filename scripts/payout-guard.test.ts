import { expect, mock, test } from 'bun:test';
mock.module('@react-native-async-storage/async-storage', () => ({
  default: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}));
const { calculatePotentialCommission, useIncentiveStore } = await import('../mobile/src/lib/incentive-store');
const { PRODUCT_MODULES } = await import('../mobile/src/lib/product-catalog');

test('unconfirmed rules never calculate a payout for any customer module', () => {
  for (const product of PRODUCT_MODULES) {
    expect(calculatePotentialCommission(product.id, 100000)).toBe('Awaiting confirmation');
  }
});

test('payout and incentive mutations stay disabled even when called directly', async () => {
  await useIncentiveStore.persist.rehydrate();
  const before = useIncentiveStore.getState();
  const incentive = before.incentives[0]!;
  const payout = before.payouts[0]!;
  before.approveIncentive(incentive.id, 'Test reviewer');
  before.markIncentivePaid(incentive.id, 'Test reviewer');
  before.updatePayoutStatus(payout.id, 'completed');
  expect(before.initiatePayout('test', 'Test', 1500, 'bank-test')).toBe(false);
  expect(useIncentiveStore.getState().incentives).toEqual(before.incentives);
  expect(useIncentiveStore.getState().payouts).toEqual(before.payouts);
  expect(useIncentiveStore.getState().auditLogs).toEqual(before.auditLogs);
});
