import { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Modal, FlatList } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle,
  DollarSign,
  Users,
  Building2,
  ChevronDown,
  X,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
} from 'lucide-react-native';
import { useIncentiveStore, IncentiveStatus, UserIncentive } from '@/lib/incentive-store';
import { useAdminStore } from '@/lib/admin-store';
import * as Haptics from '@/lib/haptics';

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  trend?: string;
  trendUp?: boolean;
}

function MetricCard({ title, value, icon, color, trend, trendUp }: MetricCardProps) {
  return (
    <View
      className="bg-slate-800 rounded-xl p-4 flex-1 min-w-[150px]"
      style={{ borderLeftWidth: 3, borderLeftColor: color }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: color + '20' }}>
          {icon}
        </View>
        {trend && (
          <View className="flex-row items-center">
            {trendUp ? (
              <ArrowUpRight size={14} color="#22C55E" />
            ) : (
              <ArrowDownLeft size={14} color="#EF4444" />
            )}
            <Text className={trendUp ? 'text-green-500 text-xs' : 'text-red-500 text-xs'}>{trend}</Text>
          </View>
        )}
      </View>
      <Text className="text-white text-2xl font-bold">{value}</Text>
      <Text className="text-slate-400 text-xs mt-1">{title}</Text>
    </View>
  );
}

