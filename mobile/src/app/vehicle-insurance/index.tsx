import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, Car, Truck, Bus, Tractor, TruckIcon } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';

const VEHICLE_CATEGORIES = [
  {
    id: 'four-wheelers',
    label: 'Four-Wheelers (Light Vehicles)',
    icon: Car,
    color: '#3B82F6',
    bgColor: '#EFF6FF',
  },
  {
    id: 'commercial-vehicles',
    label: 'Commercial Vehicles',
    icon: Truck,
    color: '#F97316',
    bgColor: '#FFF7ED',
  },
  {
    id: 'passenger-vehicles',
    label: 'Passenger Vehicles',
    icon: Bus,
    color: '#8B5CF6',
    bgColor: '#F5F3FF',
  },
  {
    id: 'special-vehicles',
    label: 'Special Vehicles',
    icon: Tractor,
    color: '#22C55E',
    bgColor: '#F0FDF4',
  },
  {
    id: 'heavy-vehicles',
    label: 'Heavy Vehicles',
    icon: TruckIcon,
    color: '#64748B',
    bgColor: '#F8FAFC',
  },
];

export default function VehicleInsuranceCategoryScreen() {
  const router = useRouter();

  const handleCategorySelect = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/vehicle-insurance/vehicle-type',
      params: { category: categoryId },
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
            <Text className="text-gray-900 font-bold text-xl">Motor Insurance</Text>
          </View>
          <View className="w-10" />
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20 }}
        >
          {/* Title Section */}
          <Animated.View entering={FadeInDown.delay(100)} className="mb-8">
            <Text className="text-gray-900 font-bold text-3xl text-center mb-3">
              Select Vehicle Category
            </Text>
            <Text className="text-gray-600 text-base text-center">
              Choose your vehicle type to continue
            </Text>
          </Animated.View>

          {/* Category Cards */}
          <View className="gap-4">
            {VEHICLE_CATEGORIES.map((category, index) => {
              const IconComponent = category.icon;
              return (
                <Animated.View
                  key={category.id}
                  entering={FadeInDown.delay(200 + index * 100)}
                >
                  <Pressable
                    onPress={() => handleCategorySelect(category.id)}
                    className="rounded-3xl p-6 active:scale-[0.98]"
                    style={{
                      backgroundColor: category.bgColor,
                      shadowColor: category.color,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.15,
                      shadowRadius: 12,
                      elevation: 4,
                    }}
                  >
                    <View className="flex-row items-center">
                      <View
                        className="w-16 h-16 rounded-2xl items-center justify-center mr-4"
                        style={{ backgroundColor: category.color + '20' }}
                      >
                        <IconComponent size={32} color={category.color} strokeWidth={2} />
                      </View>
                      <View className="flex-1">
                        <Text
                          className="font-bold text-xl"
                          style={{ color: category.color }}
                        >
                          {category.label}
                        </Text>
                      </View>
                      <ChevronLeft
                        size={24}
                        color={category.color}
                        style={{ transform: [{ rotate: '180deg' }] }}
                      />
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          {/* Info Box */}
          <Animated.View entering={FadeInDown.delay(700)} className="mt-6">
            <View className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <Text className="text-blue-700 text-sm text-center">
                💡 Select your vehicle category to get started with insurance
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
