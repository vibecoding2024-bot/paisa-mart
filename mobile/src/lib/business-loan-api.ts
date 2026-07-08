import type { BusinessLoanData } from './business-loan-store';

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  'https://paisa-mart.com';

type BusinessLoanLeadPayload = BusinessLoanData & {
  phoneNumber: string;
};

function normalizePhone(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '').slice(-10);
}

export async function submitBusinessLoanLead(payload: BusinessLoanLeadPayload) {
  const response = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api/business-loans/leads`, {
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
      monthlyIncome: payload.monthly_income,
      existingEmi: payload.existing_emi,
      businessType: payload.business_type,
      loanAmountRequired: payload.loan_amount_required,
      loanPurpose: payload.loan_purpose,
      loanPurposeOtherText: payload.loan_purpose_other_text,
      source: 'business-loans-details',
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.success) {
    throw new Error(body.message || 'Could not submit business loan details');
  }

  return body.data;
}
