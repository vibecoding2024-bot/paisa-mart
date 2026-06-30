import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const MPIN_HASH_KEY = 'auth.mpinHash';
const MPIN_SALT_KEY = 'auth.mpinSalt';
const BIOMETRIC_ENABLED_KEY = 'auth.biometricEnabled';

export type AuthSecurityConfig = {
  hasMpin: boolean;
  biometricEnabled: boolean;
  biometricAvailable: boolean;
};

const isValidMpin = (mpin: string) => /^\d{4}$/.test(mpin);

const hashMpin = async (mpin: string, salt: string) => {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${mpin}`
  );
};

export const getAuthSecurityConfig = async (): Promise<AuthSecurityConfig> => {
  const [mpinHash, biometricEnabledValue, hasHardware, isEnrolled] = await Promise.all([
    SecureStore.getItemAsync(MPIN_HASH_KEY),
    SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY),
    LocalAuthentication.hasHardwareAsync().catch(() => false),
    LocalAuthentication.isEnrolledAsync().catch(() => false),
  ]);

  return {
    hasMpin: Boolean(mpinHash),
    biometricEnabled: biometricEnabledValue === 'true',
    biometricAvailable: Boolean(hasHardware && isEnrolled),
  };
};

export const saveMpin = async (mpin: string, enableBiometric: boolean) => {
  if (!isValidMpin(mpin)) {
    throw new Error('MPIN must be 4 digits');
  }

  const salt = Crypto.randomUUID();
  const hash = await hashMpin(mpin, salt);
  await SecureStore.setItemAsync(MPIN_SALT_KEY, salt);
  await SecureStore.setItemAsync(MPIN_HASH_KEY, hash);
  await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, enableBiometric ? 'true' : 'false');
};

export const verifyMpin = async (mpin: string) => {
  if (!isValidMpin(mpin)) return false;

  const [salt, storedHash] = await Promise.all([
    SecureStore.getItemAsync(MPIN_SALT_KEY),
    SecureStore.getItemAsync(MPIN_HASH_KEY),
  ]);

  if (!salt || !storedHash) return false;
  return (await hashMpin(mpin, salt)) === storedHash;
};

export const authenticateWithBiometric = async () => {
  const config = await getAuthSecurityConfig();
  if (!config.hasMpin || !config.biometricEnabled || !config.biometricAvailable) {
    return false;
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock Paisa Mart',
    cancelLabel: 'Use MPIN',
    disableDeviceFallback: false,
  });

  return result.success;
};
