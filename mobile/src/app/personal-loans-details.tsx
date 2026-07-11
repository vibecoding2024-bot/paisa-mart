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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react-native';
import { ModalDropdown } from '@/components/ModalDropdown';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from '@/lib/haptics';
import { useAdminStore } from '@/lib/admin-store';
import { usePersonalLoanStore } from '@/lib/personal-loan-store';
import { submitPersonalLoanLead } from '@/lib/personal-loan-api';

type TextFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (val: string) => void;
  error?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
};

function TextField({ label, placeholder, value, onChangeText, error, keyboardType = 'default' }: TextFieldProps) {
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
          backgroundColor: '#fff',
          paddingHorizontal: 14,
        }}
      >
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType}
          value={value}
          onChangeText={onChangeText}
          style={{ paddingVertical: 14, fontSize: 14, color: '#111827' }}
        />
      </View>
      {error ? (
        <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{error}</Text>
      ) : null}
    </View>
  );
}

type NumericFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (val: string) => void;
  prefix?: string;
  error?: string;
  warning?: string;
  hint?: string;
};

function NumericField({
  label,
  placeholder,
  value,
  onChangeText,
  prefix,
  error,
  warning,
  hint,
}: NumericFieldProps) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: '#374151', fontWeight: '600', fontSize: 14, marginBottom: 8 }}>
        {label}
      </Text>
      <View
        style={{
          borderWidth: 1.5,
          borderColor: error ? '#EF4444' : warning ? '#F59E0B' : '#E5E7EB',
          borderRadius: 12,
          backgroundColor: '#fff',
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
        }}
      >
        {prefix ? (
          <Text style={{ color: '#6B7280', fontSize: 16, marginRight: 6 }}>{prefix}</Text>
        ) : null}
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          value={value}
          onChangeText={(val) => onChangeText(val.replace(/[^0-9]/g, ''))}
          style={{ flex: 1, paddingVertical: 14, fontSize: 14, color: '#111827' }}
        />
      </View>
      {hint ? (
        <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4, lineHeight: 17 }}>{hint}</Text>
      ) : null}
      {error ? (
        <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{error}</Text>
      ) : null}
      {warning && !error ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 6,
            backgroundColor: '#FFFBEB',
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 6,
            gap: 6,
          }}
        >
          <AlertTriangle size={14} color="#D97706" />
          <Text style={{ color: '#D97706', fontSize: 12, flex: 1, lineHeight: 17 }}>{warning}</Text>
        </View>
      ) : null}
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

