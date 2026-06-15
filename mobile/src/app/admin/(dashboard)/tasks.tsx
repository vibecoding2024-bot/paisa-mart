import { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  Phone,
  ChevronRight,
  Bell,
} from 'lucide-react-native';
import {
  useAdminStore,
  Lead,
  STAGE_LABELS,
  STAGE_COLORS,
  PRODUCT_LABELS,
} from '@/lib/admin-store';

type TaskFilter = 'all' | 'followups' | 'stuck' | 'overdue';

export default function TasksScreen() {
  const router = useRouter();
  const leads = useAdminStore(s => s.leads);
  const followUps = useAdminStore(s => s.followUps);
  const [filter, setFilter] = useState<TaskFilter>('all');

  const tasks = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Follow-up tasks
    const followUpTasks = leads
      .filter(l => l.followUpDate)
      .map(l => ({
        type: 'followup' as const,
        lead: l,
        date: new Date(l.followUpDate!),
        isOverdue: new Date(l.followUpDate!) < now,
        isToday: new Date(l.followUpDate!).toDateString() === today.toDateString(),
      }));

    // Stuck leads (no movement in 24+ hours, not in terminal states)
    const stuckLeads = leads
      .filter(l => {
        const hoursSinceUpdate = (now.getTime() - new Date(l.updatedAt).getTime()) / (1000 * 60 * 60);
        return hoursSinceUpdate > 24 && !['closed', 'disbursed', 'rejected'].includes(l.stage);
      })
      .map(l => ({
        type: 'stuck' as const,
        lead: l,
        hoursSinceUpdate: Math.floor((now.getTime() - new Date(l.updatedAt).getTime()) / (1000 * 60 * 60)),
      }));

    return {
      followUpTasks,
      stuckLeads,
      todayFollowUps: followUpTasks.filter(t => t.isToday),
      overdueFollowUps: followUpTasks.filter(t => t.isOverdue && !t.isToday),
    };
  }, [leads]);

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'followups':
        return tasks.followUpTasks.map(t => ({ ...t, taskType: 'followup' }));
      case 'stuck':
        return tasks.stuckLeads.map(t => ({ ...t, taskType: 'stuck' }));
      case 'overdue':
        return tasks.overdueFollowUps.map(t => ({ ...t, taskType: 'overdue' }));
      default:
        return [
          ...tasks.overdueFollowUps.map(t => ({ ...t, taskType: 'overdue' })),
          ...tasks.todayFollowUps.map(t => ({ ...t, taskType: 'today' })),
          ...tasks.stuckLeads.map(t => ({ ...t, taskType: 'stuck' })),
        ];
    }
  }, [filter, tasks]);

  const handleLeadPress = (lead: Lead) => {
    router.push({ pathname: '/admin/lead-details', params: { id: lead.id } } as any);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  return (
    <View className="flex-1 bg-slate-900">
      {/* Header */}
      <View className="p-4 border-b border-slate-800">
        <Text className="text-white text-xl font-bold">Tasks & Follow-ups</Text>
        <Text className="text-slate-400 text-sm mt-1">
          Manage pending actions and stuck leads
        </Text>
      </View>

      {/* Summary Cards */}
      <ScrollView keyboardShouldPersistTaps="handled"
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 12 }}
      >
        <View className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 min-w-[140px]">
          <AlertTriangle size={20} color="#EF4444" />
          <Text className="text-white text-2xl font-bold mt-2">
            {tasks.overdueFollowUps.length}
          </Text>
          <Text className="text-red-400 text-sm">Overdue</Text>
        </View>

        <View className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-4 min-w-[140px]">
          <Calendar size={20} color="#F97316" />
          <Text className="text-white text-2xl font-bold mt-2">
            {tasks.todayFollowUps.length}
          </Text>
          <Text className="text-orange-400 text-sm">Today</Text>
        </View>

        <View className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-4 min-w-[140px]">
          <Clock size={20} color="#F59E0B" />
          <Text className="text-white text-2xl font-bold mt-2">
            {tasks.stuckLeads.length}
          </Text>
          <Text className="text-amber-400 text-sm">Stuck Leads</Text>
        </View>

        <View className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 min-w-[140px]">
          <Bell size={20} color="#3B82F6" />
          <Text className="text-white text-2xl font-bold mt-2">
            {tasks.followUpTasks.length}
          </Text>
          <Text className="text-blue-400 text-sm">All Follow-ups</Text>
        </View>
      </ScrollView>

      {/* Filter Tabs */}
      <View className="px-4 pb-4">
        <ScrollView keyboardShouldPersistTaps="handled" horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {[
              { key: 'all', label: 'All Tasks' },
              { key: 'overdue', label: 'Overdue' },
              { key: 'followups', label: 'Follow-ups' },
              { key: 'stuck', label: 'Stuck' },
            ].map((item) => (
              <Pressable
                key={item.key}
                onPress={() => setFilter(item.key as TaskFilter)}
                className={`px-4 py-2 rounded-lg ${
                  filter === item.key ? 'bg-orange-500' : 'bg-slate-800'
                }`}
              >
                <Text className={filter === item.key ? 'text-white' : 'text-slate-400'}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Tasks List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item, index) => `${item.lead.id}-${index}`}
        contentContainerStyle={{ padding: 16, paddingTop: 0 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isOverdue = 'isOverdue' in item && item.isOverdue;
          const isStuck = item.taskType === 'stuck';

          return (
            <Pressable
              onPress={() => handleLeadPress(item.lead)}
              className={`bg-slate-800 rounded-xl p-4 mb-3 border-l-4 ${
                isOverdue
                  ? 'border-l-red-500'
                  : isStuck
                  ? 'border-l-amber-500'
                  : 'border-l-blue-500'
              }`}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="text-white font-medium">{item.lead.userName}</Text>
                    <View
                      className="ml-2 px-2 py-0.5 rounded"
                      style={{ backgroundColor: STAGE_COLORS[item.lead.stage] + '30' }}
                    >
                      <Text
                        style={{ color: STAGE_COLORS[item.lead.stage], fontSize: 10 }}
                      >
                        {STAGE_LABELS[item.lead.stage]}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center mt-2 gap-3">
                    <View className="flex-row items-center">
                      <Phone size={12} color="#64748B" />
                      <Text className="text-slate-400 text-sm ml-1">{item.lead.mobile}</Text>
                    </View>
                    <Text className="text-slate-500 text-xs">
                      {PRODUCT_LABELS[item.lead.productType]}
                    </Text>
                  </View>

                  {/* Task Info */}
                  <View className="flex-row items-center mt-3 gap-3">
                    {isStuck ? (
                      <View className="flex-row items-center bg-amber-500/20 px-2 py-1 rounded">
                        <Clock size={12} color="#F59E0B" />
                        <Text className="text-amber-400 text-xs ml-1">
                          Stuck for {'hoursSinceUpdate' in item ? item.hoursSinceUpdate : 0}h
                        </Text>
                      </View>
                    ) : 'date' in item ? (
                      <View
                        className={`flex-row items-center px-2 py-1 rounded ${
                          isOverdue ? 'bg-red-500/20' : 'bg-blue-500/20'
                        }`}
                      >
                        <Calendar size={12} color={isOverdue ? '#EF4444' : '#3B82F6'} />
                        <Text
                          className={`text-xs ml-1 ${isOverdue ? 'text-red-400' : 'text-blue-400'}`}
                        >
                          {isOverdue ? 'Overdue: ' : 'Follow-up: '}
                          {formatDate(item.date)}
                        </Text>
                      </View>
                    ) : null}

                    {item.lead.assignedOwner && (
                      <View className="flex-row items-center">
                        <User size={12} color="#64748B" />
                        <Text className="text-slate-500 text-xs ml-1">
                          {item.lead.assignedOwner}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <ChevronRight size={20} color="#64748B" />
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <CheckCircle size={48} color="#22C55E" />
            <Text className="text-white text-lg font-medium mt-4">All caught up!</Text>
            <Text className="text-slate-400 text-sm mt-1">No pending tasks</Text>
          </View>
        }
      />
    </View>
  );
}
