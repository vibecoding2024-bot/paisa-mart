import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import { useUserProfileStore } from '@/lib/user-profile-store';
import { useServiceSubmission } from '@/lib/use-service-submission';
import ApplicationSaved from '@/components/ApplicationSaved';

const labels = { 'credit-cards': 'Credit Card', 'bank-accounts': 'Bank Account', 'insta-loans': 'Insta Loan' };
type IntakeProduct = keyof typeof labels;
export default function ServiceApplication() {
  const params = useLocalSearchParams<{ product: string; provider: string; productName: string }>();
  const router = useRouter();
  if (!Object.hasOwn(labels, params.product)) return <View className="flex-1 bg-white p-6"><Text>Application type not found.</Text><Pressable onPress={() => router.replace('/(tabs)/products')}><Text>Back to Products</Text></Pressable></View>;
  return <Intake product={params.product as IntakeProduct} provider={params.provider || ''} productName={params.productName || ''} />;
}
function Intake({ product, provider, productName }: { product: IntakeProduct; provider: string; productName: string }) {
  const router = useRouter();
  const profile = useUserProfileStore(s => s.profile);
  const [fullName, setFullName] = useState(profile?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '');
  const submission = useServiceSubmission(product);
  return <SafeAreaView className="flex-1 bg-white">
    <LinearGradient colors={['#002561', '#003380']} style={{ padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()}><ChevronLeft color="#fff" /></Pressable>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>{labels[product]}</Text>
    </LinearGradient>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 16 }}>
      <View className="bg-blue-50 p-4 rounded-xl"><Text className="text-blue-900 font-semibold">{provider} · {productName}</Text></View>
      <Text className="text-gray-600">Submit your contact details for our team to help with your application. Provider activation or disbursement is confirmed separately.</Text>
      <Text className="text-gray-700 font-semibold">Full Name</Text>
      <TextInput accessibilityLabel="Full Name" placeholder="Enter full name" value={fullName} onChangeText={setFullName} maxLength={120} className="border border-gray-300 rounded-xl p-4 text-gray-900" />
      <Text className="text-gray-700 font-semibold">Mobile Number</Text>
      <TextInput accessibilityLabel="Mobile Number" placeholder="10-digit mobile number" value={phoneNumber} onChangeText={setPhoneNumber} maxLength={10} keyboardType="phone-pad" className="border border-gray-300 rounded-xl p-4 text-gray-900" />
      {submission.error ? <Text accessibilityRole="alert" className="text-red-600">{submission.error}</Text> : null}
      <Pressable accessibilityRole="button" disabled={submission.busy || !!submission.saved} onPress={() => void submission.submit({ fullName, phoneNumber, provider, productName })} style={{ backgroundColor: '#002561', borderRadius: 14, padding: 16, alignItems: 'center', opacity: submission.busy ? 0.6 : 1 }}>
        <Text className="text-white font-bold">{submission.busy ? 'Submitting…' : 'Submit'}</Text>
      </Pressable>
      <Text className="text-gray-500 text-sm">Customer payout · Awaiting business confirmation</Text>
    </ScrollView>
    <ApplicationSaved product={labels[product].toLowerCase()} reference={submission.saved?.referenceNumber ?? null} onDone={() => router.replace('/(tabs)')} />
  </SafeAreaView>;
}
