import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { User, ChevronRight, Settings, HelpCircle, FileText, Share2, Star, LogOut, Award, Bell, Shield, CreditCard } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const MENU_ITEMS = [
  { icon: CreditCard, label: 'Bank Details', description: 'Manage payout account' },
  { icon: Bell, label: 'Notifications', description: 'Manage alerts' },
  { icon: Shield, label: 'KYC Verification', description: 'Complete your KYC' },
  { icon: Share2, label: 'Refer & Earn', description: 'Invite friends, earn ₹500' },
  { icon: FileText, label: 'Terms & Conditions', description: 'Read our policies' },
  { icon: HelpCircle, label: 'Help & Support', description: 'Get assistance' },
  { icon: Star, label: 'Rate Us', description: 'Share your feedback' },
];

export default function ProfileScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <LinearGradient
          colors={['#002561', '#003380']}
          style={{ paddingBottom: 30 }}
        >
          <View className="px-4 pt-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-white text-xl font-semibold">Profile</Text>
              <Pressable className="w-10 h-10 bg-white/10 rounded-full items-center justify-center">
                <Settings size={20} color="#fff" />
              </Pressable>
            </View>

            {/* Profile Card */}
            <View className="flex-row items-center mt-4">
              <View className="w-16 h-16 bg-orange-500 rounded-full items-center justify-center mr-4">
                <Text className="text-white font-bold text-2xl">P</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold text-lg">Partner Name</Text>
                <Text className="text-white/70 text-sm">+91 98765 43210</Text>
                <View className="flex-row items-center mt-1">
                  <View className="bg-green-500 px-2 py-0.5 rounded-full">
                    <Text className="text-white text-xs font-medium">Verified</Text>
                  </View>
                </View>
              </View>
              <Pressable className="bg-white/20 px-3 py-1.5 rounded-full">
                <Text className="text-white text-sm">Edit</Text>
              </Pressable>
            </View>
          </View>
        </LinearGradient>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Stats Card */}
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            className="px-4 -mt-4"
          >
            <View className="bg-white rounded-2xl p-4 shadow-sm flex-row">
              <View className="flex-1 items-center border-r border-gray-100">
                <Text className="text-gray-800 font-bold text-xl">12</Text>
                <Text className="text-gray-400 text-xs mt-1">Sales</Text>
              </View>
              <View className="flex-1 items-center border-r border-gray-100">
                <Text className="text-gray-800 font-bold text-xl">₹45K</Text>
                <Text className="text-gray-400 text-xs mt-1">Earned</Text>
              </View>
              <View className="flex-1 items-center">
                <Text className="text-gray-800 font-bold text-xl">4.8</Text>
                <Text className="text-gray-400 text-xs mt-1">Rating</Text>
              </View>
            </View>
          </Animated.View>

          {/* Certification */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            className="px-4 mt-4"
          >
            <Pressable className="bg-gradient-to-r from-yellow-50 to-orange-50 bg-yellow-50 rounded-xl p-4 border border-yellow-200 flex-row items-center">
              <View className="w-12 h-12 bg-yellow-400 rounded-xl items-center justify-center mr-3">
                <Award size={24} color="#fff" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 font-semibold">Certified Financial Advisor</Text>
                <Text className="text-gray-500 text-xs mt-0.5">Complete training to get certified</Text>
              </View>
              <ChevronRight size={20} color="#F59E0B" />
            </Pressable>
          </Animated.View>

          {/* Menu Items */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            className="px-4 mt-4"
          >
            <View className="bg-white rounded-2xl overflow-hidden">
              {MENU_ITEMS.map((item, index) => (
                <Pressable
                  key={index}
                  className={`flex-row items-center p-4 ${
                    index < MENU_ITEMS.length - 1 ? 'border-b border-gray-50' : ''
                  }`}
                >
                  <View className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center mr-3">
                    <item.icon size={20} color="#6B7280" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-800 font-medium">{item.label}</Text>
                    <Text className="text-gray-400 text-xs mt-0.5">{item.description}</Text>
                  </View>
                  <ChevronRight size={20} color="#D1D5DB" />
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Logout */}
          <Animated.View
            entering={FadeInDown.delay(400).springify()}
            className="px-4 mt-4 mb-6"
          >
            <Pressable className="bg-white rounded-xl p-4 flex-row items-center justify-center">
              <LogOut size={20} color="#EF4444" />
              <Text className="text-red-500 font-semibold ml-2">Logout</Text>
            </Pressable>
          </Animated.View>

          {/* App Version */}
          <View className="items-center mb-6">
            <Text className="text-gray-400 text-xs">App Version 1.0.0</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
