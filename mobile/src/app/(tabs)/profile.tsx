import { useState } from "react";
import { View, Modal, Share, Pressable } from "react-native";
import {
  Page,
  ScreenHeader,
  Surface,
  Typography as Text,
  IconBadge,
  palette,
} from "@/components/brand";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ChevronRight,
  Settings,
  HelpCircle,
  FileText,
  Share2,
  Star,
  LogOut,
  Award,
  Bell,
  Shield,
  CreditCard,
  Lock,
  X,
  Info,
} from "lucide-react-native";

import { useUserProfileStore } from "@/lib/user-profile-store";
import { useIncentiveStore } from "@/lib/incentive-store";
import { useNotificationStore } from "@/lib/notification-store";
import { toast } from "@/lib/toast-store";
import PressableScale from "@/components/PressableScale";
import { clearAuthToken } from "@/lib/auth-api";
import { KYC_ENFORCEMENT_DISABLED } from "@/lib/onboarding-flow";

type MenuItem = {
  icon: typeof Bell;
  label: string;
  description: string;
  action: string;
};

const MENU_ITEMS: MenuItem[] = [
  {
    icon: CreditCard,
    label: "Bank Details",
    description: "Manage payout account",
    action: "route:/bank-details",
  },
  {
    icon: Bell,
    label: "Notifications",
    description: "Manage alerts",
    action: "route:/notifications",
  },
  {
    icon: Shield,
    label: "KYC Verification",
    description: "Complete your KYC",
    action: "route:/kyc",
  },
  {
    icon: Share2,
    label: "Refer & Earn",
    description: "Invite friends, earn ₹500",
    action: "share",
  },
  {
    icon: FileText,
    label: "Terms & Conditions",
    description: "Payout terms & policies",
    action: "route:/terms-and-conditions",
  },
  {
    icon: Award,
    label: "Payout Structure",
    description: "Commission rates by product",
    action: "route:/payout-structure",
  },
  {
    icon: Info,
    label: "About Us",
    description: "Paisa Mart Pvt Ltd",
    action: "route:/about-us",
  },
  {
    icon: HelpCircle,
    label: "Help & Support",
    description: "Get assistance",
    action: "help",
  },
  {
    icon: Star,
    label: "Rate Us",
    description: "Share your feedback",
    action: "rate",
  },
];

