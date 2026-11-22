import type { PolicyType, PremiumSlab } from './life-insurance-store';
import { submitDurableApplication } from './service-submission';
import { ServiceSubmissionError } from './service-application-api';
import { API_BASE } from './api-base';

const BACKEND_URL = API_BASE;

export async function submitLifeInsuranceLead(input: {
  phoneNumber: string;
  fullName: string;
  selectedLifeInsurer: string;
  policyType: PolicyType;
  premiumSlab: PremiumSlab;
  premiumOtherAmount: string;
}) {
  return submitDurableApplication('life-insurance', input, async key => {
  const response = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api/life-insurance/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify(input),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success !== true || typeof body.data?.id !== 'string' || !body.data.id) {
    throw new ServiceSubmissionError(body?.message || 'Could not submit life insurance details', response.status);
  }
  return body.data as { id: string; createdAt: string };
  });
}
