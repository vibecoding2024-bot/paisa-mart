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
import { ChevronLeft, DollarSign } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';

const BUDGET_RANGES = [
  { value: '5-10', label: '₹5L – ₹10L' },
  { value: '10-25', label: '₹10L – ₹25L' },
  { value: '25-50', label: '₹25L – ₹50L' },
  { value: '50+', label: '₹50L+' },
  { value: 'custom', label: 'Custom' },
];

export default function BuyBudgetScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    intent: string;
    userType: string;
    location: string;
    area: string;
    plotSize: string;
  }>();
  const [selectedBudget, setSelectedBudget] = useState('');
  const [customBudget, setCustomBudget] = useState('');

  const handleNext = () => {
    const budget =
      selectedBudget === 'custom' && customBudget.trim()
        ? customBudget.trim()
        : BUDGET_RANGES.find((b) => b.value === selectedBudget)?.label || '';

    if (!budget) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/open-plots/buy-timeline',
      params: { ...params, budget },
    } as any);
  };

  const isNextEnabled =
    selectedBudget && (selectedBudget !== 'custom' || customBudget.trim());

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
            <Text className="text-gray-500 text-xs mt-0.5">Step 6 of 7</Text>
          </View>
          <View className="w-10" />
        </View>

        {/* Progress Bar */}
        <View className="px-4 pt-3">
          <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <View className="h-full w-[85.71%] bg-orange-500 rounded-full" />
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
            <View className="w-20 h-20 bg-emerald-100 rounded-full items-center justify-center">
              <DollarSign size={40} color="#10B981" strokeWidth={2} />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInDown.delay(200)} className="mb-8">
            <Text className="text-gray-900 font-bold text-3xl text-center mb-3">
              What is your budget range?
            </Text>
            <Text className="text-gray-600 text-base text-center">
              Select your budget for the plot
            </Text>
          </Animated.View>

          {/* Options */}
          <View className="gap-3 mb-6">
            {BUDGET_RANGES.map((budget, index) => (
              <Animated.View
                key={budget.value}
                entering={FadeInDown.delay(300 + index * 50)}
              >
                <Pressable
                  onPress={() => {
                    setSelectedBudget(budget.value);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className={`rounded-2xl p-5 border-2 ${
                    selectedBudget === budget.value
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <Text
                    className={`text-lg font-semibold text-center ${
                      selectedBudget === budget.value
                        ? 'text-emerald-700'
                        : 'text-gray-900'
                    }`}
                  >
                    {budget.label}
                  </Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          {/* Custom Input */}
          {selectedBudget === 'custom' && (
            <Animated.View entering={FadeInDown.delay(100)}>
              <TextInput
                className="bg-white rounded-2xl px-6 py-5 text-gray-900 text-lg border-2 border-emerald-300"
                placeholder="Enter your budget (e.g., ₹40 Lakhs)"
                placeholderTextColor="#9CA3AF"
                value={customBudget}
                onChangeText={setCustomBudget}
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
              isNextEnabled ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
            style={{
              shadowColor: isNextEnabled ? '#10B981' : '#000',
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
