export type ServiceProduct = 'credit-cards' | 'bank-accounts' | 'insta-loans' | 'health-insurance' | 'motor-insurance';
export type SavedServiceReceipt = { id: string; referenceNumber: string; createdAt: string };
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || process.env.EXPO_PUBLIC_API_URL || 'https://paisa-mart.com';
async function receipt(response: Response): Promise<SavedServiceReceipt> {
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success !== true || typeof body.data?.id !== 'string' || !body.data.id.trim()
    || typeof body.data?.referenceNumber !== 'string' || !body.data.referenceNumber.trim()
    || typeof body.data?.createdAt !== 'string' || !Number.isFinite(Date.parse(body.data.createdAt)))
    throw new Error(body?.message || 'Unable to confirm a saved application. Please retry.');
  return body.data;
}
export async function submitServiceApplication(product: ServiceProduct, input: Record<string, unknown>, key: string) {
  return receipt(await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api/services/${product}/applications`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key }, body: JSON.stringify(input),
  }));
}
export async function verifyServiceReceipt(product: ServiceProduct, id: string) {
  return receipt(await fetch(`${BACKEND_URL.replace(/\/$/, '')}/api/services/${product}/receipts/${encodeURIComponent(id)}`));
}
