import { View, Text, ScrollView, Pressable, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Bus, ArrowLeftRight, Calendar, Users } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from '@/lib/haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function BusScreen() {
  const router = useRouter();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [passengers, setPassengers] = useState('1');

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSearch = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    // Search functionality placeholder
  };

  const handleSwapCities = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
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
                  <Bus size={24} color="#fff" />
                </View>
                <View>
                  <Text className="text-white text-2xl font-bold">Book Bus Tickets</Text>
                  <Text className="text-white/70 text-sm mt-1">Travel across India</Text>
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
            {/* From City */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium text-sm mb-2">From</Text>
              <TextInput
                className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border-2 border-gray-200"
                placeholder="Enter boarding point"
                placeholderTextColor="#9CA3AF"
                value={from}
                onChangeText={setFrom}
              />
            </View>

            {/* Swap Button */}
            <View className="items-center -my-2 z-10">
              <Pressable
                onPress={handleSwapCities}
                className="w-10 h-10 bg-orange-500 rounded-full items-center justify-center shadow-md active:scale-95"
              >
                <ArrowLeftRight size={18} color="#fff" />
              </Pressable>
            </View>

            {/* To City */}
            <View className="mb-4 mt-2">
              <Text className="text-gray-700 font-medium text-sm mb-2">To</Text>
              <TextInput
                className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border-2 border-gray-200"
                placeholder="Enter destination"
                placeholderTextColor="#9CA3AF"
                value={to}
                onChangeText={setTo}
              />
            </View>

            {/* Date */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium text-sm mb-2">Journey Date</Text>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                className="bg-gray-50 rounded-xl px-4 py-3 border-2 border-gray-200 flex-row items-center"
              >
                <Calendar size={20} color="#6B7280" />
                <Text className="text-gray-900 ml-3">
                  {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
              </Pressable>
            </View>

            {/* Passengers */}
            <View className="mb-5">
              <Text className="text-gray-700 font-medium text-sm mb-2">Passengers</Text>
              <View className="bg-gray-50 rounded-xl px-4 py-3 border-2 border-gray-200 flex-row items-center">
                <Users size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-gray-900"
                  placeholder="Number of passengers"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={passengers}
                  onChangeText={setPassengers}
                  maxLength={2}
                />
              </View>
            </View>

            {/* Coming Soon Label */}
            <View className="bg-orange-50 rounded-xl p-3 mb-4 border border-orange-200">
              <Text className="text-orange-700 text-xs text-center font-medium">
                🚀 Coming Soon - Bus ticket booking integration in progress
              </Text>
            </View>

            {/* Search Button */}
            <Pressable
              onPress={handleSearch}
              disabled={!from || !to}
              className={`rounded-xl py-4 items-center ${from && to ? 'bg-orange-500' : 'bg-gray-300'}`}
            >
              <Text className={`font-bold text-base ${from && to ? 'text-white' : 'text-gray-500'}`}>
                Search Buses
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