export default function ProfileScreen() {
  const router = useRouter();
  const profile = useUserProfileStore((s) => s.profile);
  const clearProfile = useUserProfileStore((s) => s.clearProfile);
  const userKYC = useIncentiveStore((s) => s.userKYC);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const displayName = profile?.name?.trim() || "Partner Name";
  const displayPhone = profile?.phoneNumber || "Add your mobile number";
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const isKYCVerified =
    KYC_ENFORCEMENT_DISABLED || userKYC?.status === "verified";
  const kycLabel = KYC_ENFORCEMENT_DISABLED
    ? "KYC Disabled"
    : isKYCVerified
      ? "Verified"
      : userKYC?.status === "submitted"
        ? "Under Review"
        : "KYC Pending";
  const kycBadgeClassName = KYC_ENFORCEMENT_DISABLED
    ? "bg-blue-500"
    : isKYCVerified
      ? "bg-green-500"
      : userKYC?.status === "submitted"
        ? "bg-amber-500"
        : "bg-orange-500";

  const handleShare = async () => {
    try {
      await Share.share({
        message:
          "Join me on Paisa Mart and start earning by selling financial products! Sign up with my referral and we both earn ₹500. 💰",
      });
    } catch {
      toast.error("Could not open share sheet");
    }
  };

  const handleMenuPress = (action: string) => {
    if (action.startsWith("route:")) {
      router.push(action.replace("route:", "") as any);
    } else if (action === "share") {
      handleShare();
    } else if (action === "help") {
      router.push("/support");
    } else if (action === "rate") {
      toast.success("Thanks! Redirecting you to the store…");
    }
  };

  const handleEdit = () => {
    router.push({
      pathname: "/basic-info",
      params: {
        phone: profile?.phoneNumber || "",
        returnTo: "/(tabs)/profile",
      },
    });
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    try {
      await clearAuthToken();
      clearProfile();
      toast.success("Logged out successfully");
      router.dismissAll();
      router.replace("/");
    } catch {
      toast.error("Unable to log out. Please try again.");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Page>
        <ScreenHeader
          eyebrow="Your Paisa Mart"
          title="A space that's yours."
          subtitle="Your details, preferences, and partner essentials."
          icon={Settings}
        />
        <Surface style={{ marginBottom: 24, padding: 23 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 23,
                backgroundColor: "#DDEFE7",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ fontSize: 28, fontWeight: "800", color: palette.teal }}
              >
                {avatarLetter}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 21, fontWeight: "800", letterSpacing: -0.5 }}
              >
                {displayName}
              </Text>
              <Text
                style={{ color: palette.muted, fontSize: 12, marginTop: 6 }}
              >
                {displayPhone}
              </Text>
            </View>
            <PressableScale
              onPress={handleEdit}
              style={{
                minWidth: 46,
                minHeight: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{ fontWeight: "700", color: palette.blue, fontSize: 12 }}
              >
                Edit
              </Text>
            </PressableScale>
          </View>
          {!KYC_ENFORCEMENT_DISABLED && (
            <PressableScale
              onPress={() => router.push("/kyc")}
              style={{
                marginTop: 20,
                borderTopWidth: 1,
                borderColor: palette.line,
                paddingTop: 16,
                minHeight: 48,
                flexDirection: "row",
                alignItems: "center",
                gap: 9,
              }}
            >
              <Shield
                size={16}
                color={isKYCVerified ? palette.teal : "#A7762F"}
              />
              <Text
                style={{
                  flex: 1,
                  color: isKYCVerified ? palette.teal : "#A7762F",
                  fontWeight: "600",
                  fontSize: 12,
                }}
              >
                {kycLabel}
              </Text>
              <ChevronRight size={16} color={palette.muted} />
            </PressableScale>
          )}
        </Surface>
        <PressableScale
          onPress={() => router.push("/(tabs)/learn")}
          style={{
            padding: 20,
            borderRadius: 22,
            backgroundColor: "#EAF0FB",
            marginBottom: 25,
            flexDirection: "row",
            alignItems: "center",
            gap: 13,
          }}
        >
          <IconBadge icon={Award} background="#DAE5FA" />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700" }}>
              Your next level starts here
            </Text>
            <Text
              style={{
                color: palette.muted,
                fontSize: 12,
                marginTop: 5,
                lineHeight: 19,
              }}
            >
              Build your skills in the Paisa Mart academy.
            </Text>
          </View>
          <ChevronRight size={17} color={palette.blue} />
        </PressableScale>
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            letterSpacing: 1.6,
            color: palette.muted,
            marginBottom: 14,
          }}
        >
          ACCOUNT & SUPPORT
        </Text>
        <Surface style={{ padding: 0, overflow: "hidden", marginBottom: 23 }}>
          {MENU_ITEMS.map((item, index) => (
            <PressableScale
              key={item.label}
              onPress={() => handleMenuPress(item.action)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 13,
                padding: 18,
                borderBottomWidth: index === MENU_ITEMS.length - 1 ? 0 : 1,
                borderColor: palette.line,
              }}
            >
              <IconBadge
                icon={item.icon}
                size={40}
                background="#F0F4F9"
                color={palette.ink}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "700" }}>
                  {item.label}
                </Text>
                <Text
                  style={{ color: palette.muted, fontSize: 11, marginTop: 4 }}
                >
                  {item.description}
                </Text>
              </View>
              {item.label === "Notifications" && unreadCount > 0 && (
                <View
                  style={{
                    backgroundColor: "#EAF1FF",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: palette.blue,
                      fontWeight: "700",
                      fontSize: 11,
                    }}
                  >
                    {unreadCount}
                  </Text>
                </View>
              )}
              <ChevronRight size={16} color="#97A8B6" />
            </PressableScale>
          ))}
        </Surface>
        <PressableScale
          onPress={() => router.push("/admin")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 13,
            minHeight: 64,
            paddingHorizontal: 18,
            backgroundColor: palette.navy,
            borderRadius: 18,
            marginBottom: 16,
          }}
        >
          <Lock size={19} color={palette.mint} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
              Admin portal
            </Text>
            <Text style={{ color: "#BDD0DE", fontSize: 11, marginTop: 3 }}>
              Internal operations
            </Text>
          </View>
          <ChevronRight size={17} color="#BDD0DE" />
        </PressableScale>
        <PressableScale
          onPress={() => setShowLogoutModal(true)}
          style={{
            minHeight: 52,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 9,
          }}
        >
          <LogOut size={17} color="#C34747" />
          <Text style={{ color: "#C34747", fontWeight: "700", fontSize: 13 }}>
            Log out
          </Text>
        </PressableScale>
        <Text
          style={{
            textAlign: "center",
            color: palette.muted,
            fontSize: 10,
            marginTop: 14,
          }}
        >
          PAISA MART · VERSION 1.0.0
        </Text>
      </Page>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 items-center justify-center px-8"
          onPress={() => setShowLogoutModal(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full"
            style={{ maxWidth: 420 }}
          >
            <View className="bg-white rounded-3xl p-6 items-center">
              <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-4">
                <LogOut size={28} color="#EF4444" />
              </View>
              <Text className="text-gray-900 font-bold text-xl">Log out?</Text>
              <Text className="text-gray-500 text-sm mt-2 text-center">
                You'll need to sign in again to access your earnings and
                products.
              </Text>
              <View className="flex-row gap-3 mt-6 w-full">
                <PressableScale
                  haptic="light"
                  onPress={() => setShowLogoutModal(false)}
                  className="flex-1 bg-gray-100 rounded-2xl py-3.5 items-center"
                >
                  <Text className="text-gray-700 font-bold">Cancel</Text>
                </PressableScale>
                <PressableScale
                  haptic="heavy"
                  onPress={handleLogout}
                  className="flex-1 bg-red-500 rounded-2xl py-3.5 items-center"
                >
                  <Text className="text-white font-bold">Log out</Text>
                </PressableScale>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
