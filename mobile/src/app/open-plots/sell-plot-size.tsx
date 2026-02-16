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
import { ChevronLeft, Maximize } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const PLOT_SIZES = [
  { value: '100', label: '100 sq yards' },
  { value: '150', label: '150 sq yards' },
  { value: '200', label: '200 sq yards' },
  { value: '300', label: '300 sq yards' },
  { value: 'custom', label: 'Custom' },
];

export default function SellPlotSizeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    intent: string;
    userType: string;
    location: string;
  }>();
  const [selectedSize, setSelectedSize] = useState('');
  const [customSize, setCustomSize] = useState('');

  const handleNext = () => {
    const plotSize =
      selectedSize === 'custom' && customSize.trim()
        ? `${customSize} sq yards`
        : PLOT_SIZES.find((s) => s.value === selectedSize)?.label || '';

    if (!plotSize) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/open-plots/sell-price',
      params: { ...params, plotSize },
    } as any);
  };

  const isNextEnabled =
    selectedSize && (selectedSize !== 'custom' || customSize.trim());

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
            <Text className="text-gray-500 text-xs mt-0.5">Step 4 of 6</Text>
          </View>
          <View className="w-10" />
        </View>

        {/* Progress Bar */}
        <View className="px-4 pt-3">
          <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <View className="h-full w-[66.66%] bg-green-500 rounded-full" />
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
            <View className="w-20 h-20 bg-amber-100 rounded-full items-center justify-center">
              <Maximize size={40} color="#F59E0B" strokeWidth={2} />
            </View>
          </Animated.View>

          {/* Location Badge */}
          <Animated.View entering={FadeInDown.delay(150)} className="items-center mb-4">
            <View className="bg-green-50 px-4 py-2 rounded-full">
              <Text className="text-green-700 text-sm font-medium">📍 {params.location}</Text>
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInDown.delay(200)} className="mb-8">
            <Text className="text-gray-900 font-bold text-3xl text-center mb-3">
              What is the size of your plot?
            </Text>
            <Text className="text-gray-600 text-base text-center">
              Select or enter the plot size
            </Text>
          </Animated.View>

          {/* Options */}
          <View className="gap-3 mb-6">
            {PLOT_SIZES.map((size, index) => (
              <Animated.View
                key={size.value}
                entering={FadeInDown.delay(300 + index * 50)}
              >
                <Pressable
                  onPress={() => {
                    setSelectedSize(size.value);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className={`rounded-2xl p-5 border-2 ${
                    selectedSize === size.value
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <Text
                    className={`text-lg font-semibold text-center ${
                      selectedSize === size.value ? 'text-amber-700' : 'text-gray-900'
                    }`}
                  >
                    {size.label}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          {/* Custom Input */}
          {selectedSize === 'custom' && (
            <Animated.View entering={FadeInDown.delay(100)}>
              <TextInput
                className="bg-white rounded-2xl px-6 py-5 text-gray-900 text-lg border-2 border-amber-300"
                placeholder="Enter size in sq yards"
                placeholderTextColor="#9CA3AF"
                value={customSize}
                onChangeText={setCustomSize}
                keyboardType="numeric"
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
              isNextEnabled ? 'bg-amber-500' : 'bg-gray-300'
            }`}
            style={{
              shadowColor: isNextEnabled ? '#F59E0B' : '#000',
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
