import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Users,
  Shield,
  Clock,
  FileText,
  Bell,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Download,
  X,
  UserPlus,
  Settings as SettingsIcon,
  History,
} from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import {
  useAdminStore,
  AdminUser,
  AdminRole,
  STAGE_LABELS,
  REJECTION_CODES,
} from '@/lib/admin-store';

type SettingsTab = 'users' | 'audit' | 'config' | 'export';

export default function SettingsScreen() {
  const currentAdmin = useAdminStore(s => s.currentAdmin);
  const adminUsers = useAdminStore(s => s.adminUsers);
  const auditLogs = useAdminStore(s => s.auditLogs);
  const leads = useAdminStore(s => s.leads);
  const addAdminUser = useAdminStore(s => s.addAdminUser);
  const removeAdminUser = useAdminStore(s => s.removeAdminUser);
  const logAction = useAdminStore(s => s.logAction);

  const [activeTab, setActiveTab] = useState<SettingsTab>('users');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'viewer' as AdminRole });

  const isAdmin = currentAdmin?.role === 'admin';

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    addAdminUser(newUser);
    setShowAddUserModal(false);
    setNewUser({ name: '', email: '', role: 'viewer' });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleRemoveUser = (userId: string) => {
    if (userId === currentAdmin?.id) {
      Alert.alert('Error', 'Cannot remove yourself');
      return;
    }
    Alert.alert(
      'Remove User',
      'Are you sure you want to remove this admin user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeAdminUser(userId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleExport = (type: string) => {
    logAction(`EXPORT: ${type}`, 'export');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Export Started', `${type} export has been initiated. You will receive the file shortly.`);
  };

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

  const tabs = [
    { key: 'users', label: 'Users', icon: Users },
    { key: 'audit', label: 'Audit Logs', icon: History },
    { key: 'config', label: 'Config', icon: SettingsIcon },
    { key: 'export', label: 'Export', icon: Download },
  ];

  const getRoleBadgeColor = (role: AdminRole) => {
    switch (role) {
      case 'admin':
        return { bg: '#EF4444', text: '#fff' };
      case 'ops':
        return { bg: '#F59E0B', text: '#fff' };
      case 'viewer':
        return { bg: '#64748B', text: '#fff' };
    }
  };

  return (
    <View className="flex-1 bg-slate-900">
      {/* Header */}
      <View className="p-4 border-b border-slate-800">
        <Text className="text-white text-xl font-bold">Settings</Text>
        <Text className="text-slate-400 text-sm mt-1">
          Manage users, view logs, and configure system
        </Text>
      </View>

      {/* Tabs */}
      <View className="border-b border-slate-800">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 12 }}>
          {tabs.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key as SettingsTab)}
              className={`flex-row items-center px-4 py-2 rounded-lg mr-2 ${
                activeTab === tab.key ? 'bg-orange-500' : 'bg-slate-800'
              }`}
            >
              <tab.icon size={16} color={activeTab === tab.key ? '#fff' : '#94A3B8'} />
              <Text className={`ml-2 ${activeTab === tab.key ? 'text-white' : 'text-slate-400'}`}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {activeTab === 'users' && (
          <View className="p-4">
            {/* Add User Button */}
            {isAdmin && (
              <Pressable
                onPress={() => setShowAddUserModal(true)}
                className="bg-orange-500 rounded-xl p-4 flex-row items-center justify-center mb-4"
              >
                <UserPlus size={20} color="#fff" />
                <Text className="text-white font-semibold ml-2">Add Admin User</Text>
              </Pressable>
            )}

            {/* Users List */}
            <View className="bg-slate-800 rounded-xl overflow-hidden">
              <View className="p-4 border-b border-slate-700">
                <Text className="text-white font-semibold">Admin Users ({adminUsers.length})</Text>
              </View>
              {adminUsers.map((user) => {
                const roleColors = getRoleBadgeColor(user.role);
                return (
                  <View
                    key={user.id}
                    className="flex-row items-center justify-between p-4 border-b border-slate-700"
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="w-10 h-10 bg-slate-700 rounded-full items-center justify-center mr-3">
                        <Text className="text-white font-bold">{user.name.charAt(0)}</Text>
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <Text className="text-white font-medium">{user.name}</Text>
                          {user.id === currentAdmin?.id && (
                            <Text className="text-slate-500 text-xs ml-2">(You)</Text>
                          )}
                        </View>
                        <Text className="text-slate-400 text-sm">{user.email}</Text>
                      </View>
                    </View>
                    <View className="flex-row items-center">
                      <View
                        className="px-2 py-1 rounded mr-3"
                        style={{ backgroundColor: roleColors.bg }}
                      >
                        <Text className="text-xs font-medium capitalize" style={{ color: roleColors.text }}>
                          {user.role}
                        </Text>
                      </View>
                      {isAdmin && user.id !== currentAdmin?.id && (
                        <Pressable
                          onPress={() => handleRemoveUser(user.id)}
                          className="p-2"
                        >
                          <Trash2 size={18} color="#EF4444" />
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Role Permissions */}
            <View className="bg-slate-800 rounded-xl p-4 mt-4">
              <Text className="text-white font-semibold mb-4">Role Permissions</Text>
              {[
                { role: 'Admin', perms: 'Full access - All features, user management, exports' },
                { role: 'Ops', perms: 'Limited update - Stage changes, assignments, notes' },
                { role: 'Viewer', perms: 'Read only - View leads, analytics, no modifications' },
              ].map((item) => (
                <View key={item.role} className="py-3 border-b border-slate-700">
                  <Text className="text-white font-medium">{item.role}</Text>
                  <Text className="text-slate-400 text-sm mt-1">{item.perms}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'audit' && (
          <View className="p-4">
            <View className="bg-slate-800 rounded-xl overflow-hidden">
              <View className="p-4 border-b border-slate-700">
                <Text className="text-white font-semibold">Recent Activity</Text>
                <Text className="text-slate-400 text-sm mt-1">Last 50 actions</Text>
              </View>
              {auditLogs.slice(0, 50).map((log) => (
                <View key={log.id} className="p-4 border-b border-slate-700">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View className="w-8 h-8 bg-slate-700 rounded-full items-center justify-center mr-3">
                        <Text className="text-white text-xs font-bold">
                          {log.adminUser.charAt(0)}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-white font-medium">{log.adminUser}</Text>
                        <Text className="text-slate-400 text-sm">{log.action}</Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-slate-500 text-xs">{formatDate(log.timestamp)}</Text>
                      {log.entityId && (
                        <Text className="text-slate-600 text-xs">{log.entityId}</Text>
                      )}
                    </View>
                  </View>
                </View>
              ))}
              {auditLogs.length === 0 && (
                <View className="p-8 items-center">
                  <Text className="text-slate-400">No audit logs yet</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {activeTab === 'config' && (
          <View className="p-4">
            {/* Stage Definitions */}
            <View className="bg-slate-800 rounded-xl p-4 mb-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white font-semibold">Stage Definitions</Text>
                {isAdmin && (
                  <Pressable className="p-2">
                    <Edit2 size={16} color="#94A3B8" />
                  </Pressable>
                )}
              </View>
              {Object.entries(STAGE_LABELS).map(([key, label]) => (
                <View key={key} className="flex-row items-center justify-between py-2 border-b border-slate-700">
                  <Text className="text-slate-300">{label}</Text>
                  <Text className="text-slate-500 text-xs">{key}</Text>
                </View>
              ))}
            </View>

            {/* Rejection Codes */}
            <View className="bg-slate-800 rounded-xl p-4 mb-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white font-semibold">Rejection Codes</Text>
                {isAdmin && (
                  <Pressable className="p-2">
                    <Plus size={16} color="#94A3B8" />
                  </Pressable>
                )}
              </View>
              {REJECTION_CODES.map((code) => (
                <View key={code.code} className="flex-row items-center justify-between py-2 border-b border-slate-700">
                  <Text className="text-slate-300">{code.label}</Text>
                  <Text className="text-slate-500 text-xs">{code.code}</Text>
                </View>
              ))}
            </View>

            {/* SLA Settings */}
            <View className="bg-slate-800 rounded-xl p-4">
              <Text className="text-white font-semibold mb-4">SLA Thresholds</Text>
              {[
                { label: 'Stuck Lead Alert', value: '24 hours' },
                { label: 'Follow-up Overdue', value: '48 hours' },
                { label: 'KYC Completion', value: '72 hours' },
                { label: 'Partner Response', value: '24 hours' },
              ].map((item) => (
                <View key={item.label} className="flex-row items-center justify-between py-3 border-b border-slate-700">
                  <Text className="text-slate-300">{item.label}</Text>
                  <View className="bg-slate-700 px-3 py-1 rounded">
                    <Text className="text-white text-sm">{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'export' && (
          <View className="p-4">
            {!isAdmin ? (
              <View className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                <Text className="text-red-400 text-center">
                  Export feature is only available for Admin users
                </Text>
              </View>
            ) : (
              <>
                <Text className="text-slate-400 text-sm mb-4">
                  Export data to CSV/XLSX format
                </Text>

                {[
                  { label: 'Full Leads Export', desc: `All ${leads.length} leads with complete details`, type: 'full-leads' },
                  { label: 'Daily Snapshot', desc: 'Today\'s leads and activity summary', type: 'daily-snapshot' },
                  { label: 'Provider Report', desc: 'Leads grouped by provider with metrics', type: 'provider-report' },
                  { label: 'Stage Report', desc: 'Leads grouped by current stage', type: 'stage-report' },
                  { label: 'Outcome Report', desc: 'Approval, rejection, and closure data', type: 'outcome-report' },
                  { label: 'Audit Logs', desc: 'All admin activity logs', type: 'audit-logs' },
                ].map((item) => (
                  <Pressable
                    key={item.type}
                    onPress={() => handleExport(item.type)}
                    className="bg-slate-800 rounded-xl p-4 mb-3 flex-row items-center justify-between"
                  >
                    <View className="flex-1">
                      <Text className="text-white font-medium">{item.label}</Text>
                      <Text className="text-slate-400 text-sm mt-1">{item.desc}</Text>
                    </View>
                    <View className="bg-orange-500/20 p-2 rounded-lg">
                      <Download size={20} color="#F97316" />
                    </View>
                  </Pressable>
                ))}
              </>
            )}
          </View>
        )}

        <View className="h-8" />
      </ScrollView>

      {/* Add User Modal */}
      <Modal visible={showAddUserModal} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowAddUserModal(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-slate-800 rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-white text-xl font-semibold">Add Admin User</Text>
                <Pressable onPress={() => setShowAddUserModal(false)}>
                  <X size={24} color="#94A3B8" />
                </Pressable>
              </View>

              <View className="mb-4">
                <Text className="text-slate-400 text-sm mb-2">Name</Text>
                <TextInput
                  className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                  placeholder="Enter name"
                  placeholderTextColor="#64748B"
                  value={newUser.name}
                  onChangeText={(text) => setNewUser(u => ({ ...u, name: text }))}
                />
              </View>

              <View className="mb-4">
                <Text className="text-slate-400 text-sm mb-2">Email</Text>
                <TextInput
                  className="bg-slate-700 rounded-xl px-4 py-3 text-white"
                  placeholder="Enter email"
                  placeholderTextColor="#64748B"
                  value={newUser.email}
                  onChangeText={(text) => setNewUser(u => ({ ...u, email: text }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View className="mb-6">
                <Text className="text-slate-400 text-sm mb-2">Role</Text>
                <View className="flex-row gap-2">
                  {(['admin', 'ops', 'viewer'] as AdminRole[]).map((role) => (
                    <Pressable
                      key={role}
                      onPress={() => setNewUser(u => ({ ...u, role }))}
                      className={`flex-1 py-3 rounded-xl items-center ${
                        newUser.role === role ? 'bg-orange-500' : 'bg-slate-700'
                      }`}
                    >
                      <Text className={`capitalize font-medium ${
                        newUser.role === role ? 'text-white' : 'text-slate-400'
                      }`}>
                        {role}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Pressable
                onPress={handleAddUser}
                className="bg-orange-500 rounded-xl py-4"
              >
                <Text className="text-white text-center font-semibold">Add User</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
