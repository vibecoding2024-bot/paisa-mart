import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
const API_URL = configuredUrl || (Platform.OS === 'web' ? '' : 'https://paisa-mart.com');

async function request<T>(path: string, body: Record<string, string>): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Something went wrong. Please try again.');
  return result as T;
}

export function sendOtp(phone: string) {
  return request<{ success: true }>('/api/auth/send-otp', { phone });
}

export function verifyOtp(phone: string, otp: string) {
  return request<{ success: true; token: string }>('/api/auth/verify-otp', { phone, otp });
}

export async function saveAuthToken(token: string) {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem('paisa_mart_auth_token', token);
  } else {
    await SecureStore.setItemAsync('paisa_mart_auth_token', token);
  }
}
