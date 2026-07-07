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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, ChevronDown, ChevronUp, Briefcase, CheckCircle2 } from 'lucide-react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import * as Haptics from '@/lib/haptics';
import { useAdminStore } from '@/lib/admin-store';
import { useBusinessLoanStore } from '@/lib/business-loan-store';
import { submitBusinessLoanLead } from '@/lib/business-loan-api';
import { useUserProfileStore } from '@/lib/user-profile-store';

const BUSINESS_TYPES = [
  'Manufacturing Business',
  'Trading Business',
  'Service Business',
  'Retail Business',
  'Wholesale Business',
  'Online / E-Commerce Business',
  'Franchise Business',
  'Construction / Real Estate Business',
  'Agriculture & Allied Business',
  'Import & Export Business',
  'Logistics / Transport Business',
  'Financial Services Business',
];

const LOAN_PURPOSES = [
  'Working Capital',
  'Machinery / Equipment',
  'Inventory Purchase',
  'Business Expansion',
  'Office / Shop Setup',
  'Renovation',
  'Debt Consolidation',
  'Other',
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

  return (
    <View className="mb-5">
      <Text className="text-gray-700 font-semibold text-sm mb-2">{label}</Text>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setOpen(!open);
        }}
        style={{
          borderWidth: 1.5,
          borderColor: error ? '#EF4444' : open ? '#002561' : '#E5E7EB',
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 14,
          backgroundColor: '#fff',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ color: value ? '#111827' : '#9CA3AF', fontSize: 14 }}>
          {value || `Select ${label}`}
        </Text>
        {open ? <ChevronUp size={18} color="#6B7280" /> : <ChevronDown size={18} color="#6B7280" />}
      </Pressable>
      {error ? (
        <Text className="text-red-500 text-xs mt-1">{error}</Text>
      ) : null}
      {open && (
        <Animated.View
          entering={FadeInDown.duration(150)}
          style={{
            borderWidth: 1.5,
            borderColor: '#E5E7EB',
            borderRadius: 12,
            backgroundColor: '#fff',
            marginTop: 4,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
            zIndex: 100,
          }}
        >
          {options.map((opt, idx) => (
            <Pressable
              key={idx}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(opt);
                setOpen(false);
              }}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 13,
                borderBottomWidth: idx < options.length - 1 ? 1 : 0,
                borderBottomColor: '#F3F4F6',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: value === opt ? '#EFF6FF' : '#fff',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: value === opt ? '#002561' : '#374151',
                  fontWeight: value === opt ? '600' : '400',
                }}
              >
                {opt}
              </Text>
              {value === opt && <CheckCircle2 size={16} color="#002561" />}
            </Pressable>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

type FormFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (val: string) => void;
  error?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
  prefix?: string;
};

function FormField({
  label,
  value,
  placeholder,
  onChangeText,
  error,
  keyboardType = 'default',
  prefix,
}: FormFieldProps) {
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
          style={{ flex: 1, paddingVertical: 14, fontSize: 14, color: '#111827' }}
        />
      </View>
      {error ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
    </View>
  );
}

