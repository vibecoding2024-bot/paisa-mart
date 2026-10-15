import { useState } from "react";
import { View, Share, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Bell,
  ChevronRight,
  CreditCard,
  Landmark,
  Shield,
  TrendingUp,
  Users,
  Wallet,
  Star,
  Gift,
  Zap,
  Home,
  Car,
  Briefcase,
  Heart,
  UserCheck,
  Gem,
  Building2,
  Umbrella,
  Smartphone,
  Plane,
  ArrowUpRight,
  Info,
  Headphones,
} from "lucide-react-native";
import { Search, ArrowRight, BookOpen } from "lucide-react-native";
import {
  Page,
  BrandMark,
  Typography as Text,
  Surface,
  SectionHeading,
  Reveal,
  IconBadge,
  palette,
} from "@/components/brand";
import { useRouter } from "expo-router";
import {
  useUserProfileStore,
  getTimeBasedGreeting,
} from "@/lib/user-profile-store";
import { useFeatureFlags } from "@/lib/feature-flags";
import { useNotificationStore } from "@/lib/notification-store";
import { toast } from "@/lib/toast-store";
import PressableScale from "@/components/PressableScale";
import ComingSoonModal, {
  type ComingSoonModule,
} from "@/components/ComingSoonModal";

const QUICK_ACTIONS = [
  {
    icon: CreditCard,
    label: "Credit Cards",
    color: "#3B82F6",
    bg: "#EFF6FF",
    categoryId: "credit-cards",
  },
  {
    icon: Landmark,
    label: "Bank Accounts",
    color: "#06B6D4",
    bg: "#ECFEFF",
    categoryId: "bank-accounts",
  },
  {
    icon: Home,
    label: "Home Loans",
    color: "#8B5CF6",
    bg: "#F5F3FF",
    categoryId: "home-loans",
  },
  {
    icon: UserCheck,
    label: "Personal Loans",
    color: "#10B981",
    bg: "#ECFDF5",
    categoryId: "personal-loans",
  },
  {
    icon: Car,
    label: "Vehicle Loans",
    color: "#EF4444",
    bg: "#FEF2F2",
    categoryId: "vehicle-loans",
  },
  {
    icon: Briefcase,
    label: "Business Loans",
    color: "#EC4899",
    bg: "#FDF2F8",
    categoryId: "business-loans",
  },
  {
    icon: Zap,
    label: "Insta Loans",
    color: "#F59E0B",
    bg: "#FFFBEB",
    categoryId: "insta-loans",
  },
  {
    icon: Heart,
    label: "Health Insurance",
    color: "#22C55E",
    bg: "#F0FDF4",
    categoryId: "health-insurance",
  },
  {
    icon: Shield,
    label: "Life Insurance",
    color: "#6366F1",
    bg: "#EEF2FF",
    categoryId: "life-insurance",
  },
  {
    icon: Umbrella,
    label: "Motor Insurance",
    color: "#0EA5E9",
    bg: "#F0F9FF",
    categoryId: "motor-insurance",
  },
  {
    icon: Gem,
    label: "Gold Loans",
    color: "#EAB308",
    bg: "#FEFCE8",
    categoryId: "gold-loans",
  },
  {
    icon: Building2,
    label: "Real Estate",
    color: "#64748B",
    bg: "#F8FAFC",
    categoryId: "real-estate",
  },
  {
    icon: Wallet,
    label: "Cash on Credit Card",
    color: "#8B5CF6",
    bg: "#F5F3FF",
    categoryId: "cash-cards",
    isScreen: true,
  },
  {
    icon: Smartphone,
    label: "Recharge & Pay Bills",
    color: "#7C3AED",
    bg: "#F5F3FF",
    categoryId: "recharge-bills",
    isScreen: true,
  },
  {
    icon: Plane,
    label: "Travel & Tickets",
    color: "#DC2626",
    bg: "#FEF2F2",
    categoryId: "travel-tickets",
    isScreen: true,
  },
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  const columns = wide ? 6 : width < 370 ? 3 : 4;
  const router = useRouter();
  const getFirstName = useUserProfileStore((s) => s.getFirstName);
  const hasProfile = useUserProfileStore((s) => s.hasProfile);
  const goldLoanEnabled = useFeatureFlags((s) => s.gold_loan_enabled);
  const realEstateEnabled = useFeatureFlags((s) => s.real_estate_enabled);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const [comingSoonModule, setComingSoonModule] =
    useState<ComingSoonModule | null>(null);

  const handleQuickAction = (categoryId: string, isScreen?: boolean) => {
    if (categoryId === "gold-loans" && !goldLoanEnabled) {
      setComingSoonModule("gold-loans");
      return;
    }
    if (categoryId === "real-estate" && !realEstateEnabled) {
      setComingSoonModule("real-estate");
      return;
    }
    if (categoryId === "home-loans") {
      router.push("/home-loans-details");
      return;
    }
    if (categoryId === "business-loans") {
      router.push("/business-loans-details");
      return;
    }
    if (categoryId === "personal-loans") {
      router.push("/personal-loans-details");
      return;
    }
    if (isScreen) {
      router.push(`/${categoryId}`);
    } else {
      router.push({
        pathname: "/(tabs)/products",
        params: { category: categoryId },
      });
    }
  };

  const handleInvite = async () => {
    try {
      await Share.share({
        message:
          "Join me on Paisa Mart and start earning by selling financial products! Sign up with my referral and we both earn ₹500. 💰",
      });
    } catch {
      toast.error("Could not open share sheet");
    }
  };

  const firstName = getFirstName();
  const timeBasedGreeting = getTimeBasedGreeting();
  const greetingLine =
    hasProfile() && firstName ? timeBasedGreeting : "Welcome to";
  const nameLine = hasProfile() && firstName ? firstName : "Paisa Mart";
  const avatarLetter = firstName ? firstName.charAt(0).toUpperCase() : "P";

  return (
    <>
      <Page>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 28,
          }}
        >
          <BrandMark />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <PressableScale
              accessibilityLabel="Notifications"
              onPress={() => router.push("/notifications")}
              style={{
                width: 44,
                height: 44,
                borderRadius: 16,
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: palette.line,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bell size={20} color={palette.ink} />
              {unreadCount > 0 && (
                <View
                  style={{
                    position: "absolute",
                    right: 8,
                    top: 7,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#E88F45",
                    borderWidth: 2,
                    borderColor: "#fff",
                  }}
                />
              )}
            </PressableScale>
            <PressableScale
              accessibilityLabel="My profile"
              onPress={() => router.push("/(tabs)/profile")}
              style={{
                width: 44,
                height: 44,
                borderRadius: 16,
                backgroundColor: "#DFEEE9",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ color: palette.teal, fontWeight: "800", fontSize: 17 }}
              >
                {avatarLetter}
              </Text>
            </PressableScale>
          </View>
        </View>
        <View style={{ marginBottom: 22 }}>
          <Text style={{ color: palette.muted, fontSize: 12, marginBottom: 5 }}>
            {greetingLine}
          </Text>
          <Text
            accessibilityRole="header"
            style={{ fontSize: 28, fontWeight: "800", letterSpacing: -0.8 }}
          >
            {nameLine}
            <Text style={{ color: palette.teal, fontSize: 28 }}>.</Text> Let's
            grow.
          </Text>
        </View>
        <Reveal>
          <LinearGradient
            colors={["#102F48", "#194D69"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 26,
              padding: wide ? 30 : 24,
              overflow: "hidden",
              marginBottom: 20,
            }}
          >
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                right: -44,
                top: -66,
                width: 230,
                height: 230,
                borderRadius: 115,
                borderColor: "#ffffff0D",
                borderWidth: 38,
              }}
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#C6DAE7", fontSize: 12 }}>
                  Your total earnings
                </Text>
                <Text
                  style={{
                    fontSize: 40,
                    lineHeight: 52,
                    color: "#fff",
                    fontWeight: "800",
                    letterSpacing: -1.4,
                    marginTop: 5,
                  }}
                >
                  ₹0
                  <Text
                    style={{
                      fontSize: 22,
                      color: "#AFC9D8",
                      fontWeight: "400",
                    }}
                  >
                    .00
                  </Text>
                </Text>
              </View>
              <PressableScale
                onPress={() => router.push("/(tabs)/earnings")}
                style={{
                  backgroundColor: palette.mint,
                  minHeight: 46,
                  paddingHorizontal: 17,
                  borderRadius: 15,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <Text style={{ fontWeight: "700", fontSize: 12 }}>
                  Earnings
                </Text>
                <ArrowUpRight size={17} color={palette.ink} />
              </PressableScale>
            </View>
            <View
              style={{
                marginTop: 18,
                paddingTop: 17,
                borderTopWidth: 1,
                borderTopColor: "#ffffff1C",
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <TrendingUp size={16} color={palette.mint} />
              <Text style={{ color: "#D2E3ED", fontSize: 11, flex: 1 }}>
                Your next opportunity is a tap away.
              </Text>
            </View>
          </LinearGradient>
        </Reveal>
        <PressableScale
          accessibilityLabel="Search financial products"
          onPress={() => router.push("/(tabs)/products")}
          style={{
            backgroundColor: "#fff",
            borderColor: palette.line,
            borderWidth: 1,
            minHeight: 54,
            borderRadius: 17,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 17,
            gap: 10,
            marginBottom: 26,
          }}
        >
          <Search size={19} color={palette.muted} />
          <Text style={{ color: palette.muted, fontSize: 12, flex: 1 }}>
            Find cards, loans, insurance & more
          </Text>
          <ArrowRight size={16} color={palette.blue} />
        </PressableScale>
        <Reveal delay={70}>
          <Surface style={{ padding: wide ? 26 : 18, marginBottom: 24 }}>
            <SectionHeading
              title="Explore & earn"
              action="View all"
              onPress={() => router.push("/(tabs)/products")}
            />
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                marginHorizontal: -4,
              }}
            >
              {QUICK_ACTIONS.filter((action) => !action.isScreen).map(
                (action, index) => (
                  <PressableScale
                    key={action.categoryId}
                    onPress={() => handleQuickAction(action.categoryId)}
                    style={{
                      width: `${100 / columns}%`,
                      alignItems: "center",
                      paddingHorizontal: 4,
                      paddingVertical: 13,
                      gap: 9,
                    }}
                  >
                    <IconBadge
                      icon={action.icon}
                      size={49}
                      color={
                        index % 3 === 1
                          ? palette.teal
                          : index % 3 === 2
                            ? "#9F682A"
                            : palette.blue
                      }
                      background={
                        index % 3 === 1
                          ? "#EAF6F1"
                          : index % 3 === 2
                            ? "#FCF3E6"
                            : "#ECF2FE"
                      }
                    />
                    <Text
                      style={{
                        textAlign: "center",
                        fontWeight: "600",
                        fontSize: 11,
                        lineHeight: 16,
                        minHeight: 32,
                      }}
                    >
                      {action.label}
                    </Text>
                  </PressableScale>
                ),
              )}
            </View>
          </Surface>
        </Reveal>
        <SectionHeading
          title="Everyday essentials"
          detail="A little more convenience, every day."
        />
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 26 }}>
          {QUICK_ACTIONS.filter((action) => action.isScreen).map((action) => (
            <PressableScale
              key={action.categoryId}
              onPress={() => handleQuickAction(action.categoryId, true)}
              style={{
                flex: 1,
                paddingVertical: 20,
                paddingHorizontal: 8,
                borderRadius: 21,
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: palette.line,
                alignItems: "center",
                gap: 12,
              }}
            >
              <action.icon size={25} color={palette.blue} strokeWidth={1.7} />
              <Text
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  lineHeight: 17,
                  fontWeight: "600",
                }}
              >
                {action.label}
              </Text>
            </PressableScale>
          ))}
        </View>
        <Reveal
          delay={120}
          style={{ flexDirection: wide ? "row" : "column", gap: 16 }}
        >
          <View style={{ flex: 1 }}>
            <PressableScale
              onPress={handleInvite}
              style={{
                backgroundColor: "#E6F3EC",
                borderRadius: 24,
                padding: 23,
                flex: 1,
                borderWidth: 1,
                borderColor: "#D5EBDD",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 18,
                }}
              >
                <IconBadge
                  icon={Gift}
                  background="#D2EBDD"
                  color={palette.teal}
                  size={42}
                />
                <ArrowUpRight size={20} color={palette.teal} />
              </View>
              <Text
                style={{
                  color: palette.teal,
                  fontSize: 10,
                  letterSpacing: 1.8,
                  fontWeight: "700",
                }}
              >
                BETTER, TOGETHER
              </Text>
              <Text
                style={{
                  fontSize: 22,
                  letterSpacing: -0.6,
                  fontWeight: "800",
                  marginTop: 7,
                }}
              >
                Refer & earn ₹500
              </Text>
              <Text
                style={{
                  color: "#547464",
                  fontSize: 12,
                  lineHeight: 20,
                  marginTop: 7,
                }}
              >
                Invite friends to start their journey.
              </Text>
              <Text
                style={{
                  color: palette.teal,
                  fontWeight: "700",
                  fontSize: 12,
                  marginTop: 18,
                }}
              >
                Invite a friend →
              </Text>
            </PressableScale>
          </View>
          <View style={{ flex: 1 }}>
            <PressableScale
              onPress={() => router.push("/(tabs)/learn")}
              style={{
                backgroundColor: "#EBF0FC",
                borderRadius: 24,
                padding: 23,
                flex: 1,
                borderWidth: 1,
                borderColor: "#DCE5FA",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 18,
                }}
              >
                <IconBadge icon={BookOpen} size={42} background="#DBE5FC" />
                <ArrowUpRight size={20} color={palette.blue} />
              </View>
              <Text
                style={{
                  color: palette.blue,
                  fontSize: 10,
                  letterSpacing: 1.8,
                  fontWeight: "700",
                }}
              >
                INVEST IN YOURSELF
              </Text>
              <Text
                style={{
                  fontSize: 22,
                  letterSpacing: -0.6,
                  fontWeight: "800",
                  marginTop: 7,
                }}
              >
                Learn. Build. Grow.
              </Text>
              <Text
                style={{
                  color: palette.muted,
                  fontSize: 12,
                  lineHeight: 20,
                  marginTop: 7,
                }}
              >
                Make your next conversation count.
              </Text>
              <Text
                style={{
                  color: palette.blue,
                  fontWeight: "700",
                  fontSize: 12,
                  marginTop: 18,
                }}
              >
                Explore learning →
              </Text>
            </PressableScale>
          </View>
        </Reveal>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 24,
            marginTop: 22,
          }}
        >
          <PressableScale
            onPress={() => router.push("/about-us")}
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Text style={{ fontSize: 11, color: palette.muted }}>
              About Paisa Mart
            </Text>
          </PressableScale>
          <PressableScale
            onPress={() => router.push("/support")}
            style={{
              minHeight: 44,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Headphones size={14} color={palette.muted} />
            <Text style={{ fontSize: 11, color: palette.muted }}>
              Here to help
            </Text>
          </PressableScale>
        </View>
      </Page>
      <ComingSoonModal
        visible={comingSoonModule !== null}
        module={comingSoonModule}
        onClose={() => setComingSoonModule(null)}
      />
    </>
  );
}
