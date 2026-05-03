import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Plane, Hotel, Bus, Train, ArrowRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from '@/lib/haptics';
import { useRouter } from 'expo-router';
import NoPayout_TCGate from '@/components/NoPayout_TCGate';

const TRAVEL_OPTIONS = [
  {
    id: 'flights',
    label: 'Flights',
    icon: Plane,
    color: '#3B82F6',
    bg: '#EFF6FF',
    description: 'Book domestic & international flights',
  },
  {
    id: 'hotels',
    label: 'Hotels',
    icon: Hotel,
    color: '#EC4899',
    bg: '#FDF2F8',
    description: 'Find and book hotels worldwide',
  },
  {
    id: 'bus',
    label: 'Bus',
    icon: Bus,
    color: '#10B981',
    bg: '#ECFDF5',
    description: 'Book bus tickets across India',
  },
  {
    id: 'train',
    label: 'Train',
    icon: Train,
    color: '#F59E0B',
    bg: '#FFFBEB',
    description: 'Book train tickets with ease',
  },
];

export default function TravelTicketsScreen() {
  const router = useRouter();
  const [tcVisible, setTcVisible] = useState(true);
  const [tcAccepted, setTcAccepted] = useState(false);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleTravelOption = (optionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/travel/${optionId}` as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <NoPayout_TCGate
        visible={tcVisible}
        module="travel-tickets"
        onAccept={() => { setTcAccepted(true); setTcVisible(false); }}
        onDecline={() => router.back()}
      />
      {tcAccepted && (
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <LinearGradient
            colors={['#002561', '#003380']}
            style={{ paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}
          >
            <View className="px-6 pt-4">
              <Animated.View entering={FadeInDown.delay(50).springify()} className="mb-4">
                <Pressable onPress={handleBack} className="flex-row items-center active:opacity-70">
                  <View className="w-9 h-9 bg-white/10 rounded-xl items-center justify-center mr-2">
                    <ArrowLeft size={20} color="#fff" />
                  </View>
                  <Text className="text-white/90 text-sm font-medium">Back to Home</Text>
                </Pressable>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <Text className="text-white text-2xl font-bold">Travel & Tickets</Text>
                <Text className="text-white/70 text-sm mt-1">Book flights, hotels, bus & train tickets</Text>
              </Animated.View>
            </View>
          </LinearGradient>

          <ScrollView
            className="flex-1 -mt-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <View className="px-6 mt-6">
              <Text className="text-gray-900 font-semibold text-base mb-4">Choose Service</Text>

              {TRAVEL_OPTIONS.map((option, index) => (
                <Animated.View
                  key={option.id}
                  entering={FadeInUp.delay(200 + index * 100).springify()}
                  className="mb-4"
                >
                  <Pressable
                    onPress={() => handleTravelOption(option.id)}
                    className="bg-white rounded-2xl p-5 shadow-sm active:scale-98 flex-row items-center"
                    style={{
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 8,
                      elevation: 2,
                    }}
                  >
                    <View
                      className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                      style={{ backgroundColor: option.bg }}
                    >
                      <option.icon size={26} color={option.color} />
                    </View>

                    <View className="flex-1">
                      <Text className="text-gray-900 font-bold text-base">{option.label}</Text>
                      <Text className="text-gray-500 text-sm mt-1">{option.description}</Text>
                    </View>

                    <ArrowRight size={20} color="#9CA3AF" />
                  </Pressable>
                </Animated.View>
              ))}
            </View>

            {/* No Payout Info Card */}
            <Animated.View
              entering={FadeInUp.delay(600).springify()}
              className="mx-6 mt-4 rounded-2xl p-5"
              style={{ backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' }}
            >
              <Text style={{ color: '#991B1B', fontWeight: '600', fontSize: 13, marginBottom: 4 }}>
                No Payout — Convenience Service
              </Text>
              <Text style={{ color: '#B91C1C', fontSize: 12, lineHeight: 18 }}>
                Travel bookings are provided for user convenience only. No commission or referral payout is applicable. These transactions are excluded from your earnings report.
              </Text>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      )}
    </View>
  );
}
