import { expect, mock, test } from 'bun:test';
mock.module('@react-native-async-storage/async-storage', () => ({
  default: { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} },
}));
const { calculatePotentialCommission, useIncentiveStore } = await import('../mobile/src/lib/incentive-store');
const { PRODUCT_MODULES } = await import('../mobile/src/lib/product-catalog');

test('the store starts with no generated incentives or payouts (A-07)', () => {
  expect(useIncentiveStore.getState().incentives).toEqual([]);
  expect(useIncentiveStore.getState().payouts).toEqual([]);
  expect(useIncentiveStore.getState().incomingOutgoing).toEqual([]);
});

test('unconfirmed rules never calculate a payout for any customer module', () => {
  for (const product of PRODUCT_MODULES) {
    expect(calculatePotentialCommission(product.id, 100000)).toBe('Awaiting confirmation');
  }
});

test('payout and incentive mutations stay disabled even when called directly', async () => {
  await useIncentiveStore.persist.rehydrate();
  // The store no longer generates sample data, so the test seeds one explicit synthetic record of each kind.
  useIncentiveStore.setState({
    incentives: [{ id: 'INC-TEST', userName: 'Synthetic', oderId: 'ORD-TEST', productType: 'credit-card', bankName: 'Test Bank', amount: 1500, status: 'pending', date: new Date(0).toISOString() } as any],
    payouts: [{ id: 'PAY-TEST', userId: 'u', userName: 'Synthetic', amount: 1500, bankAccountId: 'b', bankName: 'Test Bank', accountNumber: 'XXXX0000', status: 'initiated', initiatedAt: new Date(0).toISOString() } as any],
  });
  const before = useIncentiveStore.getState();
  expect(before.incentives).toHaveLength(1);
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
