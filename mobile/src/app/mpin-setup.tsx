import { useEffect, useMemo, useState } from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Fingerprint, LockKeyhole, ShieldCheck } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import { getAuthSecurityConfig, saveMpin } from '@/lib/auth-security';

export default function MpinSetupScreen() {
  const router = useRouter();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const [mpin, setMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [enableBiometric, setEnableBiometric] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getAuthSecurityConfig().then((config) => {
      setBiometricAvailable(config.biometricAvailable);
      setEnableBiometric(config.biometricAvailable);
    });
  }, []);

  const targetRoute = next || '/(tabs)/profile';
  const canSave = useMemo(() => /^\d{4}$/.test(mpin) && mpin === confirmMpin, [confirmMpin, mpin]);

  const handleSave = async () => {
    if (isSaving) return;
    if (!/^\d{4}$/.test(mpin)) {
      setError('Enter a 4 digit MPIN');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (mpin !== confirmMpin) {
      setError('MPIN does not match');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsSaving(true);
    setError('');
    await saveMpin(mpin, enableBiometric && biometricAvailable);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace(targetRoute as never);
  };

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1" edges={['top']}>
        <LinearGradient
          colors={['#002561', '#003380']}
          style={{ paddingBottom: 34, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}
        >
          <View className="px-6 pt-4">
            <View className="w-14 h-14 rounded-2xl bg-white/10 items-center justify-center mb-5">
              <ShieldCheck size={30} color="#fff" />
            </View>
            <Text className="text-white text-2xl font-bold">Secure your account</Text>
            <Text className="text-white/70 text-sm mt-2">
              Create an MPIN for faster and safer login.
            </Text>
          </View>
        </LinearGradient>

        <View className="px-6 -mt-5">
          <View className="bg-white rounded-2xl p-5 shadow-lg">
            <Text className="text-gray-900 font-semibold text-base mb-4">Set 4 digit MPIN</Text>

            <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border-2 border-gray-200 mb-3">
              <LockKeyhole size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-gray-900 text-lg tracking-widest"
                value={mpin}
                onChangeText={(value) => {
                  setError('');
                  setMpin(value.replace(/\D/g, '').slice(0, 4));
                }}
                placeholder="Enter MPIN"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                style={{ height: 54 }}
              />
            </View>

            <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border-2 border-gray-200">
              <LockKeyhole size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-gray-900 text-lg tracking-widest"
                value={confirmMpin}
                onChangeText={(value) => {
                  setError('');
                  setConfirmMpin(value.replace(/\D/g, '').slice(0, 4));
                }}
                placeholder="Confirm MPIN"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                secureTextEntry
                maxLength={4}
                style={{ height: 54 }}
              />
            </View>

            {biometricAvailable && (
              <View className="flex-row items-center justify-between bg-orange-50 rounded-xl px-4 py-4 mt-4">
                <View className="flex-row items-center flex-1">
                  <Fingerprint size={22} color="#F97316" />
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-900 font-semibold">Enable biometric login</Text>
                    <Text className="text-gray-500 text-xs mt-0.5">Use fingerprint or face unlock next time</Text>
                  </View>
                </View>
                <Switch value={enableBiometric} onValueChange={setEnableBiometric} />
              </View>
            )}

            {!!error && <Text className="text-red-500 text-sm mt-3">{error}</Text>}

            <Pressable onPress={handleSave} disabled={!canSave || isSaving} className="mt-5">
              <View className={`rounded-xl py-4 items-center ${canSave ? 'bg-orange-500' : 'bg-gray-300'}`}>
                <Text className={`font-bold text-base ${canSave ? 'text-white' : 'text-gray-500'}`}>
                  {isSaving ? 'Saving...' : 'Save & Continue'}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
