import { useQuery } from '@tanstack/react-query';
import { Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Page, Typography as Text, Surface, palette } from '@/components/brand';
import { fetchCustomerApplications } from '@/lib/customer-application-api';
import { CUSTOMER_PRIVATE_QUERY } from '@/lib/customer-private-query';
import { leadStageLabel } from '@/lib/loan-product-stages';
import { PRODUCT_MODULES } from '@/lib/product-catalog';

const productLabel = (id: string) => PRODUCT_MODULES.find(p => p.id === id)?.label ?? id;

export default function MyApplications() {
  const router = useRouter();
  const query = useQuery({ queryKey: ['my-applications'], queryFn: fetchCustomerApplications, refetchInterval: 15000, ...CUSTOMER_PRIVATE_QUERY });
  return <Page>
    <Stack.Screen options={{ headerShown: false }} />
    <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ paddingVertical: 16 }}><Text style={{ color: palette.blue }}>← Back</Text></Pressable>
    <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 16 }}>My applications</Text>
    <Text style={{ color: palette.muted }}>Applications submitted with your signed-in mobile number and their current status from our team.</Text>
    <Pressable accessibilityRole="button" disabled={query.isFetching} onPress={() => void query.refetch()} style={{ paddingVertical: 16 }}><Text style={{ color: palette.blue }}>{query.isFetching ? 'Loading…' : 'Refresh status'}</Text></Pressable>
    {query.isLoading && <Text>Loading applications…</Text>}
    {query.isError ? <Text accessibilityRole="alert">{query.error.message}</Text> : query.data?.map(item => <Surface key={item.referenceNumber} style={{ padding: 20, marginBottom: 16 }}>
      <Text style={{ fontWeight: '700' }}>{productLabel(item.productType)}</Text>
      <Text selectable style={{ color: palette.muted, marginTop: 4 }}>{item.referenceNumber}</Text>
      <Text style={{ color: palette.teal, marginVertical: 12, fontWeight: '700' }}>{leadStageLabel(item.productType, item.stage)}</Text>
      {Object.entries(item.details ?? {}).map(([label, value]) => <Text key={label} style={{ marginBottom: 4 }}><Text style={{ color: palette.muted }}>{label}: </Text>{value}</Text>)}
      <Text style={{ color: palette.muted, marginTop: 8 }}>Submitted {new Date(item.createdAt).toLocaleDateString('en-IN')} · Updated {new Date(item.updatedAt).toLocaleDateString('en-IN')}</Text>
    </Surface>)}
    {!query.isError && query.data?.length === 0 && <Text>No applications found for your signed-in mobile number.</Text>}
  </Page>;
}
