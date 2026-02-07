import { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  TrendingUp,
  TrendingDown,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  CreditCard,
  Wallet,
  Home,
  Heart,
  Landmark,
} from 'lucide-react-native';
import { useAdminStore, STAGE_LABELS, STAGE_COLORS, PRODUCT_LABELS, LeadStage, ProductCategory } from '@/lib/admin-store';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

function MetricCard({ title, value, change, changeType = 'neutral', icon, color }: MetricCardProps) {
  return (
    <View
      className="bg-slate-800 rounded-xl p-4 flex-1 min-w-[140px]"
      style={{ borderLeftWidth: 3, borderLeftColor: color }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: color + '20' }}>
          {icon}
        </View>
        {change && (
          <View className="flex-row items-center">
            {changeType === 'positive' ? (
              <TrendingUp size={12} color="#22C55E" />
            ) : changeType === 'negative' ? (
              <TrendingDown size={12} color="#EF4444" />
            ) : null}
            <Text
              className={`text-xs ml-1 ${
                changeType === 'positive' ? 'text-green-500' : changeType === 'negative' ? 'text-red-500' : 'text-slate-400'
              }`}
            >
              {change}
            </Text>
          </View>
        )}
      </View>
      <Text className="text-white text-2xl font-bold">{value}</Text>
      <Text className="text-slate-400 text-xs mt-1">{title}</Text>
    </View>
  );
}

interface FunnelBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
}

