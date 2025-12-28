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
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { ChevronDown, User, Mail, Briefcase, GraduationCap, IndianRupee, MapPin, Gift, X, Phone } from 'lucide-react-native';
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
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View className="bg-white rounded-t-3xl max-h-[70%]">
            <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
              <Text className="text-gray-800 text-lg font-semibold">{title}</Text>
              <Pressable onPress={onClose} className="p-2">
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
                  className="p-4 border-b border-gray-50 active:bg-orange-50"
                >
                  <Text className="text-gray-700 text-base">{item}</Text>
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
      <Text className="text-gray-600 text-sm mb-2 ml-1">{label}</Text>
      <View
        className={`flex-row items-center bg-gray-50 rounded-xl px-4 border-2 ${
          isFocused ? 'border-orange-500' : 'border-gray-200'
        }`}
        style={{ minHeight: 56 }}
      >
        {icon}
        <TextInput
          className="flex-1 ml-3 text-gray-800 text-base"
          style={{ height: 50, fontSize: 16, paddingVertical: 0 }}
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
      <Text className="text-gray-600 text-sm mb-2 ml-1">{label}</Text>
      <Pressable
        onPress={() => {
          onPress();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border-2 border-gray-200"
        style={{ minHeight: 52 }}
      >
        {icon}
        <Text className={`flex-1 ml-3 text-base ${value ? 'text-gray-800' : 'text-gray-400'}`}>
          {value || placeholder}
        </Text>
        <ChevronDown size={20} color="#6B7280" />
      </Pressable>
    </View>
  );
}

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

function PhoneInput({ value, onChangeText }: PhoneInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      className={`flex-row items-center bg-gray-50 rounded-xl px-4 border-2 ${
        isFocused ? 'border-orange-500' : 'border-gray-200'
      }`}
      style={{ minHeight: 56 }}
    >
      <View className="flex-row items-center mr-3 pr-3 border-r border-gray-300">
        <Text className="text-gray-700 font-semibold">+91</Text>
      </View>
      <Phone size={20} color="#6B7280" />
      <TextInput
        className="flex-1 ml-3 text-gray-800 text-base"
        style={{ height: 50, fontSize: 16, paddingVertical: 0 }}
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

export default function BasicInfoScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
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

  const isFormValid = name.trim() && phoneNumber.length === 10 && email.trim() && occupation && qualification && annualIncome && pincode.length === 6 && dobDay && dobMonth && dobYear;

  const handleSubmit = () => {
    if (isFormValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    }
  };

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1" edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* Header */}
          <LinearGradient
            colors={['#002561', '#003380']}
            style={{ paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}
          >
            <View className="px-6 pt-4">
              <Animated.View entering={FadeInDown.delay(100).springify()}>
                <Text className="text-white text-xl font-semibold">Complete Your Profile</Text>
                <Text className="text-white/70 text-sm mt-1">Fill in your details to get started</Text>
              </Animated.View>
            </View>
          </LinearGradient>

          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              className="flex-1 -mt-4"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {/* Form Card */}
              <Animated.View
                entering={FadeInUp.delay(200).springify()}
                className="mx-6 bg-white rounded-2xl p-5 shadow-lg mb-6"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <FormInput
                  label="Full Name"
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  icon={<User size={20} color="#6B7280" />}
                  autoCapitalize="words"
                />

                {/* Phone Number Input */}
                <View className="mb-4">
                  <Text className="text-gray-600 text-sm mb-2 ml-1">Phone Number</Text>
                  <PhoneInput
                    value={phoneNumber}
                    onChangeText={(text) => setPhoneNumber(text.replace(/\D/g, '').slice(0, 10))}
                  />
                </View>

                <FormInput
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  icon={<Mail size={20} color="#6B7280" />}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <DropdownInput
                  label="Occupation"
                  value={occupation}
                  placeholder="Select your occupation"
                  icon={<Briefcase size={20} color="#6B7280" />}
                  onPress={() => setShowOccupationModal(true)}
                />

                <DropdownInput
                  label="Qualification"
                  value={qualification}
                  placeholder="Select your qualification"
                  icon={<GraduationCap size={20} color="#6B7280" />}
                  onPress={() => setShowQualificationModal(true)}
                />

                <DropdownInput
                  label="Annual Income"
                  value={annualIncome}
                  placeholder="Select annual income"
                  icon={<IndianRupee size={20} color="#6B7280" />}
                  onPress={() => setShowIncomeModal(true)}
                />

                <FormInput
                  label="Pincode"
                  value={pincode}
                  onChangeText={(text) => setPincode(text.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit pincode"
                  icon={<MapPin size={20} color="#6B7280" />}
                  keyboardType="numeric"
                />

                {/* Date of Birth */}
                <View className="mb-4">
                  <Text className="text-gray-600 text-sm mb-2 ml-1">Date of Birth</Text>
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => {
                        setShowDayModal(true);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      className="flex-1 flex-row items-center justify-between bg-gray-50 rounded-xl px-3 py-3 border-2 border-gray-200"
                      style={{ minHeight: 52 }}
                    >
                      <Text className={`text-base ${dobDay ? 'text-gray-800' : 'text-gray-400'}`}>
                        {dobDay || 'Day'}
                      </Text>
                      <ChevronDown size={16} color="#6B7280" />
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        setShowMonthModal(true);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      className="flex-[2] flex-row items-center justify-between bg-gray-50 rounded-xl px-3 py-3 border-2 border-gray-200"
                      style={{ minHeight: 52 }}
                    >
                      <Text className={`text-base ${dobMonth ? 'text-gray-800' : 'text-gray-400'}`}>
                        {dobMonth || 'Month'}
                      </Text>
                      <ChevronDown size={16} color="#6B7280" />
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        setShowYearModal(true);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      className="flex-1 flex-row items-center justify-between bg-gray-50 rounded-xl px-3 py-3 border-2 border-gray-200"
                      style={{ minHeight: 52 }}
                    >
                      <Text className={`text-base ${dobYear ? 'text-gray-800' : 'text-gray-400'}`}>
                        {dobYear || 'Year'}
                      </Text>
                      <ChevronDown size={16} color="#6B7280" />
                    </Pressable>
                  </View>
                </View>

                <FormInput
                  label="Referral Code (Optional)"
                  value={referralCode}
                  onChangeText={setReferralCode}
                  placeholder="Enter referral code"
                  icon={<Gift size={20} color="#6B7280" />}
                  autoCapitalize="none"
                />

                {/* Submit Button */}
                <Pressable
                  onPress={handleSubmit}
                  disabled={!isFormValid}
                  className="mt-4"
                >
                  {({ pressed }) => (
                    <View
                      className={`rounded-xl py-4 items-center justify-center ${
                        isFormValid ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                      style={{
                        opacity: pressed ? 0.9 : 1,
                        transform: [{ scale: pressed ? 0.98 : 1 }],
                      }}
                    >
                      <Text className={`text-base font-bold ${isFormValid ? 'text-white' : 'text-gray-500'}`}>
                        Submit Profile
                      </Text>
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>

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
