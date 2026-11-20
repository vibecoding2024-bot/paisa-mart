import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { LeadStage, ProductCategory } from './admin-store';
export type CustomerApplication = { referenceNumber: string; productType: ProductCategory; stage: LeadStage; createdAt: string; updatedAt: string; details: Record<string, string> };
export async function fetchCustomerApplications(): Promise<CustomerApplication[]> {
  const token = Platform.OS === 'web' ? await AsyncStorage.getItem('paisa_mart_auth_token') : await SecureStore.getItemAsync('paisa_mart_auth_token');
  if (!token) throw new Error('Please sign in to view your applications');
  const base = (process.env.EXPO_PUBLIC_API_URL || 'https://paisa-mart.com').replace(/\/$/, '');
  const response = await fetch(base + '/api/customer-applications', { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.success || !Array.isArray(body.data)) throw new Error(body.message || 'Your applications are unavailable');
  return body.data;
}