export default function PersonalLoansDetailsScreen() {
  const router = useRouter();
  const setData = usePersonalLoanStore((s) => s.setData);
  const addLead = useAdminStore((s) => s.addLead);

  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [cibil, setCibil] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [loanAmountRequired, setLoanAmountRequired] = useState('');
  const [existingEmi, setExistingEmi] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = 'Please enter full name';
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number';
    if (!cibil.trim()) {
      newErrors.cibil = 'Please enter CIBIL score';
    } else if (Number(cibil) < 300 || Number(cibil) > 900) {
      newErrors.cibil = 'CIBIL score must be between 300 and 900';
    }
    if (!dateOfBirth.trim()) newErrors.dateOfBirth = 'Please enter date of birth';
    if (!city.trim()) newErrors.city = 'Please enter city';
    if (!state.trim()) newErrors.state = 'Please enter state';
    if (!companyName.trim()) newErrors.companyName = 'Please enter company name';
    if (!monthlyIncome || monthlyIncome.trim() === '') {
      newErrors.monthlyIncome = 'Please enter monthly income';
    } else if (Number(monthlyIncome) <= 0) {
      newErrors.monthlyIncome = 'Income must be greater than 0';
    }
    if (!loanAmountRequired || Number(loanAmountRequired) <= 0) {
      newErrors.loanAmountRequired = 'Please enter loan amount required';
    }
    if (existingEmi === '' || existingEmi === undefined) {
      newErrors.existingEmi = 'Please enter existing EMI (enter 0 if none)';
    } else if (Number(existingEmi) < 0) {
      newErrors.existingEmi = 'EMI cannot be negative';
    }
    if (!employmentType) newErrors.employmentType = 'Please select employment type';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      city: city.trim(),
      state: state.trim(),
      company_name: companyName.trim(),
      monthly_income: monthlyIncome,
      loan_amount_required: loanAmountRequired,
      existing_emi: existingEmi,
      employment_type: employmentType,
      timestamp: submittedAt,
    };

    try {
      setIsSubmitting(true);
      await submitPersonalLoanLead({ ...leadData, phoneNumber: mobileNumber });
      setData(leadData);
      addLead({
        userName: fullName.trim(),
        mobile: mobileNumber,
        email: '',
        productType: 'personal-loans',
        provider: 'Personal Loan',
        stage: 'new',
        outcome: 'pending',
        priority: 'medium',
        city: city.trim(),
        state: state.trim(),
        source: 'Paisa Mart',
        consentGiven: true,
        extraDetails: {
          'Full Name': fullName.trim(),
          'Mobile Number': mobileNumber,
          'CIBIL Score': cibil,
          'Date of Birth': dateOfBirth.trim(),
          City: city.trim(),
          State: state.trim(),
          'Company Name': companyName.trim(),
          'Monthly Income': monthlyIncome,
          'Loan Amount Required': loanAmountRequired,
          'Existing EMI': existingEmi,
          'Employment Type': employmentType,
          'Submission Date & Time': submittedAt,
          'Lead Source': 'Paisa Mart',
          Status: 'New',
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Application Submitted! 🎉',
        'Our Banking Executive will reach you to further process your loan.',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not submit personal loan details');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <LinearGradient colors={['#002561', '#003380']} style={{ paddingBottom: 20 }}>
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
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
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>
                Personal Loans
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 2 }}>
                Eligibility check before lender selection
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
              <UserCheck size={22} color="#fff" />
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
            {/* Intro Card */}
            <Animated.View
              entering={FadeInDown.delay(50).springify()}
              style={{
                backgroundColor: '#ECFDF5',
                borderRadius: 14,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 20,
                borderWidth: 1,
                borderColor: '#A7F3D0',
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  backgroundColor: '#D1FAE5',
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <UserCheck size={20} color="#059669" />
              </View>
              <Text style={{ color: '#065F46', fontSize: 13, flex: 1, lineHeight: 19 }}>
                Share your client's basic financial profile to find the best personal loan lenders.
              </Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(70).springify()}>
              <TextField
                label="Full Name"
                placeholder="Enter full name"
                value={fullName}
                onChangeText={(val) => {
                  setFullName(val);
                  setErrors((e) => ({ ...e, fullName: '' }));
                }}
                error={errors.fullName}
              />
              <TextField
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
              <NumericField
                label="CIBIL Score"
                placeholder="Enter CIBIL score (300-900)"
                value={cibil}
                onChangeText={(val) => {
                  setCibil(val.replace(/[^0-9]/g, '').slice(0, 3));
                  setErrors((e) => ({ ...e, cibil: '' }));
                }}
                error={errors.cibil}
              />
              <TextField
                label="Date of Birth"
                placeholder="DD/MM/YYYY"
                value={dateOfBirth}
                onChangeText={(val) => {
                  setDateOfBirth(val);
                  setErrors((e) => ({ ...e, dateOfBirth: '' }));
                }}
                error={errors.dateOfBirth}
              />
              <TextField
                label="City"
                placeholder="Enter city"
                value={city}
                onChangeText={(val) => {
                  setCity(val);
                  setErrors((e) => ({ ...e, city: '' }));
                }}
                error={errors.city}
              />
              <ModalDropdown
                label="State"
                value={state}
                options={INDIAN_STATES}
                onSelect={(val) => { setState(val); setErrors((e) => ({ ...e, state: '' })); }}
                error={errors.state}
                placeholder="Select state"
              />
              <TextField
                label="Company Name"
                placeholder="Enter current company name"
                value={companyName}
                onChangeText={(val) => {
                  setCompanyName(val);
                  setErrors((e) => ({ ...e, companyName: '' }));
                }}
                error={errors.companyName}
              />
              <NumericField
                label="Monthly Income"
                placeholder="Enter monthly income"
                prefix="₹"
                value={monthlyIncome}
                onChangeText={(val) => {
                  setMonthlyIncome(val);
                  setErrors((e) => ({ ...e, monthlyIncome: '' }));
                }}
                error={errors.monthlyIncome}
              />
              <NumericField
                label="Loan Amount Required"
                placeholder="Enter loan amount required"
                prefix="₹"
                value={loanAmountRequired}
                onChangeText={(val) => {
                  setLoanAmountRequired(val);
                  setErrors((e) => ({ ...e, loanAmountRequired: '' }));
                }}
                error={errors.loanAmountRequired}
              />
              <NumericField
                label="Existing EMI"
                placeholder="Enter existing EMI (0 if none)"
                prefix="₹"
                value={existingEmi}
                onChangeText={(val) => {
                  setExistingEmi(val);
                  setErrors((e) => ({ ...e, existingEmi: '' }));
                }}
                error={errors.existingEmi}
              />
            </Animated.View>

            {/* Employment Type */}
            <Animated.View entering={FadeInDown.delay(80).springify()}>
              <Text
                style={{
                  color: '#374151',
                  fontWeight: '600',
                  fontSize: 14,
                  marginBottom: 10,
                }}
              >
                Employment Type
              </Text>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 4 }}>
                {['Private', 'Government'].map((opt) => {
                  const selected = employmentType === opt;
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setEmploymentType(opt);
                        setErrors((e) => ({ ...e, employmentType: '' }));
                      }}
                      style={{
                        flex: 1,
                        borderWidth: 1.5,
                        borderColor: selected ? '#002561' : '#E5E7EB',
                        borderRadius: 12,
                        paddingVertical: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: selected ? '#EFF6FF' : '#fff',
                        flexDirection: 'row',
                        gap: 8,
                      }}
                    >
                      {selected && <CheckCircle2 size={16} color="#002561" />}
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: selected ? '600' : '400',
                          color: selected ? '#002561' : '#374151',
                        }}
                      >
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {errors.employmentType ? (
                <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 6, marginBottom: 14 }}>
                  {errors.employmentType}
                </Text>
              ) : null}
            </Animated.View>
          </ScrollView>

          {/* Bottom Action Buttons */}
          <Animated.View
            entering={FadeInDown.delay(280).springify()}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              paddingBottom: Platform.OS === 'ios' ? 24 : 12,
              backgroundColor: '#fff',
              borderTopWidth: 1,
              borderTopColor: '#F3F4F6',
            }}
          >
            {submitError ? (
              <Text
                style={{
                  color: '#B91C1C',
                  backgroundColor: '#FEF2F2',
                  borderColor: '#FECACA',
                  borderWidth: 1,
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 7,
                  fontSize: 12,
                  marginBottom: 10,
                }}
              >
                {submitError}
              </Text>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }}
                disabled={isSubmitting}
                style={{
                  flex: 1,
                  backgroundColor: '#F3F4F6',
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                <Text style={{ color: '#374151', fontWeight: '600', fontSize: 15 }}>Back</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={{
                  flex: 2,
                  borderRadius: 14,
                  overflow: 'hidden',
                  opacity: isSubmitting ? 0.85 : 1,
                }}
              >
                <LinearGradient
                  colors={['#002561', '#003380']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 51,
                  }}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Submit</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
