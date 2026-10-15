import { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  BrandMark,
  Surface,
  Typography as Text,
  ActionButton,
  palette,
} from "@/components/brand";
import PressableScale from "@/components/PressableScale";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  ReduceMotion,
} from "react-native-reanimated";
import { ArrowLeft, CheckCircle, RefreshCw } from "lucide-react-native";
import * as Haptics from "@/lib/haptics";
import { useIncentiveStore } from "@/lib/incentive-store";
import { useUserProfileStore } from "@/lib/user-profile-store";
import { getAuthSecurityConfig } from "@/lib/auth-security";
import { fetchUserProfile } from "@/lib/user-profile-api";
import {
  saveAuthToken,
  sendOtp,
  verifyOtp as verifyOtpRequest,
} from "@/lib/auth-api";
import { getPostAuthRoute, normalizeKycStatus } from "@/lib/onboarding-flow";
import {
  cancelOtpLoginFlow,
  finishOtpLoginFlow,
  startOtpLoginFlow,
} from "@/lib/auth-flow";

const OTP_LENGTH = 6;

export default function OTPScreen() {
  const {
    phone,
    reqId: initialReqId,
    next,
  } = useLocalSearchParams<{
    phone: string;
    reqId?: string;
    next?: string;
  }>();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [reqId, setReqId] = useState(initialReqId);
  const [resendTimer, setResendTimer] = useState(30);
  const [resendMessage, setResendMessage] = useState("");
  const [error, setError] = useState("");
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const resendInFlightRef = useRef(false);
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
      withTiming(-10, { duration: 50, reduceMotion: ReduceMotion.System }),
      withTiming(10, { duration: 50, reduceMotion: ReduceMotion.System }),
      withTiming(-10, { duration: 50, reduceMotion: ReduceMotion.System }),
      withTiming(10, { duration: 50, reduceMotion: ReduceMotion.System }),
      withTiming(0, { duration: 50, reduceMotion: ReduceMotion.System }),
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      const pastedOtp = value.slice(0, OTP_LENGTH).split("");
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

  const handleKeyPress = (
    e: { nativeEvent: { key: string } },
    index: number,
  ) => {
    if (e?.nativeEvent?.key === "Backspace" && !otp[index] && index > 0) {
      setActiveIndex(index - 1);
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
    }
  };

  const handleManualVerify = () => {
    const fullOtp = otp.join("");
    if (fullOtp.length !== OTP_LENGTH || isVerifying || isVerified) return;
    verifyOtp(fullOtp);
  };

  const verifyOtp = async (otpValue: string) => {
    setIsVerifying(true);
    setError("");
    try {
      if (!phone) throw new Error("Mobile number is missing");
      startOtpLoginFlow();
      const result = await verifyOtpRequest(
        phone,
        otpValue,
        Platform.OS === "web" ? "web" : "mobile",
        reqId,
      );
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

            const targetRoute =
              next || getPostAuthRoute(serverProfile, kycStatus);
            const config = await getAuthSecurityConfig();
            router.replace(
              config.hasMpin
                ? targetRoute
                : { pathname: "/mpin-setup", params: { next: targetRoute } },
            );
            finishOtpLoginFlow();
            return;
          }
        } catch (error) {
          console.warn(
            "Profile lookup failed, falling back to local profile",
            error,
          );
        }

        if (profile?.phoneNumber === phone) {
          const targetRoute =
            next || getPostAuthRoute(profile, userKYC?.status);
          const config = await getAuthSecurityConfig();
          router.replace(
            config.hasMpin
              ? targetRoute
              : { pathname: "/mpin-setup", params: { next: targetRoute } },
          );
          finishOtpLoginFlow();
          return;
        }

        finishOtpLoginFlow();
        router.replace({ pathname: "/basic-info", params: { phone } });
      }, 1000);
    } catch (e) {
      cancelOtpLoginFlow();
      setError(e instanceof Error ? e.message : "OTP verification failed");
      triggerShake();
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || resendInFlightRef.current) return;

    resendInFlightRef.current = true;
    setError("");
    setResendMessage("");
    setIsResending(true);
    try {
      if (!phone) throw new Error("Mobile number is missing");
      const result = await sendOtp(
        phone,
        Platform.OS === "web" ? "web" : "mobile",
      );
      setReqId(result.reqId);
      setResendTimer(30);
      setOtp(Array(OTP_LENGTH).fill(""));
      setActiveIndex(0);
      setResendMessage("OTP resent successfully");
      inputRefs.current[0]?.focus();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to resend OTP");
    } finally {
      resendInFlightRef.current = false;
      setIsResending(false);
    }
  };

  const maskedPhone = phone
    ? `+91 ${phone.slice(0, 2)}****${phone.slice(-2)}`
    : "+91 ******";

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{ flex: 1, backgroundColor: palette.canvas }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View style={{ width: "100%", maxWidth: 460, alignSelf: "center" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 30,
              }}
            >
              <PressableScale
                accessibilityLabel="Back to sign in"
                onPress={() => router.back()}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: "#fff",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowLeft size={20} color={palette.ink} />
              </PressableScale>
              <BrandMark />
            </View>
            <Surface style={{ padding: 22 }}>
              <Text
                style={{
                  color: palette.teal,
                  fontSize: 10,
                  letterSpacing: 2,
                  fontWeight: "700",
                }}
              >
                ONE LAST STEP
              </Text>
              <Text
                accessibilityRole="header"
                style={{
                  fontSize: 27,
                  fontWeight: "800",
                  letterSpacing: -0.8,
                  marginTop: 13,
                }}
              >
                Let's make it official.
              </Text>
              <Text
                style={{
                  color: palette.muted,
                  fontSize: 13,
                  lineHeight: 22,
                  marginTop: 12,
                }}
              >
                Enter the 6-digit code sent to
              </Text>
              <Text style={{ fontSize: 14, fontWeight: "700", marginTop: 3 }}>
                {maskedPhone}
              </Text>
              <Animated.View
                style={[
                  shakeStyle,
                  { marginTop: 27, flexDirection: "row", gap: 6 },
                ]}
              >
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    accessibilityLabel={`OTP digit ${index + 1}`}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      height: 55,
                      textAlign: "center",
                      borderRadius: 12,
                      borderWidth: 1.5,
                      borderColor: isVerified
                        ? palette.teal
                        : activeIndex === index
                          ? palette.blue
                          : "#DDE6EF",
                      backgroundColor: isVerified
                        ? "#EDF8F1"
                        : activeIndex === index
                          ? "#F2F6FF"
                          : "#F8FAFC",
                      fontFamily: "JakartaBold",
                      fontSize: 22,
                      color: palette.ink,
                    }}
                    keyboardType="number-pad"
                    maxLength={index === 0 ? OTP_LENGTH : 1}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={(event) => handleKeyPress(event, index)}
                    onFocus={() => setActiveIndex(index)}
                    editable={!isVerifying && !isVerified}
                    selectTextOnFocus
                    textContentType={index === 0 ? "oneTimeCode" : "none"}
                    autoComplete={index === 0 ? "sms-otp" : "off"}
                  />
                ))}
              </Animated.View>
              {!!error && (
                <Text
                  accessibilityRole="alert"
                  style={{
                    color: "#C93636",
                    fontSize: 12,
                    lineHeight: 19,
                    marginTop: 14,
                  }}
                >
                  {error}
                </Text>
              )}
              {isVerified && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 16,
                  }}
                >
                  <CheckCircle size={18} color={palette.teal} />
                  <Text
                    style={{
                      color: palette.teal,
                      fontWeight: "700",
                      fontSize: 12,
                    }}
                  >
                    Verified. You're all set.
                  </Text>
                </View>
              )}
              <View style={{ marginTop: 23 }}>
                <ActionButton
                  label={
                    isVerifying
                      ? "Verifying…"
                      : isVerified
                        ? "Verified"
                        : "Verify & continue"
                  }
                  onPress={handleManualVerify}
                  loading={isVerifying}
                  disabled={otp.join("").length !== OTP_LENGTH || isVerified}
                />
              </View>
              <Text
                style={{
                  color: palette.muted,
                  textAlign: "center",
                  fontSize: 12,
                  marginTop: 25,
                }}
              >
                Didn't receive your code?
              </Text>
              <PressableScale
                onPress={handleResend}
                disabled={resendTimer > 0 || isResending}
                style={{
                  minHeight: 48,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color:
                      resendTimer > 0 || isResending
                        ? palette.muted
                        : palette.blue,
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  {isResending
                    ? "Sending…"
                    : resendTimer > 0
                      ? `Resend in ${resendTimer}s`
                      : "Resend OTP"}
                </Text>
              </PressableScale>
              {!!resendMessage && !error && (
                <Text
                  accessibilityLiveRegion="polite"
                  style={{
                    color: palette.teal,
                    fontSize: 12,
                    textAlign: "center",
                  }}
                >
                  {resendMessage}
                </Text>
              )}
            </Surface>
            <PressableScale
              onPress={() => router.push("/support")}
              style={{
                minHeight: 50,
                justifyContent: "center",
                alignItems: "center",
                marginTop: 14,
              }}
            >
              <Text
                style={{ color: palette.blue, fontSize: 12, fontWeight: "600" }}
              >
                Need a hand? Get help
              </Text>
            </PressableScale>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
