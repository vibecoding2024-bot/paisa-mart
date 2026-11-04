import { useRef, useState } from 'react';
import { type SavedServiceReceipt, type ServiceProduct } from './service-application-api';
import { submitDurableService } from './service-submission';

/** Retain the key after a network failure: a retry cannot create a second row. */
export function useServiceSubmission(product: ServiceProduct) {
  const inFlight = useRef(false);
  const completed = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<SavedServiceReceipt | null>(null);
  const submit = async (input: Record<string, unknown>) => {
    if (inFlight.current || completed.current) return null;
    inFlight.current = true;
    setBusy(true); setError('');
    try {
      const result = await submitDurableService(product, input);
      completed.current = true;
      setSaved(result);
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your application. Please retry.');
      return null;
    } finally { inFlight.current = false; setBusy(false); }
  };
  return { submit, busy, error, saved };
}
