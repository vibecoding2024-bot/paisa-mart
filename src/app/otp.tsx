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
import { useRouter, useLocalSearchParams, useNavigationContainerRef } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
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
  const rootNavigation = useNavigationContainerRef();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    const checkNavigation = () => {
      if (rootNavigation?.isReady()) {
        setIsNavigationReady(true);
      } else {
        setTimeout(checkNavigation, 100);
      }
    };
    checkNavigation();
  }, [rootNavigation]);

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
    if (e?.nativeEvent?.key === 'Backspace' && !otp[index] && index > 0) {
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
        if (isNavigationReady) {
          router.replace('/basic-info');
        }
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
              {/* Header */}
              <Animated.View
                entering={FadeInDown.delay(100).springify()}
                className="flex-row items-center mt-4"
              >
                <Pressable
                  onPress={() => {
                    if (isNavigationReady) {
                      router.back();
                    }
                  }}
                  className="w-11 h-11 rounded-full items-center justify-center border border-amber-500/30"
                  style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)' }}
                >
                  <ArrowLeft size={20} color="#D4AF37" />
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
                <Text className="text-amber-400 font-semibold text-lg mt-1">
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
                            ? 'border-amber-400'
                            : activeIndex === index
                            ? 'border-amber-400'
                            : otp[index]
                            ? 'border-amber-500/50'
                            : 'border-amber-500/20'
                        }`}
                        style={{
                          backgroundColor: isVerified
                            ? 'rgba(212, 175, 55, 0.2)'
                            : activeIndex === index
                            ? 'rgba(212, 175, 55, 0.1)'
                            : otp[index]
                            ? 'rgba(212, 175, 55, 0.08)'
                            : 'rgba(0, 0, 0, 0.3)'
                        }}
                      >
                        <TextInput
                          ref={(ref) => {
                            inputRefs.current[index] = ref;
                          }}
                          className="text-2xl font-bold text-amber-400 text-center w-full h-full"
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
                    <RefreshCw size={20} color="#D4AF37" />
                    <Text className="text-white/70 ml-2">Verifying...</Text>
                  </View>
                )}
                {isVerified && (
                  <Animated.View
                    entering={FadeInUp.springify()}
                    className="flex-row items-center"
                  >
                    <CheckCircle size={24} color="#D4AF37" />
                    <Text className="text-amber-400 ml-2 font-semibold">
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
                      resendTimer > 0 ? 'text-white/30' : 'text-amber-400'
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
                  <Text className="text-amber-400 font-medium">
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
