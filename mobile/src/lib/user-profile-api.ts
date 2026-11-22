import type { UserProfile } from './user-profile-store';
import { API_BASE } from './api-base';
import { customerAuthHeaders } from './auth-api';

const BACKEND_URL = API_BASE;

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

  const response = await fetch(`${BACKEND_URL}/api/users/profile/${phone}`, { headers: await customerAuthHeaders() });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Profile lookup failed: ${response.status}`);

  const body = (await response.json()) as ApiResponse<UserProfile & { kycStatus?: string }>;
  return body.success && body.data ? body.data : null;
}

export async function saveUserProfile(profile: UserProfile): Promise<UserProfile & { kycStatus?: string }> {
  const response = await fetch(`${BACKEND_URL}/api/users/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await customerAuthHeaders()) },
    body: JSON.stringify({
      ...profile,
      phoneNumber: normalizePhone(profile.phoneNumber),
    }),
  });

  if (response.status === 401) throw new Error('Please sign in again to save your profile.');
  if (response.status === 403) throw new Error('You can only save the profile for your signed-in mobile number.');
  if (!response.ok) {
    throw new Error(`Profile save failed: ${response.status}`);
  }

  const body = (await response.json()) as ApiResponse<UserProfile & { kycStatus?: string }>;
  if (!body.success || !body.data) {
    throw new Error(body.message || 'Profile save failed');
  }

  return body.data;
}
