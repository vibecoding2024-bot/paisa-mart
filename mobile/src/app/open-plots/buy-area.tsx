import { useState } from 'react';
import { View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, MapPinned } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';

export default function BuyAreaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    intent: string;
    userType: string;
    location: string;
  }>();
  const [area, setArea] = useState('');

  const handleNext = () => {
    if (!area.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/open-plots/buy-plot-size',
      params: { ...params, area: area.trim() },
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
            <Text className="text-gray-900 font-bold text-xl">Buy a Plot</Text>
            <Text className="text-gray-500 text-xs mt-0.5">Step 4 of 6</Text>
          </View>
          <View className="w-10" />
        </View>

        {/* Progress Bar */}
        <View className="px-4 pt-3">
          <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <View className="h-full w-[66.66%] bg-orange-500 rounded-full" />
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
              <MapPinned size={40} color="#22C55E" strokeWidth={2} />
            </View>
          </Animated.View>

          {/* Location Badge */}
          <Animated.View entering={FadeInDown.delay(150)} className="items-center mb-4">
            <View className="bg-blue-50 px-4 py-2 rounded-full">
              <Text className="text-blue-700 text-sm font-medium">📍 {params.location}</Text>
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInDown.delay(200)} className="mb-8">
            <Text className="text-gray-900 font-bold text-3xl text-center mb-3">
              Which area or locality do you prefer?
            </Text>
            <Text className="text-gray-600 text-base text-center">
              Enter the specific area or neighborhood
            </Text>
          </Animated.View>

          {/* Input */}
          <Animated.View entering={FadeInDown.delay(300)}>
            <TextInput
              className="bg-white rounded-2xl px-6 py-5 text-gray-900 text-lg border-2 border-gray-200 focus:border-green-500"
              placeholder="e.g., Gachibowli, Whitefield, Andheri"
              placeholderTextColor="#9CA3AF"
              value={area}
              onChangeText={setArea}
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
            disabled={!area.trim()}
            className={`rounded-2xl py-5 items-center ${
              area.trim() ? 'bg-green-500' : 'bg-gray-300'
            }`}
            style={{
              shadowColor: area.trim() ? '#22C55E' : '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: area.trim() ? 0.3 : 0.1,
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
