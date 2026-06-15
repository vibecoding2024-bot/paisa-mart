import { View, Text, ScrollView, Pressable, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Hotel, Calendar, Users } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from '@/lib/haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function HotelsScreen() {
  const router = useRouter();
  const [city, setCity] = useState('');
  const [checkInDate, setCheckInDate] = useState(new Date());
  const [checkOutDate, setCheckOutDate] = useState(new Date(Date.now() + 86400000)); // +1 day
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [guests, setGuests] = useState('2');

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSearch = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    // Search functionality placeholder
  };

  const onCheckInChange = (event: any, selectedDate?: Date) => {
    setShowCheckInPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setCheckInDate(selectedDate);
      // Ensure checkout is after checkin
      if (selectedDate >= checkOutDate) {
        setCheckOutDate(new Date(selectedDate.getTime() + 86400000));
      }
    }
  };

  const onCheckOutChange = (event: any, selectedDate?: Date) => {
    setShowCheckOutPicker(Platform.OS === 'ios');
    if (selectedDate && selectedDate > checkInDate) {
      setCheckOutDate(selectedDate);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
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
                <Text className="text-white/90 text-sm font-medium">Back</Text>
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-white/10 rounded-2xl items-center justify-center mr-3">
                  <Hotel size={24} color="#fff" />
                </View>
                <View>
                  <Text className="text-white text-2xl font-bold">Book Hotels</Text>
                  <Text className="text-white/70 text-sm mt-1">Find your perfect stay</Text>
                </View>
              </View>
            </Animated.View>
          </View>
        </LinearGradient>

        <ScrollView keyboardShouldPersistTaps="handled"
          className="flex-1 -mt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <Animated.View
            entering={FadeInUp.delay(200).springify()}
            className="mx-6 bg-white rounded-2xl p-5 shadow-sm"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            {/* City */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium text-sm mb-2">City</Text>
              <TextInput
                className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border-2 border-gray-200"
                placeholder="Enter city name"
                placeholderTextColor="#9CA3AF"
                value={city}
                onChangeText={setCity}
              />
            </View>

            {/* Check-in Date */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium text-sm mb-2">Check-in</Text>
              <Pressable
                onPress={() => setShowCheckInPicker(true)}
                className="bg-gray-50 rounded-xl px-4 py-3 border-2 border-gray-200 flex-row items-center"
              >
                <Calendar size={20} color="#6B7280" />
                <Text className="text-gray-900 ml-3">
                  {checkInDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </Pressable>
            </View>

            {/* Check-out Date */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium text-sm mb-2">Check-out</Text>
              <Pressable
                onPress={() => setShowCheckOutPicker(true)}
                className="bg-gray-50 rounded-xl px-4 py-3 border-2 border-gray-200 flex-row items-center"
              >
                <Calendar size={20} color="#6B7280" />
                <Text className="text-gray-900 ml-3">
                  {checkOutDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </Pressable>
            </View>

            {/* Guests */}
            <View className="mb-5">
              <Text className="text-gray-700 font-medium text-sm mb-2">Guests</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3 border-2 border-gray-200 flex-row items-center">
                <Users size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-gray-900"
                  placeholder="Number of guests"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={guests}
                  onChangeText={setGuests}
                  maxLength={2}
                />
              </View>
            </View>

            {/* Coming Soon Label */}
            <View className="bg-orange-50 rounded-xl p-3 mb-4 border border-orange-200">
              <Text className="text-orange-700 text-xs text-center font-medium">
                🚀 Coming Soon - Hotel search integration in progress
              </Text>
            </View>

            {/* Search Button */}
            <Pressable
              onPress={handleSearch}
              disabled={!city}
              className={`rounded-xl py-4 items-center ${city ? 'bg-orange-500' : 'bg-gray-300'}`}
            >
              <Text className={`font-bold text-base ${city ? 'text-white' : 'text-gray-500'}`}>
                Search Hotels
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>

        {showCheckInPicker && (
          <DateTimePicker
            value={checkInDate}
            mode="date"
            display="default"
            onChange={onCheckInChange}
            minimumDate={new Date()}
          />
        )}

        {showCheckOutPicker && (
          <DateTimePicker
            value={checkOutDate}
            mode="date"
            display="default"
            onChange={onCheckOutChange}
            minimumDate={new Date(checkInDate.getTime() + 86400000)}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