export default function BusinessLoansDetailsScreen() {
  const router = useRouter();
  const setData = useBusinessLoanStore((s) => s.setData);
  const profile = useUserProfileStore((s) => s.profile);
  const addLead = useAdminStore((s) => s.addLead);

  const [businessType, setBusinessType] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [cibil, setCibil] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [cityState, setCityState] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [existingEmi, setExistingEmi] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [otherText, setOtherText] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!businessType) newErrors.businessType = 'Please select a business type';
    if (!fullName.trim()) newErrors.fullName = 'Please enter full name';
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number';
    if (!cibil.trim()) {
      newErrors.cibil = 'Please enter CIBIL score';
    } else if (Number(cibil) < 300 || Number(cibil) > 900) {
      newErrors.cibil = 'CIBIL score must be between 300 and 900';
    }
    if (!dateOfBirth.trim()) newErrors.dateOfBirth = 'Please enter date of birth';
    if (!cityState.trim()) newErrors.cityState = 'Please enter city and state';
    if (!monthlyIncome || monthlyIncome.trim() === '') {
      newErrors.monthlyIncome = 'Please enter monthly income';
    } else if (Number(monthlyIncome) <= 0) {
      newErrors.monthlyIncome = 'Please enter a valid monthly income';
    }
    if (!loanAmount || loanAmount.trim() === '') {
      newErrors.loanAmount = 'Please enter loan amount';
    } else if (isNaN(Number(loanAmount)) || Number(loanAmount) <= 0) {
      newErrors.loanAmount = 'Please enter a valid amount greater than 0';
    }
    if (existingEmi === '' || existingEmi === undefined) {
      newErrors.existingEmi = 'Please enter existing EMI (enter 0 if none)';
    } else if (Number(existingEmi) < 0) {
      newErrors.existingEmi = 'Existing EMI cannot be negative';
    }
    if (!loanPurpose) newErrors.loanPurpose = 'Please select a loan purpose';
    if (loanPurpose === 'Other' && !otherText.trim()) {
      newErrors.otherText = 'Please describe your loan purpose';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitError('');
    if (!validate() || isSubmitting) return;

    const phoneNumber = profile?.phoneNumber?.replace(/\D/g, '').slice(-10) || '';
    if (!/^\d{10}$/.test(phoneNumber)) {
      setSubmitError('Phone number is missing. Please complete your basic profile first.');
      return;
    }

    const [city = cityState, state = ''] = cityState.split(',').map((item) => item.trim());
    const submittedAt = new Date().toISOString();
    const leadData = {
      business_type: businessType,
      full_name: fullName.trim(),
      mobile_number: mobileNumber,
      cibil,
      date_of_birth: dateOfBirth.trim(),
      city_state: cityState.trim(),
      monthly_income: monthlyIncome,
      loan_amount_required: loanAmount,
      existing_emi: existingEmi,
      loan_purpose: loanPurpose,
      loan_purpose_other_text: loanPurpose === 'Other' ? otherText : '',
      timestamp: submittedAt,
    };

    try {
      setIsSubmitting(true);
      await submitBusinessLoanLead({ ...leadData, phoneNumber });
      setData(leadData);
      addLead({
        userName: fullName.trim(),
        mobile: mobileNumber,
        email: '',
        productType: 'business-loans',
        provider: 'Business Loan',
        stage: 'new',
        outcome: 'pending',
        priority: 'medium',
        city,
        state,
        source: 'Business Loan Form',
        creditScore: Number(cibil),
        consentGiven: true,
        extraDetails: {
          'Full Name': fullName.trim(),
          'Mobile Number': mobileNumber,
          Cibil: cibil,
          'Date of Birth': dateOfBirth.trim(),
          'City & State': cityState.trim(),
          'Monthly Income': monthlyIncome,
          'Loan Amount Required': loanAmount,
          'Existing EMI': existingEmi,
          'Business Type': businessType,
          'Loan Purpose': loanPurpose === 'Other' ? otherText.trim() : loanPurpose,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not submit business loan details');
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
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>Business Loans</Text>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 2 }}>
                Tell us about your business needs
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
              <Briefcase size={22} color="#fff" />
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
                backgroundColor: '#EFF6FF',
                borderRadius: 14,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 20,
                borderWidth: 1,
                borderColor: '#BFDBFE',
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  backgroundColor: '#DBEAFE',
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <Briefcase size={20} color="#1D4ED8" />
              </View>
              <Text style={{ color: '#1E40AF', fontSize: 13, flex: 1, lineHeight: 19 }}>
                Share a few details to find the best business loan options for your client.
              </Text>
            </Animated.View>

            {/* Field A: Business Type */}
            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <Dropdown
                label="Business Type"
                value={businessType}
                options={BUSINESS_TYPES}
                onSelect={(val) => {
                  setBusinessType(val);
                  setErrors((e) => ({ ...e, businessType: '' }));
                }}
                error={errors.businessType}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(120).springify()}>
              <FormField
                label="Full Name"
                placeholder="Enter full name"
                value={fullName}
                onChangeText={(val) => {
                  setFullName(val);
                  setErrors((e) => ({ ...e, fullName: '' }));
                }}
                error={errors.fullName}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(140).springify()}>
              <FormField
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
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(160).springify()}>
              <FormField
                label="Cibil"
                placeholder="Enter CIBIL score"
                value={cibil}
                keyboardType="numeric"
                onChangeText={(val) => {
                  setCibil(val.replace(/[^0-9]/g, '').slice(0, 3));
                  setErrors((e) => ({ ...e, cibil: '' }));
                }}
                error={errors.cibil}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(180).springify()}>
              <FormField
                label="Date of Birth"
                placeholder="DD/MM/YYYY"
                value={dateOfBirth}
                onChangeText={(val) => {
                  setDateOfBirth(val);
                  setErrors((e) => ({ ...e, dateOfBirth: '' }));
                }}
                error={errors.dateOfBirth}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <FormField
                label="City & State"
                placeholder="Example: Hyderabad, Telangana"
                value={cityState}
                onChangeText={(val) => {
                  setCityState(val);
                  setErrors((e) => ({ ...e, cityState: '' }));
                }}
                error={errors.cityState}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(220).springify()}>
              <FormField
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
            </Animated.View>

            {/* Field B: Loan Amount */}
            <Animated.View entering={FadeInDown.delay(240).springify()} style={{ marginBottom: 20 }}>
              <Text style={{ color: '#374151', fontWeight: '600', fontSize: 14, marginBottom: 8 }}>
                Loan Amount Required
              </Text>
              <View
                style={{
                  borderWidth: 1.5,
                  borderColor: errors.loanAmount ? '#EF4444' : '#E5E7EB',
                  borderRadius: 12,
                  backgroundColor: '#fff',
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                }}
              >
                <Text style={{ color: '#6B7280', fontSize: 16, marginRight: 6 }}>₹</Text>
                <TextInput
                  placeholder="Enter amount"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={loanAmount}
                  onChangeText={(val) => {
                    const cleaned = val.replace(/[^0-9]/g, '');
                    setLoanAmount(cleaned);
                    setErrors((e) => ({ ...e, loanAmount: '' }));
                  }}
                  style={{ flex: 1, paddingVertical: 14, fontSize: 14, color: '#111827' }}
                />
              </View>
              {errors.loanAmount ? (
                <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.loanAmount}</Text>
              ) : null}
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(260).springify()}>
              <FormField
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

            {/* Field C: Loan Purpose */}
            <Animated.View entering={FadeInDown.delay(280).springify()}>
              <Dropdown
                label="Purpose of Loan"
                value={loanPurpose}
                options={LOAN_PURPOSES}
                onSelect={(val) => {
                  setLoanPurpose(val);
                  setOtherText('');
                  setErrors((e) => ({ ...e, loanPurpose: '', otherText: '' }));
                }}
                error={errors.loanPurpose}
              />
            </Animated.View>

            {/* Other text input */}
            {loanPurpose === 'Other' && (
              <Animated.View entering={FadeInDown.duration(200)} style={{ marginBottom: 20, marginTop: -8 }}>
                <TextInput
                  placeholder="Briefly describe your loan purpose..."
                  placeholderTextColor="#9CA3AF"
                  value={otherText}
                  onChangeText={(val) => {
                    setOtherText(val);
                    setErrors((e) => ({ ...e, otherText: '' }));
                  }}
                  multiline
                  numberOfLines={3}
                  style={{
                    borderWidth: 1.5,
                    borderColor: errors.otherText ? '#EF4444' : '#E5E7EB',
                    borderRadius: 12,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    backgroundColor: '#fff',
                    fontSize: 14,
                    color: '#111827',
                    textAlignVertical: 'top',
                    minHeight: 80,
                  }}
                />
                {errors.otherText ? (
                  <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.otherText}</Text>
                ) : null}
              </Animated.View>
            )}
          </ScrollView>

          {/* Bottom Action Buttons */}
          <Animated.View
            entering={FadeInDown.delay(250).springify()}
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
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                      Submit
                    </Text>
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
