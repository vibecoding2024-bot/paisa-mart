import type { HomeLoanData } from './home-loan-store';

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  'https://paisa-mart.com';

type HomeLoanLeadPayload = HomeLoanData & { phoneNumber: string };

function normalizePhone(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '').slice(-10);
}

export async function submitHomeLoanLead(payload: HomeLoanLeadPayload) {
  const response = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api/home-loans/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phoneNumber: normalizePhone(payload.phoneNumber),
      fullName: payload.full_name,
      cibil: payload.cibil,
      dateOfBirth: payload.date_of_birth,
      monthlyIncome: payload.monthly_income,
      existingEmi: payload.existing_emi,
      loanAmountRequired: payload.loan_amount_required,
      loanType: payload.loan_type,
      city: payload.city,
      state: payload.state,
      source: 'home-loans-details',
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.success) {
    throw new Error(body.message || 'Could not submit home loan details');
  }
  return body.data;
}
