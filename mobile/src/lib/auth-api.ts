import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { API_BASE, API_CONFIGURED } from './api-base';

// Web without any configured URL keeps same-origin requests (served from the API host).
const API_URL = API_CONFIGURED || Platform.OS !== 'web' ? API_BASE : '';
export type OtpChannel = 'mobile' | 'web';

async function request<T>(path: string, body: Record<string, string | undefined>): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Something went wrong. Please try again.');
  return result as T;
}

export function sendOtp(phone: string, channel: OtpChannel = Platform.OS === 'web' ? 'web' : 'mobile') {
  return request<{ success: true; reqId?: string }>('/api/auth/send-otp', { phone, channel });
}

export function verifyOtp(
  phone: string,
  otp: string,
  channel: OtpChannel = Platform.OS === 'web' ? 'web' : 'mobile',
  reqId?: string
) {
  return request<{ success: true; token: string }>('/api/auth/verify-otp', { phone, otp, channel, reqId });
}

/** Server requires the phone and issues a token only if MSG91 verified that same number. */
export function verifyOtpAccessToken(
  accessToken: string,
  phone: string,
  channel: OtpChannel = Platform.OS === 'web' ? 'web' : 'mobile'
) {
  return request<{ success: true; token: string; phone: string }>('/api/auth/verify-otp-token', { accessToken, channel, phone });
}

/** The OTP-verified customer token, or null when signed out. */
export async function getAuthToken(): Promise<string | null> {
  return Platform.OS === 'web'
    ? AsyncStorage.getItem('paisa_mart_auth_token')
    : SecureStore.getItemAsync('paisa_mart_auth_token');
}

/** Authorization header for customer-owned data (profile, KYC). */
export async function customerAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function saveAuthToken(token: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem('paisa_mart_auth_token', token);
  } else {
    await SecureStore.setItemAsync('paisa_mart_auth_token', token);
  }
}

export async function clearAuthToken() {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem('paisa_mart_auth_token');
  } else {
    await SecureStore.deleteItemAsync('paisa_mart_auth_token');
  }
}
