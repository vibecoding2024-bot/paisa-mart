import { useQuery } from '@tanstack/react-query';
import { Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Page, Typography as Text, Surface, palette } from '@/components/brand';
import { fetchCustomerPayouts } from '@/lib/customer-payout-api';
export default function CustomerPayouts() {
  const router = useRouter();
  // Render only a successful current response; stale/error data is never shown.
  const query = useQuery({ queryKey: ['my-approved-payouts'], queryFn: fetchCustomerPayouts, staleTime: 0, gcTime: 0, refetchOnMount: 'always', refetchInterval: 15000, retry: false });
  return <Page>
    <Stack.Screen options={{ headerShown: false }} />
    <Pressable onPress={() => router.back()} style={{ paddingVertical: 16 }}><Text style={{ color: palette.blue }}>← Back</Text></Pressable>
    <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 16 }}>My eligible payouts</Text>
    <Text style={{ color: palette.muted }}>Amounts appear after executive and manager approval. These are eligible amounts, not payment confirmations.</Text>
    <Pressable disabled={query.isFetching} onPress={() => void query.refetch()} style={{ paddingVertical: 16 }}><Text style={{ color: palette.blue }}>Refresh</Text></Pressable>
    {query.isFetching ? <Text>Loading payout details…</Text> : query.isError ? <Text accessibilityRole="alert">{query.error.message}</Text> : query.data?.map(item => <Surface key={item.referenceNumber} style={{ padding: 20, marginBottom: 16 }}>
      <Text selectable style={{ fontWeight: '700' }}>{item.referenceNumber}</Text>
      <Text style={{ color: palette.teal, marginVertical: 12 }}>Customer Eligible Payout: ₹{item.customerAmount}</Text>
    </Surface>)}
    {!query.isFetching && !query.isError && query.data?.length === 0 && <Text>No approved payout details are available.</Text>}
  </Page>;
}
