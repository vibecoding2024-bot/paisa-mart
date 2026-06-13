import { useState } from 'react';
import { View, Text, ScrollView, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, ChevronRight, CreditCard, Landmark, Shield, TrendingUp, Users, Wallet, Star, Gift, Zap, Home, Car, Briefcase, Heart, UserCheck, Gem, Building2, Umbrella, Smartphone, Plane, ArrowUpRight } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useUserProfileStore, getTimeBasedGreeting } from '@/lib/user-profile-store';
import { useFeatureFlags } from '@/lib/feature-flags';
import { useNotificationStore } from '@/lib/notification-store';
import { toast } from '@/lib/toast-store';
import PressableScale from '@/components/PressableScale';
import ComingSoonModal, { type ComingSoonModule } from '@/components/ComingSoonModal';

const QUICK_ACTIONS = [
  { icon: CreditCard, label: 'Credit Cards', color: '#3B82F6', bg: '#EFF6FF', categoryId: 'credit-cards' },
  { icon: Landmark, label: 'Bank Accounts', color: '#06B6D4', bg: '#ECFEFF', categoryId: 'bank-accounts' },
  { icon: Home, label: 'Home Loans', color: '#8B5CF6', bg: '#F5F3FF', categoryId: 'home-loans' },
  { icon: UserCheck, label: 'Personal Loans', color: '#10B981', bg: '#ECFDF5', categoryId: 'personal-loans' },
  { icon: Car, label: 'Vehicle Loans', color: '#EF4444', bg: '#FEF2F2', categoryId: 'vehicle-loans' },
  { icon: Briefcase, label: 'Business Loans', color: '#EC4899', bg: '#FDF2F8', categoryId: 'business-loans' },
  { icon: Zap, label: 'Insta Loans', color: '#F59E0B', bg: '#FFFBEB', categoryId: 'insta-loans' },
  { icon: Heart, label: 'Health Insurance', color: '#22C55E', bg: '#F0FDF4', categoryId: 'health-insurance' },
  { icon: Shield, label: 'Life Insurance', color: '#6366F1', bg: '#EEF2FF', categoryId: 'life-insurance' },
  { icon: Umbrella, label: 'Motor Insurance', color: '#0EA5E9', bg: '#F0F9FF', categoryId: 'motor-insurance' },
  { icon: Gem, label: 'Gold Loans', color: '#EAB308', bg: '#FEFCE8', categoryId: 'gold-loans' },
  { icon: Building2, label: 'Real Estate', color: '#64748B', bg: '#F8FAFC', categoryId: 'real-estate' },
  { icon: Wallet, label: 'Cash on Credit Card', color: '#8B5CF6', bg: '#F5F3FF', categoryId: 'cash-cards', isScreen: true },
  { icon: Smartphone, label: 'Recharge & Pay Bills', color: '#7C3AED', bg: '#F5F3FF', categoryId: 'recharge-bills', isScreen: true },
  { icon: Plane, label: 'Travel & Tickets', color: '#DC2626', bg: '#FEF2F2', categoryId: 'travel-tickets', isScreen: true },
];

const PRODUCTS = [
  { name: 'HDFC Credit Card', commission: '₹2,100', type: 'Credit Card', logo: '🏦', categoryId: 'credit-cards' },
  { name: 'ICICI Personal Loan', commission: '₹3,000', type: 'Loan', logo: '🏛️', categoryId: 'personal-loans' },
  { name: 'Axis Savings Account', commission: '₹500', type: 'Savings', logo: '💳', categoryId: 'bank-accounts' },
  { name: 'LIC Term Insurance', commission: '₹1,500', type: 'Insurance', logo: '🛡️', categoryId: 'life-insurance' },
];

