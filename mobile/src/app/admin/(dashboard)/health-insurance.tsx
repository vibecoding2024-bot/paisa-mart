import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  HeartPulse,
  Search,
  ChevronDown,
  ChevronUp,
  Filter,
  Download,
  X,
  Check,
  Users,
} from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import {
  useHealthInsuranceStore,
  ApplicationStatus,
  MEMBER_LABELS,
  STATUS_COLORS,
  type HealthInsuranceApplication,
} from '@/lib/health-insurance-store';

const ALL_STATUSES: ApplicationStatus[] = ['New', 'Contacted', 'In Process', 'Closed'];

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const color = STATUS_COLORS[status];
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        backgroundColor: color + '22',
      }}
    >
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{status}</Text>
    </View>
  );
}

function ApplicationCard({
  app,
  onStatusChange,
}: {
  app: HealthInsuranceApplication;
  onStatusChange: (id: string, status: ApplicationStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const memberLabels = app.selected_members.map((m) => MEMBER_LABELS[m]).join(', ');
  const date = new Date(app.timestamp);
  const dateStr = date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <Animated.View entering={FadeInDown.springify()} style={{ marginBottom: 10 }}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setExpanded((v) => !v);
        }}
        style={{
          backgroundColor: '#1E293B',
          borderRadius: 14,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: '#334155',
        }}
      >
        {/* Header row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 14,
            gap: 10,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#22C55E22',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HeartPulse size={20} color="#22C55E" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{app.user_name}</Text>
            <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 1 }}>{app.phone_number}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <StatusBadge status={app.status} />
            <Text style={{ color: '#64748B', fontSize: 11 }}>{dateStr}</Text>
          </View>
          {expanded ? (
            <ChevronUp size={18} color="#64748B" />
          ) : (
            <ChevronDown size={18} color="#64748B" />
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
            {/* Application ID */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#64748B', fontSize: 12 }}>Application ID</Text>
              <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600' }}>
                {app.application_id}
              </Text>
            </View>

            {/* Selected Insurer */}
            {app.selected_health_insurer ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#64748B', fontSize: 12 }}>Selected Insurer</Text>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    borderRadius: 8,
                    backgroundColor: '#1E3A5F',
                    borderWidth: 1,
                    borderColor: '#2563EB44',
                  }}
                >
                  <Text style={{ color: '#60A5FA', fontSize: 12, fontWeight: '700' }}>
                    {app.selected_health_insurer}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Members */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#64748B', fontSize: 12 }}>Members Insured</Text>
              <Text
                style={{
                  color: '#E2E8F0',
                  fontSize: 12,
                  fontWeight: '600',
                  maxWidth: '60%',
                  textAlign: 'right',
                }}
              >
                {memberLabels}
              </Text>
            </View>

            {/* Elder Age */}
            {app.elder_age ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#64748B', fontSize: 12 }}>Elder Member Age</Text>
                <Text style={{ color: '#E2E8F0', fontSize: 12, fontWeight: '600' }}>
                  {app.elder_age} yrs
                </Text>
              </View>
            ) : null}

            {/* Children count */}
            {app.selected_members.includes('children') && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#64748B', fontSize: 12 }}>Children Count</Text>
                <Text style={{ color: '#E2E8F0', fontSize: 12, fontWeight: '600' }}>
                  {app.children_count}
                </Text>
              </View>
            )}

            {/* Pincode */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#64748B', fontSize: 12 }}>Pincode</Text>
              <Text style={{ color: '#E2E8F0', fontSize: 12, fontWeight: '600' }}>
                {app.pincode}
              </Text>
            </View>

            {/* Pre-existing disease */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#64748B', fontSize: 12 }}>Pre-existing Disease</Text>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 6,
                  backgroundColor: app.pre_existing_disease === 'Yes' ? '#FEE2E2' : '#D1FAE5',
                }}
              >
                <Text
                  style={{
                    color: app.pre_existing_disease === 'Yes' ? '#DC2626' : '#059669',
                    fontSize: 11,
                    fontWeight: '700',
                  }}
                >
                  {app.pre_existing_disease}
                </Text>
              </View>
            </View>

            {/* Timestamp */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#64748B', fontSize: 12 }}>Submitted At</Text>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                {dateStr}, {timeStr}
              </Text>
            </View>

            {/* Status changer */}
            <View
              style={{
                borderTopWidth: 1,
                borderTopColor: '#334155',
                paddingTop: 12,
                marginTop: 2,
              }}
            >
              <Text style={{ color: '#64748B', fontSize: 12, marginBottom: 8 }}>
                Update Status
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {ALL_STATUSES.map((s) => {
                  const isActive = app.status === s;
                  const color = STATUS_COLORS[s];
                  return (
                    <Pressable
                      key={s}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        onStatusChange(app.application_id, s);
                      }}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        borderWidth: 1.5,
                        borderColor: isActive ? color : '#334155',
                        backgroundColor: isActive ? color + '22' : 'transparent',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      {isActive && <Check size={12} color={color} strokeWidth={3} />}
                      <Text
                        style={{
                          color: isActive ? color : '#64748B',
                          fontSize: 12,
                          fontWeight: isActive ? '700' : '400',
                        }}
                      >
                        {s}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

function exportToCSV(apps: HealthInsuranceApplication[]) {
  const headers = [
    'Application ID',
    'User Name',
    'Phone Number',
    'Selected Insurer',
    'Members',
    'Elder Age',
    'Children Count',
    'Pincode',
    'Pre-existing Disease',
    'Timestamp',
    'Status',
  ];
  const rows = apps.map((a) => [
    a.application_id,
    a.user_name,
    a.phone_number,
    a.selected_health_insurer || '—',
    a.selected_members.map((m) => MEMBER_LABELS[m]).join(' | '),
    a.elder_age || '—',
    a.selected_members.includes('children') ? String(a.children_count) : '—',
    a.pincode,
    a.pre_existing_disease,
    new Date(a.timestamp).toLocaleString('en-IN'),
    a.status,
  ]);
  const csvContent = [headers, ...rows].map((r) => r.join(',')).join('\n');
  Alert.alert(
    'Export Ready',
    `CSV data for ${apps.length} application(s) is ready.\n\n(In production, this would trigger a file download or share sheet.)`,
    [{ text: 'OK' }]
  );
  return csvContent;
}

export default function AdminHealthInsuranceScreen() {
  const applications = useHealthInsuranceStore((s) => s.applications);
  const updateStatus = useHealthInsuranceStore((s) => s.updateStatus);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'All'>('All');
  const [memberFilter, setMemberFilter] = useState<string>('All');
  const [diseaseFilter, setDiseaseFilter] = useState<'All' | 'Yes' | 'No'>('All');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return applications.filter((a) => {
      const matchSearch =
        !search ||
        a.user_name.toLowerCase().includes(search.toLowerCase()) ||
        a.phone_number.includes(search) ||
        a.pincode.includes(search) ||
        a.application_id.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || a.status === statusFilter;
      const matchMember =
        memberFilter === 'All' || a.selected_members.includes(memberFilter as any);
      const matchDisease =
        diseaseFilter === 'All' || a.pre_existing_disease === diseaseFilter;
      return matchSearch && matchStatus && matchMember && matchDisease;
    });
  }, [applications, search, statusFilter, memberFilter, diseaseFilter]);

  const stats = useMemo(() => {
    return {
      total: applications.length,
      newCount: applications.filter((a) => a.status === 'New').length,
      contacted: applications.filter((a) => a.status === 'Contacted').length,
      inProcess: applications.filter((a) => a.status === 'In Process').length,
      closed: applications.filter((a) => a.status === 'Closed').length,
    };
  }, [applications]);

  const hasActiveFilter =
    statusFilter !== 'All' || memberFilter !== 'All' || diseaseFilter !== 'All' || search.length > 0;

  const clearFilters = () => {
    setStatusFilter('All');
    setMemberFilter('All');
    setDiseaseFilter('All');
    setSearch('');
  };

  return (
    <ScrollView keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: '#0F172A' }}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Page title */}
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#22C55E22',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HeartPulse size={20} color="#22C55E" />
          </View>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>
            Health Insurance Applications
          </Text>
        </View>
        <Text style={{ color: '#64748B', fontSize: 13 }}>
          Review, filter and update submitted applications
        </Text>
      </View>

      {/* Stats row */}
      <ScrollView keyboardShouldPersistTaps="handled"
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, gap: 10 }}
      >
        {[
          { label: 'Total', value: stats.total, color: '#3B82F6' },
          { label: 'New', value: stats.newCount, color: '#3B82F6' },
          { label: 'Contacted', value: stats.contacted, color: '#F59E0B' },
          { label: 'In Process', value: stats.inProcess, color: '#8B5CF6' },
          { label: 'Closed', value: stats.closed, color: '#10B981' },
        ].map((s) => (
          <View
            key={s.label}
            style={{
              backgroundColor: '#1E293B',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 12,
              minWidth: 90,
              borderWidth: 1,
              borderColor: '#334155',
              borderLeftWidth: 3,
              borderLeftColor: s.color,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>{s.value}</Text>
            <Text style={{ color: '#64748B', fontSize: 11, marginTop: 2 }}>{s.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Search + Filter toolbar */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 10 }}>
        {/* Search bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#1E293B',
            borderRadius: 12,
            paddingHorizontal: 14,
            borderWidth: 1,
            borderColor: '#334155',
            gap: 10,
          }}
        >
          <Search size={18} color="#64748B" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name, phone, pincode..."
            placeholderTextColor="#475569"
            style={{ flex: 1, color: '#fff', paddingVertical: 12, fontSize: 14 }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <X size={16} color="#64748B" />
            </Pressable>
          )}
        </View>

        {/* Filter toggle */}
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Pressable
            onPress={() => setShowFilters((v) => !v)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 10,
              backgroundColor: showFilters ? '#F97316' : '#1E293B',
              borderWidth: 1,
              borderColor: showFilters ? '#F97316' : '#334155',
            }}
          >
            <Filter size={14} color={showFilters ? '#fff' : '#94A3B8'} />
            <Text style={{ color: showFilters ? '#fff' : '#94A3B8', fontSize: 13, fontWeight: '600' }}>
              Filters
            </Text>
            {hasActiveFilter && !showFilters && (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#F97316',
                }}
              />
            )}
          </Pressable>

          <Pressable
            onPress={() => exportToCSV(filtered)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 10,
              backgroundColor: '#1E293B',
              borderWidth: 1,
              borderColor: '#334155',
            }}
          >
            <Download size={14} color="#22C55E" />
            <Text style={{ color: '#22C55E', fontSize: 13, fontWeight: '600' }}>Export CSV</Text>
          </Pressable>

          {hasActiveFilter && (
            <Pressable
              onPress={clearFilters}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 9,
                borderRadius: 10,
                backgroundColor: '#450A0A',
                borderWidth: 1,
                borderColor: '#7F1D1D',
              }}
            >
              <Text style={{ color: '#F87171', fontSize: 13, fontWeight: '600' }}>Clear</Text>
            </Pressable>
          )}
        </View>

        {/* Expanded filter panel */}
        {showFilters && (
          <View
            style={{
              backgroundColor: '#1E293B',
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: '#334155',
              gap: 14,
            }}
          >
            {/* Status filter */}
            <View>
              <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
                STATUS
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(['All', ...ALL_STATUSES] as const).map((s) => {
                  const isActive = statusFilter === s;
                  const color = s === 'All' ? '#94A3B8' : STATUS_COLORS[s];
                  return (
                    <Pressable
                      key={s}
                      onPress={() => setStatusFilter(s)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: isActive ? color + '22' : '#0F172A',
                        borderWidth: 1,
                        borderColor: isActive ? color : '#334155',
                      }}
                    >
                      <Text
                        style={{
                          color: isActive ? color : '#64748B',
                          fontSize: 12,
                          fontWeight: isActive ? '700' : '400',
                        }}
                      >
                        {s}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Member filter */}
            <View>
              <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
                MEMBER TYPE
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {(['All', 'myself', 'spouse', 'children', 'parents'] as const).map((m) => {
                  const isActive = memberFilter === m;
                  const label =
                    m === 'All' ? 'All' : MEMBER_LABELS[m as keyof typeof MEMBER_LABELS];
                  return (
                    <Pressable
                      key={m}
                      onPress={() => setMemberFilter(m)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: isActive ? '#22C55E22' : '#0F172A',
                        borderWidth: 1,
                        borderColor: isActive ? '#22C55E' : '#334155',
                      }}
                    >
                      <Text
                        style={{
                          color: isActive ? '#22C55E' : '#64748B',
                          fontSize: 12,
                          fontWeight: isActive ? '700' : '400',
                        }}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Pre-existing filter */}
            <View>
              <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
                PRE-EXISTING DISEASE
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['All', 'Yes', 'No'] as const).map((d) => {
                  const isActive = diseaseFilter === d;
                  const color =
                    d === 'All' ? '#94A3B8' : d === 'Yes' ? '#EF4444' : '#22C55E';
                  return (
                    <Pressable
                      key={d}
                      onPress={() => setDiseaseFilter(d)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: isActive ? color + '22' : '#0F172A',
                        borderWidth: 1,
                        borderColor: isActive ? color : '#334155',
                      }}
                    >
                      <Text
                        style={{
                          color: isActive ? color : '#64748B',
                          fontSize: 12,
                          fontWeight: isActive ? '700' : '400',
                        }}
                      >
                        {d}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Results */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        <Text style={{ color: '#475569', fontSize: 12, marginBottom: 12 }}>
          Showing {filtered.length} of {applications.length} applications
        </Text>

        {filtered.length === 0 ? (
          <View
            style={{
              backgroundColor: '#1E293B',
              borderRadius: 14,
              padding: 32,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#334155',
            }}
          >
            <Users size={36} color="#334155" />
            <Text style={{ color: '#475569', marginTop: 12, fontSize: 14 }}>
              No applications found
            </Text>
            {hasActiveFilter && (
              <Pressable onPress={clearFilters} style={{ marginTop: 10 }}>
                <Text style={{ color: '#F97316', fontSize: 13 }}>Clear filters</Text>
              </Pressable>
            )}
          </View>
        ) : (
          filtered.map((app) => (
            <ApplicationCard
              key={app.application_id}
              app={app}
              onStatusChange={updateStatus}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}
