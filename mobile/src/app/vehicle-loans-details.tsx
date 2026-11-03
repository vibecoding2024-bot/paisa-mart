import ApplicationSaved from '@/components/ApplicationSaved';
import { useState, useRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Car, ChevronDown, ChevronLeft } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from '@/lib/haptics';
import { ModalDropdown } from '@/components/ModalDropdown';
import BirthDatePicker from '@/components/BirthDatePicker';
import { parseBirthDate } from '@/lib/birth-date';
import { submitVehicleLoanLead } from '@/lib/vehicle-loan-api';

const VEHICLE_TYPES = [
  'Car',
  'Jeep',
  'Van',
  'Tata Ace',
  'Bolero',
  'Lorry / Truck',
  'Trailer / Container Vehicle',
  'Auto Rickshaw',
  'Taxi / Cab',
  'Bus',
  'Tempo Traveller',
  'Tractor',
  'JCB / Earthmover',
  'Crane',
  'Ambulance',
  'Fire Vehicle',
  'Heavy Truck',
  'Tipper',
  'Tanker',
  'Multi-Axle Vehicle',
  'Others',
];

type FieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (val: string) => void;
  error?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
  prefix?: string;
  editable?: boolean;
};

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  keyboardType = 'default',
  prefix,
  editable = true,
}: FieldProps) {
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
          backgroundColor: editable ? '#fff' : '#F9FAFB',
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
          editable={editable}
          style={{ flex: 1, paddingVertical: 14, fontSize: 14, color: '#111827' }}
        />
      </View>
      {error ? <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{error}</Text> : null}
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

function StateDropdown({ value, onSelect, error }: { value: string; onSelect: (v: string) => void; error?: string }) {
  return (
    <ModalDropdown
      label="State"
      value={value}
      options={INDIAN_STATES}
      onSelect={onSelect}
      error={error}
      placeholder="Select state"
    />
  );
}

const VEHICLE_ICONS: Record<string, string> = {
  'Car': '🚗', 'Jeep': '🚙', 'Van': '🚐', 'Tata Ace': '🛻', 'Bolero': '🚙',
  'Lorry / Truck': '🚛', 'Trailer / Container Vehicle': '🚚', 'Auto Rickshaw': '🛺',
  'Taxi / Cab': '🚕', 'Bus': '🚌', 'Tempo Traveller': '🚐', 'Tractor': '🚜',
  'JCB / Earthmover': '🏗️', 'Crane': '🏗️', 'Ambulance': '🚑', 'Fire Vehicle': '🚒',
  'Heavy Truck': '🚛', 'Tipper': '🚚', 'Tanker': '⛽', 'Multi-Axle Vehicle': '🚛', 'Others': '🚘',
};

function VehicleDropdown({
  value,
  onSelect,
  error,
}: {
  value: string;
  onSelect: (val: string) => void;
  error?: string;
}) {
  return (
    <ModalDropdown
      label="Vehicle Type"
      value={value}
      options={VEHICLE_TYPES}
      onSelect={onSelect}
      error={error}
      placeholder="Select vehicle type"
    />
  );
}

export default function VehicleLoansDetailsScreen() {
  const router = useRouter();
  const [vehicleCondition, setVehicleCondition] = useState<'New Vehicle' | 'Used Vehicle' | ''>('');
  const [vehicleType, setVehicleType] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [cibil, setCibil] = useState('');
  const [occupation, setOccupation] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [existingEmi, setExistingEmi] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [savedReference, setSavedReference] = useState<string | null>(null);
  const submitting = useRef(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!vehicleCondition) newErrors.vehicleCondition = 'Please select new or used vehicle';
    if (!vehicleType) newErrors.vehicleType = 'Please select vehicle type';
    if (!fullName.trim()) newErrors.fullName = 'Please enter full name';
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number';
    if (!cibil.trim()) {
      newErrors.cibil = 'Please enter CIBIL score';
    } else if (Number(cibil) < 300 || Number(cibil) > 900) {
      newErrors.cibil = 'CIBIL score must be between 300 and 900';
    }
    if (!occupation.trim()) newErrors.occupation = 'Please enter occupation';
    if (!parseBirthDate(dateOfBirth)) newErrors.dateOfBirth = 'Please select a valid date of birth';
    if (!city.trim()) newErrors.city = 'Please enter city';
    if (!state.trim()) newErrors.state = 'Please enter state';
    if (!monthlyIncome || Number(monthlyIncome) <= 0) newErrors.monthlyIncome = 'Please enter monthly income';
    if (!loanAmount || Number(loanAmount) <= 0) newErrors.loanAmount = 'Please enter loan amount required';
    if (existingEmi === '') newErrors.existingEmi = 'Please enter existing EMI (enter 0 if none)';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (submitting.current || savedReference) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitError('');
    if (!validate() || isSubmitting) return;

    submitting.current = true;
      setIsSubmitting(true);
    try {
      const receipt = await submitVehicleLoanLead({
        phoneNumber: mobileNumber,
        full_name: fullName.trim(),
        cibil,
        occupation: occupation.trim(),
        date_of_birth: dateOfBirth.trim(),
        city: city.trim(),
        state: state.trim(),
        monthly_income: monthlyIncome,
        loan_amount_required: loanAmount,
        existing_emi: existingEmi,
        vehicle_condition: vehicleCondition as 'New Vehicle' | 'Used Vehicle',
        vehicle_type: vehicleType,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSavedReference(String(receipt.id));
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not submit vehicle loan details');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <ApplicationSaved reference={savedReference} product="vehicle loan" onDone={() => router.replace('/(tabs)')} />
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
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
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>Vehicle Loans</Text>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginTop: 2 }}>
                Select vehicle type and submit application
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
              <Car size={22} color="#fff" />
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
            <Animated.View entering={FadeInDown.delay(50).springify()}>
              <ModalDropdown label="Vehicle Condition" value={vehicleCondition} options={['New Vehicle', 'Used Vehicle']} onSelect={value => setVehicleCondition(value as 'New Vehicle' | 'Used Vehicle')} error={errors.vehicleCondition} placeholder="Select new or used vehicle" />
              <VehicleDropdown
                value={vehicleType}
                onSelect={(type) => {
                  setVehicleType(type);
                  setErrors((e) => ({ ...e, vehicleType: '' }));
                }}
                error={errors.vehicleType}
              />
            </Animated.View>

            {vehicleType ? (
              <Animated.View entering={FadeInDown.delay(90).springify()}>
                <Field
                  label="Full Name"
                  placeholder="Enter full name"
                  value={fullName}
                  onChangeText={(val) => {
                    setFullName(val);
                    setErrors((e) => ({ ...e, fullName: '' }));
                  }}
                  error={errors.fullName}
                />
                <Field
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
                <Field
                  label="CIBIL Score"
                  placeholder="Enter CIBIL score"
                  value={cibil}
                  keyboardType="numeric"
                  onChangeText={(val) => {
                    setCibil(val.replace(/[^0-9]/g, '').slice(0, 3));
                    setErrors((e) => ({ ...e, cibil: '' }));
                  }}
                  error={errors.cibil}
                />
                <Field
                  label="Occupation"
                  placeholder="Enter occupation"
                  value={occupation}
                  onChangeText={(val) => {
                    setOccupation(val);
                    setErrors((e) => ({ ...e, occupation: '' }));
                  }}
                  error={errors.occupation}
                />
                <BirthDatePicker
                  value={dateOfBirth}
                  onChange={(val) => {
                    setDateOfBirth(val);
                    setErrors((e) => ({ ...e, dateOfBirth: '' }));
                  }}
                  error={errors.dateOfBirth}
                />
                <Field
                  label="City"
                  placeholder="Enter city"
                  value={city}
                  onChangeText={(val) => {
                    setCity(val);
                    setErrors((e) => ({ ...e, city: '' }));
                  }}
                  error={errors.city}
                />
                <StateDropdown
                  value={state}
                  onSelect={(val) => { setState(val); setErrors((e) => ({ ...e, state: '' })); }}
                  error={errors.state}
                />
                <Field
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
                <Field
                  label="Loan Amount Required"
                  placeholder="Enter loan amount required"
                  value={loanAmount}
                  keyboardType="numeric"
                  prefix="₹"
                  onChangeText={(val) => {
                    setLoanAmount(val.replace(/[^0-9]/g, ''));
                    setErrors((e) => ({ ...e, loanAmount: '' }));
                  }}
                  error={errors.loanAmount}
                />
                <Field
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
            ) : null}
          </ScrollView>
          {submitError ? (
            <Text accessibilityRole="alert" style={{ color: '#DC2626', paddingHorizontal: 16, paddingBottom: 8 }}>
              {submitError}
            </Text>
          ) : null}

          <Animated.View
            entering={FadeInDown.delay(120).springify()}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 12,
              paddingBottom: Platform.OS === 'ios' ? 24 : 12,
              backgroundColor: '#fff',
              borderTopWidth: 1,
              borderTopColor: '#F3F4F6',
            }}
          >
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting || !vehicleType}
              style={{
                borderRadius: 14,
                overflow: 'hidden',
                opacity: isSubmitting || !vehicleType ? 0.65 : 1,
              }}
            >
              <LinearGradient
                colors={['#002561', '#003380']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center', minHeight: 51 }}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Submit Application</Text>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
    </>
  );
}
