import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import type { PersonalLoanData } from './personal-loan-store';
const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || 'https://paisa-mart.com';
const URL = `${BACKEND_URL.replace(/\/$/, '')}/api/personal-loans/applications`;
const PENDING_KEY = 'personal-loan-pending-request';
export type PersonalLoanReceipt = { id: string; referenceNumber: string; status: string; createdAt: string; requestKey: string };
function validReceipt(data: any): boolean {
  return typeof data?.id === 'string' && /^[0-9a-f-]{36}$/i.test(data.id) && data.referenceNumber === `PL-${data.id}` && typeof data.status === 'string' && Number.isFinite(Date.parse(data.createdAt));
}
export async function submitPersonalLoanLead(payload: PersonalLoanData & { phoneNumber: string }): Promise<PersonalLoanReceipt> {
  const input = {
    phoneNumber: payload.phoneNumber.replace(/\D/g, '').slice(-10), fullName: payload.full_name,
    cibil: payload.cibil, dateOfBirth: payload.date_of_birth, city: payload.city, state: payload.state,
    companyName: payload.company_name, monthlyIncome: payload.monthly_income,
    loanAmountRequired: payload.loan_amount_required, existingEmi: payload.existing_emi, employmentType: payload.employment_type,
  };
  const fingerprint = JSON.stringify(input);
  const pending = JSON.parse(await AsyncStorage.getItem(PENDING_KEY) || 'null');
  if (pending && !pending.confirmed && pending.fingerprint !== fingerprint) throw new Error('An earlier submission is awaiting confirmation. Retry with the original details or contact support before starting another application.');
  const requestKey: string = pending?.fingerprint === fingerprint ? pending.requestKey : randomUUID();
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify({ requestKey, fingerprint }));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(URL, { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...input, requestKey }) });
    const body = await response.json().catch(() => null);
    if (!response.ok || body?.success !== true) {
      if (response.status === 400) await AsyncStorage.removeItem(PENDING_KEY);
      throw new Error(body?.message || 'Could not confirm your application. Retry with the same details.');
    }
    if (!validReceipt(body.data)) throw new Error('Confirmation was not received. Retry with the same details to recover your application reference.');
    // Retain the key for repeat taps/reloads; a confirmed receipt permits a later, different application.
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify({ requestKey, fingerprint, confirmed: true }));
    return { ...body.data, requestKey };
  } catch (error) {
    if (controller.signal.aborted) throw new Error('The connection timed out. Retry with the same details; your application will not be duplicated.');
    throw error;
  } finally { clearTimeout(timeout); }
}
export async function fetchPersonalLoanStatus(receipt: PersonalLoanReceipt): Promise<PersonalLoanReceipt> {
  const response = await fetch(`${URL}/${encodeURIComponent(receipt.id)}`, { headers: { Authorization: `Bearer ${receipt.requestKey}` } });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success !== true || !validReceipt(body.data)) throw new Error(body?.message || 'Could not load application status. Please try again.');
  return { ...body.data, requestKey: receipt.requestKey };
}
