import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, IndianRupee } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';

const PRICE_RANGES = [
  { value: '5-10', label: '₹5L – ₹10L' },
  { value: '10-25', label: '₹10L – ₹25L' },
  { value: '25-50', label: '₹25L – ₹50L' },
  { value: '50+', label: '₹50L+' },
  { value: 'custom', label: 'Custom' },
];

export default function SellPriceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    intent: string;
    userType: string;
    location: string;
    plotSize: string;
  }>();
  const [selectedPrice, setSelectedPrice] = useState('');
  const [customPrice, setCustomPrice] = useState('');

  const handleNext = () => {
    const price =
      selectedPrice === 'custom' && customPrice.trim()
        ? customPrice.trim()
        : PRICE_RANGES.find((p) => p.value === selectedPrice)?.label || '';

    if (!price) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/open-plots/sell-timeline',
      params: { ...params, price },
    } as any);
  };

  const isNextEnabled =
    selectedPrice && (selectedPrice !== 'custom' || customPrice.trim());

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
            <Text className="text-gray-500 text-xs mt-0.5">Step 5 of 6</Text>
          </View>
          <View className="w-10" />
        </View>

        {/* Progress Bar */}
        <View className="px-4 pt-3">
          <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <View className="h-full w-[83.33%] bg-green-500 rounded-full" />
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 48 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Icon */}
          <Animated.View
            entering={FadeInDown.delay(100)}
            className="items-center mb-6"
          >
            <View className="w-20 h-20 bg-teal-100 rounded-full items-center justify-center">
              <IndianRupee size={40} color="#14B8A6" strokeWidth={2} />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInDown.delay(200)} className="mb-8">
            <Text className="text-gray-900 font-bold text-3xl text-center mb-3">
              What is your expected price?
            </Text>
            <Text className="text-gray-600 text-base text-center">
              Select your expected price range
            </Text>
          </Animated.View>

          {/* Options */}
          <View className="gap-3 mb-6">
            {PRICE_RANGES.map((price, index) => (
              <Animated.View
                key={price.value}
                entering={FadeInDown.delay(300 + index * 50)}
              >
                <Pressable
                  onPress={() => {
                    setSelectedPrice(price.value);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className={`rounded-2xl p-5 border-2 ${
                    selectedPrice === price.value
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <Text
                    className={`text-lg font-semibold text-center ${
                      selectedPrice === price.value
                        ? 'text-teal-700'
                        : 'text-gray-900'
                    }`}
                  >
                    {price.label}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          {/* Custom Input */}
          {selectedPrice === 'custom' && (
            <Animated.View entering={FadeInDown.delay(100)}>
              <TextInput
                className="bg-white rounded-2xl px-6 py-5 text-gray-900 text-lg border-2 border-teal-300"
                placeholder="Enter your expected price (e.g., ₹40 Lakhs)"
                placeholderTextColor="#9CA3AF"
                value={customPrice}
                onChangeText={setCustomPrice}
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
          )}
        </ScrollView>

        {/* Next Button */}
        <View className="px-6 pb-8">
          <Pressable
            onPress={handleNext}
            disabled={!isNextEnabled}
            className={`rounded-2xl py-5 items-center ${
              isNextEnabled ? 'bg-teal-500' : 'bg-gray-300'
            }`}
            style={{
              shadowColor: isNextEnabled ? '#14B8A6' : '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isNextEnabled ? 0.3 : 0.1,
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
