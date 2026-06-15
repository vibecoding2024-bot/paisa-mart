import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ChevronDown, User, Mail, Briefcase, GraduationCap, IndianRupee, MapPin, Gift, X, Phone, CreditCard, Calendar } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import { useUserProfileStore } from '@/lib/user-profile-store';

const OCCUPATIONS = [
  'Salaried Employee', 'Self Employed', 'Business Owner',
  'Student', 'Homemaker', 'Retired', 'Freelancer', 'Other',
];
const QUALIFICATIONS = [
  '10th Pass', '12th Pass', 'Graduate', 'Post Graduate', 'Diploma', 'PhD', 'Other',
];
const ANNUAL_INCOMES = [
  '5 Lakhs to 7 Lakhs', '7.5 Lakhs to 10 Lakhs', '10 Lakhs to 15 Lakhs',
  '15 Lakhs to 20 Lakhs', '20 Lakhs to 30 Lakhs', '30 Lakhs and Above',
];
const CIBIL_SCORE_RANGES = [
  '300–549 (Poor)', '550–649 (Fair)', '650–749 (Good)',
  '750–799 (Very Good)', '800–900 (Excellent)', "I don't know my score",
];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const YEARS = Array.from({ length: 80 }, (_, i) => String(2006 - i));

// ─────────────────────────────────────────────
// Native Modal Dropdown (mobile)
// ─────────────────────────────────────────────
interface DropdownModalProps {
  visible: boolean;
  onClose: () => void;
  options: string[];
  onSelect: (value: string) => void;
  title: string;
}

