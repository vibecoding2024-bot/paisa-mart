import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAdminHomeLoans, updateHomeLoan, type HomeLoanLead } from '@/lib/home-loan-admin-api';
import { HOME_LOAN_STAGES, HOME_LOAN_STAGE_LABELS, type HomeLoanStage } from '@/lib/home-loan-stages';
import { ModalDropdown } from '@/components/ModalDropdown';

export default function HomeLoanPipeline() {
  const [search, setSearch] = useState<string>('');
  const [stage, setStage] = useState<HomeLoanStage | undefined>(undefined);
  const [page, setPage] = useState<number>(1);
  const [selected, setSelected] = useState<HomeLoanLead | null>(null);
  const [nextStage, setNextStage] = useState<HomeLoanStage>('new');
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['home-loan-pipeline', search, page, stage ?? 'all'], queryFn: () => fetchAdminHomeLoans(search, page, stage), refetchInterval: 30000 });
  const mutation = useMutation({
    mutationFn: () => { if (!selected) throw new Error('Select a lead'); return updateHomeLoan(selected.id, { stage: nextStage, version: selected.version, loanAmountRequired: amount, note }); },
    onSuccess: () => { setSelected(null); void client.invalidateQueries({ queryKey: ['home-loan-pipeline'] }); },
  });
  const open = (lead: HomeLoanLead) => { mutation.reset(); setSelected(lead); setNextStage(lead.stage); setAmount(lead.loanAmountRequired); setNote(''); };
  const money = (value: string) => '₹' + BigInt(value).toLocaleString('en-IN');
  if (selected) return <ScrollView className="flex-1 bg-slate-900" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20 }}>
    <Pressable disabled={mutation.isPending} onPress={() => setSelected(null)} className="py-3"><Text className="text-orange-400">← Back to pipeline</Text></Pressable>
    <Text className="text-white text-2xl font-bold">{selected.fullName || 'Home loan applicant'}</Text>
    <Text selectable className="text-orange-400 mt-2 mb-5">{selected.referenceNumber}</Text>
    <View className="bg-slate-800 rounded-xl p-4 mb-5"><Text selectable className="text-slate-300 leading-7">{selected.phoneNumber}{'\n'}{selected.city}, {selected.state}{'\n'}{selected.loanType}{'\n'}Date of birth: {selected.dateOfBirth || '—'}{'\n'}CIBIL: {selected.cibil || '—'}{'\n'}Monthly income: {money(selected.monthlyIncome)}{'\n'}Existing EMI: {money(selected.existingEmi)}{'\n'}Received: {new Date(selected.createdAt).toLocaleString()}</Text></View>
    <View className="bg-white rounded-xl p-4">
      <ModalDropdown label="Pipeline stage" value={HOME_LOAN_STAGE_LABELS[nextStage]} options={HOME_LOAN_STAGES.map(key => HOME_LOAN_STAGE_LABELS[key])} onSelect={value => { if (!mutation.isPending) setNextStage(HOME_LOAN_STAGES.find(key => HOME_LOAN_STAGE_LABELS[key] === value)!); }} />
      <Text className="text-slate-700 font-semibold mb-2">Loan amount (₹)</Text>
      <TextInput accessibilityLabel="Loan amount" editable={!mutation.isPending} value={amount} onChangeText={setAmount} keyboardType="numeric" maxLength={12} className="border border-slate-300 rounded-xl p-3 mb-4 text-slate-900" />
      <Text className="text-slate-700 font-semibold mb-2">Admin note</Text>
      <TextInput accessibilityLabel="Admin note" editable={!mutation.isPending} value={note} onChangeText={setNote} multiline maxLength={2000} placeholder="Contact outcome, pending documents or decision reason" className="border border-slate-300 rounded-xl p-3 mb-4 text-slate-900" />
      {mutation.isError ? <Text accessibilityRole="alert" className="text-red-600 mb-3">{mutation.error.message}</Text> : null}
      <Pressable disabled={mutation.isPending || !/^[1-9]\d{0,11}$/.test(amount)} onPress={() => mutation.mutate()} className="bg-orange-500 rounded-xl p-4 items-center" style={{ opacity: mutation.isPending || !/^[1-9]\d{0,11}$/.test(amount) ? 0.5 : 1 }}><Text className="text-white font-bold">{mutation.isPending ? 'Saving…' : 'Save changes'}</Text></Pressable>
    </View>
    <Text className="text-white font-bold text-lg mt-6 mb-3">Stage history</Text>
    {selected.history.length === 0 ? <Text className="text-slate-400">New lead — no admin changes yet.</Text> : [...selected.history].reverse().map((entry, i) => <View key={i} className="bg-slate-800 p-4 rounded-xl mb-3"><Text className="text-white font-semibold">{HOME_LOAN_STAGE_LABELS[entry.stage]} · {money(entry.loanAmountRequired)}</Text><Text className="text-slate-300 mt-2">{entry.note || 'No note'}</Text><Text className="text-slate-400 text-xs mt-2">{entry.actor} · {new Date(entry.at).toLocaleString()}</Text></View>)}
  </ScrollView>;
  return <ScrollView className="flex-1 bg-slate-900" keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
    <Text className="text-white text-2xl font-bold">Home Loan Pipeline</Text>
    <Text className="text-slate-400 mt-2 mb-5">Track applications and requested loan amounts at every stage.</Text>
    <View className="flex-row flex-wrap">{query.data?.summary.map(item => <Pressable key={item.stage} onPress={() => { setStage(item.stage); setPage(1); }} className={`rounded-xl p-4 mb-3 mr-3 border ${stage === item.stage ? 'border-orange-500 bg-slate-800' : 'border-slate-700 bg-slate-800'}`} style={{ minWidth: 150, flexGrow: 1 }}><Text className="text-slate-300">{HOME_LOAN_STAGE_LABELS[item.stage]}</Text><Text className="text-white text-xl font-bold mt-2">{money(item.totalLoanAmount)}</Text><Text className="text-orange-400 mt-1">{item.count} leads</Text></Pressable>)}</View>
    <View className="flex-row justify-between my-3"><Pressable onPress={() => { setStage(undefined); setPage(1); }} className="py-3"><Text className="text-orange-400">Show all stages</Text></Pressable><Pressable onPress={() => void query.refetch()} className="py-3"><Text className="text-orange-400">Refresh</Text></Pressable></View>
    <TextInput accessibilityLabel="Search home loan leads" value={search} onChangeText={value => { setSearch(value); setPage(1); }} maxLength={120} placeholder="Search name, phone or confirmation number" placeholderTextColor="#94A3B8" className="bg-slate-800 rounded-xl p-4 text-white mb-5" />
    {query.isLoading ? <ActivityIndicator color="#FB923C" /> : query.isError ? <Text accessibilityRole="alert" className="text-red-400">{query.error.message}</Text> : <>
      <Text className="text-slate-400 mb-3">{query.data?.total ?? 0} matching leads {stage ? '· ' + HOME_LOAN_STAGE_LABELS[stage] : ''}</Text>
      {query.data?.data.map(lead => <Pressable key={lead.id} onPress={() => open(lead)} className="bg-slate-800 rounded-xl p-5 mb-3"><Text className="text-white font-bold text-lg">{lead.fullName || 'Home loan applicant'}</Text><Text className="text-slate-300 mt-2">{lead.phoneNumber} · {money(lead.loanAmountRequired)}</Text><Text className="text-orange-400 mt-2">{HOME_LOAN_STAGE_LABELS[lead.stage]}</Text><Text className="text-slate-400 text-xs mt-3">{lead.referenceNumber}</Text></Pressable>)}
      {query.data?.total === 0 ? <Text className="text-slate-400 py-8">No leads match these filters.</Text> : null}
      <View className="flex-row justify-between mt-4"><Pressable disabled={page === 1} onPress={() => setPage(value => value - 1)} className="p-3"><Text className={page === 1 ? 'text-slate-600' : 'text-orange-400'}>Previous</Text></Pressable><Text className="text-white p-3">{page} / {query.data?.totalPages ?? 1}</Text><Pressable disabled={page >= (query.data?.totalPages ?? 1)} onPress={() => setPage(value => value + 1)} className="p-3"><Text className={page >= (query.data?.totalPages ?? 1) ? 'text-slate-600' : 'text-orange-400'}>Next</Text></Pressable></View>
    </>}
  </ScrollView>;
}
