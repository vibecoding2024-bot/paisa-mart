import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Shield,
  Building2,
  ChevronDown,
  Check,
  AlertTriangle,
  X,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from '@/lib/haptics';
import {
  useLifeInsuranceStore,
  POLICY_TYPES,
  PREMIUM_SLABS,
  PolicyType,
  PremiumSlab,
} from '@/lib/life-insurance-store';
import { useUserProfileStore } from '@/lib/user-profile-store';

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 8 }}>
      <Text style={{ color: '#374151', fontWeight: '700', fontSize: 14 }}>{text}</Text>
      {required && <Text style={{ color: '#EF4444', marginLeft: 4, fontSize: 14 }}>*</Text>}
    </View>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return msg ? (
    <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 5, marginLeft: 2 }}>{msg}</Text>
  ) : null;
}

// ── Generic bottom-sheet picker ─────────────────────────────────
function PickerModal<T extends string>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: readonly T[];
  selected: T | '';
  onSelect: (v: T) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 34,
            maxHeight: '75%',
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2 }} />
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#F3F4F6',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{title}</Text>
            <Pressable onPress={onClose}>
              <X size={20} color="#6B7280" />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {options.map((opt) => {
              const isSelected = selected === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onSelect(opt);
                    onClose();
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingVertical: 15,
                    borderBottomWidth: 1,
                    borderBottomColor: '#F9FAFB',
                    backgroundColor: isSelected ? '#EEF2FF' : '#fff',
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 15,
                      color: isSelected ? '#4338CA' : '#374151',
                      fontWeight: isSelected ? '700' : '400',
                    }}
                  >
                    {opt}
                  </Text>
                  {isSelected && <Check size={18} color="#4338CA" strokeWidth={3} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ──────────────────────────────────────────────────
export default function LifeInsuranceDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ insurer?: string }>();
  const insurer = params.insurer || '';

  const addApplication = useLifeInsuranceStore((s) => s.addApplication);
  const profile = useUserProfileStore((s) => s.profile);

  const [policyType, setPolicyType] = useState<PolicyType | ''>('');
  const [premiumSlab, setPremiumSlab] = useState<PremiumSlab | ''>('');
  const [premiumOther, setPremiumOther] = useState('');

  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const [errors, setErrors] = useState<{
    policyType?: string;
    premiumSlab?: string;
    premiumOther?: string;
  }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!policyType) e.policyType = 'Please select a policy type.';
    if (!premiumSlab) e.premiumSlab = 'Please select a premium amount.';
    if (premiumSlab === 'Others Amount' && !premiumOther.trim())
      e.premiumOther = 'Please enter the monthly premium amount.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    addApplication({
      user_name: profile?.name || 'User',
      phone_number: profile?.phoneNumber || '—',
      selected_life_insurer: insurer,
      policy_type: policyType as PolicyType,
      premium_slab: premiumSlab as PremiumSlab,
      premium_other_amount: premiumSlab === 'Others Amount' ? premiumOther.trim() : '',
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Alert.alert(
      'Application Submitted!',
      'Your life insurance query has been received. Our team will review your details and reach out with the best plans.',
      [
        {
          text: 'View Offers',
          onPress: () =>
            router.replace({
              pathname: '/(tabs)/products',
              params: { category: 'life-insurance' },
            }),
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        {/* Header */}
        <LinearGradient colors={['#002561', '#003380']} style={{ paddingBottom: 0 }}>
          <SafeAreaView edges={['top']}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingTop: 8,
                paddingBottom: 24,
              }}
            >
              <Pressable
                onPress={() => router.back()}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <ChevronLeft size={22} color="#fff" />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500' }}>
                  Life Insurance
                </Text>
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 2 }}>
                  Find Your Plan
                </Text>
              </View>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'rgba(99,102,241,0.25)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Shield size={24} color="#A5B4FC" />
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Subtitle */}
          <Animated.View entering={FadeInDown.delay(60).springify()}>
            <Text style={{ color: '#6B7280', fontSize: 14, marginBottom: 20 }}>
              Tell us a little about what you're looking for
            </Text>
          </Animated.View>

          {/* Insurer badge */}
          {insurer ? (
            <Animated.View
              entering={FadeInDown.delay(80).springify()}
              style={{
                backgroundColor: '#EEF2FF',
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 16,
                marginBottom: 22,
                borderWidth: 1,
                borderColor: '#C7D2FE',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Building2 size={15} color="#4338CA" />
              <Text style={{ color: '#3730A3', fontSize: 13, fontWeight: '600', flex: 1 }}>
                Selected Insurer: {insurer}
              </Text>
            </Animated.View>
          ) : null}

          {/* ── Section 1: Policy Type ── */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginBottom: 22 }}>
            <FieldLabel text="Select Life Insurance Type" required />
            <View style={{ gap: 10 }}>
              {POLICY_TYPES.map((type) => {
                const isSelected = policyType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setPolicyType(type);
                      setErrors((e) => ({ ...e, policyType: undefined }));
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderRadius: 14,
                      borderWidth: 2,
                      borderColor: isSelected ? '#6366F1' : '#E5E7EB',
                      backgroundColor: isSelected ? '#EEF2FF' : '#FAFAFA',
                    }}
                  >
                    {/* Radio dot */}
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 2,
                        borderColor: isSelected ? '#6366F1' : '#D1D5DB',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      {isSelected && (
                        <View
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: '#6366F1',
                          }}
                        />
                      )}
                    </View>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 15,
                        color: isSelected ? '#4338CA' : '#374151',
                        fontWeight: isSelected ? '700' : '400',
                      }}
                    >
                      {type}
                    </Text>
                    {isSelected && <Check size={18} color="#6366F1" strokeWidth={3} />}
                  </Pressable>
                );
              })}
            </View>
            <ErrorMsg msg={errors.policyType ?? ''} />
          </Animated.View>

          {/* ── Section 2: Premium Slab ── */}
          <Animated.View entering={FadeInDown.delay(160).springify()} style={{ marginBottom: 22 }}>
            <FieldLabel text="Monthly Premium You Can Pay" required />
            <Pressable
              onPress={() => setShowPremiumModal(true)}
              style={{
                borderWidth: 1.5,
                borderColor: errors.premiumSlab ? '#EF4444' : premiumSlab ? '#6366F1' : '#E5E7EB',
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 15,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: premiumSlab ? '#EEF2FF' : '#FAFAFA',
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: premiumSlab ? '#4338CA' : '#9CA3AF',
                  fontWeight: premiumSlab ? '600' : '400',
                }}
              >
                {premiumSlab || 'Select monthly premium'}
              </Text>
              <ChevronDown size={20} color={premiumSlab ? '#6366F1' : '#9CA3AF'} />
            </Pressable>
            <ErrorMsg msg={errors.premiumSlab ?? ''} />

            {/* Others amount text input */}
            {premiumSlab === 'Others Amount' && (
              <Animated.View entering={FadeInDown.duration(200)} style={{ marginTop: 12 }}>
                <TextInput
                  value={premiumOther}
                  onChangeText={(v) => {
                    setPremiumOther(v.replace(/[^0-9]/g, ''));
                    setErrors((e) => ({ ...e, premiumOther: undefined }));
                  }}
                  keyboardType="numeric"
                  placeholder="Enter monthly premium amount (₹)"
                  placeholderTextColor="#9CA3AF"
                  style={{
                    borderWidth: 1.5,
                    borderColor: errors.premiumOther ? '#EF4444' : '#E5E7EB',
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 15,
                    color: '#111827',
                    backgroundColor: '#FAFAFA',
                  }}
                />
                <ErrorMsg msg={errors.premiumOther ?? ''} />
              </Animated.View>
            )}
          </Animated.View>

          {/* Info notice */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            style={{
              backgroundColor: '#FFF7ED',
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: '#FED7AA',
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <AlertTriangle size={16} color="#F97316" style={{ marginTop: 1 }} />
            <Text style={{ color: '#C2410C', fontSize: 12, flex: 1, lineHeight: 18 }}>
              Your details are used solely to match you with the most suitable life insurance plans. We never share your information without your consent.
            </Text>
          </Animated.View>
        </ScrollView>

        {/* Bottom CTA */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            paddingTop: 16,
            paddingHorizontal: 20,
            paddingBottom: 34,
            borderTopWidth: 1,
            borderTopColor: '#F3F4F6',
            shadowColor: '#000',
            shadowOpacity: 0.06,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: -4 },
            elevation: 8,
            flexDirection: 'row',
            gap: 12,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              flex: 1,
              paddingVertical: 15,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: '#E5E7EB',
              backgroundColor: '#F9FAFB',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#6B7280', fontSize: 15, fontWeight: '600' }}>Back</Text>
          </Pressable>
          <Pressable
            onPress={handleSubmit}
            style={{ flex: 2, borderRadius: 14, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={['#002561', '#003380']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 15, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 }}>
                Submit
              </Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Modals */}
        <PickerModal
          visible={showPremiumModal}
          title="Select Monthly Premium"
          options={PREMIUM_SLABS}
          selected={premiumSlab}
          onSelect={(v) => {
            setPremiumSlab(v);
            setErrors((e) => ({ ...e, premiumSlab: undefined }));
          }}
          onClose={() => setShowPremiumModal(false)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
