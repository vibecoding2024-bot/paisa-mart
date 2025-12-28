import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ChevronDown, Calendar, User, Mail, Briefcase, GraduationCap, IndianRupee, MapPin, Gift, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

const OCCUPATIONS = [
  'Salaried Employee',
  'Self Employed',
  'Business Owner',
  'Student',
  'Homemaker',
  'Retired',
  'Freelancer',
  'Other',
];

const QUALIFICATIONS = [
  '10th Pass',
  '12th Pass',
  'Graduate',
  'Post Graduate',
  'Diploma',
  'PhD',
  'Other',
];

const ANNUAL_INCOMES = [
  'Below 2.5 Lakhs',
  '2.5 - 5 Lakhs',
  '5 - 10 Lakhs',
  '10 - 25 Lakhs',
  '25 - 50 Lakhs',
  'Above 50 Lakhs',
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const YEARS = Array.from({ length: 80 }, (_, i) => String(2006 - i));

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
      <Pressable
        className="flex-1 bg-black/70 justify-end"
        onPress={onClose}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View className="bg-neutral-900 rounded-t-3xl max-h-[70%]">
            <View className="flex-row items-center justify-between p-4 border-b border-amber-500/20">
              <Text className="text-white text-lg font-semibold">{title}</Text>
              <Pressable onPress={onClose} className="p-2">
                <X size={20} color="#D4AF37" />
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
                  className="p-4 border-b border-white/5 active:bg-amber-500/10"
                >
                  <Text className="text-white text-base">{item}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words';
}

function FormInput({ label, value, onChangeText, placeholder, icon, keyboardType = 'default', autoCapitalize = 'sentences' }: FormInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className="mb-4">
      <Text className="text-white/70 text-sm mb-2 ml-1">{label}</Text>
      <View
        className={`flex-row items-center rounded-xl px-4 py-3.5 border ${
          isFocused ? 'border-amber-400' : 'border-amber-500/20'
        }`}
        style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
      >
        {icon}
        <TextInput
          className="flex-1 ml-3 text-white text-base"
          placeholder={placeholder}
          placeholderTextColor="#6B7280"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
      </View>
    </View>
  );
}

interface DropdownInputProps {
  label: string;
  value: string;
  placeholder: string;
  icon: React.ReactNode;
  onPress: () => void;
}

