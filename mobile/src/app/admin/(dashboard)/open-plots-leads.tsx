import React, { useState, useMemo } from 'react';
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
  Clock,
  User,
  X,
  Download,
  MessageCircle,
  MapPin,
  Home,
  ShoppingBag,
  Tag,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  useOpenPlotsLeadsStore,
  type OpenPlotsLead,
  type OpenPlotsLeadStatus,
  type OpenPlotsIntent,
} from '@/lib/open-plots-leads-store';

const STATUS_COLORS: Record<OpenPlotsLeadStatus, string> = {
  'New': '#F59E0B',
  'Contacted': '#3B82F6',
  'Site Visit Scheduled': '#8B5CF6',
  'Negotiation': '#F97316',
  'Closed': '#22C55E',
  'Lost': '#64748B',
};

interface FilterState {
  search: string;
  status: OpenPlotsLeadStatus | 'all';
  intent: OpenPlotsIntent | 'all';
  priority: 'all' | 'High' | 'Normal';
  dateRange: string;
}

export default function OpenPlotsLeadsScreen() {
  const router = useRouter();
  const leads = useOpenPlotsLeadsStore((s) => s.leads);
  const updateLeadStatus = useOpenPlotsLeadsStore((s) => s.updateLeadStatus);
  const exportLeads = useOpenPlotsLeadsStore((s) => s.exportLeads);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    intent: 'all',
    priority: 'all',
    dateRange: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLead, setSelectedLead] = useState<OpenPlotsLead | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          lead.name.toLowerCase().includes(searchLower) ||
          lead.mobile.includes(searchLower) ||
          lead.id.toLowerCase().includes(searchLower) ||
          lead.location.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && lead.status !== filters.status) return false;

      // Intent filter
      if (filters.intent !== 'all' && lead.intent !== filters.intent) return false;

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

  const handleLeadPress = (lead: OpenPlotsLead) => {
    router.push({
      pathname: '/admin/open-plots-lead-details',
      params: { id: lead.id },
    } as any);
  };

  const handleStatusChange = (newStatus: OpenPlotsLeadStatus) => {
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
      title: 'Open Plots Leads Export',
    });
  };

  const renderLeadCard = ({ item: lead }: { item: OpenPlotsLead }) => {
    const intentIcon = lead.intent === 'buy' ? ShoppingBag : Tag;
    const intentColor = lead.intent === 'buy' ? '#3B82F6' : '#22C55E';

    return (
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
            <View className="flex-row items-center mb-1">
              {React.createElement(intentIcon, { size: 16, color: intentColor })}
              <Text className="text-white font-semibold text-base ml-2">
                {lead.name}
              </Text>
            </View>
            <Text className="text-slate-400 text-xs">{lead.id}</Text>
          </View>
          <View className="flex-row gap-2">
            {lead.priority === 'High' && (
              <View className="bg-red-500/20 px-2 py-1 rounded">
                <Text className="text-red-400 text-xs font-semibold">High Priority</Text>
              </View>
            )}
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
        </View>

        {/* Contact Info */}
        <View className="flex-row items-center gap-4 mb-3">
          <View className="flex-row items-center">
            <Phone size={12} color="#94A3B8" />
            <Text className="text-slate-300 text-sm ml-1">{lead.mobile}</Text>
          </View>
          <View className="flex-row items-center">
            <MapPin size={12} color="#94A3B8" />
            <Text className="text-slate-300 text-sm ml-1">{lead.location}</Text>
          </View>
        </View>

        {/* Details Row */}
        <View className="flex-row items-center gap-2 mb-3">
          <View className="bg-slate-700 px-2 py-1 rounded">
            <Text className="text-slate-300 text-xs capitalize">{lead.intent}</Text>
          </View>
          {lead.plotSize && (
            <View className="bg-slate-700 px-2 py-1 rounded">
              <Text className="text-slate-300 text-xs">{lead.plotSize}</Text>
            </View>
          )}
          {lead.budgetOrPrice && (
            <View className="bg-slate-700 px-2 py-1 rounded">
              <Text className="text-slate-300 text-xs">{lead.budgetOrPrice}</Text>
            </View>
          )}
        </View>

        {/* Site Visit Badge */}
        {lead.siteVisitRequired && (
          <View className="bg-blue-500/20 px-3 py-2 rounded-lg mb-3">
            <Text className="text-blue-400 text-xs font-medium">🏠 Site Visit Required</Text>
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
  };

  return (
    <View className="flex-1 bg-slate-900">
      {/* Search & Filters */}
      <View className="p-4 border-b border-slate-800">
        <View className="flex-row items-center gap-3">
          <View className="flex-1 flex-row items-center bg-slate-800 rounded-xl px-4 py-3">
            <Search size={18} color="#64748B" />
            <TextInput
              className="flex-1 ml-3 text-white text-base"
              placeholder="Search open plots leads..."
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
          {/* Intent Filters */}
          {([{value: 'all', label: 'All'}, {value: 'buy', label: 'Buy'}, {value: 'sell', label: 'Sell'}] as const).map((intent) => (
            <Pressable
              key={intent.value}
              onPress={() => setFilters((f) => ({ ...f, intent: intent.value }))}
              className={`px-3 py-1.5 rounded-full ${
                filters.intent === intent.value ? 'bg-blue-500' : 'bg-slate-800'
              }`}
            >
              <Text
                className={`text-sm ${
                  filters.intent === intent.value ? 'text-white' : 'text-slate-400'
                }`}
              >
                {intent.label}
              </Text>
            </Pressable>
          ))}

          {/* Status Filters */}
          {(['all', 'New', 'Contacted', 'Site Visit Scheduled'] as const).map((status) => (
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
            <Home size={48} color="#475569" />
            <Text className="text-slate-400 text-base mt-4">No open plots leads found</Text>
            <Text className="text-slate-500 text-sm mt-1">
              Leads will appear here when customers submit requests
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
                      intent: 'all',
                      priority: 'all',
                      dateRange: 'all',
                    })
                  }
                >
                  <Text className="text-orange-500">Clear All</Text>
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Priority */}
                <View className="mb-6">
                  <Text className="text-slate-400 text-sm mb-3">Priority</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {['all', 'High', 'Normal'].map((priority) => (
                      <Pressable
                        key={priority}
                        onPress={() => setFilters((f) => ({ ...f, priority: priority as any }))}
                        className={`px-4 py-2 rounded-lg ${
                          filters.priority === priority ? 'bg-orange-500' : 'bg-slate-700'
                        }`}
                      >
                        <Text
                          className={
                            filters.priority === priority ? 'text-white' : 'text-slate-300'
                          }
                        >
                          {priority === 'all' ? 'All Priorities' : priority}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

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
                Quick Actions - {selectedLead?.name}
              </Text>

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
                <User size={20} color="#94A3B8" />
                <Text className="text-white ml-3">View Details</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
