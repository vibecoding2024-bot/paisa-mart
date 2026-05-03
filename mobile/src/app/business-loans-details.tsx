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
import { ChevronLeft, ChevronDown, ChevronUp, Briefcase, CheckCircle2 } from 'lucide-react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import * as Haptics from '@/lib/haptics';
import { useBusinessLoanStore } from '@/lib/business-loan-store';

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

export default function BusinessLoansDetailsScreen() {
  const router = useRouter();
  const setData = useBusinessLoanStore((s) => s.setData);

  const [businessType, setBusinessType] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [otherText, setOtherText] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!businessType) newErrors.businessType = 'Please select a business type';
    if (!loanAmount || loanAmount.trim() === '') {
      newErrors.loanAmount = 'Please enter loan amount';
    } else if (isNaN(Number(loanAmount)) || Number(loanAmount) <= 0) {
      newErrors.loanAmount = 'Please enter a valid amount greater than 0';
    }
    if (!loanPurpose) newErrors.loanPurpose = 'Please select a loan purpose';
    if (loanPurpose === 'Other' && !otherText.trim()) {
      newErrors.otherText = 'Please describe your loan purpose';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!validate()) return;

    setData({
      business_type: businessType,
      loan_amount_required: loanAmount,
      loan_purpose: loanPurpose,
      loan_purpose_other_text: loanPurpose === 'Other' ? otherText : '',
      timestamp: new Date().toISOString(),
    });

    // Proceed to products listing for business-loans
    router.push({ pathname: '/(tabs)/products', params: { category: 'business-loans' } });
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

            {/* Field B: Loan Amount */}
            <Animated.View entering={FadeInDown.delay(150).springify()} style={{ marginBottom: 20 }}>
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

            {/* Field C: Loan Purpose */}
            <Animated.View entering={FadeInDown.delay(200).springify()}>
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
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                  Continue
                </Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
