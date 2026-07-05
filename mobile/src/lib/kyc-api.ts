const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ||
  process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ||
  'https://paisa-mart.com';

type ApiResponse<T> = {
  success: boolean;
  error?: string;
} & T;

function normalizePhone(phoneNumber: string): string {
  return phoneNumber.replace(/\D/g, '').slice(-10);
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as ApiResponse<T>;
  if (!response.ok || body.success === false) {
    throw new Error(body.error || 'KYC request failed');
  }
  return body as T;
}

export async function startDigiLockerKyc(phoneNumber: string) {
  const response = await fetch(`${BACKEND_URL}/api/kyc/digilocker/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber: normalizePhone(phoneNumber) }),
  });

  return parseResponse<{ success: true; sessionId: string; authUrl: string; status: 'pending' }>(response);
}

export async function getDigiLockerKycStatus(sessionId: string) {
  const response = await fetch(`${BACKEND_URL}/api/kyc/digilocker/status/${sessionId}`);
  return parseResponse<{
    success: true;
    sessionId: string;
    status: 'pending' | 'verified' | 'failed';
    kycStatus: 'not_started' | 'submitted' | 'verified' | 'rejected';
    error?: string;
  }>(response);
}
