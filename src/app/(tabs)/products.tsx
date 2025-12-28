import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, CreditCard, Landmark, Shield, Wallet, TrendingUp, Car, Home, Briefcase, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const CATEGORIES = [
  { icon: CreditCard, label: 'Credit Cards', count: 25, color: '#3B82F6', bg: '#EFF6FF' },
  { icon: Landmark, label: 'Loans', count: 18, color: '#10B981', bg: '#ECFDF5' },
  { icon: Shield, label: 'Insurance', count: 12, color: '#8B5CF6', bg: '#F5F3FF' },
  { icon: Wallet, label: 'Savings Account', count: 15, color: '#F59E0B', bg: '#FFFBEB' },
  { icon: TrendingUp, label: 'Demat Account', count: 8, color: '#EF4444', bg: '#FEF2F2' },
  { icon: Briefcase, label: 'Business Loan', count: 10, color: '#06B6D4', bg: '#ECFEFF' },
];

const FEATURED_PRODUCTS = [
  { name: 'HDFC Regalia Credit Card', commission: '₹2,100', category: 'Credit Card', rating: '4.8' },
  { name: 'SBI Personal Loan', commission: '₹3,500', category: 'Loan', rating: '4.5' },
  { name: 'ICICI Prudential Life', commission: '₹2,000', category: 'Insurance', rating: '4.7' },
  { name: 'Kotak 811 Account', commission: '₹400', category: 'Savings', rating: '4.6' },
];

export default function ProductsScreen() {
  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <LinearGradient
          colors={['#002561', '#003380']}
          style={{ paddingBottom: 16 }}
        >
          <View className="px-4 pt-2">
            <Text className="text-white text-xl font-semibold">Products</Text>
            <Text className="text-white/70 text-sm mt-1">Browse financial products to sell</Text>

            {/* Search Bar */}
            <Pressable className="bg-white/10 rounded-xl px-4 py-3 mt-4 flex-row items-center">
              <Search size={20} color="#fff" />
              <Text className="text-white/50 ml-3">Search products...</Text>
            </Pressable>
          </View>
        </LinearGradient>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Categories */}
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            className="px-4 mt-4"
          >
            <Text className="text-gray-800 font-semibold mb-3">Categories</Text>
            <View className="flex-row flex-wrap gap-3">
              {CATEGORIES.map((category, index) => (
                <Pressable
                  key={index}
                  className="bg-white rounded-xl p-4 flex-row items-center"
                  style={{ width: '48%' }}
                >
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: category.bg }}
                  >
                    <category.icon size={20} color={category.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-800 font-medium text-sm">{category.label}</Text>
                    <Text className="text-gray-400 text-xs">{category.count} products</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Featured Products */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            className="px-4 mt-6"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-800 font-semibold">Featured Products</Text>
              <Pressable className="flex-row items-center">
                <Text className="text-orange-500 text-sm font-medium">See All</Text>
                <ChevronRight size={16} color="#FF8C00" />
              </Pressable>
            </View>

            {FEATURED_PRODUCTS.map((product, index) => (
              <Pressable
                key={index}
                className="bg-white rounded-xl p-4 mb-3"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-gray-800 font-medium">{product.name}</Text>
                    <View className="flex-row items-center mt-1">
                      <Text className="text-gray-400 text-xs">{product.category}</Text>
                      <View className="w-1 h-1 bg-gray-300 rounded-full mx-2" />
                      <Text className="text-yellow-500 text-xs">★ {product.rating}</Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-green-600 font-bold">{product.commission}</Text>
                    <Text className="text-gray-400 text-xs">commission</Text>
                  </View>
                </View>
                <Pressable className="bg-orange-500 rounded-lg py-2 mt-3">
                  <Text className="text-white text-center font-semibold text-sm">Sell Now</Text>
                </Pressable>
              </Pressable>
            ))}
          </Animated.View>

          <View className="h-6" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
