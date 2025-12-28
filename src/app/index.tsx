import { useState, useEffect } from 'react';
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
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { Phone, ArrowRight, Shield, Crown, Briefcase } from 'lucide-react-native';

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
        colors={['#1A1A1A', '#0D0D0D', '#1A1A1A']}
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
                    colors={['#D4AF37', '#B8860B', '#DAA520']}
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: 24,
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: '#D4AF37',
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.4,
                      shadowRadius: 16,
                      elevation: 12,
                    }}
                  >
                    <Crown size={44} color="#fff" strokeWidth={2} />
                  </LinearGradient>
                </Animated.View>
                <Text className="text-3xl font-bold text-white mt-5 tracking-wide">Retire Early</Text>
                <Text className="text-amber-400 text-base mt-1 font-medium">Build Your Financial Freedom</Text>
              </Animated.View>

              {/* Features */}
              <Animated.View
                entering={FadeInDown.delay(200).springify()}
                className="flex-row justify-center mt-10 gap-8"
              >
                <View className="items-center">
                  <View className="w-14 h-14 rounded-2xl bg-amber-500/15 items-center justify-center border border-amber-500/30">
                    <Briefcase size={24} color="#D4AF37" />
                  </View>
                  <Text className="text-white/80 text-xs mt-2 font-medium">High Earnings</Text>
                </View>
                <View className="items-center">
                  <View className="w-14 h-14 rounded-2xl bg-amber-500/15 items-center justify-center border border-amber-500/30">
                    <Shield size={24} color="#D4AF37" />
                  </View>
                  <Text className="text-white/80 text-xs mt-2 font-medium">100% Secure</Text>
                </View>
                <View className="items-center">
                  <View className="w-14 h-14 rounded-2xl bg-amber-500/15 items-center justify-center border border-amber-500/30">
                    <Crown size={24} color="#D4AF37" />
                  </View>
                  <Text className="text-white/80 text-xs mt-2 font-medium">Premium</Text>
                </View>
              </Animated.View>

              {/* Login Card */}
              <Animated.View
                entering={FadeInUp.delay(300).springify()}
                className="mt-10"
              >
                <View
                  className="rounded-3xl p-6 border border-amber-500/20"
                  style={{ backgroundColor: 'rgba(212, 175, 55, 0.08)' }}
                >
                  <Text className="text-white text-xl font-semibold mb-2">
                    Welcome, Future Partner
                  </Text>
                  <Text className="text-white/60 text-sm mb-6">
                    Enter your phone number to begin your journey
                  </Text>

                  {/* Phone Input */}
                  <View
                    className={`flex-row items-center rounded-2xl px-4 py-4 border ${
                      isFocused ? 'border-amber-400' : 'border-amber-500/30'
                    }`}
                    style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
                  >
                    <View className="flex-row items-center mr-3 pr-3 border-r border-amber-500/30">
                      <Text className="text-amber-400 font-semibold">+91</Text>
                    </View>
                    <Phone size={20} color="#D4AF37" />
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
                      <Text className={`text-sm ${isValidPhone ? 'text-amber-400' : 'text-white/40'}`}>
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
                        colors={isValidPhone ? ['#D4AF37', '#B8860B'] : ['#374151', '#374151']}
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
                        <Text className={`text-lg font-bold mr-2 ${isValidPhone ? 'text-black' : 'text-gray-500'}`}>
                          Get Started
                        </Text>
                        <ArrowRight size={20} color={isValidPhone ? '#000' : '#6B7280'} />
                      </LinearGradient>
                    )}
                  </Pressable>
                </View>
              </Animated.View>

              {/* Trust Indicators */}
              <Animated.View
                entering={FadeInUp.delay(400).springify()}
                className="mt-8 items-center"
              >
                <View className="flex-row items-center gap-2">
                  <View className="h-px w-12 bg-amber-500/30" />
                  <Text className="text-amber-500/60 text-xs font-medium tracking-wider">
                    TRUSTED BY THOUSANDS
                  </Text>
                  <View className="h-px w-12 bg-amber-500/30" />
                </View>
                <View className="flex-row items-center mt-4 gap-2">
                  <View className="flex-row">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <View
                        key={i}
                        className="w-9 h-9 rounded-full items-center justify-center border-2 border-neutral-900"
                        style={{
                          marginLeft: i > 1 ? -14 : 0,
                          backgroundColor: `rgba(212, 175, 55, ${0.2 + i * 0.1})`
                        }}
                      >
                        <Text className="text-amber-400 text-xs font-bold">
                          {String.fromCharCode(64 + i)}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <Text className="text-white/50 text-sm ml-2">& many more partners</Text>
                </View>
              </Animated.View>

              {/* Terms */}
              <Animated.View
                entering={FadeInUp.delay(500).springify()}
                className="mt-auto mb-6"
              >
                <Text className="text-white/40 text-xs text-center leading-5">
                  By continuing, you agree to our{' '}
                  <Text className="text-amber-400">Terms of Service</Text>
                  {' '}and{' '}
                  <Text className="text-amber-400">Privacy Policy</Text>
                </Text>
              </Animated.View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
