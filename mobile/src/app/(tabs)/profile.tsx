import { useState } from 'react';
import { View, Text, ScrollView, Modal, Share, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ChevronRight, Settings, HelpCircle, FileText, Share2, Star, LogOut, Award, Bell, Shield, CreditCard, Lock, X, Info } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useUserProfileStore } from '@/lib/user-profile-store';
import { useIncentiveStore } from '@/lib/incentive-store';
import { useNotificationStore } from '@/lib/notification-store';
import { toast } from '@/lib/toast-store';
import PressableScale from '@/components/PressableScale';
import { clearAuthToken } from '@/lib/auth-api';
import { KYC_ENFORCEMENT_DISABLED } from '@/lib/onboarding-flow';

type MenuItem = {
  icon: typeof Bell;
  label: string;
  description: string;
  action: string;
};

const MENU_ITEMS: MenuItem[] = [
  { icon: CreditCard, label: 'Bank Details', description: 'Manage payout account', action: 'route:/bank-details' },
  { icon: Bell, label: 'Notifications', description: 'Manage alerts', action: 'route:/notifications' },
  { icon: Shield, label: 'KYC Verification', description: 'Complete your KYC', action: 'route:/kyc' },
  { icon: Share2, label: 'Refer & Earn', description: 'Invite friends, earn ₹500', action: 'share' },
  { icon: FileText, label: 'Terms & Conditions', description: 'Payout terms & policies', action: 'route:/terms-and-conditions' },
  { icon: Info, label: 'About Us', description: 'Paisa Mart Pvt Ltd', action: 'route:/about-us' },
  { icon: HelpCircle, label: 'Help & Support', description: 'Get assistance', action: 'help' },
  { icon: Star, label: 'Rate Us', description: 'Share your feedback', action: 'rate' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const profile = useUserProfileStore((s) => s.profile);
  const clearProfile = useUserProfileStore((s) => s.clearProfile);
  const userKYC = useIncentiveStore((s) => s.userKYC);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const displayName = profile?.name?.trim() || 'Partner Name';
  const displayPhone = profile?.phoneNumber || '+91 98765 43210';
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const isKYCVerified = KYC_ENFORCEMENT_DISABLED || userKYC?.status === 'verified';
  const kycLabel = KYC_ENFORCEMENT_DISABLED ? 'KYC Disabled' : isKYCVerified ? 'Verified' : userKYC?.status === 'submitted' ? 'Under Review' : 'KYC Pending';
  const kycBadgeClassName = KYC_ENFORCEMENT_DISABLED ? 'bg-blue-500' : isKYCVerified ? 'bg-green-500' : userKYC?.status === 'submitted' ? 'bg-amber-500' : 'bg-orange-500';

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          'Join me on Paisa Mart and start earning by selling financial products! Sign up with my referral and we both earn ₹500. 💰',
      });
    } catch {
      toast.error('Could not open share sheet');
    }
  };

  const handleMenuPress = (action: string) => {
    if (action.startsWith('route:')) {
      router.push(action.replace('route:', '') as any);
    } else if (action === 'share') {
      handleShare();
    } else if (action === 'help') {
      toast.info('Support: paisamartpvtltd@gmail.com · +91 9908234067');
    } else if (action === 'rate') {
      toast.success('Thanks! Redirecting you to the store…');
    }
  };

  const handleEdit = () => {
    router.push({
      pathname: '/basic-info',
      params: {
        phone: profile?.phoneNumber || '',
        returnTo: '/(tabs)/profile',
      },
    });
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    try {
      await clearAuthToken();
      clearProfile();
      toast.success('Logged out successfully');
      router.dismissAll();
      router.replace('/');
    } catch {
      toast.error('Unable to log out. Please try again.');
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <LinearGradient
          colors={['#002561', '#0A3D91']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingBottom: 36, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
        >
          <View className="px-4 pt-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-white text-xl font-bold">Profile</Text>
              <PressableScale
                haptic="light"
                onPress={() => toast.info('Settings coming soon')}
                className="w-10 h-10 bg-white/10 rounded-full items-center justify-center"
              >
                <Settings size={20} color="#fff" />
              </PressableScale>
            </View>

            {/* Profile Card */}
            <View className="flex-row items-center mt-4">
              <LinearGradient
                colors={['#FF8C00', '#FF6B00']}
                style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}
              >
                <Text className="text-white font-bold text-2xl">{avatarLetter}</Text>
              </LinearGradient>
              <View className="flex-1">
                <Text className="text-white font-bold text-lg">{displayName}</Text>
                <Text className="text-white/70 text-sm">{displayPhone}</Text>
                <View className="flex-row items-center mt-1.5">
                  <View className={`${kycBadgeClassName} px-2 py-0.5 rounded-full`}>
                    <Text className="text-white text-xs font-bold">{kycLabel}</Text>
                  </View>
                </View>
              </View>
              <PressableScale
                haptic="light"
                onPress={handleEdit}
                className="bg-white/20 px-4 py-2 rounded-full"
              >
                <Text className="text-white text-sm font-semibold">Edit</Text>
              </PressableScale>
            </View>
          </View>
        </LinearGradient>

        <ScrollView keyboardShouldPersistTaps="handled" className="flex-1" showsVerticalScrollIndicator={false}>
          {!isKYCVerified && (
            <Animated.View entering={FadeInDown.delay(80).springify()} className="px-4 -mt-5 mb-4">
              <PressableScale
                haptic="light"
                activeScale={0.98}
                onPress={() => router.push('/kyc')}
                className="bg-orange-500 rounded-2xl p-4 flex-row items-center"
                style={{ shadowColor: '#0A3D91', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 4 }}
              >
                <View className="w-10 h-10 bg-white/20 rounded-xl items-center justify-center mr-3">
                  <Shield size={20} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold">Complete KYC</Text>
                  <Text className="text-white/80 text-xs mt-0.5">Verify your documents to open the dashboard</Text>
                </View>
                <ChevronRight size={20} color="#fff" />
              </PressableScale>
            </Animated.View>
          )}

          {/* Stats Card */}
          <Animated.View entering={FadeInDown.delay(100).springify()} className={`px-4 ${isKYCVerified ? '-mt-5' : ''}`}>
            <View
              className="bg-white rounded-3xl p-4 flex-row"
              style={{ shadowColor: '#0A3D91', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 4 }}
            >
              <View className="flex-1 items-center border-r border-gray-100">
                <Text className="text-gray-900 font-extrabold text-xl">12</Text>
                <Text className="text-gray-400 text-xs mt-1">Sales</Text>
              </View>
              <View className="flex-1 items-center border-r border-gray-100">
                <Text className="text-gray-900 font-extrabold text-xl">₹45K</Text>
                <Text className="text-gray-400 text-xs mt-1">Earned</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-gray-900 font-extrabold text-xl">4.8</Text>
                <Text className="text-gray-400 text-xs mt-1">Rating</Text>
              </View>
            </View>
          </Animated.View>

          {/* Certification */}
          <Animated.View entering={FadeInDown.delay(200).springify()} className="px-4 mt-4">
            <PressableScale haptic="light" activeScale={0.98} onPress={() => router.push('/(tabs)/learn')}>
              <LinearGradient
                colors={['#FEF9C3', '#FFEDD5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#FDE68A' }}
              >
                <LinearGradient
                  colors={['#FBBF24', '#F59E0B']}
                  style={{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
                >
                  <Award size={24} color="#fff" />
                </LinearGradient>
                <View className="flex-1">
                  <Text className="text-gray-900 font-bold">Certified Financial Advisor</Text>
                  <Text className="text-gray-500 text-xs mt-0.5">Complete training to get certified</Text>
                </View>
                <ChevronRight size={20} color="#F59E0B" />
              </LinearGradient>
            </PressableScale>
          </Animated.View>

          {/* Menu Items */}
          <Animated.View entering={FadeInDown.delay(300).springify()} className="px-4 mt-4">
            <View
              className="bg-white rounded-3xl overflow-hidden"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
            >
              {MENU_ITEMS.map((item, index) => (
                <PressableScale
                  key={index}
                  haptic="light"
                  activeScale={0.99}
                  onPress={() => handleMenuPress(item.action)}
                  className={`flex-row items-center p-4 ${
                    index < MENU_ITEMS.length - 1 ? 'border-b border-gray-50' : ''
                  }`}
                >
                  <View className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center mr-3">
                    <item.icon size={20} color="#6B7280" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-semibold">{item.label}</Text>
                    <Text className="text-gray-400 text-xs mt-0.5">{item.description}</Text>
                  </View>
                  {item.label === 'Notifications' && unreadCount > 0 && (
                    <View className="bg-orange-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1.5 mr-1">
                      <Text className="text-white text-xs font-bold">{unreadCount}</Text>
                    </View>
                  )}
                  <ChevronRight size={20} color="#D1D5DB" />
                </PressableScale>
              ))}
            </View>
          </Animated.View>

          {/* Payout Structure */}
          <Animated.View entering={FadeInDown.delay(320).springify()} className="px-4 mt-4">
            <View className="bg-white rounded-3xl overflow-hidden" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
              <LinearGradient colors={['#002561', '#003380']} style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Award size={18} color="#FFB800" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Payout Structure</Text>
              </LinearGradient>
              {/* Table Header */}
              <View style={{ flexDirection: 'row', backgroundColor: '#F8FAFF', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
                <Text style={{ width: 32, fontSize: 11, fontWeight: '700', color: '#6B7280' }}>S.No</Text>
                <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: '#6B7280' }}>Service</Text>
                <Text style={{ width: 140, fontSize: 11, fontWeight: '700', color: '#6B7280', textAlign: 'right' }}>Payout / Commission</Text>
              </View>
              {[
                { s: 1,  service: 'Credit Cards',       payout: 'Up to ₹3,000 per card' },
                { s: 2,  service: 'Bank Accounts',      payout: 'Up to ₹1,000 per account' },
                { s: 3,  service: 'Home Loans',         payout: 'Up to 1.5% of disbursed' },
                { s: 4,  service: 'Personal Loans',     payout: 'Up to 2% of disbursed' },
                { s: 5,  service: 'Vehicle Loans',      payout: 'Up to 2% of disbursed' },
                { s: 6,  service: 'Business Loans',     payout: 'Up to 2% of disbursed' },
                { s: 7,  service: 'Instant Loans',      payout: 'Up to 1.5% of disbursed' },
                { s: 8,  service: 'Health Insurance',   payout: 'Up to 15% of premium' },
                { s: 9,  service: 'Life Insurance',     payout: 'Up to 20% of premium' },
                { s: 10, service: 'Motor Insurance',    payout: 'Up to 20% of premium' },
                { s: 11, service: 'Gold Loans',         payout: '₹500 per ₹1L loan' },
              ].map((row, i) => (
                <View key={row.s} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: i % 2 === 0 ? '#fff' : '#F9FAFB', borderBottomWidth: i < 10 ? 1 : 0, borderBottomColor: '#F3F4F6' }}>
                  <Text style={{ width: 32, fontSize: 12, color: '#9CA3AF', fontWeight: '600' }}>{row.s}</Text>
                  <Text style={{ flex: 1, fontSize: 13, color: '#111827', fontWeight: '500' }}>{row.service}</Text>
                  <Text style={{ width: 140, fontSize: 12, color: '#002561', fontWeight: '600', textAlign: 'right' }}>{row.payout}</Text>
                </View>
              ))}
              <View style={{ padding: 12, backgroundColor: '#FFFBEB', borderTopWidth: 1, borderTopColor: '#FDE68A' }}>
                <Text style={{ fontSize: 11, color: '#92400E', fontWeight: '600', marginBottom: 4 }}>Note:</Text>
                <Text style={{ fontSize: 11, color: '#78350F', lineHeight: 16 }}>{`• Payouts subject to bank/NBFC/insurer approval and successful disbursement or policy issuance.
• Actual commissions may vary by institution and product.`}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Admin Portal Access */}
          <Animated.View entering={FadeInDown.delay(350).springify()} className="px-4 mt-4">
            <PressableScale
              haptic="light"
              activeScale={0.98}
              onPress={() => router.push('/admin')}
              className="bg-slate-800 rounded-2xl p-4 flex-row items-center"
            >
              <View className="w-10 h-10 bg-orange-500 rounded-xl items-center justify-center mr-3">
                <Lock size={20} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold">Admin Portal</Text>
                <Text className="text-gray-400 text-xs mt-0.5">Internal operations dashboard</Text>
              </View>
              <ChevronRight size={20} color="#94A3B8" />
            </PressableScale>
          </Animated.View>

          {/* Logout */}
          <Animated.View entering={FadeInDown.delay(400).springify()} className="px-4 mt-4 mb-6">
            <PressableScale
              haptic="medium"
              activeScale={0.98}
              onPress={() => setShowLogoutModal(true)}
              className="bg-white rounded-2xl p-4 flex-row items-center justify-center"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
            >
              <LogOut size={20} color="#EF4444" />
              <Text className="text-red-500 font-bold ml-2">Logout</Text>
            </PressableScale>
          </Animated.View>

          {/* App Version */}
          <View className="items-center mb-6">
            <Text className="text-gray-400 text-xs">App Version 1.0.0</Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Logout Confirmation Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/50 items-center justify-center px-8" onPress={() => setShowLogoutModal(false)}>
          <Pressable onPress={(e) => e.stopPropagation()} className="w-full">
            <View className="bg-white rounded-3xl p-6 items-center">
              <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-4">
                <LogOut size={28} color="#EF4444" />
              </View>
              <Text className="text-gray-900 font-bold text-xl">Log out?</Text>
              <Text className="text-gray-500 text-sm mt-2 text-center">
                You'll need to sign in again to access your earnings and products.
              </Text>
              <View className="flex-row gap-3 mt-6 w-full">
                <PressableScale
                  haptic="light"
                  onPress={() => setShowLogoutModal(false)}
                  className="flex-1 bg-gray-100 rounded-2xl py-3.5 items-center"
                >
                  <Text className="text-gray-700 font-bold">Cancel</Text>
                </PressableScale>
                <PressableScale
                  haptic="heavy"
                  onPress={handleLogout}
                  className="flex-1 bg-red-500 rounded-2xl py-3.5 items-center"
                >
                  <Text className="text-white font-bold">Log out</Text>
                </PressableScale>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
