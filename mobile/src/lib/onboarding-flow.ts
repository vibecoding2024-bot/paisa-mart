import type { KYCStatus } from './incentive-store';
import type { UserProfile } from './user-profile-store';

export type OnboardingRoute = '/basic-info' | '/kyc' | '/(tabs)';

const KYC_STATUSES: KYCStatus[] = ['not_started', 'submitted', 'verified', 'rejected'];

export function normalizeKycStatus(status?: string | null): KYCStatus {
  return KYC_STATUSES.includes(status as KYCStatus) ? (status as KYCStatus) : 'not_started';
}

export function isProfileComplete(profile?: Partial<UserProfile> | null): profile is UserProfile {
  if (!profile) return false;

  return Boolean(
    profile.name?.trim() &&
      /^\d{10}$/.test(profile.phoneNumber || '') &&
      profile.email?.trim() &&
      profile.occupation?.trim() &&
      profile.qualification?.trim() &&
      profile.annualIncome?.trim() &&
      /^\d{6}$/.test(profile.pincode || '') &&
      profile.dateOfBirth?.day &&
      profile.dateOfBirth?.month &&
      profile.dateOfBirth?.year
  );
}

export function getPostAuthRoute(profile?: Partial<UserProfile> | null, kycStatus?: string | null): OnboardingRoute {
  if (!isProfileComplete(profile)) return '/basic-info';
  return normalizeKycStatus(kycStatus) === 'verified' ? '/(tabs)' : '/kyc';
}
