import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, ShoppingBag, Tag } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function OpenPlotsIntentScreen() {
  const router = useRouter();

  const handleIntentSelect = (intent: 'buy' | 'sell') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/open-plots/user-type',
      params: { intent },
    } as any);
  };

  return (
    <View className="flex-1 bg-gradient-to-b from-slate-50 to-white">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <View className="flex-1 items-center">
            <Text className="text-gray-900 font-bold text-xl">Open Plots</Text>
            <Text className="text-gray-500 text-xs mt-0.5">Step 1 of 6</Text>
          </View>
          <View className="w-10" />
        </View>

        {/* Progress Bar */}
        <View className="px-4 pt-3">
          <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <View className="h-full w-[16.66%] bg-orange-500 rounded-full" />
          </View>
        </View>

        {/* Content */}
        <View className="flex-1 justify-center px-6 pb-20">
          {/* Title Section */}
          <Animated.View entering={FadeInDown.delay(100)} className="mb-8">
            <Text className="text-gray-900 font-bold text-3xl text-center mb-3">
              What would you like to do?
            </Text>
            <Text className="text-gray-600 text-base text-center">
              Let us know so we can guide you better
            </Text>
          </Animated.View>

          {/* Options */}
          <View className="gap-4">
            {/* Buy Option */}
            <Animated.View entering={FadeInDown.delay(200)}>
              <Pressable
                onPress={() => handleIntentSelect('buy')}
                className="bg-white rounded-3xl p-6 border-2 border-blue-100 active:border-blue-500 active:scale-[0.98]"
                style={{
                  shadowColor: '#3B82F6',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center">
                  <View className="w-16 h-16 bg-blue-100 rounded-2xl items-center justify-center mr-4">
                    <ShoppingBag size={32} color="#3B82F6" strokeWidth={2} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-bold text-xl mb-1">
                      Buy a Plot
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      Find your perfect plot
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Animated.View>

            {/* Sell Option */}
            <Animated.View entering={FadeInDown.delay(300)}>
              <Pressable
                onPress={() => handleIntentSelect('sell')}
                className="bg-white rounded-3xl p-6 border-2 border-green-100 active:border-green-500 active:scale-[0.98]"
                style={{
                  shadowColor: '#22C55E',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center">
                  <View className="w-16 h-16 bg-green-100 rounded-2xl items-center justify-center mr-4">
                    <Tag size={32} color="#22C55E" strokeWidth={2} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-bold text-xl mb-1">
                      Sell a Plot
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      List your property with us
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
