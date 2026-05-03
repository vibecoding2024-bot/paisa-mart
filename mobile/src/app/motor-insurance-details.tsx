import { useState, useMemo } from 'react';
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
  Car,
  ChevronDown,
  Check,
  Building2,
  AlertTriangle,
  X,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from '@/lib/haptics';
import {
  useMotorInsuranceStore,
  VEHICLE_TYPES,
  INSURANCE_TYPES,
  VehicleType,
  InsuranceType,
} from '@/lib/motor-insurance-store';
import { useUserProfileStore } from '@/lib/user-profile-store';

// ─── Field Label ────────────────────────────────────────────────
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

// ─── Dropdown Modal ──────────────────────────────────────────────
function DropdownModal<T extends string>({
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
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 34,
            maxHeight: '80%',
          }}
        >
          {/* Handle */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2 }} />
          </View>
          {/* Header */}
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
          <ScrollView showsVerticalScrollIndicator={false}>
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
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: '#F9FAFB',
                    backgroundColor: isSelected ? '#EFF6FF' : '#fff',
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 15,
                      color: isSelected ? '#1D4ED8' : '#374151',
                      fontWeight: isSelected ? '700' : '400',
                    }}
                  >
                    {opt}
                  </Text>
                  {isSelected && <Check size={18} color="#1D4ED8" strokeWidth={3} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Year Dropdown ───────────────────────────────────────────────
function YearDropdownModal({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: string;
  onSelect: (y: string) => void;
  onClose: () => void;
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1989 }, (_, i) =>
    String(currentYear - i)
  );
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: '#fff',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 34,
            maxHeight: '70%',
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
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>
              Select Model Year
            </Text>
            <Pressable onPress={onClose}>
              <X size={20} color="#6B7280" />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {years.map((y) => {
              const isSelected = selected === y;
              return (
                <Pressable
                  key={y}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onSelect(y);
                    onClose();
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                    borderBottomWidth: 1,
                    borderBottomColor: '#F9FAFB',
                    backgroundColor: isSelected ? '#EFF6FF' : '#fff',
                  }}
                >
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 15,
                      color: isSelected ? '#1D4ED8' : '#374151',
                      fontWeight: isSelected ? '700' : '400',
                    }}
                  >
                    {y}
                  </Text>
                  {isSelected && <Check size={18} color="#1D4ED8" strokeWidth={3} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────
export default function MotorInsuranceDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ insurer?: string }>();
  const insurer = params.insurer || '';

  const addApplication = useMotorInsuranceStore((s) => s.addApplication);
  const profile = useUserProfileStore((s) => s.profile);

  const [vehicleType, setVehicleType] = useState<VehicleType | ''>('');
  const [vehicleOther, setVehicleOther] = useState('');
  const [insuranceType, setInsuranceType] = useState<InsuranceType | ''>('');
  const [modelYear, setModelYear] = useState('');

  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);

  const [errors, setErrors] = useState<{
    vehicleType?: string;
    vehicleOther?: string;
    insuranceType?: string;
    modelYear?: string;
  }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!vehicleType) e.vehicleType = 'Please select a vehicle type.';
    if (vehicleType === 'Others' && !vehicleOther.trim())
      e.vehicleOther = 'Please enter your vehicle type.';
    if (!insuranceType) e.insuranceType = 'Please select an insurance type.';
    if (!modelYear) e.modelYear = 'Please select the model year.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    const userName = profile?.name || 'User';
    const phoneNumber = profile?.phoneNumber || '—';

    addApplication({
      user_name: userName,
      phone_number: phoneNumber,
      selected_motor_insurer: insurer,
      vehicle_type: vehicleType as VehicleType,
      vehicle_type_other_text: vehicleType === 'Others' ? vehicleOther.trim() : '',
      insurance_type: insuranceType as InsuranceType,
      model_year: modelYear,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Alert.alert(
      'Application Submitted!',
      'Your motor insurance query has been received. Our team will review your details and reach out with tailored offers.',
      [
        {
          text: 'View Offers',
          onPress: () =>
            router.replace({
              pathname: '/(tabs)/products',
              params: { category: 'motor-insurance' },
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
                  Motor Insurance
                </Text>
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 2 }}>
                  Get Your Quote
                </Text>
              </View>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'rgba(14,165,233,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Car size={24} color="#38BDF8" />
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
              Fill in your vehicle details for an instant insurance quote
            </Text>
          </Animated.View>

          {/* Insurer badge */}
          {insurer ? (
            <Animated.View
              entering={FadeInDown.delay(80).springify()}
              style={{
                backgroundColor: '#EFF6FF',
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 16,
                marginBottom: 22,
                borderWidth: 1,
                borderColor: '#BFDBFE',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Building2 size={15} color="#2563EB" />
              <Text style={{ color: '#1D4ED8', fontSize: 13, fontWeight: '600', flex: 1 }}>
                Selected Provider: {insurer}
              </Text>
            </Animated.View>
          ) : null}

          {/* ── Section 1: Vehicle Type ── */}
          <Animated.View entering={FadeInDown.delay(100).springify()} style={{ marginBottom: 22 }}>
            <FieldLabel text="Select Vehicle Type" required />
            <Pressable
              onPress={() => setShowVehicleModal(true)}
              style={{
                borderWidth: 1.5,
                borderColor: errors.vehicleType ? '#EF4444' : vehicleType ? '#0EA5E9' : '#E5E7EB',
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 15,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: vehicleType ? '#F0F9FF' : '#FAFAFA',
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: vehicleType ? '#0369A1' : '#9CA3AF',
                  fontWeight: vehicleType ? '600' : '400',
                }}
              >
                {vehicleType || 'Select vehicle type'}
              </Text>
              <ChevronDown size={20} color={vehicleType ? '#0EA5E9' : '#9CA3AF'} />
            </Pressable>
            <ErrorMsg msg={errors.vehicleType ?? ''} />

            {/* Others text input */}
            {vehicleType === 'Others' && (
              <Animated.View entering={FadeInDown.duration(200)} style={{ marginTop: 12 }}>
                <TextInput
                  value={vehicleOther}
                  onChangeText={(v) => {
                    setVehicleOther(v);
                    setErrors((e) => ({ ...e, vehicleOther: undefined }));
                  }}
                  placeholder="Enter your vehicle type"
                  placeholderTextColor="#9CA3AF"
                  style={{
                    borderWidth: 1.5,
                    borderColor: errors.vehicleOther ? '#EF4444' : '#E5E7EB',
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    fontSize: 15,
                    color: '#111827',
                    backgroundColor: '#FAFAFA',
                  }}
                />
                <ErrorMsg msg={errors.vehicleOther ?? ''} />
              </Animated.View>
            )}
          </Animated.View>

          {/* ── Section 2: Insurance Type ── */}
          <Animated.View entering={FadeInDown.delay(140).springify()} style={{ marginBottom: 22 }}>
            <FieldLabel text="Select Insurance Type" required />
            <View style={{ gap: 10 }}>
              {INSURANCE_TYPES.map((type) => {
                const isSelected = insuranceType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setInsuranceType(type);
                      setErrors((e) => ({ ...e, insuranceType: undefined }));
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderRadius: 14,
                      borderWidth: 2,
                      borderColor: isSelected ? '#0EA5E9' : '#E5E7EB',
                      backgroundColor: isSelected ? '#F0F9FF' : '#FAFAFA',
                    }}
                  >
                    {/* Radio circle */}
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 2,
                        borderColor: isSelected ? '#0EA5E9' : '#D1D5DB',
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
                            backgroundColor: '#0EA5E9',
                          }}
                        />
                      )}
                    </View>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 15,
                        color: isSelected ? '#0369A1' : '#374151',
                        fontWeight: isSelected ? '700' : '400',
                      }}
                    >
                      {type}
                    </Text>
                    {isSelected && <Check size={18} color="#0EA5E9" strokeWidth={3} />}
                  </Pressable>
                );
              })}
            </View>
            <ErrorMsg msg={errors.insuranceType ?? ''} />
          </Animated.View>

          {/* ── Section 3: Model Year ── */}
          <Animated.View entering={FadeInDown.delay(180).springify()} style={{ marginBottom: 22 }}>
            <FieldLabel text="Vehicle Model Year" required />
            <Pressable
              onPress={() => setShowYearModal(true)}
              style={{
                borderWidth: 1.5,
                borderColor: errors.modelYear ? '#EF4444' : modelYear ? '#0EA5E9' : '#E5E7EB',
                borderRadius: 14,
                paddingHorizontal: 16,
                paddingVertical: 15,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: modelYear ? '#F0F9FF' : '#FAFAFA',
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontSize: 15,
                  color: modelYear ? '#0369A1' : '#9CA3AF',
                  fontWeight: modelYear ? '600' : '400',
                }}
              >
                {modelYear || 'Select year'}
              </Text>
              <ChevronDown size={20} color={modelYear ? '#0EA5E9' : '#9CA3AF'} />
            </Pressable>
            <ErrorMsg msg={errors.modelYear ?? ''} />
          </Animated.View>

          {/* Info notice */}
          <Animated.View
            entering={FadeInDown.delay(220).springify()}
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
              Your vehicle details are used only to find the best insurance plan. We do not share your data without consent.
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
        <DropdownModal
          visible={showVehicleModal}
          title="Select Vehicle Type"
          options={VEHICLE_TYPES}
          selected={vehicleType}
          onSelect={(v) => {
            setVehicleType(v);
            setErrors((e) => ({ ...e, vehicleType: undefined }));
          }}
          onClose={() => setShowVehicleModal(false)}
        />
        <YearDropdownModal
          visible={showYearModal}
          selected={modelYear}
          onSelect={(y) => {
            setModelYear(y);
            setErrors((e) => ({ ...e, modelYear: undefined }));
          }}
          onClose={() => setShowYearModal(false)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
