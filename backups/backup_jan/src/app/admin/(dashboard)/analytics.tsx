import { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react-native';
import {
  useAdminStore,
  Lead,
  LeadStage,
  ProductCategory,
  STAGE_LABELS,
  STAGE_COLORS,
  PRODUCT_LABELS,
  REJECTION_CODES,
} from '@/lib/admin-store';

const { width } = Dimensions.get('window');

type AnalyticsTab = 'overview' | 'products' | 'providers' | 'rejections';

interface BarChartProps {
  data: { label: string; value: number; color: string }[];
  maxValue: number;
}

function HorizontalBar({ data, maxValue }: BarChartProps) {
  return (
    <View>
      {data.map((item, index) => (
        <View key={index} className="mb-3">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-slate-300 text-sm" numberOfLines={1} style={{ maxWidth: 150 }}>
              {item.label}
            </Text>
            <Text className="text-white font-medium">{item.value}</Text>
          </View>
          <View className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                backgroundColor: item.color,
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function AnalyticsScreen() {
  const leads = useAdminStore(s => s.leads);
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');

  const analytics = useMemo(() => {
    const now = new Date();

    // Basic counts
    const totalLeads = leads.length;
    const approvedLeads = leads.filter(l => ['approved', 'disbursed', 'closed'].includes(l.stage)).length;
    const rejectedLeads = leads.filter(l => l.stage === 'rejected').length;
    const pendingLeads = leads.filter(l => !['approved', 'rejected', 'disbursed', 'closed'].includes(l.stage)).length;

    // Rates
    const processedLeads = approvedLeads + rejectedLeads;
    const approvalRate = processedLeads > 0 ? (approvedLeads / processedLeads) * 100 : 0;
    const rejectionRate = processedLeads > 0 ? (rejectedLeads / processedLeads) * 100 : 0;

    // By product
    const byProduct: Record<string, { total: number; approved: number; rejected: number }> = {};
    leads.forEach(l => {
      if (!byProduct[l.productType]) {
        byProduct[l.productType] = { total: 0, approved: 0, rejected: 0 };
      }
      byProduct[l.productType].total++;
      if (['approved', 'disbursed', 'closed'].includes(l.stage)) {
        byProduct[l.productType].approved++;
      }
      if (l.stage === 'rejected') {
        byProduct[l.productType].rejected++;
      }
    });

    // By provider
    const byProvider: Record<string, { total: number; approved: number; rejected: number }> = {};
    leads.forEach(l => {
      if (!byProvider[l.provider]) {
        byProvider[l.provider] = { total: 0, approved: 0, rejected: 0 };
      }
      byProvider[l.provider].total++;
      if (['approved', 'disbursed', 'closed'].includes(l.stage)) {
        byProvider[l.provider].approved++;
      }
      if (l.stage === 'rejected') {
        byProvider[l.provider].rejected++;
      }
    });

    // High drop-off stages
    const stageDropoffs: Record<LeadStage, number> = {
      new: 0,
      consent_given: 0,
      eligibility_check: 0,
      kyc_pending: 0,
      kyc_completed: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
      disbursed: 0,
      closed: 0,
    };

    leads.forEach(l => {
      if (!['approved', 'rejected', 'disbursed', 'closed'].includes(l.stage)) {
        const hoursSinceUpdate = (now.getTime() - new Date(l.updatedAt).getTime()) / (1000 * 60 * 60);
        if (hoursSinceUpdate > 48) {
          stageDropoffs[l.stage]++;
        }
      }
    });

    // Average time to closure (mock calculation)
    const avgClosureTime = 72; // hours

    // Rejection reasons (mock)
    const rejectionReasons = REJECTION_CODES.map(code => ({
      ...code,
      count: Math.floor(Math.random() * 10) + 1,
    })).sort((a, b) => b.count - a.count);

    return {
      totalLeads,
      approvedLeads,
      rejectedLeads,
      pendingLeads,
      approvalRate,
      rejectionRate,
      byProduct,
      byProvider,
      stageDropoffs,
      avgClosureTime,
      rejectionReasons,
    };
  }, [leads]);

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'products', label: 'Products' },
    { key: 'providers', label: 'Providers' },
    { key: 'rejections', label: 'Rejections' },
  ];

  return (
    <View className="flex-1 bg-slate-900">
      {/* Header */}
      <View className="p-4 border-b border-slate-800">
        <Text className="text-white text-xl font-bold">Analytics</Text>
        <Text className="text-slate-400 text-sm mt-1">
          Outcome metrics and performance insights
        </Text>
      </View>

      {/* Tabs */}
      <View className="border-b border-slate-800">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 12 }}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key as AnalyticsTab)}
              className={`px-4 py-2 rounded-lg mr-2 ${
                activeTab === tab.key ? 'bg-orange-500' : 'bg-slate-800'
              }`}
            >
              <Text className={activeTab === tab.key ? 'text-white' : 'text-slate-400'}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && (
          <View className="p-4">
            {/* Key Metrics */}
            <Animated.View entering={FadeInDown.delay(50).springify()}>
              <View className="flex-row gap-3 mb-4">
                <View className="flex-1 bg-slate-800 rounded-xl p-4">
                  <View className="flex-row items-center justify-between">
                    <CheckCircle size={20} color="#22C55E" />
                    <View className="flex-row items-center">
                      <TrendingUp size={12} color="#22C55E" />
                      <Text className="text-green-500 text-xs ml-1">+5%</Text>
                    </View>
                  </View>
                  <Text className="text-white text-3xl font-bold mt-2">
                    {analytics.approvalRate.toFixed(1)}%
                  </Text>
                  <Text className="text-slate-400 text-sm">Approval Rate</Text>
                </View>

                <View className="flex-1 bg-slate-800 rounded-xl p-4">
                  <View className="flex-row items-center justify-between">
                    <XCircle size={20} color="#EF4444" />
                    <View className="flex-row items-center">
                      <TrendingDown size={12} color="#22C55E" />
                      <Text className="text-green-500 text-xs ml-1">-2%</Text>
                    </View>
                  </View>
                  <Text className="text-white text-3xl font-bold mt-2">
                    {analytics.rejectionRate.toFixed(1)}%
                  </Text>
                  <Text className="text-slate-400 text-sm">Rejection Rate</Text>
                </View>
              </View>
            </Animated.View>

            {/* Closure Time */}
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <View className="bg-slate-800 rounded-xl p-4 mb-4">
                <View className="flex-row items-center mb-3">
                  <Clock size={20} color="#F59E0B" />
                  <Text className="text-white font-semibold ml-2">Average Time to Closure</Text>
                </View>
                <Text className="text-white text-4xl font-bold">
                  {analytics.avgClosureTime}h
                </Text>
                <Text className="text-slate-400 text-sm mt-1">Across all products</Text>
              </View>
            </Animated.View>

            {/* Lead Distribution */}
            <Animated.View entering={FadeInDown.delay(150).springify()}>
              <View className="bg-slate-800 rounded-xl p-4 mb-4">
                <Text className="text-white font-semibold mb-4">Lead Distribution</Text>
                <View className="flex-row items-center justify-around">
                  <View className="items-center">
                    <View className="w-16 h-16 rounded-full bg-green-500/20 items-center justify-center">
                      <Text className="text-green-500 font-bold text-lg">
                        {analytics.approvedLeads}
                      </Text>
                    </View>
                    <Text className="text-slate-400 text-xs mt-2">Approved</Text>
                  </View>
                  <View className="items-center">
                    <View className="w-16 h-16 rounded-full bg-red-500/20 items-center justify-center">
                      <Text className="text-red-500 font-bold text-lg">
                        {analytics.rejectedLeads}
                      </Text>
                    </View>
                    <Text className="text-slate-400 text-xs mt-2">Rejected</Text>
                  </View>
                  <View className="items-center">
                    <View className="w-16 h-16 rounded-full bg-amber-500/20 items-center justify-center">
                      <Text className="text-amber-500 font-bold text-lg">
                        {analytics.pendingLeads}
                      </Text>
                    </View>
                    <Text className="text-slate-400 text-xs mt-2">Pending</Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Drop-off Stages */}
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <View className="bg-slate-800 rounded-xl p-4">
                <View className="flex-row items-center mb-4">
                  <AlertTriangle size={20} color="#F59E0B" />
                  <Text className="text-white font-semibold ml-2">High Drop-off Stages</Text>
                </View>
                {Object.entries(analytics.stageDropoffs)
                  .filter(([_, count]) => count > 0)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([stage, count]) => (
                    <View key={stage} className="flex-row items-center justify-between py-2 border-b border-slate-700">
                      <View className="flex-row items-center">
                        <View
                          className="w-2 h-2 rounded-full mr-2"
                          style={{ backgroundColor: STAGE_COLORS[stage as LeadStage] }}
                        />
                        <Text className="text-slate-300">{STAGE_LABELS[stage as LeadStage]}</Text>
                      </View>
                      <Text className="text-amber-500 font-medium">{count} stuck</Text>
                    </View>
                  ))}
              </View>
            </Animated.View>
          </View>
        )}

        {activeTab === 'products' && (
          <View className="p-4">
            <Animated.View entering={FadeInDown.delay(50).springify()}>
              <View className="bg-slate-800 rounded-xl p-4 mb-4">
                <Text className="text-white font-semibold mb-4">Leads by Product</Text>
                <HorizontalBar
                  data={Object.entries(analytics.byProduct)
                    .sort((a, b) => b[1].total - a[1].total)
                    .map(([product, data]) => ({
                      label: PRODUCT_LABELS[product as ProductCategory] || product,
                      value: data.total,
                      color: '#3B82F6',
                    }))}
                  maxValue={Math.max(...Object.values(analytics.byProduct).map(p => p.total))}
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <View className="bg-slate-800 rounded-xl p-4">
                <Text className="text-white font-semibold mb-4">Approval Rate by Product</Text>
                {Object.entries(analytics.byProduct)
                  .sort((a, b) => b[1].total - a[1].total)
                  .map(([product, data]) => {
                    const rate = data.total > 0 ? (data.approved / data.total) * 100 : 0;
                    return (
                      <View key={product} className="flex-row items-center justify-between py-3 border-b border-slate-700">
                        <Text className="text-slate-300">{PRODUCT_LABELS[product as ProductCategory]}</Text>
                        <View className="flex-row items-center">
                          <Text className="text-green-500 font-medium mr-2">{rate.toFixed(0)}%</Text>
                          <Text className="text-slate-500 text-xs">({data.approved}/{data.total})</Text>
                        </View>
                      </View>
                    );
                  })}
              </View>
            </Animated.View>
          </View>
        )}

        {activeTab === 'providers' && (
          <View className="p-4">
            <Animated.View entering={FadeInDown.delay(50).springify()}>
              <View className="bg-slate-800 rounded-xl p-4 mb-4">
                <Text className="text-white font-semibold mb-4">Top Providers by Volume</Text>
                <HorizontalBar
                  data={Object.entries(analytics.byProvider)
                    .sort((a, b) => b[1].total - a[1].total)
                    .slice(0, 8)
                    .map(([provider, data]) => ({
                      label: provider,
                      value: data.total,
                      color: '#8B5CF6',
                    }))}
                  maxValue={Math.max(...Object.values(analytics.byProvider).map(p => p.total))}
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <View className="bg-slate-800 rounded-xl p-4">
                <Text className="text-white font-semibold mb-4">Provider Performance</Text>
                {Object.entries(analytics.byProvider)
                  .sort((a, b) => {
                    const rateA = a[1].total > 0 ? a[1].approved / a[1].total : 0;
                    const rateB = b[1].total > 0 ? b[1].approved / b[1].total : 0;
                    return rateB - rateA;
                  })
                  .slice(0, 8)
                  .map(([provider, data]) => {
                    const rate = data.total > 0 ? (data.approved / data.total) * 100 : 0;
                    return (
                      <View key={provider} className="flex-row items-center justify-between py-3 border-b border-slate-700">
                        <View>
                          <Text className="text-white font-medium">{provider}</Text>
                          <Text className="text-slate-500 text-xs">{data.total} leads</Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-green-500 font-bold">{rate.toFixed(0)}%</Text>
                          <Text className="text-slate-500 text-xs">approval</Text>
                        </View>
                      </View>
                    );
                  })}
              </View>
            </Animated.View>
          </View>
        )}

        {activeTab === 'rejections' && (
          <View className="p-4">
            <Animated.View entering={FadeInDown.delay(50).springify()}>
              <View className="bg-slate-800 rounded-xl p-4 mb-4">
                <Text className="text-white font-semibold mb-4">Rejection Reasons</Text>
                <HorizontalBar
                  data={analytics.rejectionReasons.map((reason) => ({
                    label: reason.label,
                    value: reason.count,
                    color: '#EF4444',
                  }))}
                  maxValue={Math.max(...analytics.rejectionReasons.map(r => r.count))}
                />
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <View className="bg-slate-800 rounded-xl p-4">
                <Text className="text-white font-semibold mb-4">Rejection Details</Text>
                {analytics.rejectionReasons.map((reason) => (
                  <View key={reason.code} className="flex-row items-center justify-between py-3 border-b border-slate-700">
                    <View className="flex-row items-center">
                      <View className="w-2 h-2 rounded-full bg-red-500 mr-3" />
                      <View>
                        <Text className="text-white">{reason.label}</Text>
                        <Text className="text-slate-500 text-xs">Code: {reason.code}</Text>
                      </View>
                    </View>
                    <View className="bg-red-500/20 px-3 py-1 rounded">
                      <Text className="text-red-400 font-medium">{reason.count}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Animated.View>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
