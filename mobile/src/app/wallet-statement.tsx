import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Receipt, Plus } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from '@/lib/haptics';
import { useWalletStore, formatINR, type WalletTransaction } from '@/lib/wallet-store';

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

export default function WalletStatementScreen() {
  const router = useRouter();
  const balance = useWalletStore((s) => s.balance);
  const transactions = useWalletStore((s) => s.transactions);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // Mini statement = most recent 10 transactions
  const recent = transactions.slice(0, 10);

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
                <Text className="text-white/90 text-sm font-medium">Back</Text>
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <Text className="text-white text-2xl font-bold">Mini Statement</Text>
              <Text className="text-white/70 text-sm mt-1">Your recent wallet transactions</Text>
            </Animated.View>

            {/* Balance card */}
            <Animated.View
              entering={FadeInDown.delay(200).springify()}
              style={{ marginTop: 16, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}
            >
              <Text className="text-white/60 text-xs">Current Wallet Balance</Text>
              <Text className="text-white font-extrabold text-3xl mt-1">{formatINR(balance)}</Text>
            </Animated.View>
          </View>
        </LinearGradient>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          className="flex-1 -mt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View className="px-6 mt-6">
            <Text className="text-gray-900 font-semibold text-base mb-4">Recent Transactions</Text>

            {recent.length === 0 ? (
              <Animated.View
                entering={FadeInUp.delay(300).springify()}
                className="bg-white rounded-2xl p-8 items-center justify-center"
                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
              >
                <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-3">
                  <Receipt size={28} color="#9CA3AF" />
                </View>
                <Text className="text-gray-900 font-semibold text-base">No Transactions Yet</Text>
                <Text className="text-gray-500 text-sm text-center mt-2">
                  Add money to your wallet to see your transaction history here.
                </Text>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.replace('/wallet-add-money'); }}
                  className="mt-5"
                >
                  <LinearGradient
                    colors={['#FF8C00', '#FF6B00']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ borderRadius: 14, paddingVertical: 12, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center' }}
                  >
                    <Plus size={18} color="#fff" />
                    <Text className="text-white font-bold text-sm ml-1.5">Add Money</Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            ) : (
              <View className="gap-3">
                {recent.map((tx: WalletTransaction, index: number) => {
                  const isCredit = tx.type === 'credit';
                  return (
                    <Animated.View
                      key={tx.id}
                      entering={FadeInUp.delay(300 + index * 60).springify()}
                      className="bg-white rounded-2xl p-4 flex-row items-center"
                      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
                    >
                      <View className={`w-11 h-11 rounded-xl items-center justify-center mr-3 ${isCredit ? 'bg-green-50' : 'bg-red-50'}`}>
                        {isCredit
                          ? <ArrowDownLeft size={20} color="#16A34A" />
                          : <ArrowUpRight size={20} color="#DC2626" />}
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 font-semibold text-sm">{tx.title}</Text>
                        <Text className="text-gray-400 text-xs mt-0.5">{tx.subtitle}</Text>
                        <Text className="text-gray-400 text-xs mt-0.5">{formatDate(tx.timestamp)}</Text>
                      </View>
                      <View className="items-end">
                        <Text className={`font-extrabold text-sm ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                          {isCredit ? '+' : '-'}{formatINR(tx.amount)}
                        </Text>
                        <Text className="text-gray-400 text-xs mt-0.5">Bal {formatINR(tx.balanceAfter)}</Text>
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
