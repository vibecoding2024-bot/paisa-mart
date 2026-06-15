import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  Phone,
  MessageCircle,
  Calendar,
  DollarSign,
  Home,
  Clock,
  MapPin,
  User,
  FileText,
  Edit3,
  Save,
  X,
} from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  useWhatsAppLeadsStore,
  formatLeadForWhatsApp,
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

export default function WhatsAppLeadDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const lead = useWhatsAppLeadsStore((s) => s.getLeadById(id || ''));
  const updateLeadStatus = useWhatsAppLeadsStore((s) => s.updateLeadStatus);
  const assignLeadTo = useWhatsAppLeadsStore((s) => s.assignLeadTo);
  const addLeadNote = useWhatsAppLeadsStore((s) => s.addLeadNote);

  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(lead?.notes || '');
  const [assignee, setAssignee] = useState(lead?.assignedTo || '');
  const [editingAssignee, setEditingAssignee] = useState(false);

  if (!lead) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <Text className="text-slate-400">Lead not found</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-4 bg-orange-500 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const handleStatusChange = (newStatus: WhatsAppLeadStatus) => {
    updateLeadStatus(lead.id, newStatus);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSaveNotes = () => {
    if (notesText !== lead.notes) {
      addLeadNote(lead.id, notesText);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setEditingNotes(false);
  };

  const handleSaveAssignee = () => {
    if (assignee !== lead.assignedTo) {
      assignLeadTo(lead.id, assignee);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setEditingAssignee(false);
  };

  const handleCallCustomer = () => {
    Linking.openURL(`tel:${lead.mobile}`);
  };

  const handleWhatsAppCustomer = () => {
    Linking.openURL(`whatsapp://send?phone=${lead.mobile}`);
  };

  const handleShareLead = async () => {
    const formattedMessage = formatLeadForWhatsApp(lead);
    await Share.share({
      message: formattedMessage,
      title: `Lead Details - ${lead.id}`,
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View className="flex-1 bg-slate-900">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-800">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
          >
            <ChevronLeft size={24} color="#fff" />
          </Pressable>
          <Text className="text-white font-semibold text-lg">Lead Details</Text>
          <View className="w-10 h-10" />
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Lead ID & Status */}
          <Animated.View entering={FadeInDown.delay(100)} className="p-4">
            <View className="bg-slate-800 rounded-xl p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-slate-400 text-sm">Lead ID</Text>
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[lead.status] + '20' }}
                >
                  <Text style={{ color: STATUS_COLORS[lead.status], fontSize: 12, fontWeight: '600' }}>
                    {lead.status}
                  </Text>
                </View>
              </View>
              <Text className="text-white font-semibold text-lg">{lead.id}</Text>
              <Text className="text-slate-500 text-xs mt-1">
                Created {formatDate(lead.createdAt)}
              </Text>
            </View>
          </Animated.View>

          {/* Customer Info */}
          <Animated.View entering={FadeInDown.delay(200)} className="px-4 pb-4">
            <Text className="text-white font-semibold text-base mb-3">Customer Information</Text>
            <View className="bg-slate-800 rounded-xl p-4">
              <View className="flex-row items-center mb-3">
                <User size={18} color="#94A3B8" />
                <View className="ml-3 flex-1">
                  <Text className="text-slate-400 text-xs">Name</Text>
                  <Text className="text-white text-base">{lead.customerName}</Text>
                </View>
              </View>

              <View className="flex-row items-center mb-3">
                <Phone size={18} color="#94A3B8" />
                <View className="ml-3 flex-1">
                  <Text className="text-slate-400 text-xs">Mobile</Text>
                  <Text className="text-white text-base">{lead.mobile}</Text>
                </View>
                <Pressable
                  onPress={handleCallCustomer}
                  className="bg-green-500 px-4 py-2 rounded-lg"
                >
                  <Text className="text-white text-xs font-semibold">Call</Text>
                </Pressable>
              </View>

              {lead.whatsappNumber && (
                <View className="flex-row items-center">
                  <MessageCircle size={18} color="#94A3B8" />
                  <View className="ml-3 flex-1">
                    <Text className="text-slate-400 text-xs">WhatsApp</Text>
                    <Text className="text-white text-base">{lead.whatsappNumber}</Text>
                  </View>
                  <Pressable
                    onPress={handleWhatsAppCustomer}
                    className="bg-green-600 px-4 py-2 rounded-lg"
                  >
                    <Text className="text-white text-xs font-semibold">Message</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Product Information */}
          <Animated.View entering={FadeInDown.delay(300)} className="px-4 pb-4">
            <Text className="text-white font-semibold text-base mb-3">Product Information</Text>
            <View className="bg-slate-800 rounded-xl p-4">
              <View className="flex-row items-center justify-between mb-3">
                <View>
                  <Text className="text-slate-400 text-xs">Product Category</Text>
                  <Text className="text-white text-base">
                    {CATEGORY_LABELS[lead.productCategory] || lead.productCategory}
                  </Text>
                </View>
                <View className="bg-orange-500/20 px-3 py-1 rounded">
                  <Text className="text-orange-500 text-xs font-semibold">
                    {lead.leadSource}
                  </Text>
                </View>
              </View>

              <View className="border-t border-slate-700 pt-3">
                <Text className="text-slate-400 text-xs">Bank/Provider</Text>
                <Text className="text-white text-base">{lead.bankName}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Requirement Details */}
          {(lead.loanAmount || lead.propertyType || lead.preferredCallbackTime) && (
            <Animated.View entering={FadeInDown.delay(400)} className="px-4 pb-4">
              <Text className="text-white font-semibold text-base mb-3">Requirement Details</Text>
              <View className="bg-slate-800 rounded-xl p-4">
                {lead.loanAmount && (
                  <View className="flex-row items-center mb-3">
                    <DollarSign size={18} color="#94A3B8" />
                    <View className="ml-3 flex-1">
                      <Text className="text-slate-400 text-xs">Loan Amount Needed</Text>
                      <Text className="text-white text-base">{lead.loanAmount}</Text>
                    </View>
                  </View>
                )}

                {lead.propertyType && (
                  <View className="flex-row items-center mb-3">
                    <Home size={18} color="#94A3B8" />
                    <View className="ml-3 flex-1">
                      <Text className="text-slate-400 text-xs">Property Type</Text>
                      <Text className="text-white text-base capitalize">
                        {lead.propertyType.replace(/-/g, ' ')}
                      </Text>
                    </View>
                  </View>
                )}

                {lead.preferredCallbackTime && (
                  <View className="flex-row items-center">
                    <Clock size={18} color="#94A3B8" />
                    <View className="ml-3 flex-1">
                      <Text className="text-slate-400 text-xs">Preferred Callback Time</Text>
                      <Text className="text-white text-base capitalize">
                        {lead.preferredCallbackTime.replace(/-/g, ' ')}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {/* Assignment */}
          <Animated.View entering={FadeInDown.delay(500)} className="px-4 pb-4">
            <Text className="text-white font-semibold text-base mb-3">Assignment</Text>
            <View className="bg-slate-800 rounded-xl p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <User size={18} color="#94A3B8" />
                  <View className="ml-3 flex-1">
                    <Text className="text-slate-400 text-xs">Assigned To</Text>
                    {editingAssignee ? (
                      <TextInput
                        className="text-white text-base mt-1 border-b border-slate-600 pb-1"
                        value={assignee}
                        onChangeText={setAssignee}
                        placeholder="Enter assignee name"
                        placeholderTextColor="#64748B"
                        autoFocus
                      />
                    ) : (
                      <Text className="text-white text-base">
                        {lead.assignedTo || 'Unassigned'}
                      </Text>
                    )}
                  </View>
                </View>
                {editingAssignee ? (
                  <View className="flex-row gap-2">
                    <Pressable onPress={handleSaveAssignee} className="bg-green-500 p-2 rounded-lg">
                      <Save size={18} color="#fff" />
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setAssignee(lead.assignedTo || '');
                        setEditingAssignee(false);
                      }}
                      className="bg-slate-700 p-2 rounded-lg"
                    >
                      <X size={18} color="#fff" />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setEditingAssignee(true)}
                    className="bg-slate-700 p-2 rounded-lg"
                  >
                    <Edit3 size={18} color="#fff" />
                  </Pressable>
                )}
              </View>
            </View>
          </Animated.View>

          {/* Notes */}
          <Animated.View entering={FadeInDown.delay(600)} className="px-4 pb-4">
            <Text className="text-white font-semibold text-base mb-3">Notes</Text>
            <View className="bg-slate-800 rounded-xl p-4">
              <View className="flex-row items-start justify-between mb-2">
                <View className="flex-row items-center">
                  <FileText size={18} color="#94A3B8" />
                  <Text className="text-slate-400 text-xs ml-2">Lead Notes</Text>
                </View>
                {editingNotes ? (
                  <View className="flex-row gap-2">
                    <Pressable onPress={handleSaveNotes} className="bg-green-500 p-2 rounded-lg">
                      <Save size={18} color="#fff" />
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setNotesText(lead.notes || '');
                        setEditingNotes(false);
                      }}
                      className="bg-slate-700 p-2 rounded-lg"
                    >
                      <X size={18} color="#fff" />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => setEditingNotes(true)}
                    className="bg-slate-700 p-2 rounded-lg"
                  >
                    <Edit3 size={18} color="#fff" />
                  </Pressable>
                )}
              </View>
              {editingNotes ? (
                <TextInput
                  className="text-white text-base bg-slate-700 rounded-lg p-3 mt-2"
                  value={notesText}
                  onChangeText={setNotesText}
                  placeholder="Add notes..."
                  placeholderTextColor="#64748B"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  autoFocus
                />
              ) : (
                <Text className="text-white text-base mt-2">
                  {lead.notes || 'No notes added yet'}
                </Text>
              )}
            </View>
          </Animated.View>

          {/* Status Actions */}
          <Animated.View entering={FadeInDown.delay(700)} className="px-4 pb-6">
            <Text className="text-white font-semibold text-base mb-3">Update Status</Text>
            <View className="flex-row flex-wrap gap-2">
              {(['New', 'Contacted', 'Qualified', 'Converted', 'Closed'] as WhatsAppLeadStatus[]).map(
                (status) => (
                  <Pressable
                    key={status}
                    onPress={() => handleStatusChange(status)}
                    className={`px-4 py-2 rounded-lg ${
                      lead.status === status ? 'opacity-100' : 'opacity-60'
                    }`}
                    style={{
                      backgroundColor:
                        lead.status === status
                          ? STATUS_COLORS[status]
                          : STATUS_COLORS[status] + '40',
                    }}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        lead.status === status ? 'text-white' : 'text-slate-300'
                      }`}
                    >
                      {status}
                    </Text>
                  </Pressable>
                )
              )}
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
