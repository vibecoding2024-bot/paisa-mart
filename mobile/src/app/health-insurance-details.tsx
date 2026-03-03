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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  MapPin,
  Minus,
  Plus,
  HeartPulse,
  Check,
  AlertTriangle,
  Building2,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useHealthInsuranceStore, InsuranceMember, MEMBER_LABELS } from '@/lib/health-insurance-store';
import { useUserProfileStore } from '@/lib/user-profile-store';

function FieldLabel({ text, required }: { text: string; required?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 8 }}>
      <Text style={{ color: '#374151', fontWeight: '600', fontSize: 14 }}>{text}</Text>
      {required && (
        <Text style={{ color: '#EF4444', marginLeft: 4, fontSize: 14 }}>*</Text>
      )}
    </View>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return msg ? (
    <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 5, marginLeft: 2 }}>{msg}</Text>
  ) : null;
}

export default function HealthInsuranceDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ members: string; insurer: string }>();
  const addApplication = useHealthInsuranceStore((s) => s.addApplication);
  const profile = useUserProfileStore((s) => s.profile);

  const selectedMembers: InsuranceMember[] = useMemo(() => {
    if (!params.members) return [];
    return params.members.split(',') as InsuranceMember[];
  }, [params.members]);

  const showAge = selectedMembers.includes('myself') || selectedMembers.includes('spouse');
  const showChildren = selectedMembers.includes('children');

  const [elderAge, setElderAge] = useState('');
  const [childrenCount, setChildrenCount] = useState(0);
  const [pincode, setPincode] = useState('');
  const [preExisting, setPreExisting] = useState<'Yes' | 'No'>('No');

  const [errors, setErrors] = useState<{ elderAge?: string; pincode?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (showAge) {
      const age = Number(elderAge);
      if (!elderAge || isNaN(age)) {
        newErrors.elderAge = 'Please enter age.';
      } else if (age < 18 || age > 99) {
        newErrors.elderAge = 'Age must be between 18 and 99.';
      }
    }
    if (!pincode || pincode.length !== 6) {
      newErrors.pincode = 'Enter a valid 6-digit pincode.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleViewPlans = () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    const userName = profile?.name || 'User';
    const phoneNumber = profile?.phoneNumber || '—';

    addApplication({
      user_name: userName,
      phone_number: phoneNumber,
      selected_health_insurer: params.insurer || '',
      selected_members: selectedMembers,
      elder_age: showAge ? elderAge : '',
      children_count: showChildren ? childrenCount : 0,
      pincode,
      pre_existing_disease: preExisting,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Alert.alert(
      'Application Submitted!',
      'Your health insurance query has been received. Our team will review your details and reach out with tailored plans.',
      [
        {
          text: 'View Plans',
          onPress: () =>
            router.replace({
              pathname: '/(tabs)/products',
              params: { category: 'health-insurance' },
            }),
        },
      ]
    );
  };

  const memberSummary = selectedMembers.map((m) => MEMBER_LABELS[m]).join(', ');

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
                  Health Insurance — Step 2
                </Text>
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 2 }}>
                  Let's find your perfect plan
                </Text>
              </View>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'rgba(34,197,94,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <HeartPulse size={24} color="#22C55E" />
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
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <Text style={{ color: '#6B7280', fontSize: 14, marginBottom: 20 }}>
              Enter details for a customised experience
            </Text>
          </Animated.View>

          {/* Selected insurer badge */}
          {params.insurer ? (
            <Animated.View
              entering={FadeInDown.delay(90).springify()}
              style={{
                backgroundColor: '#EFF6FF',
                borderRadius: 12,
                paddingVertical: 10,
                paddingHorizontal: 16,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: '#BFDBFE',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Building2 size={15} color="#2563EB" />
              <Text style={{ color: '#1D4ED8', fontSize: 13, fontWeight: '600', flex: 1 }}>
                Selected Insurer: {params.insurer}
              </Text>
            </Animated.View>
          ) : null}

          {/* Selected members recap */}
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={{
              backgroundColor: '#F0FDF4',
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 16,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: '#BBF7D0',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Check size={16} color="#15803D" />
            <Text style={{ color: '#15803D', fontSize: 13, fontWeight: '600', marginLeft: 8, flex: 1 }}>
              Insuring: {memberSummary}
            </Text>
          </Animated.View>

          {/* Field A: Elder age */}
          {showAge && (
            <Animated.View entering={FadeInDown.delay(140).springify()} style={{ marginBottom: 22 }}>
              <FieldLabel text="Age of the eldest member (Self / Spouse)" required />
              <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 8 }}>
                Enter the age of the oldest person between yourself and your spouse
              </Text>
              <TextInput
                value={elderAge}
                onChangeText={(v) => {
                  setElderAge(v.replace(/[^0-9]/g, ''));
                  setErrors((e) => ({ ...e, elderAge: undefined }));
                }}
                keyboardType="numeric"
                placeholder="Enter age (e.g. 35)"
                placeholderTextColor="#9CA3AF"
                maxLength={2}
                style={{
                  borderWidth: 1.5,
                  borderColor: errors.elderAge ? '#EF4444' : '#E5E7EB',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 16,
                  color: '#111827',
                  backgroundColor: '#FAFAFA',
                }}
              />
              <ErrorMsg msg={errors.elderAge ?? ''} />
            </Animated.View>
          )}

          {/* Field B: Children count */}
          {showChildren && (
            <Animated.View entering={FadeInDown.delay(180).springify()} style={{ marginBottom: 22 }}>
              <FieldLabel text="Number of children" required />
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: '#E5E7EB',
                  borderRadius: 12,
                  backgroundColor: '#FAFAFA',
                  overflow: 'hidden',
                }}
              >
                <Pressable
                  onPress={() => {
                    if (childrenCount > 0) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setChildrenCount((c) => c - 1);
                    }
                  }}
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                    backgroundColor: childrenCount > 0 ? '#F3F4F6' : '#F9FAFB',
                  }}
                >
                  <Minus size={20} color={childrenCount > 0 ? '#374151' : '#D1D5DB'} />
                </Pressable>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: '#111827' }}>
                    {childrenCount}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>
                    {childrenCount === 1 ? 'child' : 'children'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    if (childrenCount < 6) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setChildrenCount((c) => c + 1);
                    }
                  }}
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                    backgroundColor: childrenCount < 6 ? '#F3F4F6' : '#F9FAFB',
                  }}
                >
                  <Plus size={20} color={childrenCount < 6 ? '#374151' : '#D1D5DB'} />
                </Pressable>
              </View>
              <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 6 }}>Maximum 6 children</Text>
            </Animated.View>
          )}

          {/* Field C: Pincode */}
          <Animated.View entering={FadeInDown.delay(220).springify()} style={{ marginBottom: 22 }}>
            <FieldLabel text="Current Address Pincode" required />
            <View style={{ position: 'relative' }}>
              <TextInput
                value={pincode}
                onChangeText={(v) => {
                  setPincode(v.replace(/[^0-9]/g, ''));
                  setErrors((e) => ({ ...e, pincode: undefined }));
                }}
                keyboardType="numeric"
                placeholder="Enter 6-digit pincode"
                placeholderTextColor="#9CA3AF"
                maxLength={6}
                style={{
                  borderWidth: 1.5,
                  borderColor: errors.pincode ? '#EF4444' : '#E5E7EB',
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  paddingRight: 48,
                  fontSize: 16,
                  color: '#111827',
                  backgroundColor: '#FAFAFA',
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  right: 16,
                  top: 0,
                  bottom: 0,
                  justifyContent: 'center',
                }}
              >
                <MapPin size={20} color={errors.pincode ? '#EF4444' : '#9CA3AF'} />
              </View>
            </View>
            <ErrorMsg msg={errors.pincode ?? ''} />
          </Animated.View>

          {/* Field D: Pre-existing disease */}
          <Animated.View entering={FadeInDown.delay(260).springify()} style={{ marginBottom: 24 }}>
            <FieldLabel text="Pre-existing Disease?" required />
            <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 10 }}>
              E.g. diabetes, hypertension, heart disease, etc.
            </Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {(['Yes', 'No'] as const).map((opt) => {
                const isActive = preExisting === opt;
                const activeColor = opt === 'Yes' ? '#EF4444' : '#22C55E';
                return (
                  <Pressable
                    key={opt}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setPreExisting(opt);
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: isActive ? activeColor : '#E5E7EB',
                      backgroundColor: isActive ? activeColor + '15' : '#FAFAFA',
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    {isActive && (
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: activeColor,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check size={12} color="#fff" strokeWidth={3} />
                      </View>
                    )}
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '700',
                        color: isActive ? activeColor : '#6B7280',
                      }}
                    >
                      {opt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* Info notice */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
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
              Your information is used only to match you with the most suitable plans. We do not share your data without consent.
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
            onPress={handleViewPlans}
            style={{ flex: 2, borderRadius: 14, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={['#002561', '#003380']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 15,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 }}>
                View Plans
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
