import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { CheckCircle, Home } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function SuccessScreen() {
  const router = useRouter();
  const { leadId, siteVisit } = useLocalSearchParams<{ leadId: string; siteVisit?: string }>();

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleGoHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.dismissAll();
    router.push('/(tabs)/products');
  };

  // Check if it's after business hours (6 PM - 9 AM)
  const now = new Date();
  const hours = now.getHours();
  const isAfterHours = hours < 9 || hours >= 18;

  return (
    <View className="flex-1 bg-gradient-to-b from-green-50 to-white">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Content */}
        <View className="flex-1 justify-center items-center px-6">
          {/* Success Icon */}
          <Animated.View
            entering={FadeIn.delay(100).springify()}
            className="mb-8"
          >
            <View className="w-32 h-32 bg-green-100 rounded-full items-center justify-center">
              <View className="w-28 h-28 bg-green-200 rounded-full items-center justify-center">
                <CheckCircle size={80} color="#22C55E" strokeWidth={2.5} />
              </View>
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View
            entering={FadeInDown.delay(200)}
            className="mb-4"
          >
            <Text className="text-gray-900 font-bold text-3xl text-center">
              Request submitted successfully! 🎉
            </Text>
          </Animated.View>

          {/* Message */}
          <Animated.View
            entering={FadeInDown.delay(300)}
            className="mb-8"
          >
            <Text className="text-gray-600 text-lg text-center leading-7">
              Thank you. Our team from Paisa Mart will contact you {isAfterHours ? 'the next business morning' : 'within the next few hours'} to understand your requirement better.
            </Text>
          </Animated.View>

          {/* Lead ID Badge */}
          <Animated.View
            entering={FadeInDown.delay(400)}
            className="mb-8"
          >
            <View className="bg-white px-6 py-4 rounded-2xl border-2 border-green-200">
              <Text className="text-gray-500 text-sm text-center mb-1">Your Reference ID</Text>
              <Text className="text-gray-900 font-bold text-xl text-center">{leadId}</Text>
            </View>
          </Animated.View>

          {/* Site Visit Badge */}
          {siteVisit === 'true' && (
            <Animated.View
              entering={FadeInDown.delay(500)}
              className="mb-8"
            >
              <View className="bg-blue-50 px-6 py-3 rounded-xl border border-blue-200">
                <Text className="text-blue-700 text-sm text-center font-medium">
                  ✅ Site visit assistance requested
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Info Box */}
          <Animated.View
            entering={FadeInDown.delay(600)}
            className="mb-8"
          >
            <View className="bg-orange-50 p-4 rounded-xl border border-orange-200">
              <Text className="text-orange-700 text-sm text-center">
                💡 Keep your reference ID handy for faster assistance
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Bottom Buttons */}
        <Animated.View
          entering={FadeInUp.delay(700)}
          className="px-6 pb-8"
        >
          <Pressable
            onPress={handleGoHome}
            className="bg-green-500 rounded-2xl py-5 flex-row items-center justify-center"
            style={{
              shadowColor: '#22C55E',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Home size={24} color="#fff" strokeWidth={2} />
            <Text className="text-white font-bold text-lg ml-2">
              Back to Home
            </Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
