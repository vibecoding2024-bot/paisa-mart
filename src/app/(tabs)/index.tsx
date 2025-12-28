import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, ChevronRight, CreditCard, Landmark, Shield, TrendingUp, Users, Wallet, Star, Gift, Zap, Home, Car, Briefcase, Heart, UserCheck, Gem, Building2 } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const QUICK_ACTIONS = [
  { icon: CreditCard, label: 'Credit Cards', color: '#3B82F6', bg: '#EFF6FF' },
  { icon: Zap, label: 'Insta Loans', color: '#F59E0B', bg: '#FFFBEB' },
  { icon: UserCheck, label: 'Personal Loans', color: '#10B981', bg: '#ECFDF5' },
  { icon: Home, label: 'Home Loans', color: '#8B5CF6', bg: '#F5F3FF' },
  { icon: Car, label: 'Vehicle Loans', color: '#EF4444', bg: '#FEF2F2' },
  { icon: Landmark, label: 'Bank Accounts', color: '#06B6D4', bg: '#ECFEFF' },
  { icon: Briefcase, label: 'Business Loans', color: '#EC4899', bg: '#FDF2F8' },
  { icon: Gem, label: 'Gold Loans', color: '#EAB308', bg: '#FEFCE8' },
  { icon: Building2, label: 'Real Estate', color: '#0EA5E9', bg: '#F0F9FF' },
  { icon: Heart, label: 'Health Insurance', color: '#22C55E', bg: '#F0FDF4' },
  { icon: Shield, label: 'Life Insurance', color: '#6366F1', bg: '#EEF2FF' },
];

const PRODUCTS = [
  { name: 'HDFC Credit Card', commission: '₹2,100', type: 'Credit Card', logo: '🏦' },
  { name: 'ICICI Personal Loan', commission: '₹3,000', type: 'Loan', logo: '🏛️' },
  { name: 'Axis Savings Account', commission: '₹500', type: 'Savings', logo: '💳' },
  { name: 'LIC Term Insurance', commission: '₹1,500', type: 'Insurance', logo: '🛡️' },
];

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <LinearGradient
          colors={['#002561', '#003380']}
          style={{ paddingBottom: 20 }}
        >
          <View className="px-4 pt-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-orange-500 rounded-full items-center justify-center mr-3">
                  <Text className="text-white font-bold text-lg">R</Text>
                </View>
                <View>
                  <Text className="text-white/70 text-xs">Welcome back,</Text>
                  <Text className="text-white font-semibold text-base">Partner!</Text>
                </View>
              </View>
              <Pressable className="w-10 h-10 bg-white/10 rounded-full items-center justify-center">
                <Bell size={20} color="#fff" />
              </Pressable>
            </View>

            {/* Earnings Card */}
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              className="bg-white/10 rounded-2xl p-4 mt-4"
            >
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-white/70 text-xs">Total Earnings</Text>
                  <Text className="text-white font-bold text-2xl mt-1">₹0</Text>
                  <Text className="text-green-400 text-xs mt-1">Start selling to earn!</Text>
                </View>
                <Pressable className="bg-orange-500 px-4 py-2 rounded-full flex-row items-center">
                  <Text className="text-white font-semibold text-sm mr-1">Withdraw</Text>
                  <ChevronRight size={16} color="#fff" />
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </LinearGradient>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Quick Actions */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            className="px-4 -mt-3"
          >
            <View className="bg-white rounded-2xl p-4 shadow-sm">
              <Text className="text-gray-800 font-semibold mb-3">Quick Actions</Text>
              <View className="flex-row flex-wrap justify-between">
                {QUICK_ACTIONS.map((action, index) => (
                  <Pressable key={index} className="items-center mb-4" style={{ width: '30%' }}>
                    <View
                      className="w-12 h-12 rounded-2xl items-center justify-center mb-1.5"
                      style={{ backgroundColor: action.bg }}
                    >
                      <action.icon size={22} color={action.color} />
                    </View>
                    <Text className="text-gray-600 text-xs text-center" numberOfLines={2}>{action.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Stats Row */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            className="flex-row px-4 mt-4 gap-3"
          >
            <View className="flex-1 bg-white rounded-xl p-3">
              <View className="flex-row items-center">
                <Users size={18} color="#3B82F6" />
                <Text className="text-gray-500 text-xs ml-2">My Customers</Text>
              </View>
              <Text className="text-gray-800 font-bold text-xl mt-2">0</Text>
            </View>
            <View className="flex-1 bg-white rounded-xl p-3">
              <View className="flex-row items-center">
                <TrendingUp size={18} color="#10B981" />
                <Text className="text-gray-500 text-xs ml-2">This Month</Text>
              </View>
              <Text className="text-gray-800 font-bold text-xl mt-2">₹0</Text>
            </View>
          </Animated.View>

          {/* Referral Banner */}
          <Animated.View
            entering={FadeInDown.delay(400).springify()}
            className="px-4 mt-4"
          >
            <LinearGradient
              colors={['#FF8C00', '#FF6B00']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 16, padding: 16 }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white font-bold text-base">Refer & Earn ₹500</Text>
                  <Text className="text-white/80 text-xs mt-1">Invite friends and earn for each signup</Text>
                </View>
                <Gift size={40} color="#fff" />
              </View>
              <Pressable className="bg-white mt-3 py-2 px-4 rounded-full self-start">
                <Text className="text-orange-500 font-semibold text-sm">Invite Now</Text>
              </Pressable>
            </LinearGradient>
          </Animated.View>

          {/* Top Products */}
          <Animated.View
            entering={FadeInDown.delay(500).springify()}
            className="px-4 mt-4"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-800 font-semibold">Top Products to Sell</Text>
              <Pressable className="flex-row items-center">
                <Text className="text-orange-500 text-sm font-medium">View All</Text>
                <ChevronRight size={16} color="#FF8C00" />
              </Pressable>
            </View>

            {PRODUCTS.map((product, index) => (
              <Pressable
                key={index}
                className="bg-white rounded-xl p-4 mb-3 flex-row items-center"
              >
                <View className="w-12 h-12 bg-gray-100 rounded-xl items-center justify-center mr-3">
                  <Text className="text-2xl">{product.logo}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-medium">{product.name}</Text>
                  <Text className="text-gray-500 text-xs mt-0.5">{product.type}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-green-600 font-bold">{product.commission}</Text>
                  <Text className="text-gray-400 text-xs">per sale</Text>
                </View>
              </Pressable>
            ))}
          </Animated.View>

          {/* Training Section */}
          <Animated.View
            entering={FadeInDown.delay(600).springify()}
            className="px-4 mt-2 mb-6"
          >
            <View className="bg-blue-50 rounded-2xl p-4">
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-blue-600 rounded-xl items-center justify-center mr-3">
                  <Star size={24} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-semibold">Complete Training</Text>
                  <Text className="text-gray-500 text-xs mt-0.5">Become a Certified Financial Advisor</Text>
                </View>
                <ChevronRight size={20} color="#3B82F6" />
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