function FunnelBar({ label, count, total, color }: FunnelBarProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  return (
    <View className="mb-3">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-slate-300 text-sm">{label}</Text>
        <Text className="text-white font-medium">{count}</Text>
      </View>
      <View className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const leads = useAdminStore(s => s.leads);

  const metrics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const todayLeads = leads.filter(l => new Date(l.createdAt) >= today).length;
    const last7DaysLeads = leads.filter(l => new Date(l.createdAt) >= last7Days).length;
    const last30DaysLeads = leads.filter(l => new Date(l.createdAt) >= last30Days).length;

    // Stage counts
    const stageCounts: Record<LeadStage, number> = {
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
    leads.forEach(l => stageCounts[l.stage]++);

    // Product counts
    const productCounts: Partial<Record<ProductCategory, number>> = {};
    leads.forEach(l => {
      productCounts[l.productType] = (productCounts[l.productType] || 0) + 1;
    });

    // Rates
    const totalProcessed = stageCounts.approved + stageCounts.rejected + stageCounts.closed + stageCounts.disbursed;
    const approvalRate = totalProcessed > 0 ? ((stageCounts.approved + stageCounts.disbursed + stageCounts.closed) / totalProcessed * 100).toFixed(1) : '0';
    const rejectionRate = totalProcessed > 0 ? (stageCounts.rejected / totalProcessed * 100).toFixed(1) : '0';

    // Stuck leads (no update in 3+ days)
    const stuckThreshold = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const stuckLeads = leads.filter(
      l => new Date(l.updatedAt) < stuckThreshold && !['closed', 'disbursed', 'rejected'].includes(l.stage)
    ).length;

    // Top providers
    const providerCounts: Record<string, { total: number; approved: number }> = {};
    leads.forEach(l => {
      if (!providerCounts[l.provider]) {
        providerCounts[l.provider] = { total: 0, approved: 0 };
      }
      providerCounts[l.provider].total++;
      if (['approved', 'disbursed', 'closed'].includes(l.stage)) {
        providerCounts[l.provider].approved++;
      }
    });
    const topProviders = Object.entries(providerCounts)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5);

    return {
      todayLeads,
      last7DaysLeads,
      last30DaysLeads,
      stageCounts,
      productCounts,
      approvalRate,
      rejectionRate,
      stuckLeads,
      topProviders,
      totalLeads: leads.length,
    };
  }, [leads]);

  // Funnel data
  const funnelStages: { label: string; stage: LeadStage; color: string }[] = [
    { label: 'Captured', stage: 'new', color: '#3B82F6' },
    { label: 'KYC Started', stage: 'kyc_pending', color: '#F59E0B' },
    { label: 'Submitted', stage: 'submitted', color: '#6366F1' },
    { label: 'Approved', stage: 'approved', color: '#22C55E' },
    { label: 'Closed', stage: 'closed', color: '#64748B' },
  ];

  const productIcons: Partial<Record<ProductCategory, React.ReactNode>> = {
    'credit-cards': <CreditCard size={16} color="#3B82F6" />,
    'personal-loans': <Wallet size={16} color="#10B981" />,
    'home-loans': <Home size={16} color="#8B5CF6" />,
    'health-insurance': <Heart size={16} color="#22C55E" />,
    'bank-accounts': <Landmark size={16} color="#06B6D4" />,
  };

  return (
    <ScrollView className="flex-1 bg-slate-900" showsVerticalScrollIndicator={false}>
      <View className="p-4">
        {/* Page Header */}
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <Text className="text-white text-2xl font-bold mb-1">Dashboard Overview</Text>
          <Text className="text-slate-400 mb-4">Real-time metrics and insights</Text>
        </Animated.View>

        {/* Key Metrics Row */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
          >
            <MetricCard
              title="Total Leads"
              value={metrics.totalLeads}
              change="+12%"
              changeType="positive"
              icon={<Users size={16} color="#3B82F6" />}
              color="#3B82F6"
            />
            <MetricCard
              title="Today"
              value={metrics.todayLeads}
              icon={<Clock size={16} color="#F59E0B" />}
              color="#F59E0B"
            />
            <MetricCard
              title="Approval Rate"
              value={`${metrics.approvalRate}%`}
              change="+2.5%"
              changeType="positive"
              icon={<CheckCircle size={16} color="#22C55E" />}
              color="#22C55E"
            />
            <MetricCard
              title="Rejection Rate"
              value={`${metrics.rejectionRate}%`}
              change="-1.2%"
              changeType="positive"
              icon={<XCircle size={16} color="#EF4444" />}
              color="#EF4444"
            />
            <MetricCard
              title="Stuck Leads"
              value={metrics.stuckLeads}
              icon={<AlertTriangle size={16} color="#F97316" />}
              color="#F97316"
            />
          </ScrollView>
        </Animated.View>

        {/* Two Column Layout */}
        <View className="flex-row gap-4 mt-6">
          {/* Funnel View */}
          <Animated.View
            entering={FadeInDown.delay(150).springify()}
            className="flex-1 bg-slate-800 rounded-xl p-4"
          >
            <Text className="text-white font-semibold mb-4">Lead Funnel</Text>
            {funnelStages.map((item, index) => {
              const stageCount = leads.filter(l => {
                const stageOrder = ['new', 'consent_given', 'eligibility_check', 'kyc_pending', 'kyc_completed', 'submitted', 'approved', 'rejected', 'disbursed', 'closed'];
                return stageOrder.indexOf(l.stage) >= stageOrder.indexOf(item.stage);
              }).length;
              return (
                <FunnelBar
                  key={item.stage}
                  label={item.label}
                  count={metrics.stageCounts[item.stage]}
                  total={metrics.totalLeads}
                  color={item.color}
                />
              );
            })}
          </Animated.View>

          {/* Leads by Stage */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            className="flex-1 bg-slate-800 rounded-xl p-4"
          >
            <Text className="text-white font-semibold mb-4">By Stage</Text>
            {Object.entries(metrics.stageCounts)
              .filter(([_, count]) => count > 0)
              .slice(0, 6)
              .map(([stage, count]) => (
                <View key={stage} className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <View
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: STAGE_COLORS[stage as LeadStage] }}
                    />
                    <Text className="text-slate-300 text-sm">
                      {STAGE_LABELS[stage as LeadStage]}
                    </Text>
                  </View>
                  <Text className="text-white font-medium">{count}</Text>
                </View>
              ))}
          </Animated.View>
        </View>

        {/* Leads by Product */}
        <Animated.View
          entering={FadeInDown.delay(250).springify()}
          className="bg-slate-800 rounded-xl p-4 mt-4"
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white font-semibold">Leads by Product</Text>
            <Pressable onPress={() => router.push('/admin/leads' as any)}>
              <Text className="text-orange-500 text-sm">View All</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3">
              {Object.entries(metrics.productCounts).map(([product, count]) => (
                <View
                  key={product}
                  className="bg-slate-700 rounded-xl p-3 min-w-[120px]"
                >
                  <View className="w-8 h-8 bg-slate-600 rounded-lg items-center justify-center mb-2">
                    {productIcons[product as ProductCategory] || <CreditCard size={16} color="#94A3B8" />}
                  </View>
                  <Text className="text-white font-bold text-lg">{count}</Text>
                  <Text className="text-slate-400 text-xs">
                    {PRODUCT_LABELS[product as ProductCategory]}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </Animated.View>

        {/* Top Providers */}
        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          className="bg-slate-800 rounded-xl p-4 mt-4"
        >
          <Text className="text-white font-semibold mb-4">Top Providers</Text>
          {metrics.topProviders.map(([provider, data], index) => (
            <View
              key={provider}
              className="flex-row items-center justify-between py-3 border-b border-slate-700"
              style={{ borderBottomWidth: index === metrics.topProviders.length - 1 ? 0 : 1 }}
            >
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-slate-700 rounded-full items-center justify-center mr-3">
                  <Text className="text-white font-bold text-sm">{index + 1}</Text>
                </View>
                <View>
                  <Text className="text-white font-medium">{provider}</Text>
                  <Text className="text-slate-400 text-xs">{data.total} leads</Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-green-500 font-medium">{data.approved} approved</Text>
                <Text className="text-slate-400 text-xs">
                  {data.total > 0 ? ((data.approved / data.total) * 100).toFixed(0) : 0}% rate
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          entering={FadeInDown.delay(350).springify()}
          className="mt-4 mb-6"
        >
          <Text className="text-white font-semibold mb-3">Quick Actions</Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => router.push('/admin/leads' as any)}
              className="flex-1 bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 flex-row items-center justify-between"
            >
              <View>
                <Text className="text-blue-400 font-medium">View All Leads</Text>
                <Text className="text-slate-400 text-xs mt-1">{metrics.totalLeads} total</Text>
              </View>
              <ArrowRight size={20} color="#60A5FA" />
            </Pressable>
            <Pressable
              onPress={() => router.push('/admin/tasks' as any)}
              className="flex-1 bg-orange-500/20 border border-orange-500/30 rounded-xl p-4 flex-row items-center justify-between"
            >
              <View>
                <Text className="text-orange-400 font-medium">Pending Tasks</Text>
                <Text className="text-slate-400 text-xs mt-1">{metrics.stuckLeads} stuck</Text>
              </View>
              <ArrowRight size={20} color="#FB923C" />
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </ScrollView>
  );
}
