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
import { ChevronLeft, User, Phone, Car, Calendar, Clock, MapPin } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import { useVehicleInsuranceLeadsStore } from '@/lib/vehicle-insurance-leads-store';

export default function VehicleDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    category: string;
    vehicleType: string;
  }>();

  const addLead = useVehicleInsuranceLeadsStore((s) => s.addLead);

  const [ownerName, setOwnerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [registrationYear, setRegistrationYear] = useState('');
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState('');
  const [city, setCity] = useState('');

  const handleSubmit = () => {
    if (!isFormValid) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Create lead
    const newLead = addLead({
      vehicleCategory: params.category,
      vehicleType: params.vehicleType,
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      registrationYear: registrationYear.trim(),
      insuranceExpiryDate: insuranceExpiryDate.trim(),
      ownerName: ownerName.trim(),
      mobile: mobile.trim(),
      city: city.trim(),
      timestamp: new Date().toISOString(),
    });

    // Navigate to success screen
    router.push({
      pathname: '/vehicle-insurance/success',
      params: { leadId: newLead.id },
    } as any);
  };

  const isFormValid =
    ownerName.trim() &&
    mobile.trim().length === 10 &&
    vehicleNumber.trim() &&
    registrationYear.trim() &&
    insuranceExpiryDate.trim() &&
    city.trim();

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
            <Text className="text-gray-900 font-bold text-xl">Vehicle Details</Text>
          </View>
          <View className="w-10" />
        </View>

        <ScrollView keyboardShouldPersistTaps="handled"
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20 }}
        >
          {/* Title Section */}
          <Animated.View entering={FadeInDown.delay(100)} className="mb-6">
            <Text className="text-gray-900 font-bold text-2xl text-center mb-2">
              Basic Details
            </Text>
            <Text className="text-gray-600 text-base text-center">
              {params.vehicleType}
            </Text>
          </Animated.View>

          {/* Form Fields */}
          <View className="gap-4">
            {/* Owner Name */}
            <Animated.View entering={FadeInDown.delay(200)}>
              <Text className="text-gray-700 font-semibold mb-2">Owner Name</Text>
              <View className="flex-row items-center bg-white rounded-2xl px-4 py-4 border-2 border-gray-200">
                <User size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-gray-900 text-base"
                  placeholder="Enter owner name"
                  placeholderTextColor="#9CA3AF"
                  value={ownerName}
                  onChangeText={setOwnerName}
                  autoFocus
                />
              </View>
            </Animated.View>

            {/* Mobile Number */}
            <Animated.View entering={FadeInDown.delay(250)}>
              <Text className="text-gray-700 font-semibold mb-2">Mobile Number</Text>
              <View className="flex-row items-center bg-white rounded-2xl px-4 py-4 border-2 border-gray-200">
                <Phone size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-gray-900 text-base"
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#9CA3AF"
                  value={mobile}
                  onChangeText={setMobile}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </Animated.View>

            {/* Vehicle Number */}
            <Animated.View entering={FadeInDown.delay(300)}>
              <Text className="text-gray-700 font-semibold mb-2">Vehicle Number</Text>
              <View className="flex-row items-center bg-white rounded-2xl px-4 py-4 border-2 border-gray-200">
                <Car size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-gray-900 text-base"
                  placeholder="e.g., MH12AB1234"
                  placeholderTextColor="#9CA3AF"
                  value={vehicleNumber}
                  onChangeText={setVehicleNumber}
                  autoCapitalize="characters"
                />
              </View>
            </Animated.View>

            {/* Registration Year */}
            <Animated.View entering={FadeInDown.delay(350)}>
              <Text className="text-gray-700 font-semibold mb-2">Vehicle Registration Year</Text>
              <View className="flex-row items-center bg-white rounded-2xl px-4 py-4 border-2 border-gray-200">
                <Calendar size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-gray-900 text-base"
                  placeholder="e.g., 2020"
                  placeholderTextColor="#9CA3AF"
                  value={registrationYear}
                  onChangeText={setRegistrationYear}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>
            </Animated.View>

            {/* Insurance Expiry Date */}
            <Animated.View entering={FadeInDown.delay(400)}>
              <Text className="text-gray-700 font-semibold mb-2">Insurance Expiry Date</Text>
              <View className="flex-row items-center bg-white rounded-2xl px-4 py-4 border-2 border-gray-200">
                <Clock size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-gray-900 text-base"
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#9CA3AF"
                  value={insuranceExpiryDate}
                  onChangeText={setInsuranceExpiryDate}
                />
              </View>
            </Animated.View>

            {/* City */}
            <Animated.View entering={FadeInDown.delay(450)}>
              <Text className="text-gray-700 font-semibold mb-2">City / Location</Text>
              <View className="flex-row items-center bg-white rounded-2xl px-4 py-4 border-2 border-gray-200">
                <MapPin size={20} color="#9CA3AF" />
                <TextInput
                  className="flex-1 ml-3 text-gray-900 text-base"
                  placeholder="Enter your city"
                  placeholderTextColor="#9CA3AF"
                  value={city}
                  onChangeText={setCity}
                />
              </View>
            </Animated.View>
          </View>

          {/* Info Box */}
          <Animated.View entering={FadeInDown.delay(500)} className="mt-6">
            <View className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <Text className="text-blue-700 text-sm text-center">
                🔒 Your information is safe and will be used only for insurance quote
              </Text>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Submit Button */}
        <View className="px-6 pb-8">
          <Pressable
            onPress={handleSubmit}
            disabled={!isFormValid}
            className={`rounded-2xl py-5 items-center ${
              isFormValid ? 'bg-blue-500' : 'bg-gray-300'
            }`}
            style={{
              shadowColor: isFormValid ? '#3B82F6' : '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isFormValid ? 0.3 : 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text className="text-white font-bold text-lg">Get Insurance Quote</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
