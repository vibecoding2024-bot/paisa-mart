import { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, FlatList } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Clock, User, AlertTriangle, ChevronRight } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import {
  useAdminStore,
  Lead,
  LeadStage,
  STAGE_LABELS,
  STAGE_COLORS,
} from '@/lib/admin-store';

const PIPELINE_STAGES: LeadStage[] = [
  'new',
  'consent_given',
  'eligibility_check',
  'kyc_pending',
  'kyc_completed',
  'submitted',
  'approved',
  'rejected',
  'disbursed',
  'closed',
];

interface PipelineColumnProps {
  stage: LeadStage;
  leads: Lead[];
  onLeadPress: (lead: Lead) => void;
  isSelected: boolean;
  onSelect: () => void;
}

function PipelineColumn({ stage, leads, onLeadPress, isSelected, onSelect }: PipelineColumnProps) {
  const stuckLeads = leads.filter(l => {
    const hoursSinceUpdate = (Date.now() - new Date(l.updatedAt).getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdate > 24 && !['closed', 'disbursed', 'rejected'].includes(l.stage);
  });

  return (
    <Pressable
      onPress={onSelect}
      className={`mr-4 w-[200px] ${isSelected ? 'opacity-100' : 'opacity-70'}`}
    >
      {/* Column Header */}
      <View
        className="rounded-t-xl p-3"
        style={{ backgroundColor: STAGE_COLORS[stage] + '30' }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: STAGE_COLORS[stage] }}
            />
            <Text className="text-white font-medium text-sm" numberOfLines={1}>
              {STAGE_LABELS[stage]}
            </Text>
          </View>
          <View className="bg-slate-700 px-2 py-0.5 rounded">
            <Text className="text-white text-xs font-bold">{leads.length}</Text>
          </View>
        </View>
        {stuckLeads.length > 0 && (
          <View className="flex-row items-center mt-2">
            <AlertTriangle size={12} color="#F59E0B" />
            <Text className="text-amber-500 text-xs ml-1">{stuckLeads.length} stuck</Text>
          </View>
        )}
      </View>

      {/* Column Content */}
      <View className="bg-slate-800/50 rounded-b-xl p-2 min-h-[300px]">
        {leads.slice(0, 5).map((lead, index) => {
          const hoursSinceUpdate = (Date.now() - new Date(lead.updatedAt).getTime()) / (1000 * 60 * 60);
          const isStuck = hoursSinceUpdate > 24;

          return (
            <Pressable
              key={lead.id}
              onPress={() => onLeadPress(lead)}
              className={`bg-slate-800 rounded-lg p-3 mb-2 ${isStuck ? 'border border-amber-500/50' : ''}`}
            >
              <Text className="text-white font-medium text-sm" numberOfLines={1}>
                {lead.userName}
              </Text>
              <Text className="text-slate-400 text-xs mt-1">{lead.provider}</Text>
              <View className="flex-row items-center justify-between mt-2">
                <View className="flex-row items-center">
                  <Clock size={10} color="#64748B" />
                  <Text className="text-slate-500 text-xs ml-1">
                    {Math.floor(hoursSinceUpdate)}h
                  </Text>
                </View>
                {lead.assignedOwner && (
                  <View className="flex-row items-center">
                    <User size={10} color="#64748B" />
                    <Text className="text-slate-500 text-xs ml-1" numberOfLines={1}>
                      {lead.assignedOwner.split(' ')[0]}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
        {leads.length > 5 && (
          <View className="items-center py-2">
            <Text className="text-slate-400 text-xs">+{leads.length - 5} more</Text>
          </View>
        )}
        {leads.length === 0 && (
          <View className="items-center justify-center py-8">
            <Text className="text-slate-500 text-xs">No leads</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function PipelineScreen() {
  const router = useRouter();
  const leads = useAdminStore(s => s.leads);
  const [selectedStage, setSelectedStage] = useState<LeadStage>('new');

  const leadsByStage = useMemo(() => {
    const grouped: Record<LeadStage, Lead[]> = {
      new: [],
      consent_given: [],
      eligibility_check: [],
      kyc_pending: [],
      kyc_completed: [],
      submitted: [],
      approved: [],
      rejected: [],
      disbursed: [],
      closed: [],
    };

    leads.forEach(lead => {
      grouped[lead.stage].push(lead);
    });

    return grouped;
  }, [leads]);

  const selectedLeads = leadsByStage[selectedStage];

  const handleLeadPress = (lead: Lead) => {
    router.push({ pathname: '/admin/lead-details', params: { id: lead.id } } as any);
  };

  const formatTimeInStage = (lead: Lead) => {
    const hours = (Date.now() - new Date(lead.updatedAt).getTime()) / (1000 * 60 * 60);
    if (hours < 1) return '<1h';
    if (hours < 24) return `${Math.floor(hours)}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <View className="flex-1 bg-slate-900">
      {/* Header */}
      <View className="p-4 border-b border-slate-800">
        <Text className="text-white text-xl font-bold">Pipeline View</Text>
        <Text className="text-slate-400 text-sm mt-1">
          Track leads through each stage
        </Text>
      </View>

      {/* Pipeline Columns */}
      <View className="border-b border-slate-800">
        <ScrollView keyboardShouldPersistTaps="handled"
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ padding: 16 }}
        >
          {PIPELINE_STAGES.map((stage) => (
            <PipelineColumn
              key={stage}
              stage={stage}
              leads={leadsByStage[stage]}
              onLeadPress={handleLeadPress}
              isSelected={selectedStage === stage}
              onSelect={() => setSelectedStage(stage)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Selected Stage Details */}
      <View className="flex-1 p-4">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <View
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: STAGE_COLORS[selectedStage] }}
            />
            <Text className="text-white font-semibold text-lg">
              {STAGE_LABELS[selectedStage]}
            </Text>
            <Text className="text-slate-400 ml-2">({selectedLeads.length})</Text>
          </View>
        </View>

        <FlatList
          data={selectedLeads}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: lead }) => {
            const hoursSinceUpdate = (Date.now() - new Date(lead.updatedAt).getTime()) / (1000 * 60 * 60);
            const isStuck = hoursSinceUpdate > 24 && !['closed', 'disbursed', 'rejected'].includes(lead.stage);

            return (
              <Pressable
                onPress={() => handleLeadPress(lead)}
                className={`bg-slate-800 rounded-xl p-4 mb-3 flex-row items-center ${
                  isStuck ? 'border border-amber-500/50' : ''
                }`}
              >
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="text-white font-medium">{lead.userName}</Text>
                    {isStuck && (
                      <View className="ml-2 flex-row items-center bg-amber-500/20 px-2 py-0.5 rounded">
                        <AlertTriangle size={10} color="#F59E0B" />
                        <Text className="text-amber-500 text-xs ml-1">Stuck</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-slate-400 text-sm mt-1">
                    {lead.provider} • {lead.id}
                  </Text>
                  <View className="flex-row items-center mt-2 gap-4">
                    <View className="flex-row items-center">
                      <Clock size={12} color="#64748B" />
                      <Text className="text-slate-500 text-xs ml-1">
                        In stage: {formatTimeInStage(lead)}
                      </Text>
                    </View>
                    {lead.assignedOwner && (
                      <View className="flex-row items-center">
                        <User size={12} color="#64748B" />
                        <Text className="text-slate-500 text-xs ml-1">{lead.assignedOwner}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <ChevronRight size={20} color="#64748B" />
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View className="items-center justify-center py-16">
              <Text className="text-slate-400">No leads in this stage</Text>
            </View>
          }
        />
      </View>
    </View>
  );
}
