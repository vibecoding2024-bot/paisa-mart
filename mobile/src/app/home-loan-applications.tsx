import { useQuery } from '@tanstack/react-query';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Page as Screen, Typography as Text, Surface, palette } from '@/components/brand';
import { fetchCustomerApplications } from '@/lib/home-loan-api';
import { HOME_LOAN_STAGE_LABELS } from '@/lib/home-loan-stages';

export default function HomeLoanApplications() {
  const router = useRouter();
  const query = useQuery({ queryKey: ['my-home-loan-applications'], queryFn: fetchCustomerApplications, refetchInterval: 15000, staleTime: 0, retry: false });
  return <Screen>
    <Pressable onPress={() => router.back()} style={{ paddingVertical: 16 }}><Text style={{ color: palette.blue }}>← Back</Text></Pressable>
    <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 16 }}>My home loan applications</Text>
    <Text style={{ color: palette.muted, marginBottom: 16 }}>Your latest application status from our team.</Text>
    <Pressable onPress={() => void query.refetch()} style={{ paddingVertical: 16 }}><Text style={{ color: palette.blue }}>Refresh status</Text></Pressable>
    {query.isLoading && <Text>Loading applications…</Text>}
    {query.isError ? <Text accessibilityRole="alert">{query.error.message}</Text> : query.data?.map(item => <Surface key={item.referenceNumber} style={{ padding: 20, marginBottom: 16 }}>
      <Text selectable style={{ fontWeight: '700' }}>{item.referenceNumber}</Text>
      <Text style={{ color: palette.teal, marginVertical: 12 }}>{HOME_LOAN_STAGE_LABELS[item.stage]}</Text>
      <Text>{item.loanType} · ₹{BigInt(item.loanAmountRequired).toLocaleString('en-IN')}</Text>
      <Text style={{ color: palette.muted, marginTop: 8 }}>Submitted {new Date(item.createdAt).toLocaleDateString('en-IN')}</Text>
    </Surface>)}
    {!query.isError && query.data?.length === 0 && <View><Text>No applications found for your signed-in mobile number.</Text></View>}
  </Screen>;
}
