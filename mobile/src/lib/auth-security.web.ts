// Web version of auth-security - uses localStorage instead of native APIs

const MPIN_HASH_KEY = 'auth.mpinHash';
const MPIN_SALT_KEY = 'auth.mpinSalt';
const BIOMETRIC_ENABLED_KEY = 'auth.biometricEnabled';

export type AuthSecurityConfig = {
  hasMpin: boolean;
  biometricEnabled: boolean;
  biometricAvailable: boolean;
};

const isValidMpin = (mpin: string) => /^\d{4}$/.test(mpin);

const hashMpin = async (mpin: string, salt: string): Promise<string> => {
  const combined = `${salt}:${mpin}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(combined);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const getAuthSecurityConfig = async (): Promise<AuthSecurityConfig> => {
  try {
    const mpinHash = localStorage.getItem(MPIN_HASH_KEY);
    const biometricEnabledValue = localStorage.getItem(BIOMETRIC_ENABLED_KEY);

    return {
      hasMpin: Boolean(mpinHash),
      biometricEnabled: biometricEnabledValue === 'true',
      biometricAvailable: false, // Web doesn't support biometric
    };
  } catch {
    return {
      hasMpin: false,
      biometricEnabled: false,
      biometricAvailable: false,
    };
  }
};

export const saveMpin = async (mpin: string, enableBiometric: boolean): Promise<void> => {
  if (!isValidMpin(mpin)) {
    throw new Error('MPIN must be 4 digits');
  }

  try {
    const salt = crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9);
    const hash = await hashMpin(mpin, salt);
    localStorage.setItem(MPIN_SALT_KEY, salt);
    localStorage.setItem(MPIN_HASH_KEY, hash);
    localStorage.setItem(BIOMETRIC_ENABLED_KEY, enableBiometric ? 'true' : 'false');
  } catch (e) {
    throw new Error('Failed to save MPIN');
  }
};

export const verifyMpin = async (mpin: string): Promise<boolean> => {
  if (!isValidMpin(mpin)) return false;

  try {
    const salt = localStorage.getItem(MPIN_SALT_KEY);
    const storedHash = localStorage.getItem(MPIN_HASH_KEY);

    if (!salt || !storedHash) return false;
    return (await hashMpin(mpin, salt)) === storedHash;
  } catch {
    return false;
  }
};

export const authenticateWithBiometric = async (): Promise<boolean> => {
  // Biometric auth not available on web
  return false;
};
