import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PRODUCT_MODULES, SERVICE_STAGE_LABELS } from '../lib/product-catalog';
import { useAdminStore } from '@/lib/admin-store';

const SOURCES: Record<string, string[]> = {
  'credit-cards': ['credit_card_applications'],
  'bank-accounts': ['bank_account_applications'],
  'insta-loans': ['insta_loan_applications'],
  'health-insurance': ['health_insurance_applications'],
  'motor-insurance': ['motor_insurance_applications'],
  'home-loans': ['home_loan_leads'],
  'personal-loans': ['personal_loan_applications', 'personal_loan_leads'],
  'business-loans': ['business_loan_leads'],
  'vehicle-loans': ['vehicle_loan_leads'],
  'life-insurance': ['life_insurance_leads'],
};

export default function AdminProductModules() {
  const router = useRouter();
  const leads = useAdminStore(s => s.leads);
  const availability = useAdminStore(s => s.availability);
  return <ScrollView className="flex-1 bg-slate-900" contentContainerStyle={{ padding: 16 }}>
    <Text className="text-white text-2xl font-bold">Products</Text>
    <Text className="text-slate-400 mt-2 mb-4">All 15 customer dashboard modules</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {PRODUCT_MODULES.map(product => {
        const connected = SOURCES[product.id]?.some(source => availability[source] === 'available');
        return <Pressable key={product.id} accessibilityRole="button" disabled={!connected}
          onPress={() => router.push(product.id === 'home-loans' ? '/admin/home-loans' : { pathname: '/admin/leads', params: { product: product.id } } as any)}
          style={{ flexGrow: 1, flexBasis: 280, backgroundColor: '#1E293B', borderRadius: 12, padding: 16 }}>
          <Text className="text-white font-semibold">{product.label}</Text>
          <Text className="text-slate-400 mt-2">{connected ? `${leads.filter(lead => lead.productType === product.id).length} saved applications · View applications` : 'Service data unavailable'}</Text>
          {SERVICE_STAGE_LABELS[product.id] ? <Text className="text-slate-300 mt-3">{Object.values(SERVICE_STAGE_LABELS[product.id]).join(' → ')}</Text> : null}
          {SERVICE_STAGE_LABELS[product.id] ? <Text className="text-amber-400 mt-2">Customer Payout · Awaiting business confirmation</Text> : null}
        </Pressable>;
      })}
    </View>
  </ScrollView>;
}
