import { useState } from 'react';
import { View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, MapPin } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function SellLocationScreen() {
  const router = useRouter();
  const { intent, userType } = useLocalSearchParams<{ intent: string; userType: string }>();
  const [location, setLocation] = useState('');

  const handleNext = () => {
    if (!location.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/open-plots/sell-plot-size',
      params: { intent, userType, location: location.trim() },
    } as any);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gradient-to-b from-slate-50 to-white"
    >
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
            <Text className="text-gray-900 font-bold text-xl">Sell a Plot</Text>
            <Text className="text-gray-500 text-xs mt-0.5">Step 3 of 6</Text>
          </View>
          <View className="w-10" />
        </View>

        {/* Progress Bar */}
        <View className="px-4 pt-3">
          <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <View className="h-full w-[50%] bg-green-500 rounded-full" />
          </View>
        </View>

        {/* Content */}
        <View className="flex-1 px-6 pt-12">
          {/* Icon */}
          <Animated.View
            entering={FadeInDown.delay(100)}
            className="items-center mb-6"
          >
            <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center">
              <MapPin size={40} color="#22C55E" strokeWidth={2} />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInDown.delay(200)} className="mb-8">
            <Text className="text-gray-900 font-bold text-3xl text-center mb-3">
              Where is your property located?
            </Text>
            <Text className="text-gray-600 text-base text-center">
              Enter the city or location
            </Text>
          </Animated.View>

          {/* Input */}
          <Animated.View entering={FadeInDown.delay(300)}>
            <TextInput
              className="bg-white rounded-2xl px-6 py-5 text-gray-900 text-lg border-2 border-gray-200 focus:border-green-500"
              placeholder="e.g., Hyderabad, Bangalore, Mumbai"
              placeholderTextColor="#9CA3AF"
              value={location}
              onChangeText={setLocation}
              autoFocus
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
              }}
            />
          </Animated.View>
        </View>

        {/* Next Button */}
        <View className="px-6 pb-8">
          <Pressable
            onPress={handleNext}
            disabled={!location.trim()}
            className={`rounded-2xl py-5 items-center ${
              location.trim() ? 'bg-green-500' : 'bg-gray-300'
            }`}
            style={{
              shadowColor: location.trim() ? '#22C55E' : '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: location.trim() ? 0.3 : 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text className="text-white font-bold text-lg">Next</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
