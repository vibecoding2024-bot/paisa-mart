import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID, digestStringAsync, CryptoDigestAlgorithm } from 'expo-crypto';
import { submitServiceApplication, ServiceSubmissionError, type ServiceProduct } from './service-application-api';

const active = new Set<string>();
/** Persist only a fingerprint/key, never a duplicate local health/contact payload. */
export async function submitDurableApplication<T extends { id: string }>(product: string, input: object, send: (key: string) => Promise<T>): Promise<T> {
  if (active.has(product)) throw new Error('A submission is already in progress.');
  active.add(product);
  const storageKey = `service-pending:${product}`;
  try {
    const fingerprint = await digestStringAsync(CryptoDigestAlgorithm.SHA256, JSON.stringify(input));
    const pending = JSON.parse(await AsyncStorage.getItem(storageKey) || 'null');
    if (pending && !pending.confirmed && pending.fingerprint !== fingerprint)
      throw new Error('An earlier submission is awaiting confirmation. Retry with the original details or contact support before starting another application.');
    const key = pending?.fingerprint === fingerprint ? pending.key : randomUUID();
    await AsyncStorage.setItem(storageKey, JSON.stringify({ key, fingerprint }));
    try {
      const saved = await send(key);
      await AsyncStorage.setItem(`service-receipt:${product}:${saved.id}`, key);
      await AsyncStorage.setItem(storageKey, JSON.stringify({ key, fingerprint, confirmed: true }));
      return saved;
    } catch (error) {
      // Validation rejects before any write. Other errors may hide a completed save.
      if (error instanceof ServiceSubmissionError && error.status === 400) await AsyncStorage.removeItem(storageKey);
      throw error;
    }
  } finally { active.delete(product); }
}

export function submitDurableService(product: ServiceProduct, input: Record<string, unknown>) {
  return submitDurableApplication(product, input, key => submitServiceApplication(product, input, key));
}
