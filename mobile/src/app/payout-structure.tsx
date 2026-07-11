import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

function AccordionSection({ title, index, children }: { title: string; index: number; children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      className="bg-white rounded-xl mb-3 overflow-hidden shadow-sm"
    >
      <Pressable
        onPress={() => setExpanded(!expanded)}
        className="flex-row items-center justify-between p-4 border-b border-gray-100"
      >
        <Text className="font-semibold text-base flex-1 text-gray-800 pr-2">{title}</Text>
        {expanded ? <ChevronUp size={20} color="#6B7280" /> : <ChevronDown size={20} color="#6B7280" />}
      </Pressable>
      {expanded && <View className="p-4 pt-3">{children}</View>}
    </Animated.View>
  );
}

function Row({ s, service, payout, alt }: { s: number; service: string; payout: string; alt: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, backgroundColor: alt ? '#F8FAFF' : '#fff', borderRadius: 8, marginBottom: 2 }}>
      <Text style={{ width: 28, fontSize: 12, color: '#9CA3AF', fontWeight: '600' }}>{s}</Text>
      <Text style={{ flex: 1, fontSize: 13, color: '#111827', fontWeight: '500' }}>{service}</Text>
      <Text style={{ fontSize: 12, color: '#002561', fontWeight: '600', textAlign: 'right', maxWidth: 150 }}>{payout}</Text>
    </View>
  );
}

const PAYOUTS = [
  { s: 1,  service: 'Credit Cards',              payout: 'Up to ₹3,000 per approved card' },
  { s: 2,  service: 'Bank Accounts',             payout: 'Up to ₹1,000 per account' },
  { s: 3,  service: 'Home Loans',                payout: 'Up to 1.5% of net disbursed amount' },
  { s: 4,  service: 'Personal Loans',            payout: 'Up to 2% of net disbursed amount' },
  { s: 5,  service: 'Vehicle Loans',             payout: 'Up to 2% of net disbursed amount' },
  { s: 6,  service: 'Business Loans',            payout: 'Up to 2% of net disbursed amount' },
  { s: 7,  service: 'Instant Loans',             payout: 'Up to 1.5% of net disbursed amount' },
  { s: 8,  service: 'Health Insurance',          payout: 'Up to 15% of premium (excl. GST)' },
  { s: 9,  service: 'Life Insurance',            payout: 'Up to 20% of premium (excl. GST)' },
  { s: 10, service: 'Motor Insurance',           payout: 'Up to 20% of premium (excl. GST)' },
  { s: 11, service: 'Gold Loans',                payout: '₹500 per ₹1 lakh loan amount' },
];

