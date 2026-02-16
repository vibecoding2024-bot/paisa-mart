import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const VEHICLE_TYPES: Record<string, { title: string; types: string[] }> = {
  'four-wheelers': {
    title: '🚙 Four-Wheelers (Light Vehicles)',
    types: ['Car', 'Jeep', 'Van'],
  },
  'commercial-vehicles': {
    title: '🚚 Commercial Vehicles',
    types: [
      'Goods Auto (3-wheeler)',
      'Pickup / Mini Truck (Tata Ace, Bolero Pickup)',
      'Lorry / Truck',
      'Trailer / Container Vehicle',
    ],
  },
  'passenger-vehicles': {
    title: '🚌 Passenger Vehicles',
    types: ['Auto Rickshaw', 'Taxi / Cab', 'Bus', 'Tempo Traveller'],
  },
  'special-vehicles': {
    title: '🚜 Special Vehicles',
    types: ['Tractor', 'JCB / Earthmover', 'Crane', 'Ambulance', 'Fire Vehicle'],
  },
  'heavy-vehicles': {
    title: '🛻 Heavy Vehicles',
    types: ['Heavy Truck', 'Tipper', 'Lorry', 'Tanker', 'Multi-axle Vehicles'],
  },
};

export default function VehicleTypeScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category: string }>();

  const vehicleData = VEHICLE_TYPES[category || 'four-wheelers'];

  const handleVehicleSelect = (vehicleType: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/vehicle-insurance/details',
      params: { category, vehicleType },
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
            <Text className="text-gray-900 font-bold text-xl">Select Vehicle Type</Text>
          </View>
          <View className="w-10" />
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20 }}
        >
          {/* Title Section */}
          <Animated.View entering={FadeInDown.delay(100)} className="mb-6">
            <Text className="text-gray-900 font-bold text-2xl text-center mb-2">
              {vehicleData.title}
            </Text>
            <Text className="text-gray-600 text-base text-center">
              Select your specific vehicle type
            </Text>
          </Animated.View>

          {/* Vehicle Type Cards */}
          <View className="gap-3">
            {vehicleData.types.map((type, index) => (
              <Animated.View
                key={type}
                entering={FadeInDown.delay(200 + index * 50)}
              >
                <Pressable
                  onPress={() => handleVehicleSelect(type)}
                  className="bg-white rounded-2xl p-5 border-2 border-gray-200 active:border-blue-500 active:bg-blue-50"
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-gray-900 font-semibold text-lg flex-1">
                      {type}
                    </Text>
                    <ChevronRight size={20} color="#9CA3AF" />
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
