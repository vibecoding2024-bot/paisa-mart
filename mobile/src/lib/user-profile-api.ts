import type { UserProfile } from './user-profile-store';

const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ||
  'https://paisa-mart.com';

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

function normalizePhone(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '').slice(-10);
}

export async function fetchUserProfile(phoneNumber: string): Promise<(UserProfile & { kycStatus?: string }) | null> {
  const phone = normalizePhone(phoneNumber);
  if (!phone) return null;

  const response = await fetch(`${BACKEND_URL}/api/users/profile/${phone}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Profile lookup failed: ${response.status}`);

  const body = (await response.json()) as ApiResponse<UserProfile & { kycStatus?: string }>;
  return body.success && body.data ? body.data : null;
}

export async function saveUserProfile(profile: UserProfile): Promise<UserProfile & { kycStatus?: string }> {
  const response = await fetch(`${BACKEND_URL}/api/users/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...profile,
      phoneNumber: normalizePhone(profile.phoneNumber),
    }),
  });

  if (!response.ok) {
    throw new Error(`Profile save failed: ${response.status}`);
  }

  const body = (await response.json()) as ApiResponse<UserProfile & { kycStatus?: string }>;
  if (!body.success || !body.data) {
    throw new Error(body.message || 'Profile save failed');
  }

  return body.data;
}

export async function saveKycStatus(phoneNumber: string, status: 'not_started' | 'submitted' | 'verified' | 'rejected') {
  const phone = normalizePhone(phoneNumber);
  if (!phone) return null;

  const response = await fetch(`${BACKEND_URL}/api/users/profile/${phone}/kyc`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) return null;
  const body = (await response.json()) as ApiResponse<UserProfile & { kycStatus?: string }>;
  return body.success ? body.data ?? null : null;
}
