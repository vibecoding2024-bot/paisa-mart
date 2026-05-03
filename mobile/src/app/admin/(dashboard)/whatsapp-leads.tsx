import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  FlatList,
  Modal,
  Share,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Search,
  Filter,
  ChevronDown,
  Phone,
  Mail,
  Clock,
  User,
  X,
  Calendar,
  Download,
  MessageCircle,
  CheckCircle,
  MoreVertical,
} from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import {
  useWhatsAppLeadsStore,
  type WhatsAppLead,
  type WhatsAppLeadStatus,
} from '@/lib/whatsapp-leads-store';

const STATUS_COLORS: Record<WhatsAppLeadStatus, string> = {
  'New': '#F59E0B',
  'Contacted': '#3B82F6',
  'Qualified': '#8B5CF6',
  'Converted': '#22C55E',
  'Closed': '#64748B',
};

const CATEGORY_LABELS: Record<string, string> = {
  'home-loans': 'Home Loan',
  'personal-loans': 'Personal Loan',
  'vehicle-loans': 'Vehicle Loan',
  'business-loans': 'Business Loan',
  'life-insurance': 'Life Insurance',
  'health-insurance': 'Health Insurance',
  'motor-insurance': 'Motor Insurance',
  'gold-loans': 'Gold Loan',
};

interface FilterState {
  search: string;
  status: WhatsAppLeadStatus | 'all';
  product: string;
  dateRange: string;
}