function formatCurrency(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount}`;
}

const STATUS_COLORS: Record<IncentiveStatus, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#F59E0B' },
  approved: { bg: '#DBEAFE', text: '#3B82F6' },
  paid: { bg: '#D1FAE5', text: '#10B981' },
};

export default function IncentivesScreen() {
  const incentives = useIncentiveStore(s => s.incentives);
  const incomingOutgoing = useIncentiveStore(s => s.incomingOutgoing);
  const getTotalIncentivesEarned = useIncentiveStore(s => s.getTotalIncentivesEarned);
  const getTotalIncentivesPaid = useIncentiveStore(s => s.getTotalIncentivesPaid);
  const getPendingIncentives = useIncentiveStore(s => s.getPendingIncentives);
  const getNetBalance = useIncentiveStore(s => s.getNetBalance);
  const approveIncentive = useIncentiveStore(s => s.approveIncentive);
  const markIncentivePaid = useIncentiveStore(s => s.markIncentivePaid);

  const currentAdmin = useAdminStore(s => s.currentAdmin);

  const [activeTab, setActiveTab] = useState<'ledger' | 'incoming-outgoing'>('ledger');
  const [statusFilter, setStatusFilter] = useState<IncentiveStatus | 'all'>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedIncentive, setSelectedIncentive] = useState<UserIncentive | null>(null);

  const filteredIncentives = useMemo(() => {
    if (statusFilter === 'all') return incentives;
    return incentives.filter(inc => inc.status === statusFilter);
  }, [incentives, statusFilter]);

  const totalEarned = getTotalIncentivesEarned();
  const totalPaid = getTotalIncentivesPaid();
  const pending = getPendingIncentives();
  const netBalance = getNetBalance();

  const handleApprove = (incentiveId: string) => {
    if (currentAdmin) {
      approveIncentive(incentiveId, currentAdmin.name);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSelectedIncentive(null);
  };

  const handleMarkPaid = (incentiveId: string) => {
    if (currentAdmin) {
      markIncentivePaid(incentiveId, currentAdmin.name);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSelectedIncentive(null);
  };

  const handleExport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // In a real app, this would generate and download an Excel file
    alert('Export functionality would generate an Excel file with all incentive data.');
  };

  const getProductLabel = (type: string) => {
    switch (type) {
      case 'bank-account': return 'Bank Account';
      case 'credit-card': return 'Credit Card';
      case 'loan': return 'Loan';
      default: return type;
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-900" showsVerticalScrollIndicator={false}>
      <View className="p-4">
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-white text-2xl font-bold">Incentive Management</Text>
            <Pressable
              onPress={handleExport}
              className="flex-row items-center bg-green-600 px-3 py-2 rounded-lg"
            >
              <FileSpreadsheet size={16} color="#fff" />
              <Text className="text-white text-sm font-medium ml-2">Export</Text>
            </Pressable>
          </View>
          <Text className="text-slate-400 mb-4">Track incentives and payouts</Text>
        </Animated.View>

        {/* Dashboard Widgets */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
          >
            <MetricCard
              title="Total Earned"
              value={formatCurrency(totalEarned)}
              icon={<Wallet size={20} color="#3B82F6" />}
              color="#3B82F6"
              trend="+18%"
              trendUp={true}
            />
            <MetricCard
              title="Total Paid"
              value={formatCurrency(totalPaid)}
              icon={<CheckCircle size={20} color="#10B981" />}
              color="#10B981"
              trend="+12%"
              trendUp={true}
            />
            <MetricCard
              title="Pending"
              value={formatCurrency(pending)}
              icon={<Clock size={20} color="#F59E0B" />}
              color="#F59E0B"
            />
            <MetricCard
              title="Net Balance"
              value={formatCurrency(netBalance)}
              icon={<DollarSign size={20} color="#8B5CF6" />}
              color="#8B5CF6"
              trend="+8%"
              trendUp={true}
            />
          </ScrollView>
        </Animated.View>

        {/* Tab Switcher */}
        <Animated.View entering={FadeInDown.delay(150).springify()} className="mt-6">
          <View className="flex-row bg-slate-800 rounded-xl p-1">
            <Pressable
              onPress={() => setActiveTab('ledger')}
              className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'ledger' ? 'bg-orange-500' : ''}`}
            >
              <Text className={activeTab === 'ledger' ? 'text-white font-semibold' : 'text-slate-400'}>
                User Incentive Ledger
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('incoming-outgoing')}
              className={`flex-1 py-3 rounded-lg items-center ${activeTab === 'incoming-outgoing' ? 'bg-orange-500' : ''}`}
            >
              <Text className={activeTab === 'incoming-outgoing' ? 'text-white font-semibold' : 'text-slate-400'}>
                Incoming vs Outgoing
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {activeTab === 'ledger' && (
          <>
            {/* Filter Bar */}
            <Animated.View entering={FadeInDown.delay(200).springify()} className="mt-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-white font-semibold">
                  {filteredIncentives.length} Records
                </Text>
                <Pressable
                  onPress={() => setShowFilterModal(true)}
                  className="flex-row items-center bg-slate-800 px-3 py-2 rounded-lg"
                >
                  <Filter size={16} color="#94A3B8" />
                  <Text className="text-slate-300 text-sm ml-2">
                    {statusFilter === 'all' ? 'All Status' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                  </Text>
                  <ChevronDown size={16} color="#94A3B8" className="ml-1" />
                </Pressable>
              </View>
            </Animated.View>

            {/* Incentive Ledger Table */}
            <Animated.View entering={FadeInDown.delay(250).springify()} className="mt-4">
              {filteredIncentives.slice(0, 20).map((incentive, index) => {
                const statusStyle = STATUS_COLORS[incentive.status];
                return (
                  <Pressable
                    key={incentive.id}
                    onPress={() => setSelectedIncentive(incentive)}
                    className="bg-slate-800 rounded-xl p-4 mb-3"
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <Users size={14} color="#94A3B8" />
                          <Text className="text-white font-medium ml-2">{incentive.userName}</Text>
                        </View>
                        <Text className="text-slate-500 text-xs mt-1">{incentive.id}</Text>
                      </View>
                      <View
                        className="px-2 py-1 rounded-full"
                        style={{ backgroundColor: statusStyle.bg }}
                      >
                        <Text style={{ color: statusStyle.text }} className="text-xs font-medium">
                          {incentive.status.charAt(0).toUpperCase() + incentive.status.slice(1)}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row mt-3 pt-3 border-t border-slate-700">
                      <View className="flex-1">
                        <Text className="text-slate-500 text-xs">Product</Text>
                        <Text className="text-slate-300 text-sm">{getProductLabel(incentive.productType)}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-slate-500 text-xs">Bank</Text>
                        <Text className="text-slate-300 text-sm">{incentive.bankName}</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-slate-500 text-xs">Amount</Text>
                        <Text className="text-green-500 font-bold">₹{incentive.amount}</Text>
                      </View>
                    </View>

                    <View className="flex-row items-center justify-between mt-2">
                      <Text className="text-slate-500 text-xs">
                        {new Date(incentive.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                      {incentive.status === 'pending' && (
                        <Pressable
                          onPress={() => handleApprove(incentive.id)}
                          className="bg-blue-600 px-3 py-1 rounded-lg"
                        >
                          <Text className="text-white text-xs font-medium">Approve</Text>
                        </Pressable>
                      )}
                      {incentive.status === 'approved' && (
                        <Pressable
                          onPress={() => handleMarkPaid(incentive.id)}
                          className="bg-green-600 px-3 py-1 rounded-lg"
                        >
                          <Text className="text-white text-xs font-medium">Mark Paid</Text>
                        </Pressable>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </Animated.View>
          </>
        )}

        {activeTab === 'incoming-outgoing' && (
          <Animated.View entering={FadeInDown.delay(200).springify()} className="mt-4">
            {/* Summary Cards */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1 bg-green-900/30 border border-green-800 rounded-xl p-4">
                <ArrowDownLeft size={20} color="#22C55E" />
                <Text className="text-green-400 text-xs mt-2">Total Receivable</Text>
                <Text className="text-white text-xl font-bold">
                  {formatCurrency(incomingOutgoing.reduce((sum, r) => sum + r.totalReceivable, 0))}
                </Text>
              </View>
              <View className="flex-1 bg-red-900/30 border border-red-800 rounded-xl p-4">
                <ArrowUpRight size={20} color="#EF4444" />
                <Text className="text-red-400 text-xs mt-2">Total Paid Out</Text>
                <Text className="text-white text-xl font-bold">
                  {formatCurrency(incomingOutgoing.reduce((sum, r) => sum + r.totalPaidToUsers, 0))}
                </Text>
              </View>
            </View>

            {/* Bank Partner Table */}
            {incomingOutgoing.map((record, index) => (
              <View key={record.id} className="bg-slate-800 rounded-xl p-4 mb-3">
                <View className="flex-row items-center mb-3">
                  <View className="w-10 h-10 bg-slate-700 rounded-xl items-center justify-center mr-3">
                    <Building2 size={20} color="#94A3B8" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-semibold">{record.bankPartner}</Text>
                    <Text className="text-slate-500 text-xs">{record.month}</Text>
                  </View>
                </View>

                <View className="flex-row flex-wrap gap-y-3">
                  <View className="w-1/2">
                    <Text className="text-slate-500 text-xs">Total Leads</Text>
                    <Text className="text-white font-medium">{record.totalLeads}</Text>
                  </View>
                  <View className="w-1/2">
                    <Text className="text-slate-500 text-xs">Approved</Text>
                    <Text className="text-green-500 font-medium">{record.approvedLeads}</Text>
                  </View>
                  <View className="w-1/2">
                    <Text className="text-slate-500 text-xs">Receivable</Text>
                    <Text className="text-blue-400 font-medium">{formatCurrency(record.totalReceivable)}</Text>
                  </View>
                  <View className="w-1/2">
                    <Text className="text-slate-500 text-xs">Paid to Users</Text>
                    <Text className="text-orange-400 font-medium">{formatCurrency(record.totalPaidToUsers)}</Text>
                  </View>
                </View>

                <View className="mt-3 pt-3 border-t border-slate-700 flex-row items-center justify-between">
                  <Text className="text-slate-400 text-sm">Margin Retained</Text>
                  <Text className="text-green-500 font-bold text-lg">{formatCurrency(record.marginRetained)}</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        <View className="h-6" />
      </View>

      {/* Filter Modal */}
      <Modal visible={showFilterModal} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowFilterModal(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-slate-800 rounded-t-3xl">
              <View className="flex-row items-center justify-between p-4 border-b border-slate-700">
                <Text className="text-white text-lg font-semibold">Filter by Status</Text>
                <Pressable onPress={() => setShowFilterModal(false)} className="p-2">
                  <X size={20} color="#94A3B8" />
                </Pressable>
              </View>
              {(['all', 'pending', 'approved', 'paid'] as const).map((status) => (
                <Pressable
                  key={status}
                  onPress={() => {
                    setStatusFilter(status);
                    setShowFilterModal(false);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className={`p-4 border-b border-slate-700 ${statusFilter === status ? 'bg-slate-700' : ''}`}
                >
                  <Text className="text-white text-base">
                    {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Incentive Detail Modal */}
      <Modal visible={!!selectedIncentive} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setSelectedIncentive(null)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            {selectedIncentive && (
              <View className="bg-slate-800 rounded-t-3xl p-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-white text-xl font-bold">Incentive Details</Text>
                  <Pressable onPress={() => setSelectedIncentive(null)} className="p-2">
                    <X size={20} color="#94A3B8" />
                  </Pressable>
                </View>

                <View className="space-y-4">
                  <View className="flex-row justify-between py-3 border-b border-slate-700">
                    <Text className="text-slate-400">User Name</Text>
                    <Text className="text-white font-medium">{selectedIncentive.userName}</Text>
                  </View>
                  <View className="flex-row justify-between py-3 border-b border-slate-700">
                    <Text className="text-slate-400">User ID</Text>
                    <Text className="text-white font-medium">{selectedIncentive.id}</Text>
                  </View>
                  <View className="flex-row justify-between py-3 border-b border-slate-700">
                    <Text className="text-slate-400">Product Type</Text>
                    <Text className="text-white font-medium">{getProductLabel(selectedIncentive.productType)}</Text>
                  </View>
                  <View className="flex-row justify-between py-3 border-b border-slate-700">
                    <Text className="text-slate-400">Bank Name</Text>
                    <Text className="text-white font-medium">{selectedIncentive.bankName}</Text>
                  </View>
                  <View className="flex-row justify-between py-3 border-b border-slate-700">
                    <Text className="text-slate-400">Amount</Text>
                    <Text className="text-green-500 font-bold text-lg">₹{selectedIncentive.amount}</Text>
                  </View>
                  <View className="flex-row justify-between py-3 border-b border-slate-700">
                    <Text className="text-slate-400">Status</Text>
                    <View
                      className="px-3 py-1 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[selectedIncentive.status].bg }}
                    >
                      <Text style={{ color: STATUS_COLORS[selectedIncentive.status].text }} className="font-medium">
                        {selectedIncentive.status.charAt(0).toUpperCase() + selectedIncentive.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between py-3">
                    <Text className="text-slate-400">Date</Text>
                    <Text className="text-white font-medium">
                      {new Date(selectedIncentive.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-3 mt-6">
                  {selectedIncentive.status === 'pending' && (
                    <Pressable
                      onPress={() => handleApprove(selectedIncentive.id)}
                      className="flex-1 bg-blue-600 py-4 rounded-xl items-center"
                    >
                      <Text className="text-white font-semibold">Approve</Text>
                    </Pressable>
                  )}
                  {selectedIncentive.status === 'approved' && (
                    <Pressable
                      onPress={() => handleMarkPaid(selectedIncentive.id)}
                      className="flex-1 bg-green-600 py-4 rounded-xl items-center"
                    >
                      <Text className="text-white font-semibold">Mark as Paid</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => setSelectedIncentive(null)}
                    className="flex-1 bg-slate-700 py-4 rounded-xl items-center"
                  >
                    <Text className="text-white font-semibold">Close</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