export default function HomeScreen() {
  const router = useRouter();
  const getFirstName = useUserProfileStore((s) => s.getFirstName);
  const hasProfile = useUserProfileStore((s) => s.hasProfile);
  const goldLoanEnabled = useFeatureFlags((s) => s.gold_loan_enabled);
  const realEstateEnabled = useFeatureFlags((s) => s.real_estate_enabled);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const [comingSoonModule, setComingSoonModule] = useState<ComingSoonModule | null>(null);

  const handleQuickAction = (categoryId: string, isScreen?: boolean) => {
    if (categoryId === 'gold-loans' && !goldLoanEnabled) {
      setComingSoonModule('gold-loans');
      return;
    }
    if (categoryId === 'real-estate' && !realEstateEnabled) {
      setComingSoonModule('real-estate');
      return;
    }
    if (categoryId === 'business-loans') {
      router.push('/business-loans-details');
      return;
    }
    if (categoryId === 'personal-loans') {
      router.push('/personal-loans-details');
      return;
    }
    if (isScreen) {
      router.push(`/${categoryId}`);
    } else {
      router.push({ pathname: '/(tabs)/products', params: { category: categoryId } });
    }
  };

  const handleInvite = async () => {
    try {
      await Share.share({
        message:
          'Join me on Paisa Mart and start earning by selling financial products! Sign up with my referral and we both earn ₹500. 💰',
      });
    } catch {
      toast.error('Could not open share sheet');
    }
  };

  const firstName = getFirstName();
  const timeBasedGreeting = getTimeBasedGreeting();
  const greetingLine = hasProfile() && firstName ? timeBasedGreeting : 'Welcome to';
  const nameLine = hasProfile() && firstName ? firstName : 'Paisa Mart';
  const avatarLetter = firstName ? firstName.charAt(0).toUpperCase() : 'P';

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
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

            {/* Earnings Card */}
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
                  <PressableScale
                    haptic="medium"
                    onPress={() => router.push('/(tabs)/earnings')}
                  >
                    <LinearGradient
                      colors={['#FF8C00', '#FF6B00']}
                      style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, flexDirection: 'row', alignItems: 'center' }}
                    >
                      <Text className="text-white font-bold text-sm mr-1">Withdraw</Text>
                      <ArrowUpRight size={16} color="#fff" />
                    </LinearGradient>
                  </PressableScale>
                </View>
              </LinearGradient>
            </Animated.View>
          </View>
        </LinearGradient>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Quick Actions */}
          <Animated.View entering={FadeInDown.delay(200).springify()} className="px-4 mt-4">
            <View
              className="bg-white rounded-3xl p-4"
              style={{ shadowColor: '#0A3D91', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 3 }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-gray-900 font-bold text-base">Quick Actions</Text>
                <PressableScale haptic="selection" onPress={() => router.push('/(tabs)/products')} className="flex-row items-center">
                  <Text className="text-orange-500 text-xs font-semibold">See all</Text>
                  <ChevronRight size={14} color="#FF8C00" />
                </PressableScale>
              </View>
              <View className="flex-row flex-wrap justify-between">
                {QUICK_ACTIONS.map((action, index) => (
                  <PressableScale
                    key={index}
                    haptic="light"
                    activeScale={0.9}
                    className="items-center mb-4"
                    style={{ width: '30%' }}
                    onPress={() => handleQuickAction(action.categoryId, action.isScreen)}
                  >
                    <View
                      className="w-14 h-14 rounded-2xl items-center justify-center mb-1.5"
                      style={{ backgroundColor: action.bg }}
                    >
                      <action.icon size={24} color={action.color} />
                    </View>
                    <Text className="text-gray-600 text-xs text-center font-medium" numberOfLines={2}>{action.label}</Text>
                  </PressableScale>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Stats Row */}
          <Animated.View entering={FadeInDown.delay(300).springify()} className="flex-row px-4 mt-4 gap-3">
            <PressableScale
              haptic="light"
              activeScale={0.97}
              onPress={() => router.push('/(tabs)/products')}
              className="flex-1 bg-white rounded-2xl p-4"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
            >
              <View className="w-9 h-9 bg-blue-50 rounded-xl items-center justify-center">
                <Users size={18} color="#3B82F6" />
              </View>
              <Text className="text-gray-900 font-bold text-2xl mt-2.5">0</Text>
              <Text className="text-gray-400 text-xs mt-0.5">My Customers</Text>
            </PressableScale>
            <PressableScale
              haptic="light"
              activeScale={0.97}
              onPress={() => router.push('/(tabs)/earnings')}
              className="flex-1 bg-white rounded-2xl p-4"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
            >
              <View className="w-9 h-9 bg-green-50 rounded-xl items-center justify-center">
                <TrendingUp size={18} color="#10B981" />
              </View>
              <Text className="text-gray-900 font-bold text-2xl mt-2.5">₹0</Text>
              <Text className="text-gray-400 text-xs mt-0.5">This Month</Text>
            </PressableScale>
          </Animated.View>

          {/* Referral Banner */}
          <Animated.View entering={FadeInDown.delay(400).springify()} className="px-4 mt-4">
            <LinearGradient
              colors={['#FF8C00', '#FF6B00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 22, padding: 18, shadowColor: '#FF6B00', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 4 }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-white font-extrabold text-lg">Refer & Earn ₹500</Text>
                  <Text className="text-white/85 text-xs mt-1 leading-4">Invite friends and earn for every signup</Text>
                  <PressableScale
                    haptic="medium"
                    onPress={handleInvite}
                    className="bg-white mt-3 py-2.5 px-5 rounded-full self-start flex-row items-center"
                  >
                    <Text className="text-orange-600 font-bold text-sm">Invite Now</Text>
                    <ChevronRight size={16} color="#EA580C" />
                  </PressableScale>
                </View>
                <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center">
                  <Gift size={34} color="#fff" />
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Top Products */}
          <Animated.View entering={FadeInDown.delay(500).springify()} className="px-4 mt-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-900 font-bold text-base">Top Products to Sell</Text>
              <PressableScale haptic="selection" onPress={() => router.push('/(tabs)/products')} className="flex-row items-center">
                <Text className="text-orange-500 text-sm font-semibold">View All</Text>
                <ChevronRight size={16} color="#FF8C00" />
              </PressableScale>
            </View>

            {PRODUCTS.map((product, index) => (
              <PressableScale
                key={index}
                haptic="light"
                activeScale={0.98}
                onPress={() => router.push({ pathname: '/(tabs)/products', params: { category: product.categoryId } })}
                className="bg-white rounded-2xl p-4 mb-3 flex-row items-center"
                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
              >
                <View className="w-12 h-12 bg-gray-50 rounded-2xl items-center justify-center mr-3">
                  <Text className="text-2xl">{product.logo}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold">{product.name}</Text>
                  <Text className="text-gray-400 text-xs mt-0.5">{product.type}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-green-600 font-extrabold">{product.commission}</Text>
                  <Text className="text-gray-400 text-xs">per sale</Text>
                </View>
              </PressableScale>
            ))}
          </Animated.View>

          {/* Training Section */}
          <Animated.View entering={FadeInDown.delay(600).springify()} className="px-4 mt-2 mb-8">
            <PressableScale
              haptic="light"
              activeScale={0.98}
              onPress={() => router.push('/(tabs)/learn')}
            >
              <LinearGradient
                colors={['#EFF6FF', '#F5F3FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center' }}
              >
                <LinearGradient
                  colors={['#2563EB', '#1D4ED8']}
                  style={{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
                >
                  <Star size={24} color="#fff" />
                </LinearGradient>
                <View className="flex-1">
                  <Text className="text-gray-900 font-bold">Complete Training</Text>
                  <Text className="text-gray-500 text-xs mt-0.5">Become a Certified Financial Advisor</Text>
                </View>
                <ChevronRight size={20} color="#3B82F6" />
              </LinearGradient>
            </PressableScale>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
      <ComingSoonModal
        visible={comingSoonModule !== null}
        module={comingSoonModule}
        onClose={() => setComingSoonModule(null)}
      />
    </View>
  );
}
