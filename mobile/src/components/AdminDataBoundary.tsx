import { usePathname } from "expo-router";
import { SavedDirectory } from "./AdminOperationsPanels";
import { useEffect } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useAdminStore } from "@/lib/admin-store";
export default function AdminDataBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const unsupported = [
    "whatsapp-leads",
    "open-plots-leads",
    "vehicle-insurance-leads",
    "health-insurance",
    "motor-insurance",
    "life-insurance",
    "products",
  ].some((p) => pathname.endsWith("/" + p));
  const refresh = useAdminStore((s) => s.refresh),
    loading = useAdminStore((s) => s.loading),
    error = useAdminStore((s) => s.error),
    availability = useAdminStore((s) => s.availability);
  const query = useQuery({
    queryKey: ["admin-operations-refresh"],
    queryFn: refresh,
    refetchInterval: 30000,
    refetchOnMount: "always",
    retry: false,
  });
  return (
    <View className="flex-1">
      <View className="px-4 py-2 bg-slate-800">
        <Text className="text-slate-300 text-xs">
          Saved backend data · Asia/Kolkata · Provider decisions require
          recorded evidence
        </Text>
        <Pressable onPress={() => void query.refetch()}>
          <Text className="text-orange-400 py-1">Refresh data</Text>
        </Pressable>
        {Object.entries(availability)
          .filter(([, v]) => v !== "available")
          .map(([k, v]) => (
            <Text key={k} className="text-amber-400 text-xs">
              {k}: {v}
            </Text>
          ))}
        {error ? (
          <Text accessibilityRole="alert" className="text-red-400">
            {error}
          </Text>
        ) : null}
      </View>
      {loading ? (
        <Text className="text-slate-300 p-4">Loading saved applications…</Text>
      ) : error ? (
        <Text className="text-slate-400 p-4">
          Data is unavailable or an update failed. Refresh to retry; no
          successful change is assumed.
        </Text>
      ) : pathname.endsWith("/utility-transactions") ? (
        <ScrollView className="p-4">
          <SavedDirectory kind="transactions" />
        </ScrollView>
      ) : unsupported ? (
        <View className="bg-slate-800 m-4 p-4 rounded-xl">
          <Text className="text-white font-semibold">
            Service data unavailable
          </Text>
          <Text className="text-slate-400 mt-2">
            This service has no connected backend source in the approved
            checkout. Browser-local records are not presented as production
            applications.
          </Text>
        </View>
      ) : (
        children
      )}
    </View>
  );
}
