import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  Car,
  Search,
  ChevronDown,
  ChevronUp,
  Filter,
  Download,
  X,
  Check,
} from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import {
  useMotorInsuranceStore,
  VEHICLE_TYPES,
  INSURANCE_TYPES,
  MOTOR_STATUS_COLORS,
  type MotorInsuranceApplication,
  type MotorApplicationStatus,
} from '@/lib/motor-insurance-store';

const ALL_STATUSES: MotorApplicationStatus[] = ['New', 'Contacted', 'In Process', 'Closed'];

function StatusBadge({ status }: { status: MotorApplicationStatus }) {
  const color = MOTOR_STATUS_COLORS[status];
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: color + '22' }}>
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{status}</Text>
    </View>
  );
}

function ApplicationCard({
  app,
  onStatusChange,
}: {
  app: MotorInsuranceApplication;
  onStatusChange: (id: string, status: MotorApplicationStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const date = new Date(app.timestamp);
  const dateStr = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const vehicleDisplay =
    app.vehicle_type === 'Others' && app.vehicle_type_other_text
      ? `Others (${app.vehicle_type_other_text})`
      : app.vehicle_type;

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
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#0EA5E922',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Car size={20} color="#38BDF8" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{app.user_name}</Text>
            <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 1 }}>{app.phone_number}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <StatusBadge status={app.status} />
            <Text style={{ color: '#64748B', fontSize: 11 }}>{dateStr}</Text>
          </View>
          {expanded ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
        </View>

        {/* Expanded details */}
        {expanded && (
          <View style={{ borderTopWidth: 1, borderTopColor: '#334155', padding: 14, gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#64748B', fontSize: 12 }}>Application ID</Text>
              <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600' }}>{app.application_id}</Text>
            </View>

            {app.selected_motor_insurer ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: '#64748B', fontSize: 12 }}>Selected Provider</Text>
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
                    {app.selected_motor_insurer}
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#64748B', fontSize: 12 }}>Vehicle Type</Text>
              <Text style={{ color: '#E2E8F0', fontSize: 12, fontWeight: '600' }}>{vehicleDisplay}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#64748B', fontSize: 12 }}>Insurance Type</Text>
              <Text
                style={{
                  color: '#E2E8F0',
                  fontSize: 12,
                  fontWeight: '600',
                  maxWidth: '55%',
                  textAlign: 'right',
                }}
              >
                {app.insurance_type}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#64748B', fontSize: 12 }}>Model Year</Text>
              <Text style={{ color: '#E2E8F0', fontSize: 12, fontWeight: '600' }}>{app.model_year}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#64748B', fontSize: 12 }}>Submitted At</Text>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>{dateStr}, {timeStr}</Text>
            </View>

            {/* Status changer */}
            <View style={{ borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 12, marginTop: 2 }}>
              <Text style={{ color: '#64748B', fontSize: 12, marginBottom: 8 }}>Update Status</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {ALL_STATUSES.map((s) => {
                  const isActive = app.status === s;
                  const color = MOTOR_STATUS_COLORS[s];
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

function exportToCSV(apps: MotorInsuranceApplication[]) {
  const headers = [
    'Application ID',
    'User Name',
    'Phone Number',
    'Selected Provider',
    'Vehicle Type',
    'Insurance Type',
    'Model Year',
    'Timestamp',
    'Status',
  ];
  const rows = apps.map((a) => [
    a.application_id,
    a.user_name,
    a.phone_number,
    a.selected_motor_insurer || '—',
    a.vehicle_type === 'Others' && a.vehicle_type_other_text
      ? `Others (${a.vehicle_type_other_text})`
      : a.vehicle_type,
    a.insurance_type,
    a.model_year,
    new Date(a.timestamp).toLocaleString('en-IN'),
    a.status,
  ]);
  const csvContent = [headers, ...rows].map((r) => r.join(',')).join('\n');
  Alert.alert(
    'Export Ready',
    `CSV data for ${apps.length} application(s) is ready.\n\n(In production, this triggers a file download.)`,
    [{ text: 'OK' }]
  );
  return csvContent;
}

export default function AdminMotorInsuranceScreen() {
  const applications = useMotorInsuranceStore((s) => s.applications);
  const updateStatus = useMotorInsuranceStore((s) => s.updateStatus);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MotorApplicationStatus | 'All'>('All');
  const [vehicleFilter, setVehicleFilter] = useState<string>('All');
  const [insuranceFilter, setInsuranceFilter] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return applications.filter((a) => {
      const matchSearch =
        !search ||
        a.user_name.toLowerCase().includes(search.toLowerCase()) ||
        a.phone_number.includes(search) ||
        a.application_id.toLowerCase().includes(search.toLowerCase()) ||
        a.model_year.includes(search);
      const matchStatus = statusFilter === 'All' || a.status === statusFilter;
      const matchVehicle = vehicleFilter === 'All' || a.vehicle_type === vehicleFilter;
      const matchInsurance = insuranceFilter === 'All' || a.insurance_type === insuranceFilter;
      return matchSearch && matchStatus && matchVehicle && matchInsurance;
    });
  }, [applications, search, statusFilter, vehicleFilter, insuranceFilter]);

  const stats = useMemo(() => ({
    total: applications.length,
    newCount: applications.filter((a) => a.status === 'New').length,
    contacted: applications.filter((a) => a.status === 'Contacted').length,
    inProcess: applications.filter((a) => a.status === 'In Process').length,
    closed: applications.filter((a) => a.status === 'Closed').length,
  }), [applications]);

  const hasActiveFilter =
    statusFilter !== 'All' || vehicleFilter !== 'All' || insuranceFilter !== 'All' || search.length > 0;

  const clearFilters = () => {
    setStatusFilter('All');
    setVehicleFilter('All');
    setInsuranceFilter('All');
    setSearch('');
  };

  return (
    <ScrollView
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
              backgroundColor: '#0EA5E922',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Car size={20} color="#38BDF8" />
          </View>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>
            Motor Insurance Applications
          </Text>
        </View>
        <Text style={{ color: '#64748B', fontSize: 13 }}>
          Review, filter and update submitted motor insurance queries
        </Text>
      </View>

      {/* Stats row */}
      <ScrollView
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
        {/* Search */}
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
            placeholder="Search by name, phone, year..."
            placeholderTextColor="#475569"
            style={{ flex: 1, color: '#fff', paddingVertical: 12, fontSize: 14 }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <X size={16} color="#64748B" />
            </Pressable>
          )}
        </View>

        {/* Filter toggle + Export + Clear */}
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
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F97316' }} />
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
            <Download size={14} color="#38BDF8" />
            <Text style={{ color: '#38BDF8', fontSize: 13, fontWeight: '600' }}>Export CSV</Text>
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

        {/* Filter panel */}
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
                  const color = s === 'All' ? '#94A3B8' : MOTOR_STATUS_COLORS[s];
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
                      <Text style={{ color: isActive ? color : '#64748B', fontSize: 12, fontWeight: isActive ? '700' : '400' }}>
                        {s}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Vehicle type filter */}
            <View>
              <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
                VEHICLE TYPE
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {['All', ...VEHICLE_TYPES].map((v) => {
                  const isActive = vehicleFilter === v;
                  return (
                    <Pressable
                      key={v}
                      onPress={() => setVehicleFilter(v)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                        backgroundColor: isActive ? '#0EA5E922' : '#0F172A',
                        borderWidth: 1,
                        borderColor: isActive ? '#0EA5E9' : '#334155',
                      }}
                    >
                      <Text style={{ color: isActive ? '#38BDF8' : '#64748B', fontSize: 12, fontWeight: isActive ? '700' : '400' }}>
                        {v}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Insurance type filter */}
            <View>
              <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>
                INSURANCE TYPE
              </Text>
              <View style={{ gap: 8 }}>
                {(['All', ...INSURANCE_TYPES] as const).map((t) => {
                  const isActive = insuranceFilter === t;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => setInsuranceFilter(t)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: isActive ? '#8B5CF622' : '#0F172A',
                        borderWidth: 1,
                        borderColor: isActive ? '#8B5CF6' : '#334155',
                      }}
                    >
                      <Text style={{ color: isActive ? '#A78BFA' : '#64748B', fontSize: 12, fontWeight: isActive ? '700' : '400' }}>
                        {t}
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
            <Car size={36} color="#334155" />
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
