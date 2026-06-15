import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  User,
  Flag,
  CreditCard,
  Building2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Edit2,
  ChevronRight,
  X,
  FileText,
} from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import {
  useAdminStore,
  Lead,
  LeadStage,
  STAGE_LABELS,
  STAGE_COLORS,
  PRODUCT_LABELS,
  REJECTION_CODES,
} from '@/lib/admin-store';

export default function LeadDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const leads = useAdminStore(s => s.leads);
  const currentAdmin = useAdminStore(s => s.currentAdmin);
  const updateLeadStage = useAdminStore(s => s.updateLeadStage);
  const assignLead = useAdminStore(s => s.assignLead);
  const addLeadNote = useAdminStore(s => s.addLeadNote);
  const setFollowUp = useAdminStore(s => s.setFollowUp);

  const lead = leads.find(l => l.id === id);

  const [activeTab, setActiveTab] = useState<'overview' | 'journey' | 'notes'>('overview');
  const [showStageModal, setShowStageModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [stageChangeReason, setStageChangeReason] = useState('');
  const [selectedNewStage, setSelectedNewStage] = useState<LeadStage | null>(null);

  const isViewer = currentAdmin?.role === 'viewer';

  if (!lead) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <Text className="text-white text-lg">Lead not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-orange-500">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStageChange = () => {
    if (selectedNewStage && !isViewer) {
      updateLeadStage(lead.id, selectedNewStage, undefined, stageChangeReason);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowStageModal(false);
    setSelectedNewStage(null);
    setStageChangeReason('');
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      addLeadNote(lead.id, newNote.trim());
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowNoteModal(false);
    setNewNote('');
  };

  const handleSetFollowUp = () => {
    if (followUpDate && !isViewer) {
      const date = new Date();
      date.setDate(date.getDate() + parseInt(followUpDate));
      setFollowUp(lead.id, date.toISOString());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowFollowUpModal(false);
    setFollowUpDate('');
  };

  // Mock journey data
  const journeyEvents = [
    { time: lead.createdAt, event: 'Lead Created', type: 'created' },
    ...(lead.consentGiven ? [{ time: lead.createdAt, event: 'Consent Given', type: 'consent' }] : []),
    ...(lead.creditScore ? [{ time: lead.createdAt, event: `Credit Score Checked: ${lead.creditScore}`, type: 'credit' }] : []),
    ...(lead.kycStarted ? [{ time: lead.kycStarted, event: 'KYC Started', type: 'kyc' }] : []),
    ...(lead.kycCompleted ? [{ time: lead.kycCompleted, event: 'KYC Completed', type: 'kyc' }] : []),
    ...lead.stageHistory.map(sh => ({
      time: sh.changedAt,
      event: `Stage: ${STAGE_LABELS[sh.fromStage || 'new']} → ${STAGE_LABELS[sh.toStage]}`,
      type: 'stage',
      by: sh.changedBy,
      note: sh.note,
    })),
  ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  return (
    <View className="flex-1 bg-slate-900">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-slate-800">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={24} color="#fff" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-white text-lg font-semibold">{lead.userName}</Text>
          <Text className="text-slate-400 text-sm">{lead.id}</Text>
        </View>
        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: STAGE_COLORS[lead.stage] + '30' }}
        >
          <Text style={{ color: STAGE_COLORS[lead.stage], fontSize: 12, fontWeight: '600' }}>
            {STAGE_LABELS[lead.stage]}
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      {!isViewer && (
        <View className="flex-row px-4 py-3 gap-2 border-b border-slate-800">
          <Pressable
            onPress={() => setShowStageModal(true)}
            className="flex-1 bg-slate-800 rounded-lg py-2 items-center"
          >
            <Text className="text-white text-sm">Change Stage</Text>
          </Pressable>
          <Pressable
            onPress={() => assignLead(lead.id, currentAdmin?.name || 'Admin')}
            className="flex-1 bg-slate-800 rounded-lg py-2 items-center"
          >
            <Text className="text-white text-sm">Assign to Me</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowFollowUpModal(true)}
            className="flex-1 bg-orange-500 rounded-lg py-2 items-center"
          >
            <Text className="text-white text-sm">Follow-up</Text>
          </Pressable>
        </View>
      )}

      {/* Tabs */}
      <View className="flex-row px-4 py-2 border-b border-slate-800">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'journey', label: 'Journey' },
          { key: 'notes', label: `Notes (${lead.notes.length})` },
        ].map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2 rounded-lg mr-2 ${
              activeTab === tab.key ? 'bg-orange-500' : 'bg-slate-800'
            }`}
          >
            <Text className={activeTab === tab.key ? 'text-white' : 'text-slate-400'}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" className="flex-1" showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && (
          <View className="p-4">
            {/* Contact Info */}
            <Animated.View entering={FadeInDown.delay(50).springify()}>
              <View className="bg-slate-800 rounded-xl p-4 mb-4">
                <Text className="text-white font-semibold mb-4">Contact Information</Text>
                <View className="flex-row items-center mb-3">
                  <Phone size={18} color="#94A3B8" />
                  <Text className="text-white ml-3">{lead.mobile}</Text>
                </View>
                <View className="flex-row items-center mb-3">
                  <Mail size={18} color="#94A3B8" />
                  <Text className="text-white ml-3">{lead.email}</Text>
                </View>
                {lead.city && (
                  <View className="flex-row items-center">
                    <MapPin size={18} color="#94A3B8" />
                    <Text className="text-white ml-3">{lead.city}, {lead.state}</Text>
                  </View>
                )}
              </View>
            </Animated.View>

            {/* Product Info */}
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <View className="bg-slate-800 rounded-xl p-4 mb-4">
                <Text className="text-white font-semibold mb-4">Product Details</Text>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-slate-400">Product</Text>
                  <Text className="text-white">{PRODUCT_LABELS[lead.productType]}</Text>
                </View>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-slate-400">Provider</Text>
                  <Text className="text-white">{lead.provider}</Text>
                </View>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-slate-400">Outcome</Text>
                  <View className={`px-2 py-1 rounded ${
                    lead.outcome === 'approved' ? 'bg-green-500/20' :
                    lead.outcome === 'rejected' ? 'bg-red-500/20' :
                    'bg-amber-500/20'
                  }`}>
                    <Text className={`capitalize ${
                      lead.outcome === 'approved' ? 'text-green-500' :
                      lead.outcome === 'rejected' ? 'text-red-500' :
                      'text-amber-500'
                    }`}>
                      {lead.outcome}
                    </Text>
                  </View>
                </View>
                {lead.creditScore && (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-400">Credit Score</Text>
                    <Text className={`font-bold ${
                      lead.creditScore >= 750 ? 'text-green-500' :
                      lead.creditScore >= 650 ? 'text-amber-500' :
                      'text-red-500'
                    }`}>
                      {lead.creditScore}
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>

            {/* Status Info */}
            <Animated.View entering={FadeInDown.delay(150).springify()}>
              <View className="bg-slate-800 rounded-xl p-4 mb-4">
                <Text className="text-white font-semibold mb-4">Status</Text>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-slate-400">Current Stage</Text>
                  <View className="flex-row items-center">
                    <View
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: STAGE_COLORS[lead.stage] }}
                    />
                    <Text className="text-white">{STAGE_LABELS[lead.stage]}</Text>
                  </View>
                </View>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-slate-400">Priority</Text>
                  <View className={`flex-row items-center px-2 py-1 rounded ${
                    lead.priority === 'high' ? 'bg-red-500/20' :
                    lead.priority === 'medium' ? 'bg-amber-500/20' :
                    'bg-slate-700'
                  }`}>
                    <Flag size={12} color={
                      lead.priority === 'high' ? '#EF4444' :
                      lead.priority === 'medium' ? '#F59E0B' :
                      '#64748B'
                    } />
                    <Text className={`ml-1 capitalize ${
                      lead.priority === 'high' ? 'text-red-500' :
                      lead.priority === 'medium' ? 'text-amber-500' :
                      'text-slate-400'
                    }`}>
                      {lead.priority}
                    </Text>
                  </View>
                </View>
                {lead.assignedOwner && (
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-slate-400">Assigned To</Text>
                    <Text className="text-white">{lead.assignedOwner}</Text>
                  </View>
                )}
                {lead.followUpDate && (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-slate-400">Follow-up</Text>
                    <Text className="text-orange-500">{formatDate(lead.followUpDate)}</Text>
                  </View>
                )}
              </View>
            </Animated.View>

            {/* Timestamps */}
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <View className="bg-slate-800 rounded-xl p-4">
                <Text className="text-white font-semibold mb-4">Timeline</Text>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-slate-400">Created</Text>
                  <Text className="text-white">{formatDate(lead.createdAt)}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text className="text-slate-400">Last Updated</Text>
                  <Text className="text-white">{formatDate(lead.updatedAt)}</Text>
                </View>
              </View>
            </Animated.View>
          </View>
        )}

        {activeTab === 'journey' && (
          <View className="p-4">
            <Text className="text-white font-semibold mb-4">User Journey Timeline</Text>
            {journeyEvents.map((event, index) => (
              <View key={index} className="flex-row mb-4">
                <View className="items-center mr-4">
                  <View className={`w-3 h-3 rounded-full ${
                    event.type === 'stage' ? 'bg-blue-500' :
                    event.type === 'kyc' ? 'bg-green-500' :
                    event.type === 'credit' ? 'bg-purple-500' :
                    'bg-slate-500'
                  }`} />
                  {index < journeyEvents.length - 1 && (
                    <View className="w-0.5 flex-1 bg-slate-700 mt-1" />
                  )}
                </View>
                <View className="flex-1 bg-slate-800 rounded-xl p-3">
                  <Text className="text-white font-medium">{event.event}</Text>
                  <Text className="text-slate-400 text-xs mt-1">{formatDate(event.time)}</Text>
                  {'by' in event && event.by && (
                    <Text className="text-slate-500 text-xs mt-1">By: {event.by}</Text>
                  )}
                  {'note' in event && event.note && (
                    <Text className="text-slate-400 text-sm mt-2 italic">"{event.note}"</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'notes' && (
          <View className="p-4">
            <Pressable
              onPress={() => setShowNoteModal(true)}
              className="bg-orange-500 rounded-xl p-4 flex-row items-center justify-center mb-4"
            >
              <MessageSquare size={20} color="#fff" />
              <Text className="text-white font-semibold ml-2">Add Note</Text>
            </Pressable>

            {lead.notes.length === 0 ? (
              <View className="items-center py-12">
                <FileText size={48} color="#64748B" />
                <Text className="text-slate-400 mt-4">No notes yet</Text>
              </View>
            ) : (
              lead.notes.map((note) => (
                <View key={note.id} className="bg-slate-800 rounded-xl p-4 mb-3">
                  <Text className="text-white">{note.text}</Text>
                  <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-slate-700">
                    <Text className="text-slate-400 text-sm">{note.createdBy}</Text>
                    <Text className="text-slate-500 text-xs">{formatDate(note.createdAt)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <View className="h-8" />
      </ScrollView>

      {/* Stage Change Modal */}
      <Modal visible={showStageModal} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowStageModal(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-slate-800 rounded-t-3xl p-6 max-h-[80%]">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-lg font-semibold">Change Stage</Text>
                <Pressable onPress={() => setShowStageModal(false)}>
                  <X size={24} color="#94A3B8" />
                </Pressable>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {Object.entries(STAGE_LABELS).map(([stage, label]) => (
                  <Pressable
                    key={stage}
                    onPress={() => setSelectedNewStage(stage as LeadStage)}
                    className={`flex-row items-center p-4 rounded-xl mb-2 ${
                      selectedNewStage === stage ? 'bg-orange-500' : 'bg-slate-700'
                    }`}
                  >
                    <View
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: STAGE_COLORS[stage as LeadStage] }}
                    />
                    <Text className="text-white">{label}</Text>
                    {lead.stage === stage && (
                      <Text className="text-slate-400 ml-2">(current)</Text>
                    )}
                  </Pressable>
                ))}

                {selectedNewStage && (
                  <View className="mt-4">
                    <Text className="text-slate-400 text-sm mb-2">Reason / Note (optional)</Text>
                    <TextInput
                      className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                      placeholder="Add reason for stage change..."
                      placeholderTextColor="#64748B"
                      value={stageChangeReason}
                      onChangeText={setStageChangeReason}
                      multiline
                    />
                  </View>
                )}
              </ScrollView>

              <Pressable
                onPress={handleStageChange}
                disabled={!selectedNewStage}
                className={`rounded-xl py-4 mt-4 ${selectedNewStage ? 'bg-orange-500' : 'bg-slate-700'}`}
              >
                <Text className={`text-center font-semibold ${selectedNewStage ? 'text-white' : 'text-slate-500'}`}>
                  Update Stage
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Note Modal */}
      <Modal visible={showNoteModal} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowNoteModal(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-slate-800 rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-lg font-semibold">Add Note</Text>
                <Pressable onPress={() => setShowNoteModal(false)}>
                  <X size={24} color="#94A3B8" />
                </Pressable>
              </View>

              <TextInput
                className="bg-slate-700 rounded-xl px-4 py-3 text-white min-h-[120px]"
                placeholder="Enter your note..."
                placeholderTextColor="#64748B"
                value={newNote}
                onChangeText={setNewNote}
                multiline
                textAlignVertical="top"
              />

              <Pressable
                onPress={handleAddNote}
                disabled={!newNote.trim()}
                className={`rounded-xl py-4 mt-4 ${newNote.trim() ? 'bg-orange-500' : 'bg-slate-700'}`}
              >
                <Text className={`text-center font-semibold ${newNote.trim() ? 'text-white' : 'text-slate-500'}`}>
                  Save Note
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Follow-up Modal */}
      <Modal visible={showFollowUpModal} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowFollowUpModal(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-slate-800 rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white text-lg font-semibold">Set Follow-up</Text>
                <Pressable onPress={() => setShowFollowUpModal(false)}>
                  <X size={24} color="#94A3B8" />
                </Pressable>
              </View>

              <Text className="text-slate-400 text-sm mb-3">Follow-up in:</Text>
              <View className="flex-row flex-wrap gap-2">
                {['1', '2', '3', '5', '7', '14'].map((days) => (
                  <Pressable
                    key={days}
                    onPress={() => setFollowUpDate(days)}
                    className={`px-4 py-3 rounded-xl ${
                      followUpDate === days ? 'bg-orange-500' : 'bg-slate-700'
                    }`}
                  >
                    <Text className={followUpDate === days ? 'text-white' : 'text-slate-300'}>
                      {days} {parseInt(days) === 1 ? 'day' : 'days'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                onPress={handleSetFollowUp}
                disabled={!followUpDate}
                className={`rounded-xl py-4 mt-6 ${followUpDate ? 'bg-orange-500' : 'bg-slate-700'}`}
              >
                <Text className={`text-center font-semibold ${followUpDate ? 'text-white' : 'text-slate-500'}`}>
                  Set Follow-up
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
