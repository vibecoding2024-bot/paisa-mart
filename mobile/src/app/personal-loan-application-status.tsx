import { useQuery } from '@tanstack/react-query';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Page as Screen, Typography as Text, Surface, palette } from '@/components/brand';
import { usePersonalLoanStore } from '@/lib/personal-loan-store';
import { fetchPersonalLoanStatus } from '@/lib/personal-loan-api';

export default function PersonalLoanApplicationStatus() {
  const router = useRouter();
  const receipt = usePersonalLoanStore(s => s.receipt);
  const query = useQuery({ queryKey: ['personal-loan-status', receipt?.id], queryFn: () => fetchPersonalLoanStatus(receipt!), enabled: !!receipt, retry: false, staleTime: 0, refetchInterval: 15000 });
  return <Screen>
    <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ paddingVertical: 16 }}><Text style={{ color: palette.blue }}>← Back</Text></Pressable>
    <Text style={{ fontSize: 28, fontWeight: '700', marginBottom: 16 }}>Personal loan application status</Text>
    {!receipt && <Text>No application receipt is saved on this device. Please contact support with your confirmation number.</Text>}
    {receipt && <Pressable accessibilityRole="button" disabled={query.isFetching} onPress={() => void query.refetch()} style={{ paddingVertical: 16 }}><Text style={{ color: palette.blue }}>{query.isFetching ? 'Loading status…' : 'Refresh Status'}</Text></Pressable>}
    {query.isError ? <Text accessibilityRole="alert">{query.error.message}</Text> : query.data && <Surface style={{ padding: 20, marginBottom: 16 }}>
      <Text selectable style={{ fontWeight: '700' }}>{query.data.referenceNumber}</Text>
      <Text style={{ color: palette.teal, marginVertical: 12 }}>{query.data.status}</Text>
      <Text>Personal loan application</Text>
      <Text style={{ color: palette.muted, marginTop: 8 }}>Submitted {new Date(query.data.createdAt).toLocaleString('en-IN')}</Text>
    </Surface>}
    <Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)')} style={{ paddingVertical: 16 }}><Text style={{ color: palette.blue }}>Back to Home</Text></Pressable>
  </Screen>;
}