export default function PayoutStructureScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="bg-white border-b border-gray-100 px-4 py-3">
          <View className="flex-row items-center">
            <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center -ml-2">
              <ChevronLeft size={24} color="#002561" />
            </Pressable>
            <Text className="text-gray-800 text-lg font-semibold ml-2">Payout Structure</Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>

          {/* Summary Table */}
          <AccordionSection title="Commission Summary — All Products" index={0}>
            <View style={{ flexDirection: 'row', paddingHorizontal: 4, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginBottom: 6 }}>
              <Text style={{ width: 28, fontSize: 11, fontWeight: '700', color: '#6B7280' }}>S.No</Text>
              <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: '#6B7280' }}>Service</Text>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7280', textAlign: 'right', maxWidth: 150 }}>Payout / Commission</Text>
            </View>
            {PAYOUTS.map((row) => <Row key={row.s} {...row} alt={row.s % 2 === 0} />)}
          </AccordionSection>

          {/* Loans */}
          <AccordionSection title="Loans — Payout Details" index={1}>
            {[
              { label: 'Home Loans', value: 'Up to 1.5% of net disbursed loan amount' },
              { label: 'Personal Loans', value: 'Up to 2% of net disbursed loan amount' },
              { label: 'Vehicle Loans', value: 'Up to 2% of net disbursed loan amount' },
              { label: 'Business Loans', value: 'Up to 2% of net disbursed loan amount' },
              { label: 'Instant Loans', value: 'Up to 1.5% of net disbursed loan amount' },
              { label: 'Gold Loans', value: '₹500 per ₹1 lakh loan amount' },
            ].map((item) => (
              <View key={item.label} className="flex-row mb-3">
                <Text className="text-gray-600 mr-2">•</Text>
                <View className="flex-1">
                  <Text className="text-gray-800 font-semibold">{item.label}</Text>
                  <Text className="text-gray-500 text-sm leading-5">{item.value}</Text>
                </View>
              </View>
            ))}
            <View className="bg-blue-50 rounded-lg px-3 py-2 mt-1">
              <Text className="text-blue-700 text-xs leading-5">Payout is calculated on the final disbursed amount after loan approval and KYC verification.</Text>
            </View>
          </AccordionSection>

          {/* Insurance */}
          <AccordionSection title="Insurance — Payout Details" index={2}>
            {[
              { label: 'Health Insurance', value: 'Up to 15% of premium (excluding GST)' },
              { label: 'Life Insurance', value: 'Up to 20% of premium (excluding GST)' },
              { label: 'Motor Insurance', value: 'Up to 20% of premium (excluding GST)' },
            ].map((item) => (
              <View key={item.label} className="flex-row mb-3">
                <Text className="text-gray-600 mr-2">•</Text>
                <View className="flex-1">
                  <Text className="text-gray-800 font-semibold">{item.label}</Text>
                  <Text className="text-gray-500 text-sm leading-5">{item.value}</Text>
                </View>
              </View>
            ))}
            <View className="bg-blue-50 rounded-lg px-3 py-2 mt-1">
              <Text className="text-blue-700 text-xs leading-5">Payout is calculated on net premium excluding GST, after policy issuance and premium realization.</Text>
            </View>
          </AccordionSection>

          {/* Banking Products */}
          <AccordionSection title="Banking Products — Payout Details" index={3}>
            {[
              { label: 'Credit Cards', value: 'Up to ₹3,000 per approved card' },
              { label: 'Bank Accounts', value: 'Up to ₹1,000 per account opened' },
            ].map((item) => (
              <View key={item.label} className="flex-row mb-3">
                <Text className="text-gray-600 mr-2">•</Text>
                <View className="flex-1">
                  <Text className="text-gray-800 font-semibold">{item.label}</Text>
                  <Text className="text-gray-500 text-sm leading-5">{item.value}</Text>
                </View>
              </View>
            ))}
            <View className="bg-blue-50 rounded-lg px-3 py-2 mt-1">
              <Text className="text-blue-700 text-xs leading-5">Payout is credited after card approval or account activation as confirmed by the partner bank.</Text>
            </View>
          </AccordionSection>

          {/* General Conditions */}
          <AccordionSection title="General Conditions" index={4}>
            {[
              'Payouts are subject to partner bank/NBFC/insurance company approval.',
              'Successful disbursement or policy issuance is mandatory for payout eligibility.',
              'Actual commissions may vary depending on the financial institution and product.',
              'TDS will be deducted @ 5% as per Income Tax rules. PAN is mandatory.',
              'Wallet withdrawal charges: 2% + GST applicable.',
              'Payout cycle: 45 days from disbursement/policy issuance date.',
              'Payment will be processed only to the registered bank account.',
            ].map((item, i) => (
              <View key={i} className="flex-row mb-2">
                <Text className="text-gray-600 mr-2">•</Text>
                <Text className="text-gray-600 flex-1 leading-5 text-sm">{item}</Text>
              </View>
            ))}
          </AccordionSection>

          {/* Footer Note */}
          <View className="bg-orange-50 border border-orange-200 rounded-xl p-4 mt-2 mb-4">
            <Text className="text-orange-800 text-xs leading-5">
              <Text className="font-semibold">Note: </Text>
              Paisa Mart reserves the right to modify payout rates as per company policy and regulatory requirements. This structure is indicative and subject to change.
            </Text>
          </View>

          <View className="items-center mb-6">
            <Text className="text-gray-400 text-xs">Last Updated: July 2025</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
