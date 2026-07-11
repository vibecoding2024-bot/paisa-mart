import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronDown, Home, CheckCircle2 } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from '@/lib/haptics';
import { useAdminStore } from '@/lib/admin-store';
import { useHomeLoanStore } from '@/lib/home-loan-store';
import { submitHomeLoanLead } from '@/lib/home-loan-api';

const LOAN_TYPES = ['House Purchase', 'Balance Transfer', 'Loan Against Property'];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

type DropdownProps = {
  label: string;
  value: string;
  options: string[];
  onSelect: (val: string) => void;
  error?: string;
};

function Dropdown({ label, value, options, onSelect, error }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));
  const isLong = options.length > 6;
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: '#374151', fontWeight: '600', fontSize: 14, marginBottom: 8 }}>{label}</Text>
      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSearch(''); setOpen(true); }}
        style={{ borderWidth: 1.5, borderColor: error ? '#EF4444' : value ? '#002561' : '#E5E7EB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: value ? '#EFF6FF' : '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Text style={{ color: value ? '#002561' : '#9CA3AF', fontSize: 14, fontWeight: value ? '600' : '400' }}>{value || `Select ${label}`}</Text>
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
            <Text style={{ fontWeight: '700', fontSize: 16, color: '#111827' }}>Select {label}</Text>
            <Pressable onPress={() => setOpen(false)} style={{ padding: 4 }}><Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '500' }}>Cancel</Text></Pressable>
          </View>
          {isLong && (
            <View style={{ marginHorizontal: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
              <Text style={{ fontSize: 14, marginRight: 6 }}>🔍</Text>
              <TextInput placeholder={`Search ${label.toLowerCase()}...`} placeholderTextColor="#9CA3AF" value={search} onChangeText={setSearch} style={{ flex: 1, fontSize: 14, color: '#111827' }} autoCorrect={false} />
            </View>
          )}
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {filtered.map((opt, idx) => (
              <Pressable key={idx} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSelect(opt); setOpen(false); }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, backgroundColor: value === opt ? '#EFF6FF' : '#fff', borderBottomWidth: idx < filtered.length - 1 ? 1 : 0, borderBottomColor: '#F3F4F6' }}
              >
                <Text style={{ flex: 1, fontSize: 14, color: value === opt ? '#002561' : '#374151', fontWeight: value === opt ? '600' : '400' }}>{opt}</Text>
                {value === opt ? <CheckCircle2 size={16} color="#002561" /> : null}
              </Pressable>
            ))}
            {filtered.length === 0 ? <Text style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 14, paddingVertical: 24 }}>No results found</Text> : null}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

type FieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (val: string) => void;
  error?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
  prefix?: string;
};

function Field({ label, placeholder, value, onChangeText, error, keyboardType = 'default', prefix }: FieldProps) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: '#374151', fontWeight: '600', fontSize: 14, marginBottom: 8 }}>{label}</Text>
      <View style={{
        borderWidth: 1.5, borderColor: error ? '#EF4444' : '#E5E7EB',
        borderRadius: 12, backgroundColor: '#fff',
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14,
      }}>
        {prefix ? <Text style={{ color: '#6B7280', fontSize: 16, marginRight: 6 }}>{prefix}</Text> : null}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType}
          value={value}
          onChangeText={onChangeText}
          style={{ flex: 1, paddingVertical: 14, fontSize: 14, color: '#111827' }}
        />
      </View>
      {error ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
}

