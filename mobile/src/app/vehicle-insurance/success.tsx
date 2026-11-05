import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { CheckCircle, Home } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import { verifyServiceReceipt, type SavedServiceReceipt } from '@/lib/service-application-api';

export default function VehicleInsuranceSuccessScreen() {
  const router = useRouter();
  const { leadId } = useLocalSearchParams<{ leadId: string }>();
  const [saved, setSaved] = useState<SavedServiceReceipt | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setSaved(null); setError('');
    verifyServiceReceipt('motor-insurance', leadId || '').then(receipt => {
      if (active) { setSaved(receipt); void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
    }).catch(() => { if (active) setError('Unable to verify a saved application. Please check your reference and try again.'); });
    return () => { active = false; };
  }, [leadId]);

  const handleGoHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.dismissAll();
    router.push('/(tabs)/products');
  };

  // Check if it's after business hours (6 PM - 9 AM)
  const now = new Date();
  const hours = now.getHours();
  const isAfterHours = hours < 9 || hours >= 18;

  if (!saved) return <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
    <Text accessibilityRole={error ? 'alert' : undefined} className="text-gray-700 text-center">{error || 'Verifying your saved application…'}</Text>
    <Pressable accessibilityRole="button" onPress={handleGoHome} className="bg-blue-500 rounded-xl p-4 mt-6"><Text className="text-white">Back to Home</Text></Pressable>
  </SafeAreaView>;

  return (
    <View className="flex-1 bg-gradient-to-b from-blue-50 to-white">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Content */}
        <View className="flex-1 justify-center items-center px-6">
          {/* Success Icon */}
          <Animated.View
            entering={FadeIn.delay(100).springify()}
            className="mb-8"
          >
            <View className="w-32 h-32 bg-blue-100 rounded-full items-center justify-center">
              <View className="w-28 h-28 bg-blue-200 rounded-full items-center justify-center">
                <CheckCircle size={80} color="#3B82F6" strokeWidth={2.5} />
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
              Thank you. Our team from Paisa Mart will contact you {isAfterHours ? 'the next business morning' : 'within the next few hours'} with insurance quotes from top providers.
            </Text>
          </Animated.View>

          {/* Lead ID Badge */}
          <Animated.View
            entering={FadeInDown.delay(400)}
            className="mb-8"
          >
            <View className="bg-white px-6 py-4 rounded-2xl border-2 border-blue-200">
              <Text className="text-gray-500 text-sm text-center mb-1">Your Reference ID</Text>
              <Text className="text-gray-900 font-bold text-xl text-center">{saved.referenceNumber}</Text>
            </View>
          </Animated.View>

          {/* Info Box */}
          <Animated.View
            entering={FadeInDown.delay(500)}
            className="mb-8"
          >
            <View className="bg-orange-50 p-4 rounded-xl border border-orange-200">
              <Text className="text-orange-700 text-sm text-center">
                💡 Keep your reference ID handy for faster assistance
              </Text>
            </View>
          </Animated.View>

          {/* Additional Info */}
          <Animated.View
            entering={FadeInDown.delay(600)}
            className="mb-4"
          >
            <View className="bg-green-50 p-4 rounded-xl border border-green-200">
              <Text className="text-green-700 text-sm text-center font-medium">
                ✅ You will receive quotes from multiple insurance providers
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Bottom Button */}
        <Animated.View
          entering={FadeInUp.delay(700)}
          className="px-6 pb-8"
        >
          <Pressable
            onPress={handleGoHome}
            className="bg-blue-500 rounded-2xl py-5 flex-row items-center justify-center"
            style={{
              shadowColor: '#3B82F6',
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