export default function WhatsAppLeadsScreen() {
  const router = useRouter();
  const leads = useWhatsAppLeadsStore((s) => s.leads);
  const updateLeadStatus = useWhatsAppLeadsStore((s) => s.updateLeadStatus);
  const assignLeadTo = useWhatsAppLeadsStore((s) => s.assignLeadTo);
  const exportLeads = useWhatsAppLeadsStore((s) => s.exportLeads);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    product: 'all',
    dateRange: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLead, setSelectedLead] = useState<WhatsAppLead | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          lead.customerName.toLowerCase().includes(searchLower) ||
          lead.mobile.includes(searchLower) ||
          lead.id.toLowerCase().includes(searchLower) ||
          lead.bankName.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && lead.status !== filters.status) return false;

      // Product filter
      if (filters.product !== 'all' && lead.productCategory !== filters.product)
        return false;

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
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const handleLeadPress = (lead: WhatsAppLead) => {
    router.push({
      pathname: '/admin/whatsapp-lead-details',
      params: { id: lead.id },
    } as any);
  };

  const handleStatusChange = (newStatus: WhatsAppLeadStatus) => {
    if (selectedLead) {
      updateLeadStatus(selectedLead.id, newStatus);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowStatusModal(false);
    setShowActions(false);
  };

  const handleCallCustomer = (mobile: string) => {
    Linking.openURL(`tel:${mobile}`);
    setShowActions(false);
  };

  const handleWhatsAppCustomer = (mobile: string) => {
    Linking.openURL(`whatsapp://send?phone=${mobile}`);
    setShowActions(false);
  };

  const handleExport = async () => {
    const csvData = exportLeads(filteredLeads);
    await Share.share({
      message: csvData,
      title: 'WhatsApp Leads Export',
    });
  };

  const renderLeadCard = ({ item: lead }: { item: WhatsAppLead }) => (
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
          <Text className="text-white font-semibold text-base">
            {lead.customerName}
          </Text>
          <Text className="text-slate-400 text-xs mt-1">{lead.id}</Text>
        </View>
        <View
          className="px-2 py-1 rounded-full"
          style={{ backgroundColor: STATUS_COLORS[lead.status] + '20' }}
        >
          <Text
            style={{ color: STATUS_COLORS[lead.status], fontSize: 11, fontWeight: '500' }}
          >
            {lead.status}
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
          <MessageCircle size={12} color="#94A3B8" />
          <Text className="text-slate-400 text-xs ml-1">WhatsApp Share</Text>
        </View>
      </View>

      {/* Product & Bank */}
      <View className="flex-row items-center gap-2 mb-3">
        <View className="bg-slate-700 px-2 py-1 rounded">
          <Text className="text-slate-300 text-xs">
            {CATEGORY_LABELS[lead.productCategory] || lead.productCategory}
          </Text>
        </View>
        <View className="bg-slate-700 px-2 py-1 rounded">
          <Text className="text-slate-300 text-xs">{lead.bankName}</Text>
        </View>
      </View>

      {/* Requirement Details */}
      {lead.loanAmount && (
        <View className="bg-slate-700/50 px-3 py-2 rounded-lg mb-3">
          <Text className="text-slate-400 text-xs">Loan Amount</Text>
          <Text className="text-white text-sm">{lead.loanAmount}</Text>
        </View>
      )}

      {/* Footer */}
      <View className="flex-row items-center justify-between pt-2 border-t border-slate-700">
        <View className="flex-row items-center">
          <Clock size={12} color="#64748B" />
          <Text className="text-slate-500 text-xs ml-1">
            {formatDate(lead.createdAt)} • {formatTime(lead.createdAt)}
          </Text>
        </View>
        {lead.assignedTo && (
          <View className="flex-row items-center">
            <User size={12} color="#64748B" />
            <Text className="text-slate-500 text-xs ml-1">{lead.assignedTo}</Text>
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
              placeholder="Search WhatsApp leads..."
              placeholderTextColor="#64748B"
              value={filters.search}
              onChangeText={(text) => setFilters((f) => ({ ...f, search: text }))}
              autoCorrect={false}
            />
            {filters.search ? (
              <Pressable onPress={() => setFilters((f) => ({ ...f, search: '' }))}>
                <X size={18} color="#64748B" />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={() => setShowFilters(true)}
            className={`w-12 h-12 rounded-xl items-center justify-center ${
              Object.values(filters).some((v) => v !== 'all' && v !== '')
                ? 'bg-orange-500'
                : 'bg-slate-800'
            }`}
          >
            <Filter size={20} color="#fff" />
          </Pressable>
          <Pressable
            onPress={handleExport}
            className="w-12 h-12 rounded-xl items-center justify-center bg-slate-800"
          >
            <Download size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Quick Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerStyle={{ gap: 8 }}
        >
          {(['all', 'New', 'Contacted', 'Qualified', 'Converted', 'Closed'] as (
            | WhatsAppLeadStatus
            | 'all'
          )[]).map((status) => (
            <Pressable
              key={status}
              onPress={() => setFilters((f) => ({ ...f, status }))}
              className={`px-3 py-1.5 rounded-full ${
                filters.status === status ? 'bg-orange-500' : 'bg-slate-800'
              }`}
            >
              <Text
                className={`text-sm ${
                  filters.status === status ? 'text-white' : 'text-slate-400'
                }`}
              >
                {status === 'all' ? 'All Status' : status}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Results Count */}
      <View className="px-4 py-2 flex-row items-center justify-between">
        <Text className="text-slate-400 text-sm">{filteredLeads.length} leads found</Text>
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
            <MessageCircle size={48} color="#475569" />
            <Text className="text-slate-400 text-base mt-4">No WhatsApp leads found</Text>
            <Text className="text-slate-500 text-sm mt-1">
              Leads will appear here when customers share via WhatsApp
            </Text>
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
                  onPress={() =>
                    setFilters({
                      search: '',
                      status: 'all',
                      product: 'all',
                      dateRange: 'all',
                    })
                  }
                >
                  <Text className="text-orange-500">Clear All</Text>
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
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
                        onPress={() => setFilters((f) => ({ ...f, dateRange: item.value }))}
                        className={`px-4 py-2 rounded-lg ${
                          filters.dateRange === item.value ? 'bg-orange-500' : 'bg-slate-700'
                        }`}
                      >
                        <Text
                          className={
                            filters.dateRange === item.value ? 'text-white' : 'text-slate-300'
                          }
                        >
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
                      onPress={() => setFilters((f) => ({ ...f, product: 'all' }))}
                      className={`px-4 py-2 rounded-lg ${
                        filters.product === 'all' ? 'bg-orange-500' : 'bg-slate-700'
                      }`}
                    >
                      <Text
                        className={filters.product === 'all' ? 'text-white' : 'text-slate-300'}
                      >
                        All Products
                      </Text>
                    </Pressable>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <Pressable
                        key={key}
                        onPress={() => setFilters((f) => ({ ...f, product: key }))}
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
                Quick Actions - {selectedLead?.customerName}
              </Text>

              <Pressable
                onPress={() => setShowStatusModal(true)}
                className="flex-row items-center bg-slate-700 rounded-xl p-4 mb-3"
              >
                <Calendar size={20} color="#94A3B8" />
                <Text className="text-white ml-3">Change Status</Text>
              </Pressable>

              <Pressable
                onPress={() => selectedLead && handleCallCustomer(selectedLead.mobile)}
                className="flex-row items-center bg-slate-700 rounded-xl p-4 mb-3"
              >
                <Phone size={20} color="#94A3B8" />
                <Text className="text-white ml-3">Call Customer</Text>
              </Pressable>

              <Pressable
                onPress={() => selectedLead && handleWhatsAppCustomer(selectedLead.mobile)}
                className="flex-row items-center bg-slate-700 rounded-xl p-4 mb-3"
              >
                <MessageCircle size={20} color="#94A3B8" />
                <Text className="text-white ml-3">Send WhatsApp Message</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setShowActions(false);
                  if (selectedLead) handleLeadPress(selectedLead);
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

      {/* Status Change Modal */}
      <Modal visible={showStatusModal} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowStatusModal(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-slate-800 rounded-t-3xl p-6 max-h-[70%]">
              <Text className="text-white text-lg font-semibold mb-4">Select New Status</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {(['New', 'Contacted', 'Qualified', 'Converted', 'Closed'] as WhatsAppLeadStatus[]).map(
                  (status) => (
                    <Pressable
                      key={status}
                      onPress={() => handleStatusChange(status)}
                      className="flex-row items-center p-4 border-b border-slate-700"
                    >
                      <View
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: STATUS_COLORS[status] }}
                      />
                      <Text className="text-white">{status}</Text>
                    </Pressable>
                  )
                )}
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
