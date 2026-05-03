import { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Wallet,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  X,
  Building2,
  User,
  ChevronDown,
  Filter,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react-native';
import { useIncentiveStore, PayoutStatus, Payout } from '@/lib/incentive-store';
import { useAdminStore } from '@/lib/admin-store';
import * as Haptics from '@/lib/haptics';

const STATUS_CONFIG: Record<PayoutStatus, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
  initiated: { bg: '#FEF3C7', text: '#F59E0B', icon: <Clock size={14} color="#F59E0B" />, label: 'Initiated' },
  processing: { bg: '#DBEAFE', text: '#3B82F6', icon: <RefreshCw size={14} color="#3B82F6" />, label: 'Processing' },
  completed: { bg: '#D1FAE5', text: '#10B981', icon: <CheckCircle size={14} color="#10B981" />, label: 'Completed' },
  failed: { bg: '#FEE2E2', text: '#EF4444', icon: <XCircle size={14} color="#EF4444" />, label: 'Failed' },
};

function formatCurrency(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount}`;
}

export default function PayoutsScreen() {
  const payouts = useIncentiveStore(s => s.payouts);
  const minWithdrawalAmount = useIncentiveStore(s => s.minWithdrawalAmount);
  const dailyPayoutLimit = useIncentiveStore(s => s.dailyPayoutLimit);
  const updatePayoutStatus = useIncentiveStore(s => s.updatePayoutStatus);
  const updatePayoutSettings = useIncentiveStore(s => s.updatePayoutSettings);

  const currentAdmin = useAdminStore(s => s.currentAdmin);

  const [statusFilter, setStatusFilter] = useState<PayoutStatus | 'all'>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [minAmount, setMinAmount] = useState(String(minWithdrawalAmount));
  const [dailyLimit, setDailyLimit] = useState(String(dailyPayoutLimit));

  const filteredPayouts = useMemo(() => {
    if (statusFilter === 'all') return payouts;
    return payouts.filter(p => p.status === statusFilter);
  }, [payouts, statusFilter]);

  const stats = useMemo(() => {
    const initiated = payouts.filter(p => p.status === 'initiated').length;
    const processing = payouts.filter(p => p.status === 'processing').length;
    const completed = payouts.filter(p => p.status === 'completed').length;
    const failed = payouts.filter(p => p.status === 'failed').length;
    const totalPaid = payouts
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = payouts
      .filter(p => p.status === 'initiated' || p.status === 'processing')
      .reduce((sum, p) => sum + p.amount, 0);

    return { initiated, processing, completed, failed, totalPaid, pendingAmount };
  }, [payouts]);

  const handleProcessPayout = (payoutId: string) => {
    updatePayoutStatus(payoutId, 'processing');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedPayout(null);
  };

  const handleCompletePayout = (payoutId: string) => {
    updatePayoutStatus(payoutId, 'completed');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSelectedPayout(null);
  };

  const handleFailPayout = (payoutId: string) => {
    updatePayoutStatus(payoutId, 'failed', 'Bank rejection - Invalid account');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setSelectedPayout(null);
  };

  const handleSaveSettings = () => {
    const min = parseInt(minAmount, 10);
    const daily = parseInt(dailyLimit, 10);
    if (!isNaN(min) && !isNaN(daily) && min > 0 && daily > 0) {
      updatePayoutSettings(min, daily);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSettingsModal(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-900" showsVerticalScrollIndicator={false}>
      <View className="p-4">
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-white text-2xl font-bold">Payout Management</Text>
            <Pressable
              onPress={() => setShowSettingsModal(true)}
              className="flex-row items-center bg-slate-800 px-3 py-2 rounded-lg"
            >
              <Settings size={16} color="#94A3B8" />
              <Text className="text-slate-300 text-sm font-medium ml-2">Settings</Text>
            </Pressable>
          </View>
          <Text className="text-slate-400 mb-4">Manage user withdrawals and bank payouts</Text>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInDown.delay(100).springify()} className="flex-row flex-wrap gap-3">
          <View className="bg-slate-800 rounded-xl p-4 w-[48%]">
            <View className="flex-row items-center justify-between">
              <Clock size={20} color="#F59E0B" />
              <Text className="text-yellow-500 text-2xl font-bold">{stats.initiated}</Text>
            </View>
            <Text className="text-slate-400 text-sm mt-2">Initiated</Text>
          </View>
          <View className="bg-slate-800 rounded-xl p-4 w-[48%]">
            <View className="flex-row items-center justify-between">
              <RefreshCw size={20} color="#3B82F6" />
              <Text className="text-blue-500 text-2xl font-bold">{stats.processing}</Text>
            </View>
            <Text className="text-slate-400 text-sm mt-2">Processing</Text>
          </View>
          <View className="bg-slate-800 rounded-xl p-4 w-[48%]">
            <View className="flex-row items-center justify-between">
              <CheckCircle size={20} color="#10B981" />
              <Text className="text-green-500 text-2xl font-bold">{stats.completed}</Text>
            </View>
            <Text className="text-slate-400 text-sm mt-2">Completed</Text>
          </View>
          <View className="bg-slate-800 rounded-xl p-4 w-[48%]">
            <View className="flex-row items-center justify-between">
              <XCircle size={20} color="#EF4444" />
              <Text className="text-red-500 text-2xl font-bold">{stats.failed}</Text>
            </View>
            <Text className="text-slate-400 text-sm mt-2">Failed</Text>
          </View>
        </Animated.View>

        {/* Summary Cards */}
        <Animated.View entering={FadeInDown.delay(150).springify()} className="flex-row gap-3 mt-4">
          <View className="flex-1 bg-green-900/30 border border-green-800 rounded-xl p-4">
            <CheckCircle size={20} color="#22C55E" />
            <Text className="text-green-400 text-xs mt-2">Total Paid Out</Text>
            <Text className="text-white text-xl font-bold">{formatCurrency(stats.totalPaid)}</Text>
          </View>
          <View className="flex-1 bg-yellow-900/30 border border-yellow-800 rounded-xl p-4">
            <Clock size={20} color="#F59E0B" />
            <Text className="text-yellow-400 text-xs mt-2">Pending Amount</Text>
            <Text className="text-white text-xl font-bold">{formatCurrency(stats.pendingAmount)}</Text>
          </View>
        </Animated.View>

        {/* Payout Rules */}
        <Animated.View entering={FadeInDown.delay(200).springify()} className="mt-4">
          <View className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <View className="flex-row items-center mb-2">
              <AlertTriangle size={16} color="#F59E0B" />
              <Text className="text-slate-300 font-medium ml-2">Payout Rules</Text>
            </View>
            <View className="flex-row justify-between">
              <View>
                <Text className="text-slate-500 text-xs">Minimum Withdrawal</Text>
                <Text className="text-white font-semibold">₹{minWithdrawalAmount}</Text>
              </View>
              <View>
                <Text className="text-slate-500 text-xs">Daily Limit</Text>
                <Text className="text-white font-semibold">₹{dailyPayoutLimit.toLocaleString()}</Text>
              </View>
              <View>
                <Text className="text-slate-500 text-xs">KYC Required</Text>
                <Text className="text-green-500 font-semibold">Yes</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Filter Bar */}
        <Animated.View entering={FadeInDown.delay(250).springify()} className="mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white font-semibold">
              Payout Requests ({filteredPayouts.length})
            </Text>
            <Pressable
              onPress={() => setShowFilterModal(true)}
              className="flex-row items-center bg-slate-800 px-3 py-2 rounded-lg"
            >
              <Filter size={16} color="#94A3B8" />
              <Text className="text-slate-300 text-sm ml-2">
                {statusFilter === 'all' ? 'All Status' : STATUS_CONFIG[statusFilter].label}
              </Text>
              <ChevronDown size={16} color="#94A3B8" />
            </Pressable>
          </View>
        </Animated.View>

        {/* Payout List */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          {filteredPayouts.map((payout) => {
            const statusConfig = STATUS_CONFIG[payout.status];
            return (
              <Pressable
                key={payout.id}
                onPress={() => setSelectedPayout(payout)}
                className="bg-slate-800 rounded-xl p-4 mb-3"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <User size={14} color="#94A3B8" />
                      <Text className="text-white font-medium ml-2">{payout.userName}</Text>
                    </View>
                    <Text className="text-slate-500 text-xs mt-1">{payout.id}</Text>
                  </View>
                  <View
                    className="flex-row items-center px-2 py-1 rounded-full"
                    style={{ backgroundColor: statusConfig.bg }}
                  >
                    {statusConfig.icon}
                    <Text style={{ color: statusConfig.text }} className="text-xs font-medium ml-1">
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>

                <View className="flex-row mt-3 pt-3 border-t border-slate-700">
                  <View className="flex-1">
                    <Text className="text-slate-500 text-xs">Bank</Text>
                    <Text className="text-slate-300 text-sm">{payout.bankName}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-500 text-xs">Account</Text>
                    <Text className="text-slate-300 text-sm">{payout.accountNumber}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-slate-500 text-xs">Amount</Text>
                    <Text className="text-green-500 font-bold">₹{payout.amount}</Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between mt-2">
                  <Text className="text-slate-500 text-xs">
                    {new Date(payout.initiatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {payout.status === 'initiated' && (
                    <Pressable
                      onPress={() => handleProcessPayout(payout.id)}
                      className="bg-blue-600 px-3 py-1 rounded-lg"
                    >
                      <Text className="text-white text-xs font-medium">Process</Text>
                    </Pressable>
                  )}
                  {payout.status === 'processing' && (
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => handleCompletePayout(payout.id)}
                        className="bg-green-600 px-3 py-1 rounded-lg"
                      >
                        <Text className="text-white text-xs font-medium">Complete</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleFailPayout(payout.id)}
                        className="bg-red-600 px-3 py-1 rounded-lg"
                      >
                        <Text className="text-white text-xs font-medium">Fail</Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                {payout.status === 'failed' && payout.failureReason && (
                  <View className="mt-2 bg-red-900/20 rounded-lg p-2">
                    <Text className="text-red-400 text-xs">Reason: {payout.failureReason}</Text>
                  </View>
                )}

                {payout.status === 'completed' && payout.transactionId && (
                  <View className="mt-2 bg-green-900/20 rounded-lg p-2">
                    <Text className="text-green-400 text-xs">TXN: {payout.transactionId}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </Animated.View>

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
              {(['all', 'initiated', 'processing', 'completed', 'failed'] as const).map((status) => (
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
                    {status === 'all' ? 'All Status' : STATUS_CONFIG[status].label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Settings Modal */}
      <Modal visible={showSettingsModal} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowSettingsModal(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-slate-800 rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-bold">Payout Settings</Text>
                <Pressable onPress={() => setShowSettingsModal(false)} className="p-2">
                  <X size={20} color="#94A3B8" />
                </Pressable>
              </View>

              <View className="mb-4">
                <Text className="text-slate-400 text-sm mb-2">Minimum Withdrawal Amount (₹)</Text>
                <TextInput
                  className="bg-slate-700 text-white px-4 py-3 rounded-xl text-base"
                  value={minAmount}
                  onChangeText={setMinAmount}
                  keyboardType="number-pad"
                  placeholder="500"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View className="mb-6">
                <Text className="text-slate-400 text-sm mb-2">Daily Payout Limit (₹)</Text>
                <TextInput
                  className="bg-slate-700 text-white px-4 py-3 rounded-xl text-base"
                  value={dailyLimit}
                  onChangeText={setDailyLimit}
                  keyboardType="number-pad"
                  placeholder="50000"
                  placeholderTextColor="#64748B"
                />
              </View>

              <Pressable
                onPress={handleSaveSettings}
                className="bg-orange-500 py-4 rounded-xl items-center"
              >
                <Text className="text-white font-semibold">Save Settings</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Payout Detail Modal */}
      <Modal visible={!!selectedPayout} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setSelectedPayout(null)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            {selectedPayout && (
              <View className="bg-slate-800 rounded-t-3xl p-6">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-white text-xl font-bold">Payout Details</Text>
                  <Pressable onPress={() => setSelectedPayout(null)} className="p-2">
                    <X size={20} color="#94A3B8" />
                  </Pressable>
                </View>

                <View className="space-y-3">
                  <View className="flex-row justify-between py-3 border-b border-slate-700">
                    <Text className="text-slate-400">User</Text>
                    <Text className="text-white font-medium">{selectedPayout.userName}</Text>
                  </View>
                  <View className="flex-row justify-between py-3 border-b border-slate-700">
                    <Text className="text-slate-400">Payout ID</Text>
                    <Text className="text-white font-medium">{selectedPayout.id}</Text>
                  </View>
                  <View className="flex-row justify-between py-3 border-b border-slate-700">
                    <Text className="text-slate-400">Amount</Text>
                    <Text className="text-green-500 font-bold text-lg">₹{selectedPayout.amount}</Text>
                  </View>
                  <View className="flex-row justify-between py-3 border-b border-slate-700">
                    <Text className="text-slate-400">Bank</Text>
                    <Text className="text-white font-medium">{selectedPayout.bankName}</Text>
                  </View>
                  <View className="flex-row justify-between py-3 border-b border-slate-700">
                    <Text className="text-slate-400">Account</Text>
                    <Text className="text-white font-medium">{selectedPayout.accountNumber}</Text>
                  </View>
                  <View className="flex-row justify-between py-3 border-b border-slate-700">
                    <Text className="text-slate-400">Status</Text>
                    <View
                      className="flex-row items-center px-3 py-1 rounded-full"
                      style={{ backgroundColor: STATUS_CONFIG[selectedPayout.status].bg }}
                    >
                      {STATUS_CONFIG[selectedPayout.status].icon}
                      <Text style={{ color: STATUS_CONFIG[selectedPayout.status].text }} className="font-medium ml-1">
                        {STATUS_CONFIG[selectedPayout.status].label}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between py-3">
                    <Text className="text-slate-400">Initiated</Text>
                    <Text className="text-white font-medium">
                      {new Date(selectedPayout.initiatedAt).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                <View className="flex-row gap-3 mt-6">
                  {selectedPayout.status === 'initiated' && (
                    <Pressable
                      onPress={() => handleProcessPayout(selectedPayout.id)}
                      className="flex-1 bg-blue-600 py-4 rounded-xl items-center"
                    >
                      <Text className="text-white font-semibold">Process</Text>
                    </Pressable>
                  )}
                  {selectedPayout.status === 'processing' && (
                    <>
                      <Pressable
                        onPress={() => handleCompletePayout(selectedPayout.id)}
                        className="flex-1 bg-green-600 py-4 rounded-xl items-center"
                      >
                        <Text className="text-white font-semibold">Complete</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleFailPayout(selectedPayout.id)}
                        className="flex-1 bg-red-600 py-4 rounded-xl items-center"
                      >
                        <Text className="text-white font-semibold">Mark Failed</Text>
                      </Pressable>
                    </>
                  )}
                  <Pressable
                    onPress={() => setSelectedPayout(null)}
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
