import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Car, ChevronDown, ChevronLeft } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from '@/lib/haptics';
import { useAdminStore } from '@/lib/admin-store';

const VEHICLE_TYPES = [
  'Car',
  'Jeep',
  'Van',
  'Tata Ace',
  'Bolero',
  'Lorry / Truck',
  'Trailer / Container Vehicle',
  'Auto Rickshaw',
  'Taxi / Cab',
  'Bus',
  'Tempo Traveller',
  'Tractor',
  'JCB / Earthmover',
  'Crane',
  'Ambulance',
  'Fire Vehicle',
  'Heavy Truck',
  'Tipper',
  'Tanker',
  'Multi-Axle Vehicle',
  'Others',
];

type FieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (val: string) => void;
  error?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
  prefix?: string;
  editable?: boolean;
};

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  keyboardType = 'default',
  prefix,
  editable = true,
}: FieldProps) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: '#374151', fontWeight: '600', fontSize: 14, marginBottom: 8 }}>
        {label}
      </Text>
      <View
        style={{
          borderWidth: 1.5,
          borderColor: error ? '#EF4444' : '#E5E7EB',
          borderRadius: 12,
          backgroundColor: editable ? '#fff' : '#F9FAFB',
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
        }}
      >
        {prefix ? <Text style={{ color: '#6B7280', fontSize: 16, marginRight: 6 }}>{prefix}</Text> : null}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          style={{ flex: 1, paddingVertical: 14, fontSize: 14, color: '#111827' }}
        />
      </View>
      {error ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

function StateDropdown({ value, onSelect, error }: { value: string; onSelect: (v: string) => void; error?: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = INDIAN_STATES.filter((s) => s.toLowerCase().includes(search.toLowerCase()));
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: '#374151', fontWeight: '600', fontSize: 14, marginBottom: 8 }}>State</Text>
      <Pressable
        onPress={() => { setSearch(''); setOpen(true); }}
        style={{ borderWidth: 1.5, borderColor: error ? '#EF4444' : value ? '#002561' : '#E5E7EB', borderRadius: 12, backgroundColor: value ? '#EFF6FF' : '#fff', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, justifyContent: 'space-between' }}
      >
        <Text style={{ fontSize: 14, color: value ? '#002561' : '#9CA3AF', fontWeight: value ? '600' : '400' }}>{value || 'Select state'}</Text>
        <ChevronDown size={18} color={value ? '#002561' : '#9CA3AF'} />
      </Pressable>
      {error ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={() => setOpen(false)} />
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '72%', paddingBottom: Platform.OS === 'ios' ? 32 : 16 }}>
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 }}>
            <Text style={{ fontWeight: '700', fontSize: 16, color: '#111827' }}>Select State</Text>
            <Pressable onPress={() => setOpen(false)} style={{ padding: 4 }}><Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>Cancel</Text></Pressable>
          </View>
          <View style={{ marginHorizontal: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ fontSize: 14, marginRight: 6 }}>🔍</Text>
            <TextInput placeholder="Search state..." placeholderTextColor="#9CA3AF" value={search} onChangeText={setSearch} style={{ flex: 1, fontSize: 14, color: '#111827' }} autoCorrect={false} />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {filtered.map((s, i) => (
              <Pressable key={s} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(s); setOpen(false); }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, backgroundColor: value === s ? '#EFF6FF' : '#fff', borderBottomWidth: i < filtered.length - 1 ? 1 : 0, borderBottomColor: '#F3F4F6' }}
              >
                <Text style={{ flex: 1, fontSize: 14, color: value === s ? '#002561' : '#374151', fontWeight: value === s ? '600' : '400' }}>{s}</Text>
                {value === s ? <Text style={{ color: '#002561', fontSize: 16 }}>✓</Text> : null}
              </Pressable>
            ))}
            {filtered.length === 0 ? <Text style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 14, paddingVertical: 24 }}>No results found</Text> : null}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const VEHICLE_ICONS: Record<string, string> = {
  'Car': '🚗', 'Jeep': '🚙', 'Van': '🚐', 'Tata Ace': '🛻', 'Bolero': '🚙',
  'Lorry / Truck': '🚛', 'Trailer / Container Vehicle': '🚚', 'Auto Rickshaw': '🛺',
  'Taxi / Cab': '🚕', 'Bus': '🚌', 'Tempo Traveller': '🚐', 'Tractor': '🚜',
  'JCB / Earthmover': '🏗️', 'Crane': '🏗️', 'Ambulance': '🚑', 'Fire Vehicle': '🚒',
  'Heavy Truck': '🚛', 'Tipper': '🚚', 'Tanker': '⛽', 'Multi-Axle Vehicle': '🚛', 'Others': '🚘',
};

