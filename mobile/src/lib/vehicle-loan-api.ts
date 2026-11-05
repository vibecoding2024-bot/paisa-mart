import { submitDurableApplication } from './service-submission';
import { ServiceSubmissionError } from './service-application-api';
export type VehicleLoanSubmission = {
  full_name: string;
  cibil: string;
  occupation: string;
  date_of_birth: string;
  city: string;
  state: string;
  monthly_income: string;
  loan_amount_required: string;
  existing_emi: string;
  vehicle_condition: 'New Vehicle' | 'Used Vehicle';
  vehicle_type: string;
  phoneNumber: string;
};

const BACKEND_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ||
  'https://paisa-mart.com';

export async function submitVehicleLoanLead(payload: VehicleLoanSubmission) {
  const input = {
      phoneNumber: payload.phoneNumber,
      fullName: payload.full_name,
      cibil: payload.cibil,
      occupation: payload.occupation,
      dateOfBirth: payload.date_of_birth,
      city: payload.city,
      state: payload.state,
      monthlyIncome: payload.monthly_income,
      loanAmountRequired: payload.loan_amount_required,
      existingEmi: payload.existing_emi,
      vehicleCondition: payload.vehicle_condition,
      vehicleType: payload.vehicle_type,
      source: 'vehicle-loans-details',
    };
  return submitDurableApplication('vehicle-loans', input, async key => {
  const response = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api/vehicle-loans/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify(input),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success !== true || typeof body.data?.id !== 'string' || !body.data.id) {
    throw new ServiceSubmissionError(body?.message || 'Could not submit vehicle loan details', response.status);
  }
  return body.data as { id: string; createdAt: string };
  });
}
