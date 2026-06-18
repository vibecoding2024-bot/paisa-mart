import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Wallet, Plus, Check } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from '@/lib/haptics';
import { useWalletStore, formatINR } from '@/lib/wallet-store';
import { toast } from '@/lib/toast-store';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', sub: 'Google Pay, PhonePe, Paytm' },
  { id: 'card', label: 'Debit / Credit Card', sub: 'Visa, Mastercard, RuPay' },
  { id: 'netbanking', label: 'Net Banking', sub: 'All major banks' },
];

export default function WalletAddMoneyScreen() {
  const router = useRouter();
  const balance = useWalletStore((s) => s.balance);
  const addMoney = useWalletStore((s) => s.addMoney);

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('upi');

  const numericAmount = parseInt(amount || '0', 10);
  const isValid = numericAmount >= 1;

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleQuickAmount = (value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAmount(String(value));
  };

  const handleAddMoney = () => {
    if (!isValid) return;
    const methodLabel = PAYMENT_METHODS.find((m) => m.id === method)?.label ?? 'UPI';
    addMoney(numericAmount, methodLabel);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    toast.success(`${formatINR(numericAmount)} added to your wallet`);
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
                <Text className="text-white text-2xl font-bold">Add Money</Text>
                <Text className="text-white/70 text-sm mt-1">Top up your wallet instantly</Text>
              </Animated.View>

              {/* Balance pill */}
              <Animated.View
                entering={FadeInDown.delay(200).springify()}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, backgroundColor: 'rgba(255,255,255,0.12)', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}
              >
                <Wallet size={16} color="#FFB870" />
                <Text className="text-white/80 text-xs">Wallet Balance</Text>
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
              <Text className="text-gray-900 font-semibold text-base mb-3">Enter Amount</Text>
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
              </View>

              {/* Quick amounts */}
              <View className="flex-row flex-wrap gap-2 mt-3">
                {QUICK_AMOUNTS.map((value) => (
                  <Pressable
                    key={value}
                    onPress={() => handleQuickAmount(value)}
                    className={`px-4 py-2 rounded-full border ${numericAmount === value ? 'bg-orange-500 border-orange-500' : 'bg-white border-gray-200'}`}
                  >
                    <Text className={`text-sm font-semibold ${numericAmount === value ? 'text-white' : 'text-gray-700'}`}>
                      ₹{value.toLocaleString('en-IN')}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>

            {/* Payment method */}
            <Animated.View entering={FadeInUp.delay(400).springify()} className="px-6 mt-6">
              <Text className="text-gray-900 font-semibold text-base mb-3">Payment Method</Text>
              <View className="gap-3">
                {PAYMENT_METHODS.map((m) => {
                  const selected = method === m.id;
                  return (
                    <Pressable
                      key={m.id}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMethod(m.id); }}
                      className={`bg-white rounded-2xl p-4 flex-row items-center justify-between border-2 ${selected ? 'border-orange-500' : 'border-transparent'}`}
                      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
                    >
                      <View className="flex-1">
                        <Text className="text-gray-900 font-semibold text-sm">{m.label}</Text>
                        <Text className="text-gray-400 text-xs mt-0.5">{m.sub}</Text>
                      </View>
                      <View className={`w-6 h-6 rounded-full items-center justify-center ${selected ? 'bg-orange-500' : 'border-2 border-gray-200'}`}>
                        {selected && <Check size={14} color="#fff" />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          </ScrollView>

          {/* Add Money button */}
          <View className="px-6 pb-4 pt-2 bg-transparent">
            <Pressable onPress={handleAddMoney} disabled={!isValid}>
              <LinearGradient
                colors={isValid ? ['#FF8C00', '#FF6B00'] : ['#E5E7EB', '#E5E7EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              >
                <Plus size={20} color={isValid ? '#fff' : '#9CA3AF'} />
                <Text className={`font-bold text-base ml-2 ${isValid ? 'text-white' : 'text-gray-400'}`}>
                  {isValid ? `Add ${formatINR(numericAmount)}` : 'Enter an amount'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
