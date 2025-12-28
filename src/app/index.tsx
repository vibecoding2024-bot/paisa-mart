import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Phone, ArrowRight, Shield, TrendingUp, Wallet } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const pulseValue = useSharedValue(1);

  useEffect(() => {
    pulseValue.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500 }),
        withTiming(1, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  const isValidPhone = phoneNumber.length === 10 && /^\d+$/.test(phoneNumber);

  const handleContinue = () => {
    if (isValidPhone) {
      router.push({ pathname: '/otp', params: { phone: phoneNumber } });
    }
  };

  const formatPhoneDisplay = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 10);
    return cleaned;
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#0A1628', '#1A365D', '#0A1628']}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView className="flex-1" edges={['top']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
          >
            <View className="flex-1 px-6">
              {/* Logo Section */}
              <Animated.View
                entering={FadeInDown.delay(100).springify()}
                className="items-center mt-12"
              >
                <Animated.View style={animatedLogoStyle}>
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 20,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <TrendingUp size={40} color="#fff" strokeWidth={2.5} />
                  </LinearGradient>
                </Animated.View>
                <Text className="text-3xl font-bold text-white mt-4">EarnPro</Text>
                <Text className="text-emerald-400 text-base mt-1">Sell & Earn</Text>
              </Animated.View>

              {/* Features */}
              <Animated.View
                entering={FadeInDown.delay(200).springify()}
                className="flex-row justify-center mt-8 gap-6"
              >
                <View className="items-center">
                  <View className="w-12 h-12 rounded-full bg-emerald-500/20 items-center justify-center">
                    <Wallet size={22} color="#10B981" />
                  </View>
                  <Text className="text-white/70 text-xs mt-2">Earn ₹1L+</Text>
                </View>
                <View className="items-center">
                  <View className="w-12 h-12 rounded-full bg-blue-500/20 items-center justify-center">
                    <Shield size={22} color="#3B82F6" />
                  </View>
                  <Text className="text-white/70 text-xs mt-2">100% Safe</Text>
                </View>
                <View className="items-center">
                  <View className="w-12 h-12 rounded-full bg-amber-500/20 items-center justify-center">
                    <TrendingUp size={22} color="#F59E0B" />
                  </View>
                  <Text className="text-white/70 text-xs mt-2">Instant Pay</Text>
                </View>
              </Animated.View>

              {/* Login Card */}
              <Animated.View
                entering={FadeInUp.delay(300).springify()}
                className="mt-10"
              >
                <View className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
                  <Text className="text-white text-xl font-semibold mb-2">
                    Welcome Partner!
                  </Text>
                  <Text className="text-white/60 text-sm mb-6">
                    Enter your phone number to get started
                  </Text>

                  {/* Phone Input */}
                  <View
                    className={`flex-row items-center bg-white/10 rounded-2xl px-4 py-4 border ${
                      isFocused ? 'border-emerald-400' : 'border-transparent'
                    }`}
                  >
                    <View className="flex-row items-center mr-3 pr-3 border-r border-white/20">
                      <Text className="text-white font-medium">+91</Text>
                    </View>
                    <Phone size={20} color="#9CA3AF" />
                    <TextInput
                      className="flex-1 ml-3 text-white text-lg"
                      placeholder="Phone Number"
                      placeholderTextColor="#6B7280"
                      keyboardType="phone-pad"
                      value={phoneNumber}
                      onChangeText={(text) => setPhoneNumber(formatPhoneDisplay(text))}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      maxLength={10}
                    />
                    {phoneNumber.length > 0 && (
                      <Text className={`text-sm ${isValidPhone ? 'text-emerald-400' : 'text-white/40'}`}>
                        {phoneNumber.length}/10
                      </Text>
                    )}
                  </View>

                  {/* Continue Button */}
                  <Pressable
                    onPress={handleContinue}
                    disabled={!isValidPhone}
                    className="mt-6"
                  >
                    {({ pressed }) => (
                      <LinearGradient
                        colors={isValidPhone ? ['#10B981', '#059669'] : ['#374151', '#374151']}
                        style={{
                          borderRadius: 16,
                          padding: 18,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: pressed ? 0.9 : 1,
                          transform: [{ scale: pressed ? 0.98 : 1 }],
                        }}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Text className={`text-lg font-semibold mr-2 ${isValidPhone ? 'text-white' : 'text-gray-500'}`}>
                          Continue
                        </Text>
                        <ArrowRight size={20} color={isValidPhone ? '#fff' : '#6B7280'} />
                      </LinearGradient>
                    )}
                  </Pressable>
                </View>
              </Animated.View>

              {/* Trust Indicators */}
              <Animated.View
                entering={FadeInUp.delay(400).springify()}
                className="mt-6 items-center"
              >
                <Text className="text-white/40 text-xs">
                  Trusted by 14 Lakh+ Partners across India
                </Text>
                <View className="flex-row items-center mt-3 gap-2">
                  <View className="flex-row">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <View
                        key={i}
                        className="w-8 h-8 rounded-full bg-emerald-500/30 border-2 border-slate-800 items-center justify-center"
                        style={{ marginLeft: i > 1 ? -12 : 0 }}
                      >
                        <Text className="text-white text-xs font-bold">
                          {String.fromCharCode(64 + i)}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <Text className="text-white/60 text-sm ml-2">& many more</Text>
                </View>
              </Animated.View>

              {/* Terms */}
              <Animated.View
                entering={FadeInUp.delay(500).springify()}
                className="mt-auto mb-6"
              >
                <Text className="text-white/40 text-xs text-center leading-5">
                  By continuing, you agree to our{' '}
                  <Text className="text-emerald-400">Terms of Service</Text>
                  {' '}and{' '}
                  <Text className="text-emerald-400">Privacy Policy</Text>
                </Text>
              </Animated.View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
