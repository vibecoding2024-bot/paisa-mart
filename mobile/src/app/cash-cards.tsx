import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CreditCard, Wallet, ArrowUpRight, Plus, History, ArrowLeft } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from '@/lib/haptics';
import { useRouter } from 'expo-router';
import NoPayout_TCGate from '@/components/NoPayout_TCGate';

const CARD_TYPES = [
  { id: '1', name: 'Credit Cards', icon: CreditCard, color: '#3B82F6', bg: '#EFF6FF', count: 0 },
  { id: '2', name: 'Debit Cards', icon: Wallet, color: '#10B981', bg: '#ECFDF5', count: 0 },
];

const RECENT_TRANSACTIONS = [
  { id: '1', title: 'Card Application - HDFC', amount: '₹0 payout', date: 'Pending', status: 'pending' },
  { id: '2', title: 'Card Application - Axis', amount: '₹0 payout', date: 'Approved', status: 'success' },
];

export default function CashCardsScreen() {
  const router = useRouter();
  const [tcVisible, setTcVisible] = useState(true);
  const [tcAccepted, setTcAccepted] = useState(false);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <NoPayout_TCGate
        visible={tcVisible}
        module="cash-cards"
        onAccept={() => { setTcAccepted(true); setTcVisible(false); }}
        onDecline={() => router.back()}
      />
      {tcAccepted && (
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <LinearGradient
            colors={['#002561', '#003380']}
            style={{ paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}
          >
            <View className="px-6 pt-4">
              {/* Back Button */}
              <Animated.View entering={FadeInDown.delay(50).springify()} className="mb-4">
                <Pressable
                  onPress={handleBack}
                  className="flex-row items-center active:opacity-70"
                >
                  <View className="w-9 h-9 bg-white/10 rounded-xl items-center justify-center mr-2">
                    <ArrowLeft size={20} color="#fff" />
                  </View>
                  <Text className="text-white/90 text-sm font-medium">Back to Home</Text>
                </Pressable>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <Text className="text-white text-2xl font-bold">Cash on Credit Card</Text>
                <Text className="text-white/70 text-sm mt-1">Manage and track all your card applications</Text>
              </Animated.View>

              {/* No-Payout Badge */}
              <Animated.View
                entering={FadeInDown.delay(200).springify()}
                style={{
                  backgroundColor: 'rgba(239,68,68,0.15)',
                  borderRadius: 14,
                  padding: 14,
                  marginTop: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(239,68,68,0.25)',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <CreditCard size={18} color="#FCA5A5" />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#FCA5A5', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    No Payout — 0% Commission
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 2, lineHeight: 17 }}>
                    Transactions here do not generate earnings or referral payouts.
                  </Text>
                </View>
              </Animated.View>
            </View>
          </LinearGradient>

          <ScrollView keyboardShouldPersistTaps="handled"
            className="flex-1 -mt-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Card Types Section */}
            <View className="px-6 mt-6">
              <Text className="text-gray-900 font-semibold text-lg mb-4">Card Categories</Text>
              <View className="flex-row gap-3">
                {CARD_TYPES.map((card, index) => (
                  <Animated.View
                    key={card.id}
                    entering={FadeInUp.delay(300 + index * 100).springify()}
                    className="flex-1"
                  >
                    <Pressable
                      onPress={handlePress}
                      className="bg-white rounded-2xl p-4 shadow-sm active:scale-95"
                      style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.05,
                        shadowRadius: 8,
                        elevation: 2,
                      }}
                    >
                      <View className={`w-12 h-12 rounded-xl items-center justify-center mb-3`} style={{ backgroundColor: card.bg }}>
                        <card.icon size={24} color={card.color} />
                      </View>
                      <Text className="text-gray-900 font-semibold text-base">{card.name}</Text>
                      <Text className="text-gray-500 text-sm mt-1">{card.count} active</Text>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            </View>

            {/* Quick Actions */}
            <View className="px-6 mt-6">
              <Text className="text-gray-900 font-semibold text-lg mb-4">Quick Actions</Text>
              <View className="gap-3">
                <Animated.View entering={FadeInUp.delay(500).springify()}>
                  <Pressable
                    onPress={handlePress}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-5 flex-row items-center justify-between active:scale-98"
                  >
                    <LinearGradient
                      colors={['#FF8C00', '#FF6B00']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className="absolute inset-0 rounded-2xl"
                    />
                    <View className="flex-row items-center">
                      <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center mr-4">
                        <Plus size={24} color="#fff" />
                      </View>
                      <View>
                        <Text className="text-white font-bold text-base">New Application</Text>
                        <Text className="text-white/80 text-sm">Apply for a new card</Text>
                      </View>
                    </View>
                    <ArrowUpRight size={20} color="#fff" />
                  </Pressable>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(600).springify()}>
                  <Pressable
                    onPress={handlePress}
                    className="bg-white rounded-2xl p-5 flex-row items-center justify-between shadow-sm active:scale-98"
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 8,
                      elevation: 2,
                    }}
                  >
                    <View className="flex-row items-center">
                      <View className="w-12 h-12 bg-blue-50 rounded-xl items-center justify-center mr-4">
                        <History size={24} color="#3B82F6" />
                      </View>
                      <View>
                        <Text className="text-gray-900 font-semibold text-base">Application History</Text>
                        <Text className="text-gray-500 text-sm">View all your applications</Text>
                      </View>
                    </View>
                    <ArrowUpRight size={20} color="#9CA3AF" />
                  </Pressable>
                </Animated.View>
              </View>
            </View>

            {/* Recent Transactions */}
            <View className="px-6 mt-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-gray-900 font-semibold text-lg">Recent Activity</Text>
                <Pressable onPress={handlePress}>
                  <Text className="text-orange-500 font-medium text-sm">View All</Text>
                </Pressable>
              </View>

              {RECENT_TRANSACTIONS.length === 0 ? (
                <Animated.View
                  entering={FadeInUp.delay(700).springify()}
                  className="bg-white rounded-2xl p-8 items-center justify-center shadow-sm"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-3">
                    <History size={28} color="#9CA3AF" />
                  </View>
                  <Text className="text-gray-900 font-semibold text-base">No Recent Activity</Text>
                  <Text className="text-gray-500 text-sm text-center mt-2">
                    Start applying for cards to see your activity here
                  </Text>
                </Animated.View>
              ) : (
                <View className="gap-3">
                  {RECENT_TRANSACTIONS.map((transaction, index) => (
                    <Animated.View
                      key={transaction.id}
                      entering={FadeInUp.delay(700 + index * 100).springify()}
                    >
                      <Pressable
                        onPress={handlePress}
                        className="bg-white rounded-2xl p-4 flex-row items-center justify-between shadow-sm active:scale-98"
                        style={{
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.05,
                          shadowRadius: 8,
                          elevation: 2,
                        }}
                      >
                        <View className="flex-row items-center flex-1">
                          <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${
                            transaction.status === 'success' ? 'bg-green-50' : 'bg-orange-50'
                          }`}>
                            <CreditCard size={20} color={transaction.status === 'success' ? '#10B981' : '#FF8C00'} />
                          </View>
                          <View className="flex-1">
                            <Text className="text-gray-900 font-semibold text-sm">{transaction.title}</Text>
                            <Text className="text-gray-500 text-xs mt-0.5">{transaction.date}</Text>
                          </View>
                        </View>
                        <Text className="font-bold text-base text-gray-400">
                          {transaction.amount}
                        </Text>
                      </Pressable>
                    </Animated.View>
                  ))}
                </View>
              )}
            </View>

            {/* No Payout Info Card */}
            <Animated.View
              entering={FadeInUp.delay(900).springify()}
              className="mx-6 mt-6 rounded-2xl p-5"
              style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' }}
            >
              <Text style={{ color: '#991B1B', fontWeight: '600', fontSize: 13, marginBottom: 4 }}>
                No Payout — Convenience Service
              </Text>
              <Text style={{ color: '#B91C1C', fontSize: 12, lineHeight: 18 }}>
                This module is provided for user convenience only. No commission or referral payout is applicable. Transactions here do not appear in your earnings report.
              </Text>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      )}
    </View>
  );
}
