import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { API_BASE } from './api-base';
import { CUSTOMER_PRIVATE_QUERY, customerQueryKey } from './customer-private-query';
import { useUserProfileStore } from './user-profile-store';
export type CustomerPayout = { referenceNumber: string; productType: string; customerAmount: string; currency: string };
export async function fetchCustomerPayouts(): Promise<CustomerPayout[]> {
  const token = Platform.OS === 'web' ? await AsyncStorage.getItem('paisa_mart_auth_token') : await SecureStore.getItemAsync('paisa_mart_auth_token');
  if (!token) throw new Error('Please sign in to view your payout details');
  const base = API_BASE;
  const response = await fetch(base + '/api/customer-payouts', { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store' });
  const body = await response.json();
  if (!response.ok || !body.success || !Array.isArray(body.data)) throw new Error(body.message || 'Payout details are unavailable');
  return body.data;
}
/**
 * Current server response only; stale or failed data is never shown as a figure.
 * Shared by Home, Earnings and "My eligible payouts". The key is scoped to the signed-in customer so a request
 * still in flight when one customer logs out can never resolve into the next customer's screens.
 */
export function useApprovedPayouts() {
  const phone = useUserProfileStore(s => s.profile?.phoneNumber);
  return useQuery({ queryKey: customerQueryKey('my-approved-payouts', phone), queryFn: fetchCustomerPayouts, enabled: !!phone, refetchInterval: 15000, ...CUSTOMER_PRIVATE_QUERY });
}
/** Sums server decimal strings as integer paise (no floating-point drift); formats ₹ with Indian grouping. */
export function formatPayoutTotal(payouts: CustomerPayout[]): string {
  let paise = 0;
  for (const p of payouts) {
    const m = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(p.customerAmount).trim());
    if (m) paise += Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0'));
  }
  const rupees = String(Math.floor(paise / 100));
  const last3 = rupees.slice(-3), rest = rupees.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3 : last3;
  return '₹' + grouped + '.' + String(paise % 100).padStart(2, '0');
}
