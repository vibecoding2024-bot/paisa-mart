import { useState, useEffect, useRef } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { ArrowLeft, CheckCircle, RefreshCw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const OTP_LENGTH = 6;

export default function OTPScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const router = useRouter();

  const shakeValue = useSharedValue(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Auto-focus first input
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 500);
  }, []);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeValue.value }],
  }));

  const triggerShake = () => {
    shakeValue.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste
      const pastedOtp = value.slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((digit, i) => {
        if (index + i < OTP_LENGTH) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + pastedOtp.length, OTP_LENGTH - 1);
      setActiveIndex(nextIndex);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < OTP_LENGTH - 1) {
        setActiveIndex(index + 1);
        inputRefs.current[index + 1]?.focus();
      }

      // Auto verify when all digits entered
      if (value && index === OTP_LENGTH - 1) {
        const fullOtp = newOtp.join('');
        if (fullOtp.length === OTP_LENGTH) {
          verifyOtp(fullOtp);
        }
      }
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      setActiveIndex(index - 1);
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  };

  const verifyOtp = async (otpValue: string) => {
    setIsVerifying(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // For demo, accept any 6-digit OTP
    if (otpValue.length === OTP_LENGTH) {
      setIsVerified(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        router.replace('/(tabs)');
      }, 1000);
    } else {
      triggerShake();
      setIsVerifying(false);
    }
  };

  const handleResend = () => {
    if (resendTimer === 0) {
      setResendTimer(30);
      setOtp(Array(OTP_LENGTH).fill(''));
      setActiveIndex(0);
      inputRefs.current[0]?.focus();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const maskedPhone = phone ? `+91 ${phone.slice(0, 2)}****${phone.slice(-2)}` : '+91 ******';

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
              {/* Header */}
              <Animated.View
                entering={FadeInDown.delay(100).springify()}
                className="flex-row items-center mt-4"
              >
                <Pressable
                  onPress={() => router.back()}
                  className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
                >
                  <ArrowLeft size={20} color="#fff" />
                </Pressable>
              </Animated.View>

              {/* Title */}
              <Animated.View
                entering={FadeInDown.delay(200).springify()}
                className="mt-8"
              >
                <Text className="text-3xl font-bold text-white">
                  Verify OTP
                </Text>
                <Text className="text-white/60 mt-2 text-base">
                  We've sent a 6-digit code to
                </Text>
                <Text className="text-emerald-400 font-semibold text-lg mt-1">
                  {maskedPhone}
                </Text>
              </Animated.View>

              {/* OTP Input */}
              <Animated.View
                entering={FadeInUp.delay(300).springify()}
                style={shakeStyle}
                className="mt-10"
              >
                <View className="flex-row justify-between">
                  {Array(OTP_LENGTH)
                    .fill(0)
                    .map((_, index) => (
                      <View
                        key={index}
                        className={`w-12 h-14 rounded-xl border-2 items-center justify-center ${
                          isVerified
                            ? 'border-emerald-400 bg-emerald-400/20'
                            : activeIndex === index
                            ? 'border-emerald-400 bg-white/10'
                            : otp[index]
                            ? 'border-white/30 bg-white/10'
                            : 'border-white/10 bg-white/5'
                        }`}
                      >
                        <TextInput
                          ref={(ref) => {
                            inputRefs.current[index] = ref;
                          }}
                          className="text-2xl font-bold text-white text-center w-full h-full"
                          keyboardType="number-pad"
                          maxLength={index === 0 ? OTP_LENGTH : 1}
                          value={otp[index]}
                          onChangeText={(value) => handleOtpChange(value, index)}
                          onKeyPress={(e) => handleKeyPress(e, index)}
                          onFocus={() => setActiveIndex(index)}
                          editable={!isVerifying && !isVerified}
                          selectTextOnFocus
                        />
                      </View>
                    ))}
                </View>
              </Animated.View>

              {/* Status */}
              <Animated.View
                entering={FadeInUp.delay(400).springify()}
                className="mt-8 items-center"
              >
                {isVerifying && !isVerified && (
                  <View className="flex-row items-center">
                    <Animated.View
                      style={{
                        transform: [
                          {
                            rotate: withTiming('360deg', {
                              duration: 1000,
                            }),
                          },
                        ],
                      }}
                    >
                      <RefreshCw size={20} color="#10B981" />
                    </Animated.View>
                    <Text className="text-white/70 ml-2">Verifying...</Text>
                  </View>
                )}
                {isVerified && (
                  <Animated.View
                    entering={FadeInUp.springify()}
                    className="flex-row items-center"
                  >
                    <CheckCircle size={24} color="#10B981" />
                    <Text className="text-emerald-400 ml-2 font-semibold">
                      Verified Successfully!
                    </Text>
                  </Animated.View>
                )}
              </Animated.View>

              {/* Resend */}
              <Animated.View
                entering={FadeInUp.delay(500).springify()}
                className="mt-8 items-center"
              >
                <Text className="text-white/50 text-sm">
                  Didn't receive the code?
                </Text>
                <Pressable
                  onPress={handleResend}
                  disabled={resendTimer > 0}
                  className="mt-2"
                >
                  <Text
                    className={`text-base font-semibold ${
                      resendTimer > 0 ? 'text-white/30' : 'text-emerald-400'
                    }`}
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                  </Text>
                </Pressable>
              </Animated.View>

              {/* Help */}
              <Animated.View
                entering={FadeInUp.delay(600).springify()}
                className="mt-auto mb-6"
              >
                <Pressable className="py-4 items-center">
                  <Text className="text-emerald-400 font-medium">
                    Need help? Contact Support
                  </Text>
                </Pressable>
              </Animated.View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}
