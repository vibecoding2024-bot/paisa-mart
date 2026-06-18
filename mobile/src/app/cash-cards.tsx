import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Wallet, Plus, ArrowRightLeft, Receipt, ArrowDownLeft, ArrowUpRight, Headphones, ChevronRight, ShieldCheck, CreditCard } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from '@/lib/haptics';
import { useWalletStore, formatINR, type WalletTransaction } from '@/lib/wallet-store';

const WALLET_ACTIONS = [
  { key: 'add', label: 'Add Money', sub: 'Via card', icon: Plus, color: '#16A34A', bg: '#F0FDF4', route: '/wallet-add-money' as const },
  { key: 'withdraw', label: 'Withdraw', sub: 'To bank', icon: ArrowRightLeft, color: '#2563EB', bg: '#EFF6FF', route: '/wallet-transfer' as const },
  { key: 'statement', label: 'Statement', sub: 'History', icon: Receipt, color: '#FF8C00', bg: '#FFF7ED', route: '/wallet-statement' as const },
];

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  const day = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'short' });
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${day} ${month}, ${hours}:${minutes} ${ampm}`;
};

export default function CashCardsScreen() {
  const router = useRouter();
  const balance = useWalletStore((s) => s.balance);
  const transactions = useWalletStore((s) => s.transactions);

  const recent = transactions.slice(0, 4);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const go = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(route as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <SafeAreaView className="flex-1" edges={['top']}>
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
                <Text className="text-white/90 text-sm font-medium">Back to Home</Text>
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <Text className="text-white text-2xl font-bold">Cash on Credit Card</Text>
              <Text className="text-white/70 text-sm mt-1">Your wallet — add money with a card & withdraw to bank</Text>
            </Animated.View>

            {/* Wallet Balance Card */}
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <LinearGradient
                colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.06)']}
                style={{ borderRadius: 22, padding: 18, marginTop: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-11 h-11 bg-white/15 rounded-2xl items-center justify-center mr-3">
                      <Wallet size={22} color="#FFB870" />
                    </View>
                    <View>
                      <Text className="text-white/60 text-xs font-medium">Wallet Balance</Text>
                      <Text className="text-white font-extrabold text-3xl mt-0.5">{formatINR(balance)}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center bg-white/10 px-2.5 py-1.5 rounded-full">
                    <ShieldCheck size={12} color="#4ADE80" />
                    <Text className="text-white/80 text-[10px] ml-1 font-medium">Secured</Text>
                  </View>
                </View>

                {/* Add Money + Withdraw buttons */}
                <View className="flex-row gap-3 mt-4">
                  <Pressable onPress={() => go('/wallet-add-money')} className="flex-1 active:opacity-90">
                    <LinearGradient
                      colors={['#FF8C00', '#FF6B00']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ borderRadius: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Plus size={18} color="#fff" />
                      <Text className="text-white font-bold text-sm ml-1.5">Add Money</Text>
                    </LinearGradient>
                  </Pressable>
                  <Pressable onPress={() => go('/wallet-transfer')} className="flex-1 active:opacity-90">
                    <View className="bg-white/15 border border-white/20 rounded-2xl flex-row items-center justify-center" style={{ borderRadius: 14, paddingVertical: 12 }}>
                      <ArrowUpRight size={18} color="#fff" />
                      <Text className="text-white font-bold text-sm ml-1.5">Withdraw</Text>
                    </View>
                  </Pressable>
                </View>
              </LinearGradient>
            </Animated.View>
          </View>
        </LinearGradient>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          className="flex-1 -mt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Quick wallet actions */}
          <Animated.View entering={FadeInUp.delay(300).springify()} className="px-6 mt-6">
            <Text className="text-gray-900 font-semibold text-base mb-3">Wallet Actions</Text>
            <View className="flex-row gap-3">
              {WALLET_ACTIONS.map((action) => (
                <Pressable
                  key={action.key}
                  onPress={() => go(action.route)}
                  className="flex-1 bg-white rounded-2xl p-3 items-center active:scale-95"
                  style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
                >
                  <View className="w-12 h-12 rounded-2xl items-center justify-center mb-2" style={{ backgroundColor: action.bg }}>
                    <action.icon size={22} color={action.color} />
                  </View>
                  <Text className="text-gray-900 font-semibold text-xs text-center">{action.label}</Text>
                  <Text className="text-gray-400 text-[10px] text-center mt-0.5">{action.sub}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Recent Activity */}
          <Animated.View entering={FadeInUp.delay(400).springify()} className="px-6 mt-7">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-900 font-semibold text-base">Recent Activity</Text>
              {transactions.length > 0 && (
                <Pressable onPress={() => go('/wallet-statement')} className="flex-row items-center">
                  <Text className="text-orange-500 text-sm font-semibold">View All</Text>
                  <ChevronRight size={16} color="#FF8C00" />
                </Pressable>
              )}
            </View>

            {recent.length === 0 ? (
              <View
                className="bg-white rounded-2xl p-8 items-center justify-center"
                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
              >
                <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-3">
                  <CreditCard size={28} color="#9CA3AF" />
                </View>
                <Text className="text-gray-900 font-semibold text-base">No Transactions Yet</Text>
                <Text className="text-gray-500 text-sm text-center mt-2">
                  Add money using your credit card to get started.
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {recent.map((tx: WalletTransaction) => {
                  const isCredit = tx.type === 'credit';
                  return (
                    <View
                      key={tx.id}
                      className="bg-white rounded-2xl p-4 flex-row items-center"
                      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
                    >
                      <View className={`w-11 h-11 rounded-xl items-center justify-center mr-3 ${isCredit ? 'bg-green-50' : 'bg-red-50'}`}>
                        {isCredit ? <ArrowDownLeft size={20} color="#16A34A" /> : <ArrowUpRight size={20} color="#DC2626" />}
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 font-semibold text-sm">{tx.title}</Text>
                        <Text className="text-gray-400 text-xs mt-0.5">{formatDate(tx.timestamp)}</Text>
                      </View>
                      <Text className={`font-extrabold text-sm ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                        {isCredit ? '+' : '-'}{formatINR(tx.amount)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </Animated.View>

          {/* Support */}
          <Animated.View entering={FadeInUp.delay(500).springify()} className="px-6 mt-7">
            <Text className="text-gray-900 font-semibold text-base mb-3">Need Help?</Text>
            <Pressable onPress={() => go('/support')} className="active:scale-98">
              <LinearGradient
                colors={['#EFF6FF', '#F5F3FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center' }}
              >
                <LinearGradient
                  colors={['#2563EB', '#1D4ED8']}
                  style={{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
                >
                  <Headphones size={24} color="#fff" />
                </LinearGradient>
                <View className="flex-1">
                  <Text className="text-gray-900 font-bold">Contact Support</Text>
                  <Text className="text-gray-500 text-xs mt-0.5">Call, WhatsApp or email us for any wallet issue</Text>
                </View>
                <ChevronRight size={20} color="#3B82F6" />
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Info note */}
          <Animated.View
            entering={FadeInUp.delay(600).springify()}
            className="mx-6 mt-7 rounded-2xl p-5"
            style={{ backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0' }}
          >
            <Text style={{ color: '#166534', fontWeight: '600', fontSize: 13, marginBottom: 4 }}>
              Safe & Secure Wallet
            </Text>
            <Text style={{ color: '#15803D', fontSize: 12, lineHeight: 18 }}>
              Add money to your wallet using a credit or debit card and withdraw to your bank anytime. All transactions are encrypted and protected.
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
