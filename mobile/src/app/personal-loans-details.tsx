import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { usePersonalLoanStore } from '@/lib/personal-loan-store';

const CREDIT_SCORE_OPTIONS = [
  { label: '300 – 500 (Poor)', value: '300-500' },
  { label: '550 – 649 (Fair)', value: '550-649' },
  { label: '650 – 749 (Good)', value: '650-749' },
  { label: '750 – 799 (Very Good)', value: '750-799' },
  { label: '800 – 900 (Excellent)', value: '800-900' },
  { label: "I don't know my score", value: 'unknown' },
];

type DropdownProps = {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onSelect: (val: string) => void;
  placeholder?: string;
  error?: string;
};

function Dropdown({ label, value, options, onSelect, placeholder, error }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label ?? '';

  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ color: '#374151', fontWeight: '600', fontSize: 14, marginBottom: 8 }}>
        {label}
      </Text>
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
        <Text style={{ color: selectedLabel ? '#111827' : '#9CA3AF', fontSize: 14 }}>
          {selectedLabel || placeholder || `Select ${label}`}
        </Text>
        {open ? <ChevronUp size={18} color="#6B7280" /> : <ChevronDown size={18} color="#6B7280" />}
      </Pressable>
      {error ? (
        <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{error}</Text>
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
          }}
        >
          {options.map((opt, idx) => (
            <Pressable
              key={idx}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(opt.value);
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
                backgroundColor: value === opt.value ? '#EFF6FF' : '#fff',
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: value === opt.value ? '#002561' : '#374151',
                  fontWeight: value === opt.value ? '600' : '400',
                }}
              >
                {opt.label}
              </Text>
              {value === opt.value && <CheckCircle2 size={16} color="#002561" />}
            </Pressable>
          ))}
        </Animated.View>
      )}
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

export default function PersonalLoansDetailsScreen() {
  const router = useRouter();
  const setData = usePersonalLoanStore((s) => s.setData);

  const [employmentType, setEmploymentType] = useState('');
  const [creditScore, setCreditScore] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [monthlyEmi, setMonthlyEmi] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const emiWarning =
    monthlyEmi &&
    monthlyIncome &&
    Number(monthlyEmi) > 0 &&
    Number(monthlyIncome) > 0 &&
    Number(monthlyEmi) >= Number(monthlyIncome)
      ? 'Total EMI is equal to or exceeds monthly income. Loan approval may be difficult.'
      : '';

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!employmentType) newErrors.employmentType = 'Please select employment type';
    if (!monthlyIncome || monthlyIncome.trim() === '') {
      newErrors.monthlyIncome = 'Please enter monthly income';
    } else if (Number(monthlyIncome) <= 0) {
      newErrors.monthlyIncome = 'Income must be greater than 0';
    }
    if (monthlyEmi === '' || monthlyEmi === undefined) {
      newErrors.monthlyEmi = 'Please enter total monthly EMI (enter 0 if none)';
    } else if (Number(monthlyEmi) < 0) {
      newErrors.monthlyEmi = 'EMI cannot be negative';
    }
    if (outstandingBalance === '' || outstandingBalance === undefined) {
      newErrors.outstandingBalance =
        'Please enter total outstanding balance (enter 0 if none)';
    } else if (Number(outstandingBalance) < 0) {
      newErrors.outstandingBalance = 'Outstanding balance cannot be negative';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!validate()) return;

    setData({
      employment_type: employmentType,
      credit_score_range: creditScore || '',
      monthly_income: monthlyIncome,
      total_monthly_emi: monthlyEmi,
      total_outstanding_balance: outstandingBalance,
      timestamp: new Date().toISOString(),
    });

    router.push({ pathname: '/(tabs)/products', params: { category: 'personal-loans' } });
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

            {/* Field A: Employment Type */}
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
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
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
                <Text
                  style={{ color: '#EF4444', fontSize: 12, marginTop: -14, marginBottom: 14 }}
                >
                  {errors.employmentType}
                </Text>
              ) : null}
            </Animated.View>

            {/* Field B: Credit Score Range */}
            <Animated.View entering={FadeInDown.delay(120).springify()}>
              <Dropdown
                label="Credit Score Range"
                placeholder="Select your credit score range"
                value={creditScore}
                options={CREDIT_SCORE_OPTIONS}
                onSelect={(val) => setCreditScore(val)}
              />
              <View style={{ marginTop: -12, marginBottom: 16 }}>
                <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
                  Optional — helps match the best lenders for your client.
                </Text>
              </View>
            </Animated.View>

            {/* Field C: Monthly Income */}
            <Animated.View entering={FadeInDown.delay(160).springify()}>
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
            </Animated.View>

            {/* Field D: Total Monthly EMI */}
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <NumericField
                label="Total Monthly EMI"
                placeholder="Enter total EMI amount"
                prefix="₹"
                value={monthlyEmi}
                onChangeText={(val) => {
                  setMonthlyEmi(val);
                  setErrors((e) => ({ ...e, monthlyEmi: '' }));
                }}
                error={errors.monthlyEmi}
                warning={emiWarning}
              />
            </Animated.View>

            {/* Field E: Total Outstanding Loan Balance */}
            <Animated.View entering={FadeInDown.delay(240).springify()}>
              <NumericField
                label="Total Outstanding Loan Amount"
                placeholder="Enter total outstanding balance"
                prefix="₹"
                value={outstandingBalance}
                onChangeText={(val) => {
                  setOutstandingBalance(val);
                  setErrors((e) => ({ ...e, outstandingBalance: '' }));
                }}
                hint="Total balance remaining across all active loans."
                error={errors.outstandingBalance}
              />
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
              flexDirection: 'row',
              gap: 12,
            }}
          >
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={{
                flex: 1,
                backgroundColor: '#F3F4F6',
                borderRadius: 14,
                paddingVertical: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#374151', fontWeight: '600', fontSize: 15 }}>Back</Text>
            </Pressable>
            <Pressable
              onPress={handleContinue}
              style={{ flex: 2, borderRadius: 14, overflow: 'hidden' }}
            >
              <LinearGradient
                colors={['#002561', '#003380']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Continue</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