function VehicleDropdown({
  value,
  onSelect,
  error,
}: {
  value: string;
  onSelect: (val: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = VEHICLE_TYPES.filter((t) => t.toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: '#374151', fontWeight: '600', fontSize: 14, marginBottom: 8 }}>
        Vehicle Type <Text style={{ color: '#EF4444' }}>*</Text>
      </Text>
      <Pressable
        onPress={() => { setSearch(''); setOpen(true); }}
        style={{
          borderWidth: 1.5,
          borderColor: error ? '#EF4444' : value ? '#002561' : '#E5E7EB',
          borderRadius: 12,
          backgroundColor: value ? '#EFF6FF' : '#fff',
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingVertical: 13,
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {value ? <Text style={{ fontSize: 18 }}>{VEHICLE_ICONS[value] ?? '🚘'}</Text> : null}
          <Text style={{ fontSize: 14, color: value ? '#002561' : '#9CA3AF', fontWeight: value ? '600' : '400' }}>
            {value || 'Select vehicle type'}
          </Text>
        </View>
        <ChevronDown size={18} color={value ? '#002561' : '#9CA3AF'} />
      </Pressable>
      {error ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={() => setOpen(false)} />
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
          maxHeight: '72%', paddingBottom: Platform.OS === 'ios' ? 32 : 16,
        }}>
          {/* Handle */}
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#E5E7EB' }} />
          </View>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 }}>
            <Text style={{ fontWeight: '700', fontSize: 16, color: '#111827' }}>Select Vehicle Type</Text>
            <Pressable onPress={() => setOpen(false)} style={{ padding: 4 }}>
              <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>Cancel</Text>
            </Pressable>
          </View>
          {/* Search */}
          <View style={{
            marginHorizontal: 16, marginBottom: 8,
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
          }}>
            <Text style={{ fontSize: 14, marginRight: 6 }}>🔍</Text>
            <TextInput
              placeholder="Search vehicle type..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              style={{ flex: 1, fontSize: 14, color: '#111827' }}
              autoCorrect={false}
            />
          </View>
          {/* List */}
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {filtered.map((type, i) => {
              const selected = value === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(type); setOpen(false); }}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    paddingHorizontal: 16, paddingVertical: 12,
                    backgroundColor: selected ? '#EFF6FF' : '#fff',
                    borderBottomWidth: i < filtered.length - 1 ? 1 : 0,
                    borderBottomColor: '#F3F4F6',
                  }}
                >
                  <View style={{
                    width: 36, height: 36, borderRadius: 10,
                    backgroundColor: selected ? '#DBEAFE' : '#F9FAFB',
                    alignItems: 'center', justifyContent: 'center', marginRight: 12,
                  }}>
                    <Text style={{ fontSize: 18 }}>{VEHICLE_ICONS[type] ?? '🚘'}</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 14, color: selected ? '#002561' : '#374151', fontWeight: selected ? '600' : '400' }}>
                    {type}
                  </Text>
                  {selected ? <Text style={{ color: '#002561', fontSize: 16 }}>✓</Text> : null}
                </Pressable>
              );
            })}
            {filtered.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 14, paddingVertical: 24 }}>No results found</Text>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

