import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const TIMELINE_OPTIONS = [
  { value: 'immediately', label: 'Immediately', icon: '⚡' },
  { value: '1-month', label: 'Within 1 month', icon: '📅' },
  { value: '3-months', label: 'Within 3 months', icon: '📆' },
  { value: 'flexible', label: 'Flexible', icon: '🤝' },
];

export default function SellTimelineScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    intent: string;
    userType: string;
    location: string;
    plotSize: string;
    price: string;
  }>();
  const [selectedTimeline, setSelectedTimeline] = useState('');

  const handleNext = () => {
    if (!selectedTimeline) return;

    const timeline =
      TIMELINE_OPTIONS.find((t) => t.value === selectedTimeline)?.label || '';

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/open-plots/sell-contact',
      params: { ...params, timeline },
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
            <Text className="text-gray-900 font-bold text-xl">Sell a Plot</Text>
            <Text className="text-gray-500 text-xs mt-0.5">Step 6 of 7</Text>
          </View>
          <View className="w-10" />
        </View>

        {/* Progress Bar */}
        <View className="px-4 pt-3">
          <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <View className="h-full w-[85.71%] bg-green-500 rounded-full" />
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
            <View className="w-20 h-20 bg-rose-100 rounded-full items-center justify-center">
              <Clock size={40} color="#F43F5E" strokeWidth={2} />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInDown.delay(200)} className="mb-8">
            <Text className="text-gray-900 font-bold text-3xl text-center mb-3">
              When do you want to sell?
            </Text>
            <Text className="text-gray-600 text-base text-center">
              Let us know your timeline
            </Text>
          </Animated.View>

          {/* Options */}
          <View className="gap-3 mb-6">
            {TIMELINE_OPTIONS.map((option, index) => (
              <Animated.View
                key={option.value}
                entering={FadeInDown.delay(300 + index * 50)}
              >
                <Pressable
                  onPress={() => {
                    setSelectedTimeline(option.value);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className={`rounded-2xl p-5 border-2 ${
                    selectedTimeline === option.value
                      ? 'border-rose-500 bg-rose-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <View className="flex-row items-center">
                    <Text className="text-3xl mr-4">{option.icon}</Text>
                    <Text
                      className={`text-lg font-semibold flex-1 ${
                        selectedTimeline === option.value
                          ? 'text-rose-700'
                          : 'text-gray-900'
                      }`}
                    >
                      {option.label}
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </ScrollView>

        {/* Next Button */}
        <View className="px-6 pb-8">
          <Pressable
            onPress={handleNext}
            disabled={!selectedTimeline}
            className={`rounded-2xl py-5 items-center ${
              selectedTimeline ? 'bg-rose-500' : 'bg-gray-300'
            }`}
            style={{
              shadowColor: selectedTimeline ? '#F43F5E' : '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: selectedTimeline ? 0.3 : 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text className="text-white font-bold text-lg">Next</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
