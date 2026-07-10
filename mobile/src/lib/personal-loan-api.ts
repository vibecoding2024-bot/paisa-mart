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
      fullName: payload.full_name,
      mobileNumber: payload.mobile_number,
      cibil: payload.cibil,
      dateOfBirth: payload.date_of_birth,
      city: payload.city,
      state: payload.state,
      companyName: payload.company_name,
      monthlyIncome: payload.monthly_income,
      loanAmountRequired: payload.loan_amount_required,
      existingEmi: payload.existing_emi,
      employmentType: payload.employment_type,
      source: 'personal-loans-details',
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.success) {
    throw new Error(body.message || 'Could not submit personal loan details');
  }

  return body.data;
}
