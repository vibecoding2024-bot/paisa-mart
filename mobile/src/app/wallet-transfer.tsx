import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Wallet, Landmark, ArrowRight, Check } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from '@/lib/haptics';
import { useWalletStore, formatINR } from '@/lib/wallet-store';
import { toast } from '@/lib/toast-store';

// Mock saved bank accounts. In a real app these come from the KYC / bank-details flow.
const SAVED_BANKS = [
  { id: 'hdfc', bank: 'HDFC Bank', account: '••••4821', logo: '🏦' },
  { id: 'sbi', bank: 'State Bank of India', account: '••••9032', logo: '🏛️' },
  { id: 'icici', bank: 'ICICI Bank', account: '••••1170', logo: '💳' },
];

export default function WalletTransferScreen() {
  const router = useRouter();
  const balance = useWalletStore((s) => s.balance);
  const transferToBank = useWalletStore((s) => s.transferToBank);

  const [amount, setAmount] = useState('');
  const [bankId, setBankId] = useState(SAVED_BANKS[0].id);

  const numericAmount = parseInt(amount || '0', 10);
  const selectedBank = SAVED_BANKS.find((b) => b.id === bankId) ?? SAVED_BANKS[0];
  const insufficient = numericAmount > balance;
  const isValid = numericAmount >= 1 && !insufficient;

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleTransfer = () => {
    if (!isValid) return;
    const label = `${selectedBank.bank} ${selectedBank.account}`;
    const tx = transferToBank(numericAmount, label);
    if (!tx) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error('Insufficient wallet balance');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success(`${formatINR(numericAmount)} sent to ${selectedBank.bank}`);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          {/* Header */}
          <LinearGradient
            colors={['#002561', '#003380']}
            style={{ paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}
          >
            <View className="px-6 pt-4">
              <Animated.View entering={FadeInDown.delay(50).springify()} className="mb-4">
                <Pressable onPress={handleBack} className="flex-row items-center active:opacity-70">
                  <View className="w-9 h-9 bg-white/10 rounded-xl items-center justify-center mr-2">
                    <ArrowLeft size={20} color="#fff" />
                  </View>
                  <Text className="text-white/90 text-sm font-medium">Back</Text>
                </Pressable>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <Text className="text-white text-2xl font-bold">Transfer to Bank</Text>
                <Text className="text-white/70 text-sm mt-1">Move money from wallet to your bank</Text>
              </Animated.View>

              <Animated.View
                entering={FadeInDown.delay(200).springify()}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, backgroundColor: 'rgba(255,255,255,0.12)', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}
              >
                <Wallet size={16} color="#FFB870" />
                <Text className="text-white/80 text-xs">Available</Text>
                <Text className="text-white font-bold text-sm">{formatINR(balance)}</Text>
              </Animated.View>
            </View>
          </LinearGradient>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            className="flex-1 -mt-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Amount input */}
            <Animated.View entering={FadeInUp.delay(300).springify()} className="px-6 mt-6">
              <Text className="text-gray-900 font-semibold text-base mb-3">Amount to Transfer</Text>
              <View
                className="bg-white rounded-2xl px-5 py-4 flex-row items-center"
                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
              >
                <Text className="text-gray-900 font-bold text-3xl mr-1">₹</Text>
                <TextInput
                  value={amount}
                  onChangeText={(t) => setAmount(t.replace(/\D/g, '').slice(0, 7))}
                  placeholder="0"
                  placeholderTextColor="#D1D5DB"
                  keyboardType="number-pad"
                  className="flex-1 text-gray-900 font-bold text-3xl"
                  style={{ ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}) }}
                />
                {balance > 0 && (
                  <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAmount(String(Math.round(balance))); }} className="bg-orange-50 px-3 py-1.5 rounded-full">
                    <Text className="text-orange-600 font-bold text-xs">ALL</Text>
                  </Pressable>
                )}
              </View>
              {insufficient && (
                <Text className="text-red-500 text-xs mt-2 ml-1 font-medium">Amount exceeds your wallet balance</Text>
              )}
            </Animated.View>

            {/* Bank selection */}
            <Animated.View entering={FadeInUp.delay(400).springify()} className="px-6 mt-6">
              <Text className="text-gray-900 font-semibold text-base mb-3">Transfer To</Text>
              <View className="gap-3">
                {SAVED_BANKS.map((b) => {
                  const selected = bankId === b.id;
                  return (
                    <Pressable
                      key={b.id}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setBankId(b.id); }}
                      className={`bg-white rounded-2xl p-4 flex-row items-center border-2 ${selected ? 'border-orange-500' : 'border-transparent'}`}
                      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
                    >
                      <View className="w-11 h-11 bg-gray-50 rounded-xl items-center justify-center mr-3">
                        <Text className="text-xl">{b.logo}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 font-semibold text-sm">{b.bank}</Text>
                        <Text className="text-gray-400 text-xs mt-0.5">Account {b.account}</Text>
                      </View>
                      <View className={`w-6 h-6 rounded-full items-center justify-center ${selected ? 'bg-orange-500' : 'border-2 border-gray-200'}`}>
                        {selected && <Check size={14} color="#fff" />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              <Text className="text-gray-400 text-xs mt-3 ml-1">Transfers are usually credited within a few minutes.</Text>
            </Animated.View>
          </ScrollView>

          {/* Transfer button */}
          <View className="px-6 pb-4 pt-2">
            <Pressable onPress={handleTransfer} disabled={!isValid}>
              <LinearGradient
                colors={isValid ? ['#FF8C00', '#FF6B00'] : ['#E5E7EB', '#E5E7EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              >
                <Landmark size={20} color={isValid ? '#fff' : '#9CA3AF'} />
                <Text className={`font-bold text-base mx-2 ${isValid ? 'text-white' : 'text-gray-400'}`}>
                  {isValid ? `Transfer ${formatINR(numericAmount)}` : 'Enter an amount'}
                </Text>
                {isValid && <ArrowRight size={18} color="#fff" />}
              </LinearGradient>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