function DropdownModal({ visible, onClose, options, onSelect, title }: DropdownModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
              <Text style={{ color: '#1F2937', fontSize: 18, fontWeight: '600' }}>{title}</Text>
              <Pressable onPress={onClose} style={{ padding: 8 }}>
                <X size={20} color="#6B7280" />
              </Pressable>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onSelect(item);
                    onClose();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={({ pressed }) => ({
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: '#F9FAFB',
                    backgroundColor: pressed ? '#FFF7ED' : 'white',
                  })}
                >
                  <Text style={{ color: '#374151', fontSize: 16 }}>{item}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// SmartSelect — HTML <select> on web, Modal on native
// ─────────────────────────────────────────────
interface SmartSelectProps {
  label: string;
  value: string;
  placeholder: string;
  icon: React.ReactNode;
  options: string[];
  onSelect: (value: string) => void;
  optional?: boolean;
}

function SmartSelect({ label, value, placeholder, icon, options, onSelect, optional }: SmartSelectProps) {
  const [showModal, setShowModal] = useState(false);

  if (Platform.OS === 'web') {
    return (
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: '#4B5563', fontSize: 13, marginBottom: 6, marginLeft: 2 }}>
          {label}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F9FAFB',
            borderRadius: 12,
            paddingHorizontal: 16,
            borderWidth: 2,
            borderColor: value ? '#FF8C00' : '#E5E7EB',
            minHeight: 52,
            transition: 'border-color 0.2s ease',
          } as any}
        >
          {icon}
          {/* @ts-ignore */}
          <select
            value={value || ''}
            onChange={(e: any) => onSelect(e.target.value)}
            style={{
              flex: 1,
              marginLeft: 10,
              fontSize: 15,
              color: value ? '#1F2937' : '#9CA3AF',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              cursor: 'pointer',
              height: 48,
              appearance: 'none',
              WebkitAppearance: 'none',
              width: '100%',
              fontFamily: 'inherit',
            } as any}
          >
            {/* @ts-ignore */}
            <option value="" disabled style={{ color: '#9CA3AF' }}>
              {placeholder}
            </option>
            {options.map((opt) => (
              // @ts-ignore
              <option key={opt} value={opt} style={{ color: '#1F2937' }}>
                {opt}
              </option>
            ))}
          </select>
          <ChevronDown size={18} color={value ? '#FF8C00' : '#9CA3AF'} />
        </View>
      </View>
    );
  }

  // Native: existing pressable + modal
  return (
    <>
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: '#4B5563', fontSize: 13, marginBottom: 6, marginLeft: 2 }}>
          {label}
        </Text>
        <Pressable
          onPress={() => {
            setShowModal(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F9FAFB',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderWidth: 2,
            borderColor: value ? '#FF8C00' : '#E5E7EB',
            minHeight: 52,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          {icon}
          <Text style={{ flex: 1, marginLeft: 12, fontSize: 15, color: value ? '#1F2937' : '#9CA3AF' }}>
            {value || placeholder}
          </Text>
          <ChevronDown size={18} color={value ? '#FF8C00' : '#9CA3AF'} />
        </Pressable>
      </View>
      <DropdownModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        options={options}
        onSelect={onSelect}
        title={`Select ${label.replace(' (Optional)', '')}`}
      />
    </>
  );
}

// ─────────────────────────────────────────────
// SmartDobPicker — inline date pickers for web
// ─────────────────────────────────────────────
interface SmartDobPickerProps {
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  setDobDay: (v: string) => void;
  setDobMonth: (v: string) => void;
  setDobYear: (v: string) => void;
  showDayModal: boolean;
  showMonthModal: boolean;
  showYearModal: boolean;
  setShowDayModal: (v: boolean) => void;
  setShowMonthModal: (v: boolean) => void;
  setShowYearModal: (v: boolean) => void;
}

function SmartDobPicker({
  dobDay, dobMonth, dobYear,
  setDobDay, setDobMonth, setDobYear,
  showDayModal, showMonthModal, showYearModal,
  setShowDayModal, setShowMonthModal, setShowYearModal,
}: SmartDobPickerProps) {
  if (Platform.OS === 'web') {
    const selectStyle = (value: string): any => ({
      flex: 1,
      fontSize: 14,
      color: value ? '#1F2937' : '#9CA3AF',
      background: 'transparent',
      border: 'none',
      outline: 'none',
      cursor: 'pointer',
      height: 44,
      appearance: 'none',
      WebkitAppearance: 'none',
      fontFamily: 'inherit',
      width: '100%',
    });

    const boxStyle = (value: string): any => ({
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F9FAFB',
      borderRadius: 12,
      paddingHorizontal: 10,
      borderWidth: 2,
      borderColor: value ? '#FF8C00' : '#E5E7EB',
      minHeight: 48,
      transition: 'border-color 0.2s ease',
      overflow: 'hidden',
    });

    return (
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, marginLeft: 2, gap: 6 }}>
          <Calendar size={14} color="#4B5563" />
          <Text style={{ color: '#4B5563', fontSize: 13 }}>Date of Birth</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Day */}
          <View style={{ ...boxStyle(dobDay), flex: 1 }}>
            {/* @ts-ignore */}
            <select value={dobDay || ''} onChange={(e: any) => setDobDay(e.target.value)} style={selectStyle(dobDay)}>
              {/* @ts-ignore */}
              <option value="" disabled>Day</option>
              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown size={14} color={dobDay ? '#FF8C00' : '#9CA3AF'} />
          </View>

          {/* Month */}
          <View style={{ ...boxStyle(dobMonth), flex: 2 }}>
            {/* @ts-ignore */}
            <select value={dobMonth || ''} onChange={(e: any) => setDobMonth(e.target.value)} style={selectStyle(dobMonth)}>
              {/* @ts-ignore */}
              <option value="" disabled>Month</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <ChevronDown size={14} color={dobMonth ? '#FF8C00' : '#9CA3AF'} />
          </View>

          {/* Year */}
          <View style={{ ...boxStyle(dobYear), flex: 1.4 }}>
            {/* @ts-ignore */}
            <select value={dobYear || ''} onChange={(e: any) => setDobYear(e.target.value)} style={selectStyle(dobYear)}>
              {/* @ts-ignore */}
              <option value="" disabled>Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <ChevronDown size={14} color={dobYear ? '#FF8C00' : '#9CA3AF'} />
          </View>
        </View>
      </View>
    );
  }

  // Native: original pressable UI
  return (
    <>
      <View style={{ marginBottom: 16 }}>
        <Text style={{ color: '#4B5563', fontSize: 13, marginBottom: 6, marginLeft: 2 }}>Date of Birth</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => { setShowDayModal(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 2, borderColor: dobDay ? '#FF8C00' : '#E5E7EB', minHeight: 52 }}
          >
            <Text style={{ fontSize: 14, color: dobDay ? '#1F2937' : '#9CA3AF' }}>{dobDay || 'Day'}</Text>
            <ChevronDown size={14} color={dobDay ? '#FF8C00' : '#9CA3AF'} />
          </Pressable>
          <Pressable
            onPress={() => { setShowMonthModal(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={{ flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 2, borderColor: dobMonth ? '#FF8C00' : '#E5E7EB', minHeight: 52 }}
          >
            <Text style={{ fontSize: 14, color: dobMonth ? '#1F2937' : '#9CA3AF' }}>{dobMonth || 'Month'}</Text>
            <ChevronDown size={14} color={dobMonth ? '#FF8C00' : '#9CA3AF'} />
          </Pressable>
          <Pressable
            onPress={() => { setShowYearModal(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={{ flex: 1.4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, borderWidth: 2, borderColor: dobYear ? '#FF8C00' : '#E5E7EB', minHeight: 52 }}
          >
            <Text style={{ fontSize: 14, color: dobYear ? '#1F2937' : '#9CA3AF' }}>{dobYear || 'Year'}</Text>
            <ChevronDown size={14} color={dobYear ? '#FF8C00' : '#9CA3AF'} />
          </Pressable>
        </View>
      </View>
      <DropdownModal visible={showDayModal} onClose={() => setShowDayModal(false)} options={DAYS} onSelect={setDobDay} title="Select Day" />
      <DropdownModal visible={showMonthModal} onClose={() => setShowMonthModal(false)} options={MONTHS} onSelect={setDobMonth} title="Select Month" />
      <DropdownModal visible={showYearModal} onClose={() => setShowYearModal(false)} options={YEARS} onSelect={setDobYear} title="Select Year" />
    </>
  );
}

// ─────────────────────────────────────────────
// FormInput — text input with web-smooth focus
// ─────────────────────────────────────────────
interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words';
  maxLength?: number;
}

function FormInput({ label, value, onChangeText, placeholder, icon, keyboardType = 'default', autoCapitalize = 'sentences', maxLength }: FormInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: '#4B5563', fontSize: 13, marginBottom: 6, marginLeft: 2 }}>{label}</Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#F9FAFB',
          borderRadius: 12,
          paddingHorizontal: 16,
          borderWidth: 2,
          borderColor: isFocused ? '#FF8C00' : '#E5E7EB',
          minHeight: 52,
          ...(Platform.OS === 'web' ? { transition: 'border-color 0.2s ease' } as any : {}),
        }}
      >
        {icon}
        <TextInput
          style={{
            flex: 1,
            marginLeft: 12,
            color: '#1F2937',
            fontSize: 15,
            height: 48,
            paddingVertical: 0,
            ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
          }}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          returnKeyType="done"
          maxLength={maxLength}
        />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// PhoneInput
// ─────────────────────────────────────────────
function PhoneInput({ value, onChangeText }: { value: string; onChangeText: (t: string) => void }) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 2,
        borderColor: isFocused ? '#FF8C00' : '#E5E7EB',
        minHeight: 52,
        ...(Platform.OS === 'web' ? { transition: 'border-color 0.2s ease' } as any : {}),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12, paddingRight: 12, borderRightWidth: 1, borderRightColor: '#D1D5DB' }}>
        <Text style={{ color: '#374151', fontWeight: '600', fontSize: 15 }}>+91</Text>
      </View>
      <Phone size={18} color="#6B7280" />
      <TextInput
        style={{
          flex: 1,
          marginLeft: 10,
          color: '#1F2937',
          fontSize: 15,
          height: 48,
          paddingVertical: 0,
          ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
        }}
        placeholder="Enter phone number"
        placeholderTextColor="#9CA3AF"
        keyboardType="number-pad"
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        maxLength={10}
        autoCorrect={false}
        textContentType="telephoneNumber"
        returnKeyType="done"
      />
    </View>
  );
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function BasicInfoScreen() {
  const router = useRouter();
  const setProfile = useUserProfileStore((s) => s.setProfile);

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [occupation, setOccupation] = useState('');
  const [qualification, setQualification] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');
  const [cibilScoreRange, setCibilScoreRange] = useState('');
  const [pincode, setPincode] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // Native-only modal states (SmartSelect manages its own for most)
  const [showDayModal, setShowDayModal] = useState(false);
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);

  const isFormValid = !!(
    name.trim() && phoneNumber.length === 10 && email.trim() &&
    occupation && qualification && annualIncome &&
    pincode.length === 6 && dobDay && dobMonth && dobYear
  );

  const handleSubmit = () => {
    if (!isFormValid) return;
    setProfile({
      name: name.trim(),
      phoneNumber,
      email: email.trim(),
      occupation,
      qualification,
      annualIncome,
      pincode,
      cibilScore: cibilScoreRange,
      dateOfBirth: dobDay && dobMonth && dobYear ? { day: dobDay, month: dobMonth, year: dobYear } : undefined,
      createdAt: new Date().toISOString(),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)');
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          {/* Header */}
          <LinearGradient
            colors={['#002561', '#003380']}
            style={{ paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}
          >
            <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <Text style={{ color: 'white', fontSize: 20, fontWeight: '600' }}>Complete Your Profile</Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>Fill in your details to get started</Text>
              </Animated.View>
            </View>
          </LinearGradient>

          <ScrollView
            style={{ flex: 1, marginTop: -16 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
              <Animated.View
                entering={FadeInUp.delay(200).springify()}
                style={{
                  marginHorizontal: 20,
                  backgroundColor: 'white',
                  borderRadius: 20,
                  padding: 20,
                  marginBottom: 24,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.08,
                  shadowRadius: 16,
                  elevation: 8,
                }}
              >
                <FormInput
                  label="Full Name"
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  icon={<User size={18} color="#6B7280" />}
                  autoCapitalize="words"
                />

                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: '#4B5563', fontSize: 13, marginBottom: 6, marginLeft: 2 }}>Phone Number</Text>
                  <PhoneInput
                    value={phoneNumber}
                    onChangeText={(t) => setPhoneNumber(t.replace(/\D/g, '').slice(0, 10))}
                  />
                </View>

                <FormInput
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  icon={<Mail size={18} color="#6B7280" />}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <SmartSelect
                  label="CIBIL Score Range (Optional)"
                  value={cibilScoreRange}
                  placeholder="Select your CIBIL score range"
                  icon={<CreditCard size={18} color="#6B7280" />}
                  options={CIBIL_SCORE_RANGES}
                  onSelect={setCibilScoreRange}
                  optional
                />

                <SmartSelect
                  label="Occupation"
                  value={occupation}
                  placeholder="Select your occupation"
                  icon={<Briefcase size={18} color="#6B7280" />}
                  options={OCCUPATIONS}
                  onSelect={setOccupation}
                />

                <SmartSelect
                  label="Qualification"
                  value={qualification}
                  placeholder="Select your qualification"
                  icon={<GraduationCap size={18} color="#6B7280" />}
                  options={QUALIFICATIONS}
                  onSelect={setQualification}
                />

                <SmartSelect
                  label="Annual Income"
                  value={annualIncome}
                  placeholder="Select annual income"
                  icon={<IndianRupee size={18} color="#6B7280" />}
                  options={ANNUAL_INCOMES}
                  onSelect={setAnnualIncome}
                />

                <FormInput
                  label="Pincode"
                  value={pincode}
                  onChangeText={(t) => setPincode(t.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit pincode"
                  icon={<MapPin size={18} color="#6B7280" />}
                  keyboardType="numeric"
                  maxLength={6}
                />

                <SmartDobPicker
                  dobDay={dobDay} dobMonth={dobMonth} dobYear={dobYear}
                  setDobDay={setDobDay} setDobMonth={setDobMonth} setDobYear={setDobYear}
                  showDayModal={showDayModal} showMonthModal={showMonthModal} showYearModal={showYearModal}
                  setShowDayModal={setShowDayModal} setShowMonthModal={setShowMonthModal} setShowYearModal={setShowYearModal}
                />

                <FormInput
                  label="Referral Code (Optional)"
                  value={referralCode}
                  onChangeText={setReferralCode}
                  placeholder="Enter referral code"
                  icon={<Gift size={18} color="#6B7280" />}
                  autoCapitalize="none"
                />

                {/* Progress indicator */}
                <View style={{ marginBottom: 16, marginTop: 4 }}>
                  {(() => {
                    const filled = [name.trim(), phoneNumber.length === 10, email.trim(), occupation, qualification, annualIncome, pincode.length === 6, dobDay, dobMonth, dobYear].filter(Boolean).length;
                    const pct = Math.round((filled / 10) * 100);
                    return (
                      <>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={{ fontSize: 12, color: '#6B7280' }}>Profile completion</Text>
                          <Text style={{ fontSize: 12, color: '#FF8C00', fontWeight: '600' }}>{pct}%</Text>
                        </View>
                        <View style={{ height: 4, backgroundColor: '#F3F4F6', borderRadius: 4 }}>
                          <View style={{ height: 4, width: `${pct}%` as any, backgroundColor: pct === 100 ? '#22C55E' : '#FF8C00', borderRadius: 4 }} />
                        </View>
                      </>
                    );
                  })()}
                </View>

                {/* Submit Button */}
                <Pressable
                  onPress={handleSubmit}
                  disabled={!isFormValid}
                  style={({ pressed }) => ({
                    borderRadius: 14,
                    paddingVertical: 15,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isFormValid ? '#FF8C00' : '#E5E7EB',
                    opacity: pressed ? 0.88 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                    ...(Platform.OS === 'web' ? { transition: 'all 0.15s ease', cursor: isFormValid ? 'pointer' : 'not-allowed' } as any : {}),
                  })}
                >
                  <Text style={{ fontSize: 16, fontWeight: '700', color: isFormValid ? 'white' : '#9CA3AF' }}>
                    {isFormValid ? 'Submit Profile →' : 'Fill all required fields'}
                  </Text>
                </Pressable>
              </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
