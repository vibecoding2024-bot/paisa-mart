/** Customer dashboard modules, also used by the admin module directory. */
export const PRODUCT_MODULES = [
  { id: 'credit-cards', label: 'Credit Cards' },
  { id: 'bank-accounts', label: 'Bank Accounts' },
  { id: 'home-loans', label: 'Home Loans' },
  { id: 'personal-loans', label: 'Personal Loans' },
  { id: 'vehicle-loans', label: 'Vehicle Loans' },
  { id: 'business-loans', label: 'Business Loans' },
  { id: 'insta-loans', label: 'Insta Loans' },
  { id: 'health-insurance', label: 'Health Insurance' },
  { id: 'life-insurance', label: 'Life Insurance' },
  { id: 'motor-insurance', label: 'Motor Insurance' },
  { id: 'gold-loans', label: 'Gold Loans' },
  { id: 'real-estate', label: 'Real Estate' },
  { id: 'cash-cards', label: 'Cash on Credit Card' },
  { id: 'recharge-bills', label: 'Recharge & Pay Bills' },
  { id: 'travel-tickets', label: 'Travel & Tickets' },
] as const;

export type ProductModule = typeof PRODUCT_MODULES[number]['id'];

/** Processing milestones only. Customer payout is a separate, disabled finance workflow. */
export const SERVICE_STAGE_LABELS: Record<string, Record<string, string>> = {
  'credit-cards': { new: 'Leads', submitted: 'Logins', approved: 'Credit Card Activation' },
  'bank-accounts': { new: 'Leads', submitted: 'Logins', approved: 'Account Activation' },
  'insta-loans': { new: 'Leads', submitted: 'Logins', disbursed: 'Loan Net Disbursement' },
  'health-insurance': { new: 'Leads', submitted: 'Logins', approved: 'Policy Issued' },
  'motor-insurance': { new: 'Leads', submitted: 'Logins', approved: 'Policy Issued' },
  'life-insurance': { new: 'Leads', submitted: 'Logins', approved: 'Policy Issued' },
};

export const PAYOUT_CALCULATIONS_ENABLED = false;