export default function VehicleLoansDetailsScreen() {
  const router = useRouter();
  const addLead = useAdminStore((s) => s.addLead);

  const [vehicleType, setVehicleType] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [cibil, setCibil] = useState('');
  const [occupation, setOccupation] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [existingEmi, setExistingEmi] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!vehicleType) newErrors.vehicleType = 'Please select vehicle type';
    if (!fullName.trim()) newErrors.fullName = 'Please enter full name';
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number';
    if (!cibil.trim()) {
      newErrors.cibil = 'Please enter CIBIL score';
    } else if (Number(cibil) < 300 || Number(cibil) > 900) {
      newErrors.cibil = 'CIBIL score must be between 300 and 900';
    }
    if (!occupation.trim()) newErrors.occupation = 'Please enter occupation';
    if (!dateOfBirth.trim()) newErrors.dateOfBirth = 'Please enter date of birth';
    if (!city.trim()) newErrors.city = 'Please enter city';
    if (!state.trim()) newErrors.state = 'Please enter state';
    if (!monthlyIncome || Number(monthlyIncome) <= 0) newErrors.monthlyIncome = 'Please enter monthly income';
    if (!loanAmount || Number(loanAmount) <= 0) newErrors.loanAmount = 'Please enter loan amount required';
    if (existingEmi === '') newErrors.existingEmi = 'Please enter existing EMI (enter 0 if none)';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    const submittedAt = new Date().toISOString();
    addLead({
      userName: fullName.trim(),
      mobile: mobileNumber,
      email: '',
      productType: 'vehicle-loans',
      provider: 'Vehicle Loan',
      stage: 'new',
      outcome: 'pending',
      priority: 'medium',
      city: city.trim(),
      state: state.trim(),
      source: 'Paisa Mart',
      creditScore: Number(cibil),
      consentGiven: true,
      extraDetails: {
        'Vehicle Type': vehicleType,
        'Full Name': fullName.trim(),
        'Mobile Number': mobileNumber,
        CIBIL: cibil,
        Occupation: occupation.trim(),
        'Date of Birth': dateOfBirth.trim(),
        City: city.trim(),
        State: state.trim(),
        'Monthly Income': monthlyIncome,
        'Loan Amount Required': loanAmount,
        'Existing EMI': existingEmi,
        'Submission Date & Time': submittedAt,
        Status: 'New',
        'Lead Source': 'Paisa Mart',
      },
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSubmitting(false);
    Alert.alert(
      'Application Submitted Successfully',
      'Thank you for choosing Paisa Mart. Our team will review your request and contact you within the next few hours.',
      [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <LinearGradient colors={['#002561', '#003380']} style={{ paddingBottom: 20 }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 8, flexDirection: 'row', alignItems: 'center' }}>
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 36,
                height: 36,
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <ChevronLeft size={22} color="#fff" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>Vehicle Loans</Text>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 2 }}>
                Select vehicle type and submit application
              </Text>
            </View>
            <View
              style={{
                width: 42,
                height: 42,
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Car size={22} color="#fff" />
            </View>
          </View>
        </LinearGradient>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View entering={FadeInDown.delay(50).springify()}>
              <VehicleDropdown
                value={vehicleType}
                onSelect={(type) => {
                  setVehicleType(type);
                  setErrors((e) => ({ ...e, vehicleType: '' }));
                }}
                error={errors.vehicleType}
              />
            </Animated.View>

            {vehicleType ? (
              <Animated.View entering={FadeInDown.delay(90).springify()}>
                <Field
                  label="Full Name"
                  placeholder="Enter full name"
                  value={fullName}
                  onChangeText={(val) => {
                    setFullName(val);
                    setErrors((e) => ({ ...e, fullName: '' }));
                  }}
                  error={errors.fullName}
                />
                <Field
                  label="Mobile Number"
                  placeholder="Enter 10-digit mobile number"
                  value={mobileNumber}
                  keyboardType="phone-pad"
                  onChangeText={(val) => {
                    setMobileNumber(val.replace(/[^0-9]/g, '').slice(0, 10));
                    setErrors((e) => ({ ...e, mobileNumber: '' }));
                  }}
                  error={errors.mobileNumber}
                />
                <Field
                  label="CIBIL Score"
                  placeholder="Enter CIBIL score"
                  value={cibil}
                  keyboardType="numeric"
                  onChangeText={(val) => {
                    setCibil(val.replace(/[^0-9]/g, '').slice(0, 3));
                    setErrors((e) => ({ ...e, cibil: '' }));
                  }}
                  error={errors.cibil}
                />
                <Field
                  label="Occupation"
                  placeholder="Enter occupation"
                  value={occupation}
                  onChangeText={(val) => {
                    setOccupation(val);
                    setErrors((e) => ({ ...e, occupation: '' }));
                  }}
                  error={errors.occupation}
                />
                <Field
                  label="Date of Birth"
                  placeholder="DD/MM/YYYY"
                  value={dateOfBirth}
                  onChangeText={(val) => {
                    setDateOfBirth(val);
                    setErrors((e) => ({ ...e, dateOfBirth: '' }));
                  }}
                  error={errors.dateOfBirth}
                />
                <Field
                  label="City"
                  placeholder="Enter city"
                  value={city}
                  onChangeText={(val) => {
                    setCity(val);
                    setErrors((e) => ({ ...e, city: '' }));
                  }}
                  error={errors.city}
                />
                <StateDropdown
                  value={state}
                  onSelect={(val) => { setState(val); setErrors((e) => ({ ...e, state: '' })); }}
                  error={errors.state}
                />
                <Field
                  label="Monthly Income"
                  placeholder="Enter monthly income"
                  value={monthlyIncome}
                  keyboardType="numeric"
                  prefix="₹"
                  onChangeText={(val) => {
                    setMonthlyIncome(val.replace(/[^0-9]/g, ''));
                    setErrors((e) => ({ ...e, monthlyIncome: '' }));
                  }}
                  error={errors.monthlyIncome}
                />
                <Field
                  label="Loan Amount Required"
                  placeholder="Enter loan amount required"
                  value={loanAmount}
                  keyboardType="numeric"
                  prefix="₹"
                  onChangeText={(val) => {
                    setLoanAmount(val.replace(/[^0-9]/g, ''));
                    setErrors((e) => ({ ...e, loanAmount: '' }));
                  }}
                  error={errors.loanAmount}
                />
                <Field
                  label="Existing EMI"
                  placeholder="Enter existing EMI"
                  value={existingEmi}
                  keyboardType="numeric"
                  prefix="₹"
                  onChangeText={(val) => {
                    setExistingEmi(val.replace(/[^0-9]/g, ''));
                    setErrors((e) => ({ ...e, existingEmi: '' }));
                  }}
                  error={errors.existingEmi}
                />
              </Animated.View>
            ) : null}
          </ScrollView>

          <Animated.View
            entering={FadeInDown.delay(120).springify()}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              paddingBottom: Platform.OS === 'ios' ? 24 : 12,
              backgroundColor: '#fff',
              borderTopWidth: 1,
              borderTopColor: '#F3F4F6',
            }}
          >
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={{
                borderRadius: 14,
                overflow: 'hidden',
                opacity: isSubmitting || !vehicleType ? 0.65 : 1,
              }}
            >
              <LinearGradient
                colors={['#002561', '#003380']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center', minHeight: 51 }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Submit Application</Text>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
