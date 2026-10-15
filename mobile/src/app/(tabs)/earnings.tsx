import { useState, useMemo } from "react";
import {
  View,
  Modal,
  TextInput,
  Pressable,
  useWindowDimensions,
} from "react-native";
import {
  Page,
  ScreenHeader,
  Surface,
  Typography as Text,
  SectionHeading,
  IconBadge,
  palette,
} from "@/components/brand";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Wallet,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Clock,
  CheckCircle,
  X,
  AlertTriangle,
  Shield,
} from "lucide-react-native";

import * as Haptics from "@/lib/haptics";
import { toast } from "@/lib/toast-store";
import PressableScale from "@/components/PressableScale";
import { useIncentiveStore } from "@/lib/incentive-store";
import { KYC_ENFORCEMENT_DISABLED } from "@/lib/onboarding-flow";

const TRANSACTIONS = [
  {
    type: "credit",
    title: "HDFC Credit Card Sale",
    amount: "₹2,100",
    date: "Today",
    status: "completed",
  },
  {
    type: "credit",
    title: "SBI Personal Loan",
    amount: "₹3,500",
    date: "Yesterday",
    status: "completed",
  },
  {
    type: "debit",
    title: "Withdrawal to Bank",
    amount: "₹5,000",
    date: "2 days ago",
    status: "completed",
  },
  {
    type: "credit",
    title: "Referral Bonus",
    amount: "₹500",
    date: "3 days ago",
    status: "completed",
  },
  {
    type: "credit",
    title: "ICICI Credit Card",
    amount: "₹1,800",
    date: "5 days ago",
    status: "pending",
  },
];

