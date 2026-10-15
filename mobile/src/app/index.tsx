import { useRef, useState } from "react";
import {
  View,
  TextInput,
  ScrollView,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowUpRight,
  Landmark,
  CreditCard,
  ShieldCheck,
  Headphones,
  Check,
  Sparkles,
} from "lucide-react-native";
import PressableScale from "@/components/PressableScale";
import {
  ActionButton,
  BrandMark,
  Typography as Text,
  palette,
  IconBadge,
} from "@/components/brand";
import { sendOtp } from "@/lib/auth-api";
import { useIncentiveStore } from "@/lib/incentive-store";
import { useUserProfileStore } from "@/lib/user-profile-store";
import { getAuthSecurityConfig } from "@/lib/auth-security";
import { fetchUserProfile } from "@/lib/user-profile-api";
import { getPostAuthRoute, normalizeKycStatus } from "@/lib/onboarding-flow";
import {
  cancelOtpLoginFlow,
  finishOtpLoginFlow,
  startOtpLoginFlow,
} from "@/lib/auth-flow";

const isWeb = Platform.OS === "web";

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 860;
  const heroSize = wide ? 48 : width < 370 ? 28 : 32;
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const sendInFlightRef = useRef(false);
  const router = useRouter();
  const profile = useUserProfileStore((s) => s.profile);
  const setProfile = useUserProfileStore((s) => s.setProfile);
  const userKYC = useIncentiveStore((s) => s.userKYC);
  const setKYCStatus = useIncentiveStore((s) => s.setKYCStatus);

  const isValidPhone = phoneNumber.length === 10 && /^\d+$/.test(phoneNumber);

  const handleMpinLogin = async () => {
    if (!profile) return;
    const targetRoute = getPostAuthRoute(profile, userKYC?.status);
    const config = await getAuthSecurityConfig();
    router.push({
      pathname: config.hasMpin ? "/unlock" : "/mpin-setup",
      params: { next: targetRoute },
    });
  };

  const routeAfterVerifiedAuth = async (verifiedPhone: string) => {
    let serverProfile: Awaited<ReturnType<typeof fetchUserProfile>> = null;
    try {
      serverProfile = await fetchUserProfile(verifiedPhone);
    } catch (error) {
      console.warn("Profile lookup failed after OTP verification", error);
    }

    if (serverProfile) {
      const kycStatus = normalizeKycStatus(serverProfile.kycStatus);
      setProfile(serverProfile);
      setKYCStatus(serverProfile.phoneNumber, kycStatus);

      const targetRoute = getPostAuthRoute(serverProfile, kycStatus);
      const config = await getAuthSecurityConfig();
      router.replace(
        config.hasMpin
          ? targetRoute
          : { pathname: "/mpin-setup", params: { next: targetRoute } },
      );
      finishOtpLoginFlow();
      return;
    }

    if (profile?.phoneNumber === verifiedPhone) {
      const targetRoute = getPostAuthRoute(profile, userKYC?.status);
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
    router.replace({
      pathname: "/basic-info",
      params: { phone: verifiedPhone },
    });
  };

  const handleContinue = async () => {
    if (isValidPhone && !sendInFlightRef.current) {
      sendInFlightRef.current = true;
      setError("");
      setIsSending(true);
      try {
        startOtpLoginFlow();
        const otpResult = await sendOtp(phoneNumber, isWeb ? "web" : "mobile");
        router.push({
          pathname: "/otp",
          params: { phone: phoneNumber, reqId: otpResult.reqId },
        });
      } catch (e) {
        cancelOtpLoginFlow();
        setError(e instanceof Error ? e.message : "Unable to send OTP");
      } finally {
        sendInFlightRef.current = false;
        setIsSending(false);
      }
    }
  };

  const formatPhoneDisplay = (value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 10);
    return cleaned;
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: palette.canvas }}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            padding: wide ? 40 : 0,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 1120,
              alignSelf: "center",
              flexDirection: wide ? "row" : "column",
              borderRadius: wide ? 32 : 0,
              overflow: "hidden",
              backgroundColor: "#fff",
              borderWidth: wide ? 1 : 0,
              borderColor: palette.line,
            }}
          >
            <LinearGradient
              colors={["#102F48", "#164B69"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flex: wide ? 1.1 : undefined,
                padding: wide ? 46 : 26,
                paddingBottom: wide ? 46 : 34,
                overflow: "hidden",
              }}
            >
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  width: 330,
                  height: 330,
                  borderRadius: 165,
                  borderWidth: 1,
                  borderColor: "#ffffff12",
                  right: -160,
                  top: 60,
                }}
              />
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  width: 260,
                  height: 260,
                  borderRadius: 130,
                  borderWidth: 36,
                  borderColor: "#ffffff04",
                  right: -120,
                  top: 95,
                }}
              />
              <BrandMark light />
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 7,
                  marginTop: wide ? 62 : 30,
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    backgroundColor: palette.mint,
                    borderRadius: 3,
                  }}
                />
                <Text
                  style={{
                    color: palette.mint,
                    fontSize: 10,
                    fontWeight: "700",
                    letterSpacing: 2,
                  }}
                >
                  YOUR NEXT CHAPTER
                </Text>
              </View>
              <Text
                accessibilityRole="header"
                style={{
                  fontSize: heroSize,
                  lineHeight: wide ? 57 : 40,
                  fontWeight: "800",
                  color: "#fff",
                  letterSpacing: -1.5,
                  marginTop: 14,
                }}
              >
                Big ambitions.{"\n"}
                <Text
                  style={{
                    color: palette.mint,
                    fontSize: heroSize,
                    lineHeight: wide ? 57 : 40,
                    fontWeight: "800",
                    letterSpacing: -1.5,
                  }}
                >
                  Brighter beginnings.
                </Text>
              </Text>
              <Text
                style={{
                  color: "#C6DAE7",
                  fontSize: 14,
                  lineHeight: 23,
                  marginTop: 17,
                  maxWidth: 340,
                }}
              >
                Discover financial products. Help your customers. Build your
                earning journey with Paisa Mart.
              </Text>
              {wide && (
                <View style={{ marginTop: 40, gap: 12 }}>
                  <View
                    style={{
                      backgroundColor: "#ffffff10",
                      padding: 18,
                      borderRadius: 20,
                      borderColor: "#ffffff20",
                      borderWidth: 1,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 14,
                    }}
                  >
                    <IconBadge
                      icon={Landmark}
                      color={palette.navy}
                      background={palette.mint}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "700",
                          fontSize: 15,
                        }}
                      >
                        More possibilities, one place.
                      </Text>
                      <Text
                        style={{ color: "#C6DAE7", fontSize: 12, marginTop: 5 }}
                      >
                        Banking · Credit cards · Loans · Insurance
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 7,
                      padding: 6,
                    }}
                  >
                    <Check size={15} color={palette.mint} />
                    <Text style={{ color: "#C6DAE7", fontSize: 12 }}>
                      Product discovery to application, made simpler.
                    </Text>
                  </View>
                </View>
              )}
            </LinearGradient>
            <View
              style={{
                flex: wide ? 1 : undefined,
                padding: wide ? 46 : 26,
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  alignSelf: "flex-start",
                  borderRadius: 12,
                  backgroundColor: "#EDF7F3",
                  paddingHorizontal: 11,
                  paddingVertical: 8,
                  flexDirection: "row",
                  gap: 7,
                  alignItems: "center",
                  marginBottom: 23,
                }}
              >
                <ShieldCheck size={15} color={palette.teal} />
                <Text
                  style={{
                    color: palette.teal,
                    fontSize: 11,
                    fontWeight: "600",
                  }}
                >
                  Sign in with OTP
                </Text>
              </View>
              <Text
                style={{ fontSize: 28, fontWeight: "800", letterSpacing: -0.8 }}
              >
                Welcome to Paisa Mart
              </Text>
              <Text
                style={{
                  color: palette.muted,
                  fontSize: 13,
                  lineHeight: 21,
                  marginTop: 9,
                  marginBottom: 28,
                }}
              >
                A world of opportunities starts with your mobile number.
              </Text>
              <Text
                style={{ fontSize: 12, fontWeight: "700", marginBottom: 10 }}
              >
                Mobile number
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  borderWidth: 1.5,
                  borderColor: error
                    ? "#D84747"
                    : isFocused
                      ? palette.blue
                      : "#DCE5EE",
                  backgroundColor: isFocused ? "#fff" : "#F8FAFC",
                  borderRadius: 15,
                  minHeight: 58,
                  paddingHorizontal: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    borderRightWidth: 1,
                    borderColor: "#DCE5EE",
                    paddingRight: 14,
                  }}
                >
                  +91
                </Text>
                <TextInput
                  accessibilityLabel="Mobile number"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    paddingLeft: 14,
                    height: 56,
                    fontSize: 16,
                    color: palette.ink,
                    fontFamily: "JakartaSemiBold",
                  }}
                  placeholder="Enter 10-digit number"
                  placeholderTextColor="#8697A6"
                  keyboardType="number-pad"
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(formatPhoneDisplay(text));
                    if (error) setError("");
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  maxLength={10}
                  autoCorrect={false}
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  returnKeyType="go"
                  onSubmitEditing={handleContinue}
                  editable={!isSending}
                />
              </View>
              {!!error && (
                <Text
                  accessibilityRole="alert"
                  style={{
                    color: "#C93636",
                    fontSize: 12,
                    lineHeight: 19,
                    marginTop: 10,
                  }}
                >
                  {error}
                </Text>
              )}
              <View style={{ marginTop: 18 }}>
                <ActionButton
                  label={isSending ? "Sending your code…" : "Get started"}
                  loading={isSending}
                  disabled={!isValidPhone}
                  onPress={handleContinue}
                />
              </View>
              {profile && (
                <PressableScale
                  onPress={handleMpinLogin}
                  style={{
                    minHeight: 48,
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 8,
                  }}
                >
                  <Text
                    style={{
                      color: palette.blue,
                      fontWeight: "700",
                      fontSize: 13,
                    }}
                  >
                    Sign in with MPIN
                  </Text>
                </PressableScale>
              )}
              <Text
                style={{
                  color: palette.muted,
                  fontSize: 11,
                  lineHeight: 19,
                  marginTop: 16,
                }}
              >
                By continuing, you agree to our{" "}
                <Text
                  onPress={() => router.push("/terms-and-conditions")}
                  accessibilityRole="link"
                  style={{
                    color: palette.blue,
                    fontSize: 11,
                    fontWeight: "700",
                    textDecorationLine: "underline",
                  }}
                >
                  Terms & Conditions
                </Text>
                .
              </Text>
              <View
                style={{
                  borderTopWidth: 1,
                  borderColor: palette.line,
                  marginTop: 28,
                  paddingTop: 23,
                  gap: 15,
                }}
              >
                {[
                  {
                    icon: CreditCard,
                    title: "Discover",
                    caption: "Explore products for every customer.",
                  },
                  {
                    icon: Sparkles,
                    title: "Grow",
                    caption: "Learn, share, and build your business.",
                  },
                ].map((item) => (
                  <View
                    key={item.title}
                    style={{
                      flexDirection: "row",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    <IconBadge
                      icon={item.icon}
                      size={37}
                      background="#F0F5FB"
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: "700" }}>
                        {item.title}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: palette.muted,
                          marginTop: 3,
                        }}
                      >
                        {item.caption}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 25,
                }}
              >
                <PressableScale
                  onPress={() => router.push("/about-us")}
                  style={{ minHeight: 44, justifyContent: "center" }}
                >
                  <Text style={{ color: palette.muted, fontSize: 12 }}>
                    About Paisa Mart
                  </Text>
                </PressableScale>
                <PressableScale
                  onPress={() => router.push("/support")}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    minHeight: 44,
                    gap: 6,
                  }}
                >
                  <Headphones size={15} color={palette.blue} />
                  <Text
                    style={{
                      color: palette.blue,
                      fontSize: 12,
                      fontWeight: "700",
                    }}
                  >
                    Get help
                  </Text>
                  <ArrowUpRight size={13} color={palette.blue} />
                </PressableScale>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
