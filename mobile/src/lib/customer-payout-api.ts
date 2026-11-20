import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
export type CustomerPayout = { referenceNumber: string; productType: string; customerAmount: string; currency: string };
export async function fetchCustomerPayouts(): Promise<CustomerPayout[]> {
  const token = Platform.OS === 'web' ? await AsyncStorage.getItem('paisa_mart_auth_token') : await SecureStore.getItemAsync('paisa_mart_auth_token');
  if (!token) throw new Error('Please sign in to view your payout details');
  const base = (process.env.EXPO_PUBLIC_API_URL || 'https://paisa-mart.com').replace(/\/$/, '');
  const response = await fetch(base + '/api/customer-payouts', { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store' });
  const body = await response.json();
  if (!response.ok || !body.success || !Array.isArray(body.data)) throw new Error(body.message || 'Payout details are unavailable');
  return body.data;
}
