import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HomeLoanStage } from './home-loan-stages';
const base = (process.env.EXPO_PUBLIC_API_URL || 'https://paisa-mart.com').replace(/\/$/, '');
export async function adminLogin(email: string, password: string) {
  const response = await fetch(base + '/api/admin/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
  const body = await response.json();
  if (!response.ok || !body.success) return null;
  await AsyncStorage.setItem('paisa_mart_admin_api_token', body.token);
  return body.user;
}
export type HomeLoanLead = { id: string; referenceNumber: string; fullName?: string; phoneNumber: string; loanAmountRequired: string; loanType: string; city?: string; state?: string; createdAt: string; monthlyIncome: string; existingEmi: string; cibil?: string; dateOfBirth?: string; stage: HomeLoanStage; version: number; history: { stage: HomeLoanStage; loanAmountRequired: string; note: string; actor: string; at: string }[] };
export type PipelineSummary = { stage: HomeLoanStage; count: number; totalLoanAmount: string };
export async function fetchAdminHomeLoans(search = '', page = 1, stage?: HomeLoanStage): Promise<{ data: HomeLoanLead[]; total: number; totalPages: number; summary: PipelineSummary[] }> {
  const token = await AsyncStorage.getItem('paisa_mart_admin_api_token');
  if (!token) throw new Error('Please sign out and sign in again.');
  const response = await fetch(base + '/api/admin/home-loans?search=' + encodeURIComponent(search) + '&page=' + page + (stage ? '&stage=' + stage : ''), { headers: { Authorization: 'Bearer ' + token } });
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error(body.message || 'Could not load leads');
  return body;
}

export async function updateHomeLoan(id: string, changes: { stage: HomeLoanStage; version: number; loanAmountRequired: string; note: string }) {
  const token = await AsyncStorage.getItem('paisa_mart_admin_api_token');
  if (!token) throw new Error('Please sign out and sign in again.');
  const response = await fetch(base + '/api/admin/home-loans/' + encodeURIComponent(id), { method: 'PATCH', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(changes) });
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error(body.message || 'Could not update lead');
}
