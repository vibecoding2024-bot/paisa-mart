import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Search,
  Filter,
  ChevronDown,
  MoreVertical,
  Phone,
  Mail,
  Clock,
  User,
  X,
  Flag,
  Calendar,
} from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import {
  useAdminStore,
  Lead,
  LeadStage,
  ProductCategory,
  STAGE_LABELS,
  STAGE_COLORS,
  PRODUCT_LABELS,
} from '@/lib/admin-store';

const OUTCOME_COLORS = {
  pending: '#F59E0B',
  approved: '#22C55E',
  rejected: '#EF4444',
  disbursed: '#14B8A6',
  closed: '#64748B',
};

const PRIORITY_COLORS = {
  low: '#64748B',
  medium: '#F59E0B',
  high: '#EF4444',
};

interface FilterState {
  search: string;
  stage: LeadStage | 'all';
  product: ProductCategory | 'all';
  outcome: string;
  priority: string;
  dateRange: string;
}

export default function LeadsScreen() {
  const router = useRouter();
  const leads = useAdminStore(s => s.leads);
  const currentAdmin = useAdminStore(s => s.currentAdmin);
  const updateLeadStage = useAdminStore(s => s.updateLeadStage);
  const assignLead = useAdminStore(s => s.assignLead);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    stage: 'all',
    product: 'all',
    outcome: 'all',
    priority: 'all',
    dateRange: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          lead.userName.toLowerCase().includes(searchLower) ||
          lead.mobile.includes(searchLower) ||
          lead.id.toLowerCase().includes(searchLower) ||
          lead.provider.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Stage filter
      if (filters.stage !== 'all' && lead.stage !== filters.stage) return false;

      // Product filter
      if (filters.product !== 'all' && lead.productType !== filters.product) return false;

      // Outcome filter
      if (filters.outcome !== 'all' && lead.outcome !== filters.outcome) return false;

      // Priority filter
      if (filters.priority !== 'all' && lead.priority !== filters.priority) return false;

      // Date range filter
      if (filters.dateRange !== 'all') {
        const now = new Date();
        const leadDate = new Date(lead.createdAt);
        const daysDiff = (now.getTime() - leadDate.getTime()) / (1000 * 60 * 60 * 24);

        if (filters.dateRange === 'today' && daysDiff > 1) return false;
        if (filters.dateRange === '7days' && daysDiff > 7) return false;
        if (filters.dateRange === '30days' && daysDiff > 30) return false;
      }

      return true;
    });
  }, [leads, filters]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const handleLeadPress = (lead: Lead) => {
    router.push({ pathname: '/admin/lead-details', params: { id: lead.id } } as any);
  };

  const handleStageChange = (newStage: LeadStage) => {
    if (selectedLead && currentAdmin?.role !== 'viewer') {
      updateLeadStage(selectedLead.id, newStage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowStageModal(false);
    setShowActions(false);
  };

  const renderLeadCard = ({ item: lead }: { item: Lead }) => (
    <Pressable
      onPress={() => handleLeadPress(lead)}
      onLongPress={() => {
        setSelectedLead(lead);
        setShowActions(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }}
      className="bg-slate-800 rounded-xl p-4 mb-3"
    >
      {/* Header Row */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-white font-semibold text-base">{lead.userName}</Text>
            {lead.priority === 'high' && (
              <View className="ml-2 px-2 py-0.5 bg-red-500/20 rounded">
                <Flag size={10} color="#EF4444" />
              </View>
            )}
          </View>
          <Text className="text-slate-400 text-xs mt-1">{lead.id}</Text>
        </View>
        <View
          className="px-2 py-1 rounded-full"
          style={{ backgroundColor: STAGE_COLORS[lead.stage] + '20' }}
        >
          <Text style={{ color: STAGE_COLORS[lead.stage], fontSize: 11, fontWeight: '500' }}>
            {STAGE_LABELS[lead.stage]}
          </Text>
        </View>
      </View>

      {/* Contact Info */}
      <View className="flex-row items-center gap-4 mb-3">
        <View className="flex-row items-center">
          <Phone size={12} color="#94A3B8" />
          <Text className="text-slate-300 text-sm ml-1">{lead.mobile}</Text>
        </View>
        <View className="flex-row items-center">
          <Mail size={12} color="#94A3B8" />
          <Text className="text-slate-400 text-xs ml-1">{lead.email?.split('@')[0]}...</Text>
        </View>
      </View>

      {/* Product & Provider */}
      <View className="flex-row items-center gap-2 mb-3">
        <View className="bg-slate-700 px-2 py-1 rounded">
          <Text className="text-slate-300 text-xs">{PRODUCT_LABELS[lead.productType]}</Text>
        </View>
        <View className="bg-slate-700 px-2 py-1 rounded">
          <Text className="text-slate-300 text-xs">{lead.provider}</Text>
        </View>
        <View
          className="px-2 py-1 rounded"
          style={{ backgroundColor: OUTCOME_COLORS[lead.outcome] + '20' }}
        >
          <Text
            className="text-xs capitalize"
            style={{ color: OUTCOME_COLORS[lead.outcome] }}
          >
            {lead.outcome}
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View className="flex-row items-center justify-between pt-2 border-t border-slate-700">
        <View className="flex-row items-center">
          <Clock size={12} color="#64748B" />
          <Text className="text-slate-500 text-xs ml-1">
            {formatDate(lead.createdAt)} • {formatTime(lead.createdAt)}
          </Text>
        </View>
        {lead.assignedOwner && (
          <View className="flex-row items-center">
            <User size={12} color="#64748B" />
            <Text className="text-slate-500 text-xs ml-1">{lead.assignedOwner}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-slate-900">
      {/* Search & Filters */}
      <View className="p-4 border-b border-slate-800">
        <View className="flex-row items-center gap-3">
          <View className="flex-1 flex-row items-center bg-slate-800 rounded-xl px-4 py-3">
            <Search size={18} color="#64748B" />
            <TextInput
              className="flex-1 ml-3 text-white text-base"
              placeholder="Search leads..."
              placeholderTextColor="#64748B"
              value={filters.search}
              onChangeText={(text) => setFilters(f => ({ ...f, search: text }))}
              autoCorrect={false}
            />
            {filters.search ? (
              <Pressable onPress={() => setFilters(f => ({ ...f, search: '' }))}>
                <X size={18} color="#64748B" />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={() => setShowFilters(true)}
            className={`w-12 h-12 rounded-xl items-center justify-center ${
              Object.values(filters).some(v => v !== 'all' && v !== '') ? 'bg-orange-500' : 'bg-slate-800'
            }`}
          >
            <Filter size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Quick Filters */}
        <ScrollView keyboardShouldPersistTaps="handled"
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerStyle={{ gap: 8 }}
        >
          {(['all', 'new', 'kyc_pending', 'submitted', 'approved', 'rejected'] as (LeadStage | 'all')[]).map((stage) => (
            <Pressable
              key={stage}
              onPress={() => setFilters(f => ({ ...f, stage }))}
              className={`px-3 py-1.5 rounded-full ${
                filters.stage === stage ? 'bg-orange-500' : 'bg-slate-800'
              }`}
            >
              <Text className={`text-sm ${filters.stage === stage ? 'text-white' : 'text-slate-400'}`}>
                {stage === 'all' ? 'All Stages' : STAGE_LABELS[stage]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Results Count */}
      <View className="px-4 py-2 flex-row items-center justify-between">
        <Text className="text-slate-400 text-sm">
          {filteredLeads.length} leads found
        </Text>
        <Pressable className="flex-row items-center">
          <Text className="text-slate-400 text-sm mr-1">Sort by: Latest</Text>
          <ChevronDown size={14} color="#94A3B8" />
        </Pressable>
      </View>

      {/* Leads List */}
      <FlatList
        data={filteredLeads}
        keyExtractor={(item) => item.id}
        renderItem={renderLeadCard}
        contentContainerStyle={{ padding: 16, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Text className="text-slate-400 text-base">No leads found</Text>
            <Text className="text-slate-500 text-sm mt-1">Try adjusting your filters</Text>
          </View>
        }
      />

      {/* Filter Modal */}
      <Modal visible={showFilters} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowFilters(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-slate-800 rounded-t-3xl p-6 max-h-[80%]">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-semibold">Filters</Text>
                <Pressable
                  onPress={() => setFilters({
                    search: '',
                    stage: 'all',
                    product: 'all',
                    outcome: 'all',
                    priority: 'all',
                    dateRange: 'all',
                  })}
                >
                  <Text className="text-orange-500">Clear All</Text>
                </Pressable>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {/* Date Range */}
                <View className="mb-6">
                  <Text className="text-slate-400 text-sm mb-3">Date Range</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {[
                      { value: 'all', label: 'All Time' },
                      { value: 'today', label: 'Today' },
                      { value: '7days', label: 'Last 7 Days' },
                      { value: '30days', label: 'Last 30 Days' },
                    ].map((item) => (
                      <Pressable
                        key={item.value}
                        onPress={() => setFilters(f => ({ ...f, dateRange: item.value }))}
                        className={`px-4 py-2 rounded-lg ${
                          filters.dateRange === item.value ? 'bg-orange-500' : 'bg-slate-700'
                        }`}
                      >
                        <Text className={filters.dateRange === item.value ? 'text-white' : 'text-slate-300'}>
                          {item.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Product Type */}
                <View className="mb-6">
                  <Text className="text-slate-400 text-sm mb-3">Product Type</Text>
                  <View className="flex-row flex-wrap gap-2">
                    <Pressable
                      onPress={() => setFilters(f => ({ ...f, product: 'all' }))}
                      className={`px-4 py-2 rounded-lg ${
                        filters.product === 'all' ? 'bg-orange-500' : 'bg-slate-700'
                      }`}
                    >
                      <Text className={filters.product === 'all' ? 'text-white' : 'text-slate-300'}>
                        All Products
                      </Text>
                    </Pressable>
                    {Object.entries(PRODUCT_LABELS).slice(0, 6).map(([key, label]) => (
                      <Pressable
                        key={key}
                        onPress={() => setFilters(f => ({ ...f, product: key as ProductCategory }))}
                        className={`px-4 py-2 rounded-lg ${
                          filters.product === key ? 'bg-orange-500' : 'bg-slate-700'
                        }`}
                      >
                        <Text className={filters.product === key ? 'text-white' : 'text-slate-300'}>
                          {label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Outcome */}
                <View className="mb-6">
                  <Text className="text-slate-400 text-sm mb-3">Outcome</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {['all', 'pending', 'approved', 'rejected', 'disbursed', 'closed'].map((outcome) => (
                      <Pressable
                        key={outcome}
                        onPress={() => setFilters(f => ({ ...f, outcome }))}
                        className={`px-4 py-2 rounded-lg ${
                          filters.outcome === outcome ? 'bg-orange-500' : 'bg-slate-700'
                        }`}
                      >
                        <Text className={`capitalize ${filters.outcome === outcome ? 'text-white' : 'text-slate-300'}`}>
                          {outcome === 'all' ? 'All Outcomes' : outcome}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Priority */}
                <View className="mb-6">
                  <Text className="text-slate-400 text-sm mb-3">Priority</Text>
                  <View className="flex-row gap-2">
                    {['all', 'high', 'medium', 'low'].map((priority) => (
                      <Pressable
                        key={priority}
                        onPress={() => setFilters(f => ({ ...f, priority }))}
                        className={`px-4 py-2 rounded-lg ${
                          filters.priority === priority ? 'bg-orange-500' : 'bg-slate-700'
                        }`}
                      >
                        <Text className={`capitalize ${filters.priority === priority ? 'text-white' : 'text-slate-300'}`}>
                          {priority === 'all' ? 'All' : priority}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <Pressable
                onPress={() => setShowFilters(false)}
                className="bg-orange-500 rounded-xl py-4 mt-4"
              >
                <Text className="text-white text-center font-semibold">Apply Filters</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Actions Modal */}
      <Modal visible={showActions} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowActions(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-slate-800 rounded-t-3xl p-6">
              <Text className="text-white text-lg font-semibold mb-4">
                Quick Actions - {selectedLead?.userName}
              </Text>

              <Pressable
                onPress={() => setShowStageModal(true)}
                className="flex-row items-center bg-slate-700 rounded-xl p-4 mb-3"
              >
                <Calendar size={20} color="#94A3B8" />
                <Text className="text-white ml-3">Change Stage</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (selectedLead) {
                    assignLead(selectedLead.id, currentAdmin?.name || 'Admin');
                    setShowActions(false);
                  }
                }}
                className="flex-row items-center bg-slate-700 rounded-xl p-4 mb-3"
              >
                <User size={20} color="#94A3B8" />
                <Text className="text-white ml-3">Assign to Me</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setShowActions(false);
                  if (selectedLead) {
                    router.push({ pathname: '/admin/lead-details', params: { id: selectedLead.id } } as any);
                  }
                }}
                className="flex-row items-center bg-slate-700 rounded-xl p-4"
              >
                <MoreVertical size={20} color="#94A3B8" />
                <Text className="text-white ml-3">View Details</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Stage Change Modal */}
      <Modal visible={showStageModal} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowStageModal(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-slate-800 rounded-t-3xl p-6 max-h-[70%]">
              <Text className="text-white text-lg font-semibold mb-4">Select New Stage</Text>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {Object.entries(STAGE_LABELS).map(([stage, label]) => (
                  <Pressable
                    key={stage}
                    onPress={() => handleStageChange(stage as LeadStage)}
                    className="flex-row items-center p-4 border-b border-slate-700"
                  >
                    <View
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: STAGE_COLORS[stage as LeadStage] }}
                    />
                    <Text className="text-white">{label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
