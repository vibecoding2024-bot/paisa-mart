import { Pressable, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { fetchAdminHomeLoans } from '@/lib/home-loan-admin-api';
import { HOME_LOAN_STAGE_LABELS } from '@/lib/home-loan-stages';

export default function HomeLoanPipelineSummary() {
  const router = useRouter();
  const query = useQuery({ queryKey: ['home-loan-pipeline', '', 1, 'all'], queryFn: () => fetchAdminHomeLoans(), refetchInterval: 30000 });
  return <Pressable onPress={() => router.push('/admin/home-loans')} className="bg-slate-800 rounded-2xl p-5 mb-5">
    <Text className="text-orange-400 font-bold text-lg">Home Loan Pipeline →</Text>
    <Text className="text-slate-400 mt-1 mb-3">Total requested loan amount at each stage</Text>
    {query.isError ? <Text className="text-red-400">{query.error.message}</Text> : query.isLoading ? <Text className="text-slate-400">Loading pipeline…</Text> : query.data?.summary.map(item => <View key={item.stage} className="flex-row justify-between py-2 border-b border-slate-700"><Text className="text-slate-300 flex-1">{HOME_LOAN_STAGE_LABELS[item.stage]} ({item.count})</Text><Text className="text-white font-semibold">₹{BigInt(item.totalLoanAmount).toLocaleString('en-IN')}</Text></View>)}
  </Pressable>;
}
