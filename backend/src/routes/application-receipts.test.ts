import { afterEach, expect, test } from 'bun:test';
import { submitBusinessLoanLead } from '../../../mobile/src/lib/business-loan-api';
import { submitLifeInsuranceLead } from '../../../mobile/src/lib/life-insurance-api';
import { submitVehicleLoanLead } from '../../../mobile/src/lib/vehicle-loan-api';
import { PRODUCT_MODULES, PAYOUT_CALCULATIONS_ENABLED } from '../../../mobile/src/lib/product-catalog';
import { leadStageLabel, leadStageOptions } from '../../../mobile/src/lib/loan-product-stages';

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });
const submissions = [
  () => submitBusinessLoanLead({ phoneNumber: '9876543210' } as any),
  () => submitLifeInsuranceLead({ phoneNumber: '9876543210' } as any),
  () => submitVehicleLoanLead({ phoneNumber: '9876543210', vehicle_condition: 'New Vehicle' } as any),
];

test('all form clients require a saved reference and reject HTTP, malformed and network failures', async () => {
  for (const submit of submissions) {
    for (const body of [{ success: false }, { success: true }, { success: true, data: { id: '' } }, { success: true, data: { id: 123 } }]) {
      globalThis.fetch = (async () => Response.json(body)) as any;
      await expect(submit()).rejects.toThrow();
    }
    globalThis.fetch = (async () => Response.json({ success: true, data: { id: 'saved-123' } }, { status: 500 })) as any;
    await expect(submit()).rejects.toThrow();
    globalThis.fetch = (async () => new Response('not json')) as any;
    await expect(submit()).rejects.toThrow();
    globalThis.fetch = (async () => { throw new Error('offline'); }) as any;
    await expect(submit()).rejects.toThrow('offline');
    globalThis.fetch = (async () => Response.json({ success: true, data: { id: 'saved-123' } })) as any;
    expect((await submit()).id).toBe('saved-123');
  }
});

test('the shared directory has 15 unique customer modules and no enabled payout calculations', () => {
  expect(PRODUCT_MODULES).toHaveLength(15);
  expect(new Set(PRODUCT_MODULES.map(module => module.id)).size).toBe(15);
  expect(PAYOUT_CALCULATIONS_ENABLED).toBe(false);
});

test('service workflows expose their confirmed milestones independently of payout', () => {
  for (const product of ['life-insurance', 'health-insurance', 'motor-insurance'] as const) {
    expect(leadStageOptions(product).map(stage => leadStageLabel(product, stage))).toEqual(['Leads', 'Logins', 'Policy Issued']);
  }
  expect(leadStageLabel('credit-cards', 'approved')).toBe('Credit Card Activation');
  expect(leadStageLabel('bank-accounts', 'approved')).toBe('Account Activation');
  expect(leadStageLabel('insta-loans', 'disbursed')).toBe('Loan Net Disbursement');
});
