import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { CreditCard, Wallet, TrendingUp, ArrowUpRight, Plus, History, Settings, ArrowLeft } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

const CARD_TYPES = [
  { id: '1', name: 'Credit Cards', icon: CreditCard, color: '#3B82F6', bg: '#EFF6FF', count: 0 },
  { id: '2', name: 'Debit Cards', icon: Wallet, color: '#10B981', bg: '#ECFDF5', count: 0 },
];

const RECENT_TRANSACTIONS = [
  { id: '1', title: 'Card Application - HDFC', amount: '₹2,100', date: 'Pending', status: 'pending' },
  { id: '2', title: 'Card Application - Axis', amount: '₹1,800', date: 'Approved', status: 'success' },
];

export default function CashCardsScreen() {
  const router = useRouter();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View className="flex-1 bg-gray-50">
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
              <Text className="text-white text-2xl font-bold">Cash & Credit Cards</Text>
              <Text className="text-white/70 text-sm mt-1">Manage and track all your card applications</Text>
            </Animated.View>

            {/* Stats Card */}
            <Animated.View
              entering={FadeInDown.delay(200).springify()}
              className="bg-white/10 rounded-2xl p-5 mt-5 backdrop-blur-xl"
            >
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-white/70 text-xs uppercase tracking-wide">Total Earnings</Text>
                  <Text className="text-white font-bold text-3xl mt-1">₹0</Text>
                  <Text className="text-green-400 text-xs mt-2">No applications yet</Text>
                </View>
                <View className="bg-orange-500 w-14 h-14 rounded-2xl items-center justify-center">
                  <TrendingUp size={28} color="#fff" />
                </View>
              </View>
            </Animated.View>
          </View>
        </LinearGradient>

        <ScrollView
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
                      <Text className={`font-bold text-base ${
                        transaction.status === 'success' ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {transaction.amount}
                      </Text>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            )}
          </View>

          {/* Info Card */}
          <Animated.View
            entering={FadeInUp.delay(900).springify()}
            className="mx-6 mt-6 bg-blue-50 rounded-2xl p-5"
          >
            <View className="flex-row items-start">
              <View className="w-10 h-10 bg-blue-100 rounded-xl items-center justify-center mr-3">
                <Settings size={20} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-blue-900 font-semibold text-sm">Paisa Mart Partner Tip</Text>
                <Text className="text-blue-700 text-xs mt-1 leading-5">
                  Earn up to ₹4,000 per credit card application. Track all your applications and earnings in one place.
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
