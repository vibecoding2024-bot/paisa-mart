import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import BirthDatePicker from '@/components/BirthDatePicker';
import { parseBirthDate } from '@/lib/birth-date';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Home } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from '@/lib/haptics';
import { useHomeLoanStore } from '@/lib/home-loan-store';
import { submitHomeLoanLead } from '@/lib/home-loan-api';
import { ModalDropdown } from '@/components/ModalDropdown';

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
  return (
    <ModalDropdown
      label={label}
      value={value}
      options={options}
      onSelect={onSelect}
      error={error}
    />
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
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [showConfirmationDetails, setShowConfirmationDetails] = useState<boolean>(false);
  const submitting = useRef<boolean>(false);
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
    if (!parseBirthDate(dateOfBirth)) e.dateOfBirth = 'Please select a valid date of birth from the calendar';
    if (!monthlyIncome || Number(monthlyIncome) <= 0) e.monthlyIncome = 'Please enter monthly income';
    if (existingEmi === '') e.existingEmi = 'Please enter existing EMI (enter 0 if none)';
    if (!loanAmount || Number(loanAmount) <= 0) e.loanAmount = 'Please enter loan amount required';
    if (!loanType) e.loanType = 'Please select loan type';
    if (!city.trim()) e.city = 'Please enter city';
    if (!state) e.state = 'Please select state';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const leadData = { full_name: fullName.trim(), mobile_number: mobileNumber, cibil, date_of_birth: dateOfBirth, monthly_income: monthlyIncome, existing_emi: existingEmi, loan_amount_required: loanAmount, loan_type: loanType, city: city.trim(), state, timestamp: new Date().toISOString() };
      const saved = await submitHomeLoanLead({ ...leadData, phoneNumber: mobileNumber });
      if (!saved?.id) throw new Error('Confirmation was not received. Please contact support before submitting again.');
      return { saved, leadData };
    },
    onSuccess: ({ saved, leadData }) => {
      setConfirmation(saved.referenceNumber || ('HL-' + saved.id));
      setData(leadData);
      setSubmitError('');
    },
    onError: error => setSubmitError(error instanceof Error ? error.message : 'Could not submit your application. Please try again.'),
    onSettled: () => { submitting.current = false; },
    retry: false,
  });
  const isSubmitting = mutation.isPending;
  const handleSubmit = () => {
    if (submitting.current || confirmation || !validate()) return;
    submitting.current = true;
    setSubmitError('');
    mutation.mutate();
  };

  if (confirmation) return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 48 }}>
        <View style={{ backgroundColor: '#fff', padding: 24, borderRadius: 20 }}>
          <Text style={{ color: '#16A34A', fontSize: 18, fontWeight: '700' }}>✓ Lead received</Text>
          <Text style={{ color: '#002561', fontSize: 26, fontWeight: '700', marginTop: 16 }}>Details submitted successfully</Text>
          <Text style={{ color: '#475569', fontSize: 16, lineHeight: 24, marginTop: 12 }}>We have received your home loan details. Our team will contact you shortly.</Text>
          <View style={{ backgroundColor: '#F1F5F9', padding: 16, borderRadius: 12, marginVertical: 24 }}>
            <Text style={{ color: '#64748B', marginBottom: 8 }}>Your confirmation number</Text>
            <Text selectable style={{ color: '#002561', fontWeight: '700', fontSize: 18 }}>{confirmation}</Text>
          </View>
          {showConfirmationDetails && <Text style={{ color: '#475569', lineHeight: 24, marginBottom: 20 }}>{fullName}{'\n'}{mobileNumber}{'\n'}{loanType}{'\n'}Loan amount: ₹{Number(loanAmount).toLocaleString('en-IN')}{'\n'}{city}, {state}</Text>}
          <Pressable onPress={() => setShowConfirmationDetails(v => !v)} style={{ backgroundColor: '#002561', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 }}><Text style={{ color: '#fff', fontWeight: '700' }}>{showConfirmationDetails ? 'Hide details' : 'View confirmation'}</Text></Pressable>
          <Pressable onPress={() => router.replace('/(tabs)')} style={{ borderColor: '#CBD5E1', borderWidth: 1, borderRadius: 12, padding: 16, alignItems: 'center' }}><Text style={{ color: '#002561', fontWeight: '700' }}>Back to home</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

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
              <BirthDatePicker value={dateOfBirth} onChange={(value) => { setDateOfBirth(value); setErrors(current => ({ ...current, dateOfBirth: '' })); }} error={errors.dateOfBirth} />
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
