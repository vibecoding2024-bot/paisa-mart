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
  Car,
  Calendar,
} from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import {
  useVehicleInsuranceLeadsStore,
  type VehicleInsuranceLead,
  type VehicleInsuranceLeadStatus,
} from '@/lib/vehicle-insurance-leads-store';

const STATUS_COLORS: Record<VehicleInsuranceLeadStatus, string> = {
  'New': '#F59E0B',
  'Contacted': '#3B82F6',
  'Quote Sent': '#8B5CF6',
  'Policy Issued': '#22C55E',
  'Closed': '#64748B',
  'Lost': '#EF4444',
};

interface FilterState {
  search: string;
  status: VehicleInsuranceLeadStatus | 'all';
  category: string;
  dateRange: string;
}

export default function VehicleInsuranceLeadsScreen() {
  const router = useRouter();
  const leads = useVehicleInsuranceLeadsStore((s) => s.leads);
  const updateLeadStatus = useVehicleInsuranceLeadsStore((s) => s.updateLeadStatus);
  const exportLeads = useVehicleInsuranceLeadsStore((s) => s.exportLeads);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    category: 'all',
    dateRange: 'all',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLead, setSelectedLead] = useState<VehicleInsuranceLead | null>(null);
  const [showActions, setShowActions] = useState(false);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          lead.ownerName.toLowerCase().includes(searchLower) ||
          lead.mobile.includes(searchLower) ||
          lead.id.toLowerCase().includes(searchLower) ||
          lead.vehicleNumber.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && lead.status !== filters.status) return false;

      // Category filter
      if (filters.category !== 'all' && lead.vehicleCategory !== filters.category)
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

  const handleLeadPress = (lead: VehicleInsuranceLead) => {
    router.push({
      pathname: '/admin/vehicle-insurance-lead-details',
      params: { id: lead.id },
    } as any);
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
      title: 'Vehicle Insurance Leads Export',
    });
  };

  const renderLeadCard = ({ item: lead }: { item: VehicleInsuranceLead }) => (
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
          <Text className="text-white font-semibold text-base mb-1">
            {lead.ownerName}
          </Text>
          <Text className="text-slate-400 text-xs">{lead.id}</Text>
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
          <Car size={12} color="#94A3B8" />
          <Text className="text-slate-300 text-sm ml-1">{lead.vehicleNumber}</Text>
        </View>
      </View>

      {/* Vehicle Details */}
      <View className="flex-row items-center gap-2 mb-3">
        <View className="bg-slate-700 px-2 py-1 rounded">
          <Text className="text-slate-300 text-xs capitalize">
            {lead.vehicleType}
          </Text>
        </View>
        <View className="bg-slate-700 px-2 py-1 rounded">
          <Text className="text-slate-300 text-xs">{lead.city}</Text>
        </View>
      </View>

      {/* Expiry Date */}
      <View className="bg-orange-500/20 px-3 py-2 rounded-lg mb-3">
        <View className="flex-row items-center">
          <Calendar size={14} color="#FB923C" />
          <Text className="text-orange-400 text-xs font-medium ml-2">
            Expiry: {lead.insuranceExpiryDate}
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
              placeholder="Search vehicle insurance leads..."
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
        <ScrollView keyboardShouldPersistTaps="handled"
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerStyle={{ gap: 8 }}
        >
          {(['all', 'New', 'Contacted', 'Quote Sent', 'Policy Issued'] as (
            | VehicleInsuranceLeadStatus
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
            <Car size={48} color="#475569" />
            <Text className="text-slate-400 text-base mt-4">No vehicle insurance leads found</Text>
            <Text className="text-slate-500 text-sm mt-1">
              Leads will appear here when customers request quotes
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
                      category: 'all',
                      dateRange: 'all',
                    })
                  }
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
                Quick Actions - {selectedLead?.ownerName}
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
