import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Wallet, Info, ChevronRight, RefreshCw } from "lucide-react-native";
import {
  Page,
  ScreenHeader,
  Surface,
  Typography as Text,
  SectionHeading,
  IconBadge,
  palette,
} from "@/components/brand";
import { useApprovedPayouts, formatPayoutTotal } from "@/lib/customer-payout-api";

/**
 * Earnings shows only server data: the signed-in user's own payout amounts approved by both an
 * executive and a manager (GET /api/customer-payouts). Approved eligible amounts are not payment
 * confirmations, and the app has no balance, wallet or withdrawal service, so none is shown.
 */
export default function EarningsScreen() {
  const router = useRouter();
  const query = useApprovedPayouts();
  const payouts = query.data ?? [];

  return (
    <Page>
      <ScreenHeader
        eyebrow="Earnings"
        title="Approved payouts"
        subtitle="Amounts the Paisa Mart team has approved for your applications."
        icon={Wallet}
      />

      <Surface style={{ padding: 22, marginBottom: 17 }}>
        <Text style={{ color: palette.muted, fontSize: 12 }}>Total approved eligible payouts</Text>
        <Text style={{ fontWeight: "800", fontSize: 34, letterSpacing: -1, marginTop: 8 }}>
          {query.isSuccess ? formatPayoutTotal(payouts) : query.isError ? "Unavailable" : "Loading…"}
        </Text>
        {query.isError ? (
          <Text accessibilityRole="alert" style={{ color: palette.muted, fontSize: 12, marginTop: 8 }}>
            {query.error.message}
          </Text>
        ) : null}
        <Pressable
          accessibilityRole="button"
          disabled={query.isFetching}
          onPress={() => void query.refetch()}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 }}
        >
          <RefreshCw size={14} color={palette.blue} />
          <Text style={{ color: palette.blue, fontSize: 12, fontWeight: "700" }}>
            {query.isFetching ? "Refreshing…" : "Refresh"}
          </Text>
        </Pressable>
      </Surface>

      <View
        style={{
          backgroundColor: "#EDF1F6",
          borderRadius: 14,
          padding: 14,
          marginBottom: 24,
          flexDirection: "row",
          gap: 10,
        }}
      >
        <Info size={16} color={palette.muted} />
        <Text style={{ fontSize: 11, lineHeight: 17, color: palette.muted, flex: 1 }}>
          An amount appears here only after an executive and a manager approve it. Approved amounts are
          eligible payouts, not confirmation that money has been paid. In-app withdrawals are not
          available; the Paisa Mart team contacts you about payment.
        </Text>
      </View>

      <SectionHeading title="Approved payouts" detail="By application" />
      {query.isSuccess && payouts.length === 0 ? (
        <Surface style={{ padding: 20 }}>
          <Text style={{ fontWeight: "700", fontSize: 13 }}>No approved payouts yet</Text>
          <Text style={{ color: palette.muted, fontSize: 12, marginTop: 6, lineHeight: 18 }}>
            Approved amounts for your applications will appear here.
          </Text>
        </Surface>
      ) : null}
      {query.isSuccess && payouts.length > 0 ? (
        <Surface style={{ padding: 0, overflow: "hidden" }}>
          {payouts.map((item, index) => (
            <View
              key={item.referenceNumber}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 18,
                borderBottomWidth: index === payouts.length - 1 ? 0 : 1,
                borderColor: palette.line,
              }}
            >
              <IconBadge icon={Wallet} color={palette.teal} background="#ECF6F0" size={39} />
              <View style={{ flex: 1 }}>
                <Text selectable style={{ fontSize: 12, fontWeight: "700" }}>{item.referenceNumber}</Text>
                <Text style={{ color: palette.muted, fontSize: 10, marginTop: 5 }}>Approved eligible payout</Text>
              </View>
              <Text style={{ color: palette.teal, fontWeight: "700", fontSize: 13 }}>
                {formatPayoutTotal([item])}
              </Text>
            </View>
          ))}
        </Surface>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/my-applications")}
        style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 20 }}
      >
        <Text style={{ color: palette.blue, fontWeight: "700", fontSize: 12, flex: 1 }}>
          My applications & status
        </Text>
        <ChevronRight size={16} color={palette.blue} />
      </Pressable>
    </Page>
  );
}
