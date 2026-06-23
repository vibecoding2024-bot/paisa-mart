import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { Phone, ArrowRight, Users, Wallet, Award, Star } from 'lucide-react-native';
import { sendOtp } from '@/lib/auth-api';

const isWeb = Platform.OS === 'web';

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const isValidPhone = phoneNumber.length === 10 && /^\d+$/.test(phoneNumber);

  const handleContinue = async () => {
    if (isValidPhone) {
      setError('');
      setIsSending(true);
      try {
        await sendOtp(phoneNumber);
        router.push({ pathname: '/otp', params: { phone: phoneNumber } });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to send OTP');
      } finally {
        setIsSending(false);
      }
    }
  };

  const formatPhoneDisplay = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    return cleaned;
  };

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* Top Section - Blue Background */}
          <LinearGradient
            colors={['#002561', '#003380']}
            style={{ paddingBottom: 40, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}
          >
            <View className="px-6 pt-4">
              {/* Logo */}
              <Animated.View
                entering={isWeb ? undefined : FadeInDown.delay(100).springify()}
                className="flex-row items-center"
              >
                <View className="w-10 h-10 bg-orange-500 rounded-lg items-center justify-center mr-2">
                  <Text className="text-white font-bold text-lg">P</Text>
                </View>
                <Text className="text-white text-2xl font-bold">Paisa Mart</Text>
              </Animated.View>

              {/* Hero Text */}
              <Animated.View
                entering={isWeb ? undefined : FadeInDown.delay(200).springify()}
                className="mt-6"
              >
                <Text className="text-white text-2xl font-bold leading-8">
                  Sell financial products{'\n'}and earn real money{'\n'}online!
                </Text>
              </Animated.View>

              {/* Stats Row */}
              <Animated.View
                entering={isWeb ? undefined : FadeInDown.delay(300).springify()}
                className="flex-row mt-6 gap-6"
              >
                <View className="flex-row items-center">
                  <Users size={20} color="#FF8C00" />
                  <View className="ml-2">
                    <Text className="text-white font-bold text-lg">40 Lakh+</Text>
                    <Text className="text-white/70 text-xs">Partners</Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <Wallet size={20} color="#FF8C00" />
                  <View className="ml-2">
                    <Text className="text-white font-bold text-lg">₹100 Cr+</Text>
                    <Text className="text-white/70 text-xs">Earned</Text>
                  </View>
                </View>
              </Animated.View>

              {/* Rating */}
              <Animated.View
                entering={isWeb ? undefined : FadeInDown.delay(400).springify()}
                className="flex-row items-center mt-4 bg-white/10 self-start px-3 py-1.5 rounded-full"
              >
                <Star size={14} color="#FFD700" fill="#FFD700" />
                <Text className="text-white text-sm ml-1 font-medium">4.5</Text>
                <Text className="text-white/70 text-xs ml-1">• 50K+ Reviews</Text>
              </Animated.View>
            </View>
          </LinearGradient>

          {/* Bottom Section - White Background */}
          <View className="flex-1 px-6 -mt-6">
            {/* Login Card */}
            <Animated.View
              entering={isWeb ? undefined : FadeInUp.delay(300).springify()}
              className="bg-white rounded-2xl p-5 shadow-lg"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Text className="text-gray-800 text-lg font-semibold mb-1">
                Get Started
              </Text>
              <Text className="text-gray-500 text-sm mb-4">
                Enter your mobile number to continue
              </Text>

              {/* Phone Input */}
              <View
                className={`flex-row items-center bg-gray-50 rounded-xl px-4 border-2 ${
                  isFocused ? 'border-orange-500' : 'border-gray-200'
                }`}
                style={{ minHeight: 56 }}
              >
                <View className="flex-row items-center mr-3 pr-3 border-r border-gray-300">
                  <Text className="text-gray-700 font-semibold">+91</Text>
                </View>
                <Phone size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-gray-800 text-base"
                  style={{ height: 50, fontSize: 16, paddingVertical: 0 }}
                  placeholder="Mobile Number"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={phoneNumber}
                  onChangeText={(text) => setPhoneNumber(formatPhoneDisplay(text))}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  maxLength={10}
                  autoCorrect={false}
                  textContentType="telephoneNumber"
                  returnKeyType="done"
                />
              </View>

              {!!error && <Text className="text-red-500 text-sm mt-2">{error}</Text>}

              {/* Continue Button */}
              <Pressable
                onPress={handleContinue}
                disabled={!isValidPhone || isSending}
                className="mt-4"
              >
                {({ pressed }) => (
                  <View
                    className={`rounded-xl py-4 flex-row items-center justify-center ${
                      isValidPhone && !isSending ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                    style={{
                      opacity: pressed ? 0.9 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    }}
                  >
                    <Text className={`text-base font-bold mr-2 ${isValidPhone ? 'text-white' : 'text-gray-500'}`}>
                      {isSending ? 'Sending OTP...' : 'Continue'}
                    </Text>
                    <ArrowRight size={20} color={isValidPhone ? '#fff' : '#9CA3AF'} />
                  </View>
                )}
              </Pressable>

              {/* Terms */}
              <Text className="text-gray-400 text-xs text-center mt-4 leading-5">
                By continuing, you agree to our{' '}
                <Text className="text-orange-500">Terms of Service</Text>
                {' '}and{' '}
                <Text className="text-orange-500">Privacy Policy</Text>
              </Text>
            </Animated.View>

            {/* How it works */}
            <Animated.View
              entering={isWeb ? undefined : FadeInUp.delay(500).springify()}
              className="mt-6"
            >
              <Text className="text-gray-800 font-semibold text-base mb-4">How it works</Text>
              <View className="flex-row justify-between">
                <View className="items-center flex-1">
                  <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center border-2 border-blue-600">
                    <Text className="text-blue-600 font-bold">1</Text>
                  </View>
                  <Text className="text-gray-600 text-xs mt-2 text-center">Register{'\n'}& Train</Text>
                </View>
                <View className="items-center flex-1">
                  <View className="w-12 h-12 rounded-full bg-orange-50 items-center justify-center border-2 border-orange-500">
                    <Text className="text-orange-500 font-bold">2</Text>
                  </View>
                  <Text className="text-gray-600 text-xs mt-2 text-center">Sell{'\n'}Products</Text>
                </View>
                <View className="items-center flex-1">
                  <View className="w-12 h-12 rounded-full bg-green-50 items-center justify-center border-2 border-green-500">
                    <Text className="text-green-500 font-bold">3</Text>
                  </View>
                  <Text className="text-gray-600 text-xs mt-2 text-center">Earn{'\n'}Money</Text>
                </View>
              </View>
            </Animated.View>

            {/* Partner Benefits */}
            <Animated.View
              entering={isWeb ? undefined : FadeInUp.delay(600).springify()}
              className="mt-6 flex-row gap-3"
            >
              <View className="flex-1 bg-blue-50 rounded-xl p-3">
                <Award size={20} color="#002561" />
                <Text className="text-gray-800 font-medium text-sm mt-2">Zero Investment</Text>
                <Text className="text-gray-500 text-xs">Start earning with no money down</Text>
              </View>
              <View className="flex-1 bg-orange-50 rounded-xl p-3">
                <Wallet size={20} color="#FF8C00" />
                <Text className="text-gray-800 font-medium text-sm mt-2">Instant Payout</Text>
                <Text className="text-gray-500 text-xs">Get paid directly to bank</Text>
              </View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