export default function EarningsScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  const [showAllTransactions, setShowAllTransactions] =
    useState<boolean>(false);
  const router = useRouter();
  const userKYC = useIncentiveStore((s) => s.userKYC);
  const bankAccounts = useIncentiveStore((s) => s.bankAccounts);
  const minWithdrawalAmount = useIncentiveStore((s) => s.minWithdrawalAmount);
  const initiatePayout = useIncentiveStore((s) => s.initiatePayout);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);

  const availableBalance = 7900; // In real app, this would come from the store

  const canWithdraw = useMemo(() => {
    return (
      (KYC_ENFORCEMENT_DISABLED || userKYC?.status === "verified") &&
      bankAccounts.length > 0
    );
  }, [userKYC, bankAccounts]);

  const primaryBank = useMemo(() => {
    return bankAccounts.find((a) => a.isPrimary) || bankAccounts[0];
  }, [bankAccounts]);

  const handleWithdraw = () => {
    if (!canWithdraw) {
      if (!KYC_ENFORCEMENT_DISABLED && userKYC?.status !== "verified") {
        toast.info("Complete your KYC to unlock withdrawals");
        router.push("/kyc");
      } else {
        toast.info("Add a bank account to receive payouts");
        router.push("/bank-details");
      }
      return;
    }
    setShowWithdrawModal(true);
    setSelectedBankId(primaryBank?.id || null);
  };

  const handleConfirmWithdraw = () => {
    const amount = parseInt(withdrawAmount, 10);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amount < minWithdrawalAmount) {
      toast.error(`Minimum withdrawal is ₹${minWithdrawalAmount}`);
      return;
    }
    if (amount > availableBalance) {
      toast.error("You don't have enough balance");
      return;
    }
    if (!selectedBankId) {
      toast.error("Please select a bank account");
      return;
    }

    const success = initiatePayout(
      "user-current",
      "Partner Name",
      amount,
      selectedBankId,
    );

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      toast.success(
        `Preview withdrawal of ₹${amount.toLocaleString()} saved. No funds were transferred.`,
      );
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error("Failed to initiate withdrawal. Try again.");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Page>
        <ScreenHeader
          eyebrow="Your growth, at a glance"
          title="Every effort adds up."
          subtitle="Keep track of earnings, payouts, and recent activity."
          icon={Wallet}
        />
        <View
          style={{
            backgroundColor: "#FFF5E5",
            borderRadius: 13,
            padding: 13,
            marginBottom: 17,
            flexDirection: "row",
            alignItems: "center",
            gap: 9,
          }}
        >
          <AlertTriangle size={16} color="#996B2E" />
          <Text
            style={{ fontSize: 11, lineHeight: 17, color: "#896029", flex: 1 }}
          >
            Preview · These are sample figures, not your live balance.
          </Text>
        </View>
        <LinearGradient
          colors={["#102F48", "#194D69"]}
          style={{
            borderRadius: 26,
            padding: 26,
            overflow: "hidden",
            marginBottom: 19,
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              right: -48,
              top: -70,
              width: 260,
              height: 260,
              borderRadius: 130,
              borderColor: "#ffffff08",
              borderWidth: 45,
            }}
          />
          <Text style={{ color: "#BDD3E1", fontSize: 12 }}>
            Available balance · Preview
          </Text>
          <Text
            style={{
              color: "#fff",
              fontWeight: "800",
              fontSize: 43,
              letterSpacing: -1.5,
              lineHeight: 57,
              marginTop: 10,
            }}
          >
            ₹{availableBalance.toLocaleString("en-IN")}
            <Text style={{ color: "#A8C1D2", fontSize: 24 }}>.00</Text>
          </Text>
          <View style={{ flexDirection: "row", gap: 12, marginTop: 25 }}>
            <PressableScale
              onPress={handleWithdraw}
              style={{
                backgroundColor: palette.mint,
                borderRadius: 14,
                flex: 1,
                minHeight: 48,
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "row",
                gap: 6,
              }}
            >
              <ArrowUpRight size={17} color={palette.navy} />
              <Text style={{ fontWeight: "700", fontSize: 12 }}>Withdraw</Text>
            </PressableScale>
            <PressableScale
              onPress={() => router.push("/bank-details")}
              style={{
                backgroundColor: "#ffffff13",
                borderWidth: 1,
                borderColor: "#ffffff20",
                borderRadius: 14,
                flex: 1,
                minHeight: 48,
                justifyContent: "center",
                alignItems: "center",
                gap: 6,
                flexDirection: "row",
              }}
            >
              <Shield size={16} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>
                Bank details
              </Text>
            </PressableScale>
          </View>
        </LinearGradient>
        {!canWithdraw && (
          <PressableScale
            onPress={() =>
              router.push(
                !KYC_ENFORCEMENT_DISABLED && userKYC?.status !== "verified"
                  ? "/kyc"
                  : "/bank-details",
              )
            }
            style={{
              padding: 18,
              borderRadius: 18,
              backgroundColor: "#EAF1FF",
              marginBottom: 19,
              flexDirection: "row",
              gap: 10,
              alignItems: "center",
            }}
          >
            <Shield size={19} color={palette.blue} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", fontSize: 12 }}>
                {!KYC_ENFORCEMENT_DISABLED && userKYC?.status !== "verified"
                  ? "Complete your KYC"
                  : "Connect your bank account"}
              </Text>
              <Text
                style={{ color: palette.muted, fontSize: 11, marginTop: 4 }}
              >
                Set up your details for future payouts.
              </Text>
            </View>
            <ChevronRight size={17} color={palette.blue} />
          </PressableScale>
        )}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
          {[
            { label: "This month", value: "₹12,400", icon: TrendingUp },
            { label: "Total earned", value: "₹45,600", icon: Wallet },
          ].map((item) => (
            <Surface key={item.label} style={{ flex: 1, padding: 19 }}>
              <IconBadge
                icon={item.icon}
                size={35}
                background="#EDF6F1"
                color={palette.teal}
              />
              <Text
                style={{ color: palette.muted, fontSize: 11, marginTop: 16 }}
              >
                {item.label}
              </Text>
              <Text
                style={{
                  fontSize: wide ? 28 : 22,
                  fontWeight: "800",
                  marginTop: 5,
                  letterSpacing: -0.7,
                }}
              >
                {item.value}
              </Text>
            </Surface>
          ))}
        </View>
        <View
          style={{
            backgroundColor: "#EDF1F6",
            borderRadius: 18,
            padding: 18,
            marginBottom: 27,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Clock size={21} color={palette.muted} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: palette.muted, fontSize: 11 }}>
              Pending earnings
            </Text>
            <Text style={{ fontWeight: "800", fontSize: 18, marginTop: 4 }}>
              ₹1,800
            </Text>
          </View>
          <Text
            style={{
              color: "#956B2F",
              fontWeight: "600",
              fontSize: 10,
              backgroundColor: "#F9ECCD",
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 7,
            }}
          >
            Processing
          </Text>
        </View>
        <SectionHeading
          title="Recent activity"
          detail="Sample transaction history"
          action={showAllTransactions ? "Show less" : "View all"}
          onPress={() => setShowAllTransactions(!showAllTransactions)}
        />
        <Surface style={{ padding: 0, overflow: "hidden" }}>
          {TRANSACTIONS.slice(
            0,
            showAllTransactions ? TRANSACTIONS.length : 3,
          ).map((transaction, index, list) => (
            <View
              key={transaction.title}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 18,
                borderBottomWidth: index === list.length - 1 ? 0 : 1,
                borderColor: palette.line,
              }}
            >
              <IconBadge
                icon={
                  transaction.type === "credit" ? ArrowDownLeft : ArrowUpRight
                }
                color={
                  transaction.type === "credit" ? palette.teal : palette.blue
                }
                background={
                  transaction.type === "credit" ? "#ECF6F0" : "#ECF2FC"
                }
                size={39}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 12, fontWeight: "700", lineHeight: 19 }}
                >
                  {transaction.title}
                </Text>
                <Text
                  style={{ color: palette.muted, fontSize: 10, marginTop: 5 }}
                >
                  {transaction.date}
                  {transaction.status === "pending" ? " · Pending" : ""}
                </Text>
              </View>
              <Text
                style={{
                  color:
                    transaction.type === "credit" ? palette.teal : palette.ink,
                  fontWeight: "700",
                  fontSize: 13,
                }}
              >
                {transaction.type === "credit" ? "+" : "−"}
                {transaction.amount}
              </Text>
            </View>
          ))}
        </Surface>
      </Page>
      {/* Withdraw Modal */}
      <Modal
        visible={showWithdrawModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowWithdrawModal(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 560, alignSelf: "center" }}
          >
            <View className="bg-white rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-gray-900 text-xl font-bold">
                  Preview withdrawal
                </Text>
                <PressableScale
                  haptic="light"
                  onPress={() => setShowWithdrawModal(false)}
                  className="w-9 h-9 bg-gray-100 rounded-full items-center justify-center"
                >
                  <X size={18} color="#6B7280" />
                </PressableScale>
              </View>

              {/* Available Balance */}
              <View className="bg-gray-100 rounded-2xl p-4 mb-4">
                <Text className="text-gray-500 text-xs">Available Balance</Text>
                <Text className="text-gray-900 text-2xl font-bold">
                  ₹{availableBalance.toLocaleString()}
                </Text>
              </View>

              {/* Amount Input */}
              <View className="mb-4">
                <Text className="text-gray-600 text-sm mb-2">Enter Amount</Text>
                <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 border-2 border-gray-200">
                  <Text className="text-gray-900 text-xl font-bold">₹</Text>
                  <TextInput
                    className="flex-1 ml-2 text-gray-900 text-xl font-bold py-3"
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    value={withdrawAmount}
                    onChangeText={(text) =>
                      setWithdrawAmount(text.replace(/\D/g, ""))
                    }
                    keyboardType="number-pad"
                  />
                </View>
                <Text className="text-gray-500 text-xs mt-1">
                  Minimum withdrawal: ₹{minWithdrawalAmount}
                </Text>
              </View>

              {/* Quick Amounts */}
              <View className="flex-row gap-2 mb-4">
                {[500, 1000, 2000, 5000].map((amount) => (
                  <PressableScale
                    key={amount}
                    haptic="selection"
                    activeScale={0.94}
                    onPress={() => setWithdrawAmount(String(amount))}
                    className={`flex-1 py-2.5 rounded-xl items-center ${
                      withdrawAmount === String(amount)
                        ? "bg-blue-600"
                        : "bg-gray-100"
                    }`}
                  >
                    <Text
                      className={`font-bold ${
                        withdrawAmount === String(amount)
                          ? "text-white"
                          : "text-gray-600"
                      }`}
                    >
                      ₹{amount}
                    </Text>
                  </PressableScale>
                ))}
              </View>

              {/* Bank Account Selection */}
              {bankAccounts.length > 0 && (
                <View className="mb-4">
                  <Text className="text-gray-600 text-sm mb-2">
                    Withdraw to
                  </Text>
                  {bankAccounts.map((account) => (
                    <PressableScale
                      key={account.id}
                      haptic="selection"
                      activeScale={0.98}
                      onPress={() => setSelectedBankId(account.id)}
                      className={`flex-row items-center p-3 rounded-2xl mb-2 border-2 ${
                        selectedBankId === account.id
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <View className="w-10 h-10 bg-gray-200 rounded-lg items-center justify-center mr-3">
                        <Shield size={20} color="#6B7280" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-900 font-semibold">
                          {account.bankName}
                        </Text>
                        <Text className="text-gray-500 text-xs">
                          •••• {account.accountNumber.slice(-4)}
                        </Text>
                      </View>
                      {selectedBankId === account.id && (
                        <CheckCircle size={20} color="#F97316" />
                      )}
                    </PressableScale>
                  ))}
                </View>
              )}

              {/* Confirm Button */}
              <PressableScale haptic="medium" onPress={handleConfirmWithdraw}>
                <LinearGradient
                  colors={["#1261E8", "#1261E8"]}
                  style={{
                    borderRadius: 16,
                    paddingVertical: 16,
                    alignItems: "center",
                  }}
                >
                  <Text className="text-white font-bold text-base">
                    Withdraw ₹{withdrawAmount || "0"}
                  </Text>
                </LinearGradient>
              </PressableScale>

              <Text className="text-gray-500 text-center text-xs mt-3">
                This preview uses sample balances; it does not transfer real
                funds.
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