function DropdownInput({ label, value, placeholder, icon, onPress }: DropdownInputProps) {
  return (
    <View className="mb-4">
      <Text className="text-white/70 text-sm mb-2 ml-1">{label}</Text>
      <Pressable
        onPress={() => {
          onPress();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        className="flex-row items-center rounded-xl px-4 py-3.5 border border-amber-500/20"
        style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
      >
        {icon}
        <Text className={`flex-1 ml-3 text-base ${value ? 'text-white' : 'text-gray-500'}`}>
          {value || placeholder}
        </Text>
        <ChevronDown size={20} color="#D4AF37" />
      </Pressable>
    </View>
  );
}

export default function BasicInfoScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [occupation, setOccupation] = useState('');
  const [qualification, setQualification] = useState('');
  const [annualIncome, setAnnualIncome] = useState('');
  const [pincode, setPincode] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const [showOccupationModal, setShowOccupationModal] = useState(false);
  const [showQualificationModal, setShowQualificationModal] = useState(false);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);

  const isFormValid = name.trim() && email.trim() && occupation && qualification && annualIncome && pincode.length === 6 && dobDay && dobMonth && dobYear;

  const handleSubmit = () => {
    if (isFormValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    }
  };

  const formatDob = () => {
    if (dobDay && dobMonth && dobYear) {
      return `${dobDay} ${dobMonth} ${dobYear}`;
    }
    return '';
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#1A1A1A', '#0D0D0D', '#1A1A1A']}
        style={{ flex: 1 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView className="flex-1" edges={['top']}>
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="px-6 pb-6">
              {/* Header */}
              <Animated.View
                entering={FadeInDown.delay(100).springify()}
                className="mt-4 mb-6"
              >
                <Text className="text-3xl font-bold text-white">
                  Basic Information
                </Text>
                <Text className="text-white/60 mt-2 text-base">
                  Complete your profile to get started
                </Text>
              </Animated.View>

              {/* Form */}
              <Animated.View entering={FadeInUp.delay(200).springify()}>
                <FormInput
                  label="Full Name"
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  icon={<User size={20} color="#D4AF37" />}
                  autoCapitalize="words"
                />

                <FormInput
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  icon={<Mail size={20} color="#D4AF37" />}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <DropdownInput
                  label="Occupation"
                  value={occupation}
                  placeholder="Select your occupation"
                  icon={<Briefcase size={20} color="#D4AF37" />}
                  onPress={() => setShowOccupationModal(true)}
                />

                <DropdownInput
                  label="Qualification"
                  value={qualification}
                  placeholder="Select your qualification"
                  icon={<GraduationCap size={20} color="#D4AF37" />}
                  onPress={() => setShowQualificationModal(true)}
                />

                <DropdownInput
                  label="Annual Income"
                  value={annualIncome}
                  placeholder="Select annual income"
                  icon={<IndianRupee size={20} color="#D4AF37" />}
                  onPress={() => setShowIncomeModal(true)}
                />

                <FormInput
                  label="Pincode"
                  value={pincode}
                  onChangeText={(text) => setPincode(text.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit pincode"
                  icon={<MapPin size={20} color="#D4AF37" />}
                  keyboardType="numeric"
                />

                {/* Date of Birth */}
                <View className="mb-4">
                  <Text className="text-white/70 text-sm mb-2 ml-1">Date of Birth</Text>
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => {
                        setShowDayModal(true);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      className="flex-1 flex-row items-center justify-between rounded-xl px-3 py-3.5 border border-amber-500/20"
                      style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                    >
                      <Text className={`text-base ${dobDay ? 'text-white' : 'text-gray-500'}`}>
                        {dobDay || 'Day'}
                      </Text>
                      <ChevronDown size={16} color="#D4AF37" />
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        setShowMonthModal(true);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      className="flex-[2] flex-row items-center justify-between rounded-xl px-3 py-3.5 border border-amber-500/20"
                      style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                    >
                      <Text className={`text-base ${dobMonth ? 'text-white' : 'text-gray-500'}`}>
                        {dobMonth || 'Month'}
                      </Text>
                      <ChevronDown size={16} color="#D4AF37" />
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        setShowYearModal(true);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      className="flex-1 flex-row items-center justify-between rounded-xl px-3 py-3.5 border border-amber-500/20"
                      style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
                    >
                      <Text className={`text-base ${dobYear ? 'text-white' : 'text-gray-500'}`}>
                        {dobYear || 'Year'}
                      </Text>
                      <ChevronDown size={16} color="#D4AF37" />
                    </Pressable>
                  </View>
                </View>

                <FormInput
                  label="Referral Code (Optional)"
                  value={referralCode}
                  onChangeText={setReferralCode}
                  placeholder="Enter referral code"
                  icon={<Gift size={20} color="#D4AF37" />}
                  autoCapitalize="none"
                />

                {/* Submit Button */}
                <Pressable
                  onPress={handleSubmit}
                  disabled={!isFormValid}
                  className="mt-4 mb-8"
                >
                  {({ pressed }) => (
                    <LinearGradient
                      colors={isFormValid ? ['#D4AF37', '#B8860B'] : ['#374151', '#374151']}
                      style={{
                        borderRadius: 16,
                        padding: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.9 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                      }}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text className={`text-lg font-bold ${isFormValid ? 'text-black' : 'text-gray-500'}`}>
                        Submit Profile
                      </Text>
                    </LinearGradient>
                  )}
                </Pressable>
              </Animated.View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* Dropdown Modals */}
      <DropdownModal
        visible={showOccupationModal}
        onClose={() => setShowOccupationModal(false)}
        options={OCCUPATIONS}
        onSelect={setOccupation}
        title="Select Occupation"
      />
      <DropdownModal
        visible={showQualificationModal}
        onClose={() => setShowQualificationModal(false)}
        options={QUALIFICATIONS}
        onSelect={setQualification}
        title="Select Qualification"
      />
      <DropdownModal
        visible={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
        options={ANNUAL_INCOMES}
        onSelect={setAnnualIncome}
        title="Select Annual Income"
      />
      <DropdownModal
        visible={showDayModal}
        onClose={() => setShowDayModal(false)}
        options={DAYS}
        onSelect={setDobDay}
        title="Select Day"
      />
      <DropdownModal
        visible={showMonthModal}
        onClose={() => setShowMonthModal(false)}
        options={MONTHS}
        onSelect={setDobMonth}
        title="Select Month"
      />
      <DropdownModal
        visible={showYearModal}
        onClose={() => setShowYearModal(false)}
        options={YEARS}
        onSelect={setDobYear}
        title="Select Year"
      />
    </View>
  );
}
