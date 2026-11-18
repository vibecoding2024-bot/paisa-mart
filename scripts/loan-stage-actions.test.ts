import { test, expect } from 'bun:test';
import { loanStageActions, leadStageOptions } from '../mobile/src/lib/loan-product-stages';
import { PRODUCT_MODULES } from '../mobile/src/lib/product-catalog';

test('every loan offers manual Payout immediately after Rejected without making it a decision stage', () => {
  for (const product of PRODUCT_MODULES.filter(p => p.id.endsWith('-loans'))) {
    const actions = loanStageActions(product.id);
    expect(actions[actions.indexOf('rejected') + 1]).toBe('payout');
    expect(actions.filter(a => a === 'payout')).toHaveLength(1);
    expect(leadStageOptions(product.id)).not.toContain('payout');
  }
  expect(loanStageActions('bank-accounts')).not.toContain('payout');
});
