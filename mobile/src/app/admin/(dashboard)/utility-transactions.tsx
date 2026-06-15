import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  FlatList,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Search,
  ShieldOff,
  CreditCard,
  Smartphone,
  Plane,
  Clock,
  User,
  Phone,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import {
  useUtilityTransactionStore,
  type UtilityTransaction,
  type UtilityModule,
  type UtilityTxStatus,
  UTILITY_MODULE_LABELS,
} from '@/lib/utility-transaction-store';

const MODULE_ICONS: Record<UtilityModule, React.ReactNode> = {
  'cash-cards': <CreditCard size={16} color="#3B82F6" />,
  'recharge-bills': <Smartphone size={16} color="#8B5CF6" />,
  'travel-tickets': <Plane size={16} color="#EC4899" />,
};

const MODULE_COLORS: Record<UtilityModule, { bg: string; text: string; border: string }> = {
  'cash-cards': { bg: '#1E3A5F', text: '#93C5FD', border: '#3B82F6' },
  'recharge-bills': { bg: '#2E1065', text: '#C4B5FD', border: '#8B5CF6' },
  'travel-tickets': { bg: '#500724', text: '#FBCFE8', border: '#EC4899' },
};

const STATUS_CONFIG: Record<UtilityTxStatus, { color: string; bg: string; icon: React.ReactNode }> = {
  'Completed': { color: '#22C55E', bg: '#052E16', icon: <CheckCircle size={14} color="#22C55E" /> },
  'Pending': { color: '#F59E0B', bg: '#451A03', icon: <Clock size={14} color="#F59E0B" /> },
  'Failed': { color: '#EF4444', bg: '#450A0A', icon: <XCircle size={14} color="#EF4444" /> },
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

type FilterModule = 'all' | UtilityModule;
type FilterStatus = 'all' | UtilityTxStatus;

function TransactionCard({ tx, index }: { tx: UtilityTransaction; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const modColor = MODULE_COLORS[tx.module];
  const statusCfg = STATUS_CONFIG[tx.status];

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setExpanded(!expanded);
        }}
        style={{
          backgroundColor: '#1E293B',
          borderRadius: 14,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: '#334155',
          overflow: 'hidden',
        }}
      >
        {/* Main row */}
        <View style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {/* Module icon badge */}
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: modColor.bg,
              borderWidth: 1,
              borderColor: modColor.border + '60',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {MODULE_ICONS[tx.module]}
          </View>

          {/* Main info */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <Text style={{ color: '#F1F5F9', fontWeight: '600', fontSize: 14 }}>
                {tx.user_name}
              </Text>
              <View
                style={{
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                  backgroundColor: modColor.bg,
                  borderWidth: 1,
                  borderColor: modColor.border + '50',
                }}
              >
                <Text style={{ color: modColor.text, fontSize: 10, fontWeight: '600' }}>
                  {UTILITY_MODULE_LABELS[tx.module].split(' ').slice(0, 2).join(' ')}
                </Text>
              </View>
            </View>
            <Text style={{ color: '#94A3B8', fontSize: 12 }}>{tx.mobile}</Text>
          </View>

          {/* Right side */}
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text style={{ color: '#F1F5F9', fontWeight: '700', fontSize: 15 }}>
              {tx.transaction_amount}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: 6,
                backgroundColor: statusCfg.bg,
              }}
            >
              {statusCfg.icon}
              <Text style={{ color: statusCfg.color, fontSize: 11, fontWeight: '600' }}>
                {tx.status}
              </Text>
            </View>
          </View>

          {expanded ? (
            <ChevronUp size={16} color="#64748B" />
          ) : (
            <ChevronDown size={16} color="#64748B" />
          )}
        </View>

        {/* Expanded details */}
        {expanded && (
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: '#334155',
              padding: 14,
              gap: 10,
            }}
          >
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: '#0F172A', borderRadius: 10, padding: 10 }}>
                <Text style={{ color: '#64748B', fontSize: 10, fontWeight: '600', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>Module</Text>
                <Text style={{ color: '#CBD5E1', fontSize: 13 }}>{UTILITY_MODULE_LABELS[tx.module]}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#0F172A', borderRadius: 10, padding: 10 }}>
                <Text style={{ color: '#64748B', fontSize: 10, fontWeight: '600', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>Amount</Text>
                <Text style={{ color: '#CBD5E1', fontSize: 13 }}>{tx.transaction_amount}</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: '#0F172A', borderRadius: 10, padding: 10 }}>
                <Text style={{ color: '#64748B', fontSize: 10, fontWeight: '600', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>Timestamp</Text>
                <Text style={{ color: '#CBD5E1', fontSize: 12 }}>{formatTimestamp(tx.timestamp)}</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#0F172A', borderRadius: 10, padding: 10 }}>
                <Text style={{ color: '#64748B', fontSize: 10, fontWeight: '600', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>Payout</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Text style={{ color: '#EF4444', fontSize: 15, fontWeight: '700' }}>₹0</Text>
                  <View style={{ backgroundColor: '#450A0A', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                    <Text style={{ color: '#FCA5A5', fontSize: 9, fontWeight: '700' }}>LOCKED</Text>
                  </View>
                </View>
                <Text style={{ color: '#64748B', fontSize: 10, marginTop: 1 }}>Commission: {tx.commission}</Text>
              </View>
            </View>

            {/* Safety note */}
            <View style={{ backgroundColor: '#1C1917', borderRadius: 8, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#292524' }}>
              <ShieldOff size={14} color="#F97316" />
              <Text style={{ color: '#78716C', fontSize: 11, flex: 1 }}>
                This transaction is permanently excluded from earnings and payout calculations.
              </Text>
            </View>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const ALL_MODULES: { label: string; value: FilterModule }[] = [
  { label: 'All Modules', value: 'all' },
  { label: 'Cash on CC', value: 'cash-cards' },
  { label: 'Recharge', value: 'recharge-bills' },
  { label: 'Travel', value: 'travel-tickets' },
];

const ALL_STATUSES: { label: string; value: FilterStatus }[] = [
  { label: 'All Status', value: 'all' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Failed', value: 'Failed' },
];

export default function UtilityTransactionsScreen() {
  const transactions = useUtilityTransactionStore((s) => s.transactions);

  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState<FilterModule>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  const filtered = useMemo(() => {
    let list = transactions;
    if (moduleFilter !== 'all') list = list.filter((t) => t.module === moduleFilter);
    if (statusFilter !== 'all') list = list.filter((t) => t.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.user_name.toLowerCase().includes(q) ||
          t.mobile.includes(q) ||
          UTILITY_MODULE_LABELS[t.module].toLowerCase().includes(q)
      );
    }
    return list;
  }, [transactions, moduleFilter, statusFilter, search]);

  const stats = useMemo(() => ({
    total: transactions.length,
    completed: transactions.filter((t) => t.status === 'Completed').length,
    pending: transactions.filter((t) => t.status === 'Pending').length,
  }), [transactions]);

  return (
    <ScrollView keyboardShouldPersistTaps="handled"
      className="flex-1 bg-slate-900"
      showsVerticalScrollIndicator={false}
      stickyHeaderIndices={[0]}
    >
      {/* Sticky header with search */}
      <View style={{ backgroundColor: '#0F172A', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 }}>
        <Animated.View entering={FadeInDown.delay(30).springify()}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <View style={{ width: 36, height: 36, backgroundColor: '#EF4444', opacity: 0.9, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
              <ShieldOff size={18} color="#fff" />
            </View>
            <View>
              <Text style={{ color: '#F1F5F9', fontWeight: '700', fontSize: 20 }}>Utility Transactions</Text>
              <Text style={{ color: '#64748B', fontSize: 13 }}>Cash on CC · Recharge · Travel — Zero Payout</Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            {[
              { label: 'Total', value: stats.total, color: '#3B82F6' },
              { label: 'Completed', value: stats.completed, color: '#22C55E' },
              { label: 'Pending', value: stats.pending, color: '#F59E0B' },
              { label: 'Total Payout', value: '₹0', color: '#EF4444' },
            ].map((s) => (
              <View
                key={s.label}
                style={{ flex: 1, backgroundColor: '#1E293B', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#334155' }}
              >
                <Text style={{ color: s.color, fontWeight: '700', fontSize: 17 }}>{s.value}</Text>
                <Text style={{ color: '#64748B', fontSize: 10, marginTop: 2 }}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Search */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 12, paddingHorizontal: 12, marginBottom: 10, borderWidth: 1, borderColor: '#334155' }}>
            <Search size={16} color="#64748B" />
            <TextInput
              placeholder="Search by name or mobile..."
              placeholderTextColor="#475569"
              value={search}
              onChangeText={setSearch}
              style={{ flex: 1, paddingVertical: 10, paddingLeft: 8, color: '#F1F5F9', fontSize: 14 }}
            />
          </View>

          {/* Module filter chips */}
          <ScrollView keyboardShouldPersistTaps="handled" horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
            {ALL_MODULES.map((m) => (
              <Pressable
                key={m.value}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setModuleFilter(m.value);
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: moduleFilter === m.value ? '#3B82F6' : '#1E293B',
                  borderWidth: 1,
                  borderColor: moduleFilter === m.value ? '#3B82F6' : '#334155',
                }}
              >
                <Text style={{ color: moduleFilter === m.value ? '#fff' : '#94A3B8', fontSize: 12, fontWeight: '600' }}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
            <View style={{ width: 1, backgroundColor: '#334155', marginHorizontal: 2 }} />
            {ALL_STATUSES.filter(s => s.value !== 'all').map((s) => (
              <Pressable
                key={s.value}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setStatusFilter(statusFilter === s.value ? 'all' : s.value as FilterStatus);
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: statusFilter === s.value ? STATUS_CONFIG[s.value as UtilityTxStatus].bg : '#1E293B',
                  borderWidth: 1,
                  borderColor: statusFilter === s.value ? STATUS_CONFIG[s.value as UtilityTxStatus].color + '80' : '#334155',
                }}
              >
                <Text style={{ color: statusFilter === s.value ? STATUS_CONFIG[s.value as UtilityTxStatus].color : '#94A3B8', fontSize: 12, fontWeight: '600' }}>
                  {s.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      </View>

      {/* Transaction list */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 }}>
        {filtered.length === 0 ? (
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={{ backgroundColor: '#1E293B', borderRadius: 14, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#334155' }}
          >
            <AlertCircle size={32} color="#475569" />
            <Text style={{ color: '#94A3B8', fontWeight: '600', fontSize: 15, marginTop: 12 }}>No Transactions Found</Text>
            <Text style={{ color: '#475569', fontSize: 13, marginTop: 4, textAlign: 'center' }}>
              No utility transactions match your current filters.
            </Text>
          </Animated.View>
        ) : (
          filtered.map((tx, index) => (
            <TransactionCard key={tx.id} tx={tx} index={index} />
          ))
        )}

        {/* Zero-payout lock notice */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={{
            backgroundColor: '#1C1917',
            borderRadius: 12,
            padding: 14,
            marginTop: 8,
            borderWidth: 1,
            borderColor: '#292524',
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <ShieldOff size={16} color="#F97316" style={{ marginTop: 1 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#D6D3D1', fontWeight: '600', fontSize: 12, marginBottom: 3 }}>
              Zero-Payout Safety Lock Active
            </Text>
            <Text style={{ color: '#78716C', fontSize: 11, lineHeight: 17 }}>
              Cash on Credit Card, Recharge & Pay Bills, and Travel & Tickets are permanently configured at 0% commission and ₹0 payout. This override cannot be changed by global commission settings.
            </Text>
          </View>
        </Animated.View>
      </View>
    </ScrollView>
  );
}
