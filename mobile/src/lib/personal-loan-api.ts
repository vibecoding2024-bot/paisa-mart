import type { PersonalLoanData } from './personal-loan-store';

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  'https://paisa-mart.com';

type PersonalLoanLeadPayload = PersonalLoanData & {
  phoneNumber: string;
};

function normalizePhone(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '').slice(-10);
}

export async function submitPersonalLoanLead(payload: PersonalLoanLeadPayload) {
  const response = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api/personal-loans/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phoneNumber: normalizePhone(payload.phoneNumber),
      employmentType: payload.employment_type,
      creditScoreRange: payload.credit_score_range,
      monthlyIncome: payload.monthly_income,
      totalMonthlyEmi: payload.total_monthly_emi,
      totalOutstandingBalance: payload.total_outstanding_balance,
      source: 'personal-loans-details',
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.success) {
    throw new Error(body.message || 'Could not submit personal loan details');
  }

  return body.data;
}
