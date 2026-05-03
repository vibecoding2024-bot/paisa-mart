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
import { ChevronLeft, User, Phone } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import { useOpenPlotsLeadsStore } from '@/lib/open-plots-leads-store';

export default function SellContactScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    intent: string;
    userType: string;
    location: string;
    plotSize: string;
    price: string;
    timeline: string;
  }>();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');

  const addLead = useOpenPlotsLeadsStore((s) => s.addLead);

  const handleSubmit = () => {
    if (!name.trim() || !mobile.trim()) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Create lead
    const newLead = addLead({
      intent: params.intent as 'buy' | 'sell',
      userType: params.userType as 'customer' | 'agent',
      location: params.location,
      plotSize: params.plotSize,
      budgetOrPrice: params.price,
      timeline: params.timeline,
      name: name.trim(),
      mobile: mobile.trim(),
      timestamp: new Date().toISOString(),
    });

    // Navigate to success screen
    router.push({
      pathname: '/open-plots/success',
      params: { leadId: newLead.id },
    } as any);
  };

  const isSubmitEnabled = name.trim() && mobile.trim() && mobile.length === 10;

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
            <Text className="text-gray-500 text-xs mt-0.5">Step 7 of 7</Text>
          </View>
          <View className="w-10" />
        </View>

        {/* Progress Bar */}
        <View className="px-4 pt-3">
          <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <View className="h-full w-[100%] bg-green-500 rounded-full" />
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 48 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Animated.View entering={FadeInDown.delay(100)} className="mb-8">
            <Text className="text-gray-900 font-bold text-3xl text-center mb-3">
              Almost done! 🎉
            </Text>
            <Text className="text-gray-600 text-base text-center">
              Share your contact details so we can help you
            </Text>
          </Animated.View>

          {/* Name Input */}
          <Animated.View entering={FadeInDown.delay(200)} className="mb-4">
            <View className="flex-row items-center bg-white rounded-2xl px-5 py-4 border-2 border-gray-200">
              <User size={24} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-gray-900 text-lg"
                placeholder="Your name"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>
          </Animated.View>

          {/* Mobile Input */}
          <Animated.View entering={FadeInDown.delay(300)} className="mb-6">
            <View className="flex-row items-center bg-white rounded-2xl px-5 py-4 border-2 border-gray-200">
              <Phone size={24} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-gray-900 text-lg"
                placeholder="Mobile number"
                placeholderTextColor="#9CA3AF"
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          </Animated.View>

          {/* Info Box */}
          <Animated.View entering={FadeInDown.delay(400)} className="mt-6">
            <View className="bg-green-50 p-4 rounded-xl border border-green-100">
              <Text className="text-green-700 text-sm text-center">
                🔒 Your information is safe with us and will only be used to assist you
              </Text>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Submit Button */}
        <View className="px-6 pb-8">
          <Pressable
            onPress={handleSubmit}
            disabled={!isSubmitEnabled}
            className={`rounded-2xl py-5 items-center ${
              isSubmitEnabled ? 'bg-green-500' : 'bg-gray-300'
            }`}
            style={{
              shadowColor: isSubmitEnabled ? '#22C55E' : '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isSubmitEnabled ? 0.3 : 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text className="text-white font-bold text-lg">Submit Request</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