export default function HomeLoansDetailsScreen() {
  const router = useRouter();
  const setData = useHomeLoanStore((s) => s.setData);
  const addLead = useAdminStore((s) => s.addLead);

  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [cibil, setCibil] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [existingEmi, setExistingEmi] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanType, setLoanType] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Please enter full name';
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) e.mobileNumber = 'Please enter a valid 10-digit mobile number';
    if (!cibil.trim()) {
      e.cibil = 'Please enter CIBIL score';
    } else if (Number(cibil) < 300 || Number(cibil) > 900) {
      e.cibil = 'CIBIL score must be between 300 and 900';
    }
    if (!dateOfBirth.trim()) e.dateOfBirth = 'Please enter date of birth';
    if (!monthlyIncome || Number(monthlyIncome) <= 0) e.monthlyIncome = 'Please enter monthly income';
    if (existingEmi === '') e.existingEmi = 'Please enter existing EMI (enter 0 if none)';
    if (!loanAmount || Number(loanAmount) <= 0) e.loanAmount = 'Please enter loan amount required';
    if (!loanType) e.loanType = 'Please select loan type';
    if (!city.trim()) e.city = 'Please enter city';
    if (!state) e.state = 'Please select state';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitError('');
    if (!validate() || isSubmitting) return;

    const submittedAt = new Date().toISOString();
    const leadData = {
      full_name: fullName.trim(),
      mobile_number: mobileNumber,
      cibil,
      date_of_birth: dateOfBirth.trim(),
      monthly_income: monthlyIncome,
      existing_emi: existingEmi,
      loan_amount_required: loanAmount,
      loan_type: loanType,
      city: city.trim(),
      state,
      timestamp: submittedAt,
    };

    try {
      setIsSubmitting(true);
      await submitHomeLoanLead({ ...leadData, phoneNumber: mobileNumber });
      setData(leadData);
      addLead({
        userName: fullName.trim(),
        mobile: mobileNumber,
        email: '',
        productType: 'home-loans',
        provider: 'Home Loan',
        stage: 'new',
        outcome: 'pending',
        priority: 'medium',
        city: city.trim(),
        state,
        source: 'Paisa Mart',
        creditScore: Number(cibil),
        consentGiven: true,
        extraDetails: {
          'Full Name': fullName.trim(),
          'Mobile Number': mobileNumber,
          'CIBIL Score': cibil,
          'Date of Birth': dateOfBirth.trim(),
          'Monthly Income': monthlyIncome,
          'Existing EMI': existingEmi,
          'Loan Amount Required': loanAmount,
          'Loan Type': loanType,
          City: city.trim(),
          State: state,
          'Submission Date & Time': submittedAt,
          'Lead Source': 'Paisa Mart',
          Status: 'New',
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Application Submitted Successfully',
        'Thank you for choosing Paisa Mart. Our team will review your request and contact you within the next few hours.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not submit home loan details');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <LinearGradient colors={['#002561', '#003380']} style={{ paddingBottom: 20 }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 8, flexDirection: 'row', alignItems: 'center' }}>
            <Pressable
              onPress={() => router.back()}
              style={{ width: 36, height: 36, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
            >
              <ChevronLeft size={22} color="#fff" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>Home Loans</Text>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 2 }}>
                Tell us about your home loan needs
              </Text>
            </View>
            <View style={{ width: 42, height: 42, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
              <Home size={22} color="#fff" />
            </View>
          </View>
        </LinearGradient>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Animated.View
              entering={FadeInDown.delay(50).springify()}
              style={{ backgroundColor: '#F5F3FF', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#DDD6FE' }}
            >
              <View style={{ width: 38, height: 38, backgroundColor: '#EDE9FE', borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Home size={20} color="#7C3AED" />
              </View>
              <Text style={{ color: '#5B21B6', fontSize: 13, flex: 1, lineHeight: 19 }}>
                Share a few details to find the best home loan options for your client.
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(70).springify()}>
              <Field
                label="Full Name"
                placeholder="Enter full name"
                value={fullName}
                onChangeText={(v) => { setFullName(v); setErrors((e) => ({ ...e, fullName: '' })); }}
                error={errors.fullName}
              />
              <Field
                label="Mobile Number"
                placeholder="Enter 10-digit mobile number"
                value={mobileNumber}
                keyboardType="phone-pad"
                onChangeText={(v) => { setMobileNumber(v.replace(/[^0-9]/g, '').slice(0, 10)); setErrors((e) => ({ ...e, mobileNumber: '' })); }}
                error={errors.mobileNumber}
              />
              <Field
                label="CIBIL Score"
                placeholder="Enter CIBIL score (300-900)"
                value={cibil}
                keyboardType="numeric"
                onChangeText={(v) => { setCibil(v.replace(/[^0-9]/g, '').slice(0, 3)); setErrors((e) => ({ ...e, cibil: '' })); }}
                error={errors.cibil}
              />
              <Field
                label="Date of Birth"
                placeholder="DD/MM/YYYY"
                value={dateOfBirth}
                onChangeText={(v) => { setDateOfBirth(v); setErrors((e) => ({ ...e, dateOfBirth: '' })); }}
                error={errors.dateOfBirth}
              />
              <Field
                label="Monthly Income"
                placeholder="Enter monthly income"
                value={monthlyIncome}
                keyboardType="numeric"
                prefix="₹"
                onChangeText={(v) => { setMonthlyIncome(v.replace(/[^0-9]/g, '')); setErrors((e) => ({ ...e, monthlyIncome: '' })); }}
                error={errors.monthlyIncome}
              />
              <Field
                label="Existing EMI"
                placeholder="Enter existing EMI (0 if none)"
                value={existingEmi}
                keyboardType="numeric"
                prefix="₹"
                onChangeText={(v) => { setExistingEmi(v.replace(/[^0-9]/g, '')); setErrors((e) => ({ ...e, existingEmi: '' })); }}
                error={errors.existingEmi}
              />
              <Field
                label="Loan Amount Required"
                placeholder="Enter loan amount required"
                value={loanAmount}
                keyboardType="numeric"
                prefix="₹"
                onChangeText={(v) => { setLoanAmount(v.replace(/[^0-9]/g, '')); setErrors((e) => ({ ...e, loanAmount: '' })); }}
                error={errors.loanAmount}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <Dropdown
                label="Loan Type"
                value={loanType}
                options={LOAN_TYPES}
                onSelect={(v) => { setLoanType(v); setErrors((e) => ({ ...e, loanType: '' })); }}
                error={errors.loanType}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(120).springify()}>
              <Field
                label="City"
                placeholder="Enter city"
                value={city}
                onChangeText={(v) => { setCity(v); setErrors((e) => ({ ...e, city: '' })); }}
                error={errors.city}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(140).springify()}>
              <Dropdown
                label="State"
                value={state}
                options={INDIAN_STATES}
                onSelect={(v) => { setState(v); setErrors((e) => ({ ...e, state: '' })); }}
                error={errors.state}
              />
            </Animated.View>
          </ScrollView>

          <Animated.View
            entering={FadeInDown.delay(160).springify()}
            style={{ paddingHorizontal: 16, paddingVertical: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6' }}
          >
            {submitError ? (
              <Text style={{ color: '#B91C1C', backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, fontSize: 12, marginBottom: 10 }}>
                {submitError}
              </Text>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
                disabled={isSubmitting}
                style={{ flex: 1, backgroundColor: '#F3F4F6', borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', opacity: isSubmitting ? 0.6 : 1 }}
              >
                <Text style={{ color: '#374151', fontWeight: '600', fontSize: 15 }}>Back</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={{ flex: 2, borderRadius: 14, overflow: 'hidden', opacity: isSubmitting ? 0.85 : 1 }}
              >
                <LinearGradient
                  colors={['#002561', '#003380']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center', minHeight: 51 }}
                >
                  {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Submit</Text>}
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
