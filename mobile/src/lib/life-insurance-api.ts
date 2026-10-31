import type { PolicyType, PremiumSlab } from './life-insurance-store';

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  'https://paisa-mart.com';

export async function submitLifeInsuranceLead(input: {
  phoneNumber: string;
  fullName: string;
  selectedLifeInsurer: string;
  policyType: PolicyType;
  premiumSlab: PremiumSlab;
  premiumOtherAmount: string;
}) {
  const response = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api/life-insurance/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success !== true || typeof body.data?.id !== 'string') {
    throw new Error(body?.message || 'Could not submit life insurance details');
  }
  return body.data as { id: string; createdAt: string };
}
