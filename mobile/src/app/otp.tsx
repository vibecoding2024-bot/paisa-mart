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
} from 'react-native-reanimated';
import { ArrowLeft, CheckCircle, RefreshCw } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import { useIncentiveStore } from '@/lib/incentive-store';
import { useUserProfileStore } from '@/lib/user-profile-store';
import { getAuthSecurityConfig } from '@/lib/auth-security';
import { fetchUserProfile } from '@/lib/user-profile-api';
import { saveAuthToken, sendOtp, verifyOtp as verifyOtpRequest } from '@/lib/auth-api';
import { getPostAuthRoute, normalizeKycStatus } from '@/lib/onboarding-flow';

const OTP_LENGTH = 6;

export default function OTPScreen() {
  const { phone, reqId: initialReqId } = useLocalSearchParams<{ phone: string; reqId?: string }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [reqId, setReqId] = useState(initialReqId);
  const [resendTimer, setResendTimer] = useState(30);
  const [resendMessage, setResendMessage] = useState('');
  const [error, setError] = useState('');
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const router = useRouter();
  const profile = useUserProfileStore((s) => s.profile);
  const setProfile = useUserProfileStore((s) => s.setProfile);
  const userKYC = useIncentiveStore((s) => s.userKYC);
  const setKYCStatus = useIncentiveStore((s) => s.setKYCStatus);

  const shakeValue = useSharedValue(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
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

  const handleManualVerify = () => {
    const fullOtp = otp.join('');
    if (fullOtp.length !== OTP_LENGTH || isVerifying || isVerified) return;
    verifyOtp(fullOtp);
  };

  const verifyOtp = async (otpValue: string) => {
    setIsVerifying(true);
    setError('');
    try {
      if (!phone) throw new Error('Mobile number is missing');
      const result = await verifyOtpRequest(phone, otpValue, Platform.OS === 'web' ? 'web' : 'mobile', reqId);
      await saveAuthToken(result.token);
      setIsVerified(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(async () => {
        try {
          const serverProfile = await fetchUserProfile(phone);
          if (serverProfile) {
            const kycStatus = normalizeKycStatus(serverProfile.kycStatus);
            setProfile(serverProfile);
            setKYCStatus(serverProfile.phoneNumber, kycStatus);

            const targetRoute = getPostAuthRoute(serverProfile, kycStatus);
            const config = await getAuthSecurityConfig();
            router.replace({
              pathname: config.hasMpin ? '/unlock' : '/mpin-setup',
              params: { next: targetRoute },
            });
            return;
          }
        } catch (error) {
          console.warn('Profile lookup failed, falling back to local profile', error);
        }

        if (profile?.phoneNumber === phone) {
          const targetRoute = getPostAuthRoute(profile, userKYC?.status);
          const config = await getAuthSecurityConfig();
          router.replace({
            pathname: config.hasMpin ? '/unlock' : '/mpin-setup',
            params: { next: targetRoute },
          });
          return;
        }

        router.replace({ pathname: '/basic-info', params: { phone } });
      }, 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'OTP verification failed');
      triggerShake();
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || isResending) return;

    setError('');
    setResendMessage('');
    setIsResending(true);
    try {
      if (!phone) throw new Error('Mobile number is missing');
      const result = await sendOtp(phone, Platform.OS === 'web' ? 'web' : 'mobile');
      setReqId(result.reqId);
      setResendTimer(30);
      setOtp(Array(OTP_LENGTH).fill(''));
      setActiveIndex(0);
      setResendMessage('OTP resent successfully');
      inputRefs.current[0]?.focus();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  const maskedPhone = phone ? `+91 ${phone.slice(0, 2)}****${phone.slice(-2)}` : '+91 ******';

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* Header */}
          <LinearGradient
            colors={['#002561', '#003380']}
            style={{ paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}
          >
            <View className="px-6 pt-4">
              <Animated.View
                entering={FadeInDown.delay(100).springify()}
                className="flex-row items-center"
              >
                <Pressable
                  onPress={() => router.back()}
                  className="w-10 h-10 rounded-full bg-white/10 items-center justify-center mr-4"
                >
                  <ArrowLeft size={20} color="#fff" />
                </Pressable>
                <Text className="text-white text-xl font-semibold">Verify OTP</Text>
              </Animated.View>
            </View>
          </LinearGradient>

          <View className="flex-1 px-6">
            {/* OTP Card */}
            <Animated.View
              entering={FadeInUp.delay(200).springify()}
              className="bg-white rounded-2xl p-5 -mt-4 shadow-lg"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Text className="text-gray-800 text-lg font-semibold mb-1">
                Enter Verification Code
              </Text>
              <Text className="text-gray-500 text-sm mb-1">
                We've sent a 6-digit code to
              </Text>
              <Text className="text-orange-500 font-semibold mb-6">
                {maskedPhone}
              </Text>

              {/* OTP Input */}
              <Animated.View style={shakeStyle}>
                <View className="flex-row justify-between">
                  {Array(OTP_LENGTH)
                    .fill(0)
                    .map((_, index) => (
                      <View
                        key={index}
                        className={`w-12 h-14 rounded-xl border-2 items-center justify-center ${
                          isVerified
                            ? 'border-green-500 bg-green-50'
                            : activeIndex === index
                            ? 'border-orange-500 bg-orange-50'
                            : otp[index]
                            ? 'border-gray-300 bg-gray-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <TextInput
                          ref={(ref) => {
                            inputRefs.current[index] = ref;
                          }}
                          className="text-2xl font-bold text-gray-800 text-center w-full h-full"
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
              <View className="mt-6 items-center">
                {isVerifying && !isVerified && (
                  <View className="flex-row items-center">
                    <RefreshCw size={20} color="#FF8C00" />
                    <Text className="text-gray-600 ml-2">Verifying...</Text>
                  </View>
                )}
                {isVerified && (
                  <Animated.View
                    entering={FadeInUp.springify()}
                    className="flex-row items-center"
                  >
                    <CheckCircle size={24} color="#22C55E" />
                    <Text className="text-green-500 ml-2 font-semibold">
                      Verified Successfully!
                    </Text>
                  </Animated.View>
                )}
              </View>

              {!!error && <Text className="text-red-500 text-sm text-center mt-3">{error}</Text>}

              <Pressable
                onPress={handleManualVerify}
                disabled={otp.join('').length !== OTP_LENGTH || isVerifying || isVerified}
                className={`mt-5 rounded-xl py-4 items-center ${
                  otp.join('').length === OTP_LENGTH && !isVerifying && !isVerified ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <Text
                  className={`font-bold text-base ${
                    otp.join('').length === OTP_LENGTH && !isVerifying && !isVerified ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  {isVerifying ? 'Verifying...' : 'Submit OTP'}
                </Text>
              </Pressable>

              {/* Resend */}
              <View className="mt-6 items-center">
                <Text className="text-gray-500 text-sm">
                  Didn't receive the code?
                </Text>
                <Pressable
                  onPress={handleResend}
                  disabled={resendTimer > 0 || isResending}
                  className="mt-2"
                >
                  <Text
                    className={`text-base font-semibold ${
                      resendTimer > 0 || isResending ? 'text-gray-400' : 'text-orange-500'
                    }`}
                  >
                    {isResending ? 'Sending...' : resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                  </Text>
                </Pressable>
                {!!resendMessage && !error && (
                  <Text className="text-green-600 text-sm text-center mt-2">{resendMessage}</Text>
                )}
              </View>
            </Animated.View>

            {/* Help */}
            <Animated.View
              entering={FadeInUp.delay(400).springify()}
              className="mt-auto mb-6"
            >
              <Pressable className="py-4 items-center">
                <Text className="text-orange-500 font-medium">
                  Need help? Contact Support
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
