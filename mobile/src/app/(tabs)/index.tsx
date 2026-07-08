import { useState } from 'react';
import { View, Text, ScrollView, Share, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, ChevronRight, TrendingUp, Users, Wallet, Lock, CreditCard } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useUserProfileStore, getTimeBasedGreeting } from '@/lib/user-profile-store';
import { useNotificationStore } from '@/lib/notification-store';
import { toast } from '@/lib/toast-store';
import PressableScale from '@/components/PressableScale';

interface BankProduct {
  id: string;
  title: string;
  bank: string;
  features: string[];
  gradient: [string, string];
}

const BANK_PRODUCTS: BankProduct[] = [
  {
    id: 'kotak-savings-account',
    title: 'Kotak 811',
    bank: 'Kotak Mahindra Bank',
    features: ['Zero balance account', 'Virtual debit card'],
    gradient: ['#E0F2FE', '#F0FAFF'],
  },
  {
    id: 'indusind-bank-business-savings-account',
    title: 'Indus Delite: Zero Balance',
    bank: 'IndusInd Bank',
    features: ['Zero Balance Savings Account', 'Up to 5% cashback on debit card spends'],
    gradient: ['#E0F2FE', '#F0FAFF'],
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const getFirstName = useUserProfileStore((s) => s.getFirstName);
  const hasProfile = useUserProfileStore((s) => s.hasProfile);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const firstName = getFirstName();
  const timeBasedGreeting = getTimeBasedGreeting();
  const greetingLine = hasProfile() && firstName ? timeBasedGreeting : 'Welcome to';
  const nameLine = hasProfile() && firstName ? firstName : 'Paisa Mart';
  const avatarLetter = firstName ? firstName.charAt(0).toUpperCase() : 'P';

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView className="flex-1" edges={['top']}>
        <LinearGradient
          colors={['#002561', '#0A3D91', '#0A3D91']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingBottom: 26, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
        >
          <View className="px-4 pt-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <LinearGradient
                  colors={['#FF8C00', '#FF6B00']}
                  style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
                >
                  <Text className="text-white font-bold text-lg">{avatarLetter}</Text>
                </LinearGradient>
                <View>
                  <Text className="text-white/60 text-xs">{greetingLine}</Text>
                  <Text className="text-white font-bold text-lg">{nameLine}</Text>
                </View>
              </View>
              <PressableScale
                haptic="light"
                onPress={() => router.push('/notifications')}
                className="w-11 h-11 bg-white/10 rounded-full items-center justify-center"
              >
                <Bell size={20} color="#fff" />
                {unreadCount > 0 && (
                  <View className="absolute -top-0.5 -right-0.5 bg-orange-500 rounded-full min-w-[18px] h-[18px] items-center justify-center px-1 border-2 border-[#0A3D91]">
                    <Text className="text-white text-[10px] font-bold">{unreadCount}</Text>
                  </View>
                )}
              </PressableScale>
            </View>

            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <LinearGradient
                colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.06)']}
                style={{ borderRadius: 22, padding: 18, marginTop: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}
              >
                <View className="flex-row justify-between items-start">
                  <View>
                    <Text className="text-white/60 text-xs font-medium">Total Earnings</Text>
                    <Text className="text-white font-extrabold text-3xl mt-1">₹0</Text>
                    <View className="flex-row items-center mt-1.5">
                      <TrendingUp size={13} color="#4ADE80" />
                      <Text className="text-green-400 text-xs ml-1 font-medium">Start selling to earn!</Text>
                    </View>
                  </View>
                  <PressableScale haptic="medium" onPress={() => router.push('/(tabs)/earnings')}>
                    <LinearGradient
                      colors={['#FF8C00', '#FF6B00']}
                      style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, flexDirection: 'row', alignItems: 'center' }}
                    >
                      <Text className="text-white font-bold text-sm mr-1">Withdraw</Text>
                      <ChevronRight size={16} color="#fff" />
                    </LinearGradient>
                  </PressableScale>
                </View>
              </LinearGradient>
            </Animated.View>
          </View>
        </LinearGradient>

        <ScrollView keyboardShouldPersistTaps="handled" className="flex-1" showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.delay(200).springify()} className="px-4 mt-6">
            <Text className="text-gray-900 font-bold text-lg mb-4">Featured Bank Accounts</Text>

            {BANK_PRODUCTS.map((product, index) => (
              <Animated.View
                key={product.id}
                entering={FadeInDown.delay(250 + index * 100).springify()}
                className="mb-4"
              >
                <LinearGradient
                  colors={product.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 20, padding: 20, shadowColor: '#0A3D91', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 3 }}
                >
                  <View className="flex-row items-start justify-between mb-4">
                    <View className="flex-1">
                      <Text className="text-gray-900 font-bold text-base">{product.title}</Text>
                      <Text className="text-gray-500 text-sm mt-0.5">{product.bank}</Text>
                    </View>
                    <View className="bg-white rounded-full p-2">
                      <CreditCard size={20} color="#0A3D91" />
                    </View>
                  </View>

                  <View className="mb-5">
                    {product.features.map((feature, featureIndex) => (
                      <View key={featureIndex} className="flex-row items-center mb-2.5">
                        <View className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3" />
                        <Text className="text-gray-700 text-sm flex-1">{feature}</Text>
                      </View>
                    ))}
                  </View>

                  <Pressable
                    onPress={() => router.push({ pathname: '/share-card', params: { productId: product.id } })}
                    className="mb-4"
                  >
                    <View className="flex-row items-center">
                      <Text className="text-blue-600 font-semibold text-sm">View all Details and Benefits</Text>
                      <ChevronRight size={16} color="#2563EB" />
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => router.push({ pathname: '/share-card', params: { productId: product.id } })}
                    className="bg-blue-600 rounded-xl py-3 items-center justify-center"
                  >
                    <Text className="text-white font-bold text-base">Apply</Text>
                  </Pressable>
                </LinearGradient>
              </Animated.View>
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(700).springify()} className="px-4 mt-2 mb-8">
            <PressableScale
              haptic="light"
              activeScale={0.98}
              onPress={() => router.push({ pathname: '/(tabs)/products', params: { category: 'bank-accounts' } })}
              className="bg-white rounded-2xl p-4 flex-row items-center justify-center"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
            >
              <Text className="text-gray-900 font-bold text-base">View All Bank Products</Text>
              <ChevronRight size={18} color="#0A3D91" />
            </PressableScale>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
