import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Wallet, TrendingUp, ArrowDownLeft, ArrowUpRight, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const TRANSACTIONS = [
  { type: 'credit', title: 'HDFC Credit Card Sale', amount: '₹2,100', date: 'Today', status: 'completed' },
  { type: 'credit', title: 'SBI Personal Loan', amount: '₹3,500', date: 'Yesterday', status: 'completed' },
  { type: 'debit', title: 'Withdrawal to Bank', amount: '₹5,000', date: '2 days ago', status: 'completed' },
  { type: 'credit', title: 'Referral Bonus', amount: '₹500', date: '3 days ago', status: 'completed' },
  { type: 'credit', title: 'ICICI Credit Card', amount: '₹1,800', date: '5 days ago', status: 'pending' },
];

export default function EarningsScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <LinearGradient
          colors={['#002561', '#003380']}
          style={{ paddingBottom: 20 }}
        >
          <View className="px-4 pt-2">
            <Text className="text-white text-xl font-semibold">My Earnings</Text>

            {/* Balance Card */}
            <View className="bg-white/10 rounded-2xl p-4 mt-4">
              <Text className="text-white/70 text-xs">Available Balance</Text>
              <Text className="text-white font-bold text-3xl mt-1">₹7,900</Text>

              <View className="flex-row mt-4 gap-3">
                <Pressable className="flex-1 bg-orange-500 rounded-xl py-3 flex-row items-center justify-center">
                  <ArrowUpRight size={18} color="#fff" />
                  <Text className="text-white font-semibold ml-2">Withdraw</Text>
                </Pressable>
                <Pressable className="flex-1 bg-white/20 rounded-xl py-3 flex-row items-center justify-center">
                  <Clock size={18} color="#fff" />
                  <Text className="text-white font-semibold ml-2">History</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </LinearGradient>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Stats */}
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            className="flex-row px-4 mt-4 gap-3"
          >
            <View className="flex-1 bg-white rounded-xl p-4">
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-green-100 rounded-lg items-center justify-center">
                  <TrendingUp size={16} color="#22C55E" />
                </View>
              </View>
              <Text className="text-gray-800 font-bold text-xl mt-2">₹12,400</Text>
              <Text className="text-gray-400 text-xs">This Month</Text>
            </View>
            <View className="flex-1 bg-white rounded-xl p-4">
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-blue-100 rounded-lg items-center justify-center">
                  <Wallet size={16} color="#3B82F6" />
                </View>
              </View>
              <Text className="text-gray-800 font-bold text-xl mt-2">₹45,600</Text>
              <Text className="text-gray-400 text-xs">Total Earned</Text>
            </View>
          </Animated.View>

          {/* Pending */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            className="px-4 mt-4"
          >
            <View className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-gray-600 text-xs">Pending Earnings</Text>
                  <Text className="text-gray-800 font-bold text-lg">₹1,800</Text>
                </View>
                <View className="bg-yellow-400 px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-medium">Processing</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Transactions */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            className="px-4 mt-4"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-800 font-semibold">Recent Transactions</Text>
              <Pressable className="flex-row items-center">
                <Text className="text-orange-500 text-sm font-medium">View All</Text>
                <ChevronRight size={16} color="#FF8C00" />
              </Pressable>
            </View>

            {TRANSACTIONS.map((transaction, index) => (
              <View
                key={index}
                className="bg-white rounded-xl p-4 mb-3 flex-row items-center"
              >
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                    transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                  }`}
                >
                  {transaction.type === 'credit' ? (
                    <ArrowDownLeft size={20} color="#22C55E" />
                  ) : (
                    <ArrowUpRight size={20} color="#EF4444" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-medium">{transaction.title}</Text>
                  <View className="flex-row items-center mt-0.5">
                    <Text className="text-gray-400 text-xs">{transaction.date}</Text>
                    {transaction.status === 'pending' && (
                      <View className="flex-row items-center ml-2">
                        <Clock size={10} color="#F59E0B" />
                        <Text className="text-yellow-500 text-xs ml-1">Pending</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text
                  className={`font-bold ${
                    transaction.type === 'credit' ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {transaction.type === 'credit' ? '+' : '-'}{transaction.amount}
                </Text>
              </View>
            ))}
          </Animated.View>

          <View className="h-6" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
