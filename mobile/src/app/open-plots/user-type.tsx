import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, User, Briefcase } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';

export default function UserTypeScreen() {
  const router = useRouter();
  const { intent } = useLocalSearchParams<{ intent: 'buy' | 'sell' }>();

  const handleUserTypeSelect = (userType: 'customer' | 'agent') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: `/open-plots/${intent}-location`,
      params: { intent, userType },
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
            <Text className="text-gray-500 text-xs mt-0.5">Step 2 of 6</Text>
          </View>
          <View className="w-10" />
        </View>

        {/* Progress Bar */}
        <View className="px-4 pt-3">
          <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <View className="h-full w-[33.33%] bg-orange-500 rounded-full" />
          </View>
        </View>

        {/* Content */}
        <View className="flex-1 justify-center px-6 pb-20">
          {/* Title Section */}
          <Animated.View entering={FadeInDown.delay(100)} className="mb-8">
            <Text className="text-gray-900 font-bold text-3xl text-center mb-3">
              Are you a customer or an agent?
            </Text>
            <Text className="text-gray-600 text-base text-center">
              This helps us connect you with the right team
            </Text>
          </Animated.View>

          {/* Options */}
          <View className="gap-4">
            {/* Customer Option */}
            <Animated.View entering={FadeInDown.delay(200)}>
              <Pressable
                onPress={() => handleUserTypeSelect('customer')}
                className="bg-white rounded-3xl p-6 border-2 border-purple-100 active:border-purple-500 active:scale-[0.98]"
                style={{
                  shadowColor: '#A855F7',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center">
                  <View className="w-16 h-16 bg-purple-100 rounded-2xl items-center justify-center mr-4">
                    <User size={32} color="#A855F7" strokeWidth={2} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-bold text-xl mb-1">
                      I'm a Customer
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {intent === 'buy' ? 'Looking to buy a plot' : 'Want to sell my plot'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            </Animated.View>

            {/* Agent Option */}
            <Animated.View entering={FadeInDown.delay(300)}>
              <Pressable
                onPress={() => handleUserTypeSelect('agent')}
                className="bg-white rounded-3xl p-6 border-2 border-orange-100 active:border-orange-500 active:scale-[0.98]"
                style={{
                  shadowColor: '#F97316',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center">
                  <View className="w-16 h-16 bg-orange-100 rounded-2xl items-center justify-center mr-4">
                    <Briefcase size={32} color="#F97316" strokeWidth={2} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-bold text-xl mb-1">
                      I'm an Agent
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {intent === 'buy' ? 'Helping clients find plots' : 'Listing client properties'}
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
