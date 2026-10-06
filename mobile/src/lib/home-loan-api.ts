import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { HomeLoanData } from './home-loan-store';

const BACKEND_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ||
  'https://paisa-mart.com';

type HomeLoanLeadPayload = HomeLoanData & { phoneNumber: string };

function normalizePhone(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '').slice(-10);
}

export async function submitHomeLoanLead(payload: HomeLoanLeadPayload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
  const response = await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api/home-loans/leads`, {
    signal: controller.signal,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phoneNumber: normalizePhone(payload.phoneNumber),
      fullName: payload.full_name,
      cibil: payload.cibil,
      dateOfBirth: payload.date_of_birth,
      monthlyIncome: payload.monthly_income,
      existingEmi: payload.existing_emi,
      loanAmountRequired: payload.loan_amount_required,
      loanType: payload.loan_type,
      city: payload.city,
      state: payload.state,
      source: 'home-loans-details',
    }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.success) {
    throw new Error(body.message || 'Could not submit home loan details');
  }
  return body.data;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('The connection timed out. Your application may have been received. Please contact support before submitting again.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export type CustomerApplication = { referenceNumber: string; stage: import('./home-loan-stages').HomeLoanStage; loanAmountRequired: string; loanType: string; createdAt: string };
export async function fetchCustomerApplications(): Promise<CustomerApplication[]> {
  const token = Platform.OS === 'web'
    ? await AsyncStorage.getItem('paisa_mart_auth_token')
    : await SecureStore.getItemAsync('paisa_mart_auth_token');
  if (!token) throw new Error('Please sign in again to view your applications.');
  const response = await fetch(BACKEND_URL.replace(/\/$/, '') + '/api/home-loans/applications', { headers: { Authorization: 'Bearer ' + token } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.success || !Array.isArray(body.data)) throw new Error(body.message || 'Application status is unavailable. Please contact support.');
  return body.data;
}
