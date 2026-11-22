import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { LeadStage, ProductCategory } from './admin-store';
import { API_BASE } from './api-base';
export type CustomerApplication = { referenceNumber: string; productType: ProductCategory; stage: LeadStage; createdAt: string; updatedAt: string; details: Record<string, string> };
export async function fetchCustomerApplications(): Promise<CustomerApplication[]> {
  const token = Platform.OS === 'web' ? await AsyncStorage.getItem('paisa_mart_auth_token') : await SecureStore.getItemAsync('paisa_mart_auth_token');
  if (!token) throw new Error('Please sign in to view your applications');
  const base = API_BASE;
  let response: Response;
  try {
    response = await fetch(base + '/api/customer-applications', { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store' });
  } catch {
    throw new Error('Unable to reach Paisa Mart. Check your connection and refresh.');
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.success || !Array.isArray(body.data)) throw new Error(body.message || 'Your applications are unavailable');
  return body.data;
}
