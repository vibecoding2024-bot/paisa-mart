import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fingerprint, LockKeyhole, Shield } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import { authenticateWithBiometric, getAuthSecurityConfig, verifyMpin } from '@/lib/auth-security';

export default function UnlockScreen() {
  const router = useRouter();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const [mpin, setMpin] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [error, setError] = useState('');

  const targetRoute = next || '/(tabs)';

  const unlockWithBiometric = async () => {
    const success = await authenticateWithBiometric();
    if (success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(targetRoute as never);
    }
  };

  useEffect(() => {
    getAuthSecurityConfig().then((config) => {
      setBiometricEnabled(config.biometricEnabled);
      setBiometricAvailable(config.biometricAvailable);
      if (config.biometricEnabled && config.biometricAvailable) {
        unlockWithBiometric();
      }
    });
  }, []);

  useEffect(() => {
    if (mpin.length !== 4) return;

    verifyMpin(mpin).then(async (success) => {
      if (success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace(targetRoute as never);
      } else {
        setError('Incorrect MPIN');
        setMpin('');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    });
  }, [mpin, router, targetRoute]);

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1" edges={['top']}>
        <LinearGradient
          colors={['#002561', '#003380']}
          style={{ paddingBottom: 38, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}
        >
          <View className="px-6 pt-4 items-center">
            <View className="w-16 h-16 rounded-2xl bg-white/10 items-center justify-center mb-5">
              <Shield size={34} color="#fff" />
            </View>
            <Text className="text-white text-2xl font-bold">Unlock Paisa Mart</Text>
            <Text className="text-white/70 text-sm mt-2 text-center">
              Use biometric login or your 4 digit MPIN.
            </Text>
          </View>
        </LinearGradient>

        <View className="px-6 -mt-5">
          <View className="bg-white rounded-2xl p-5 shadow-lg">
            {biometricEnabled && biometricAvailable && (
              <Pressable onPress={unlockWithBiometric} className="mb-4">
                <View className="bg-orange-50 rounded-xl py-4 flex-row items-center justify-center">
                  <Fingerprint size={22} color="#F97316" />
                  <Text className="text-orange-600 font-bold ml-2">Use Biometric</Text>
                </View>
              </Pressable>
            )}

            <Text className="text-gray-900 font-semibold text-base mb-3">Enter MPIN</Text>
            <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border-2 border-gray-200">
              <LockKeyhole size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-gray-900 text-lg tracking-widest"
                value={mpin}
                onChangeText={(value) => {
                  setError('');
                  setMpin(value.replace(/\D/g, '').slice(0, 4));
                }}
                placeholder="4 digit MPIN"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                autoFocus
                style={{ height: 54 }}
              />
            </View>

            {!!error && <Text className="text-red-500 text-sm mt-3">{error}</Text>}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
