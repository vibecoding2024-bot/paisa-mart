import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { X, ChevronDown } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';

export interface LeadCaptureData {
  loanAmount: string;
  propertyType: string;
  callbackTime: string;
  customLoanAmount?: string;
  customCallbackTime?: string;
}

interface LeadCaptureModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: LeadCaptureData) => void;
  productCategory: string;
}

const LOAN_AMOUNTS = [
  { value: '1000000', label: '₹10 Lakh' },
  { value: '2000000', label: '₹20 Lakh' },
  { value: '3000000', label: '₹30 Lakh' },
  { value: '5000000', label: '₹50 Lakh' },
  { value: '7500000', label: '₹75 Lakh' },
  { value: '10000000', label: '₹1 Crore' },
  { value: 'custom', label: 'Custom Amount' },
];

const PROPERTY_TYPES = [
  { value: 'self-occupied', label: 'Self-occupied' },
  { value: 'investment', label: 'Investment' },
  { value: 'plot-construction', label: 'Plot+Construction' },
];

const CALLBACK_TIMES = [
  { value: 'now', label: 'Now' },
  { value: 'today-evening', label: 'Today Evening' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'custom', label: 'Custom' },
];

export default function LeadCaptureModal({
  visible,
  onClose,
  onSubmit,
  productCategory,
}: LeadCaptureModalProps) {
  const [loanAmount, setLoanAmount] = useState('');
  const [customLoanAmount, setCustomLoanAmount] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [callbackTime, setCallbackTime] = useState('');
  const [customCallbackTime, setCustomCallbackTime] = useState('');
  const [showLoanDropdown, setShowLoanDropdown] = useState(false);
  const [showPropertyDropdown, setShowPropertyDropdown] = useState(false);
  const [showCallbackDropdown, setShowCallbackDropdown] = useState(false);

  const handleSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSubmit({
      loanAmount,
      propertyType,
      callbackTime,
      customLoanAmount: loanAmount === 'custom' ? customLoanAmount : undefined,
      customCallbackTime: callbackTime === 'custom' ? customCallbackTime : undefined,
    });
    resetForm();
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSubmit({
      loanAmount: '',
      propertyType: '',
      callbackTime: '',
    });
    resetForm();
  };

  const resetForm = () => {
    setLoanAmount('');
    setCustomLoanAmount('');
    setPropertyType('');
    setCallbackTime('');
    setCustomCallbackTime('');
  };

  const getProductLabel = () => {
    const labels: Record<string, string> = {
      'home-loans': 'Home Loan',
      'personal-loans': 'Personal Loan',
      'vehicle-loans': 'Vehicle Loan',
      'business-loans': 'Business Loan',
      'life-insurance': 'Life Insurance',
      'health-insurance': 'Health Insurance',
      'motor-insurance': 'Motor Insurance',
      'gold-loans': 'Gold Loan',
    };
    return labels[productCategory] || 'Product';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 bg-black/60 justify-end">
          <Animated.View
            entering={FadeIn}
            className="bg-white rounded-t-3xl max-h-[85%]"
          >
            {/* Handle */}
            <View className="items-center pt-3 pb-2">
              <View className="w-10 h-1 bg-gray-300 rounded-full" />
            </View>

            {/* Header */}
            <View className="px-5 py-3 border-b border-gray-100">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-gray-900 font-bold text-xl">
                    Quick Details
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    Help us serve you better (Optional - 10 seconds)
                  </Text>
                </View>
                <Pressable
                  onPress={onClose}
                  className="w-10 h-10 items-center justify-center"
                >
                  <X size={22} color="#6B7280" />
                </Pressable>
              </View>
            </View>

            {/* Content */}
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 20 }}
            >
              {/* Loan Amount - Show for loan products */}
              {['home-loans', 'personal-loans', 'vehicle-loans', 'business-loans', 'gold-loans'].includes(productCategory) && (
                <Animated.View entering={FadeInDown.delay(100)} className="mb-5">
                  <Text className="text-gray-700 font-semibold mb-2">
                    1. Loan Amount Needed
                  </Text>
                  <Pressable
                    onPress={() => {
                      setShowLoanDropdown(!showLoanDropdown);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 flex-row items-center justify-between"
                  >
                    <Text className={loanAmount ? 'text-gray-900' : 'text-gray-400'}>
                      {loanAmount
                        ? LOAN_AMOUNTS.find(a => a.value === loanAmount)?.label || 'Custom Amount'
                        : 'Select amount...'}
                    </Text>
                    <ChevronDown size={20} color="#6B7280" />
                  </Pressable>

                  {showLoanDropdown && (
                    <View className="mt-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
                      {LOAN_AMOUNTS.map((amount, index) => (
                        <Pressable
                          key={amount.value}
                          onPress={() => {
                            setLoanAmount(amount.value);
                            setShowLoanDropdown(false);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }}
                          className={`px-4 py-3 ${index < LOAN_AMOUNTS.length - 1 ? 'border-b border-gray-100' : ''}`}
                        >
                          <Text className="text-gray-700">{amount.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}

                  {loanAmount === 'custom' && (
                    <View className="mt-2">
                      <TextInput
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900"
                        placeholder="Enter custom amount (e.g., 4500000)"
                        placeholderTextColor="#9CA3AF"
                        value={customLoanAmount}
                        onChangeText={setCustomLoanAmount}
                        keyboardType="numeric"
                      />
                    </View>
                  )}
                </Animated.View>
              )}

              {/* Property Type - Show only for home loans */}
              {productCategory === 'home-loans' && (
                <Animated.View entering={FadeInDown.delay(200)} className="mb-5">
                  <Text className="text-gray-700 font-semibold mb-2">
                    2. Property Type
                  </Text>
                  <Pressable
                    onPress={() => {
                      setShowPropertyDropdown(!showPropertyDropdown);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 flex-row items-center justify-between"
                  >
                    <Text className={propertyType ? 'text-gray-900' : 'text-gray-400'}>
                      {propertyType
                        ? PROPERTY_TYPES.find(p => p.value === propertyType)?.label
                        : 'Select property type...'}
                    </Text>
                    <ChevronDown size={20} color="#6B7280" />
                  </Pressable>

                  {showPropertyDropdown && (
                    <View className="mt-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
                      {PROPERTY_TYPES.map((type, index) => (
                        <Pressable
                          key={type.value}
                          onPress={() => {
                            setPropertyType(type.value);
                            setShowPropertyDropdown(false);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }}
                          className={`px-4 py-3 ${index < PROPERTY_TYPES.length - 1 ? 'border-b border-gray-100' : ''}`}
                        >
                          <Text className="text-gray-700">{type.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </Animated.View>
              )}

              {/* Callback Time */}
              <Animated.View entering={FadeInDown.delay(300)} className="mb-5">
                <Text className="text-gray-700 font-semibold mb-2">
                  {productCategory === 'home-loans' ? '3. ' : '2. '}Preferred Callback Time
                </Text>
                <Pressable
                  onPress={() => {
                    setShowCallbackDropdown(!showCallbackDropdown);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 flex-row items-center justify-between"
                >
                  <Text className={callbackTime ? 'text-gray-900' : 'text-gray-400'}>
                    {callbackTime
                      ? CALLBACK_TIMES.find(t => t.value === callbackTime)?.label || 'Custom Time'
                      : 'Select time...'}
                  </Text>
                  <ChevronDown size={20} color="#6B7280" />
                </Pressable>

                {showCallbackDropdown && (
                  <View className="mt-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {CALLBACK_TIMES.map((time, index) => (
                      <Pressable
                        key={time.value}
                        onPress={() => {
                          setCallbackTime(time.value);
                          setShowCallbackDropdown(false);
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                        className={`px-4 py-3 ${index < CALLBACK_TIMES.length - 1 ? 'border-b border-gray-100' : ''}`}
                      >
                        <Text className="text-gray-700">{time.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                {callbackTime === 'custom' && (
                  <View className="mt-2">
                    <TextInput
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900"
                      placeholder="Enter preferred time (e.g., 3 PM tomorrow)"
                      placeholderTextColor="#9CA3AF"
                      value={customCallbackTime}
                      onChangeText={setCustomCallbackTime}
                    />
                  </View>
                )}
              </Animated.View>

              {/* Info */}
              <View className="bg-blue-50 p-3 rounded-xl">
                <Text className="text-blue-700 text-xs">
                  💡 This helps our team understand your requirement better and serve you faster
                </Text>
              </View>
            </ScrollView>

            {/* Buttons */}
            <View className="p-5 border-t border-gray-100 flex-row gap-3">
              <Pressable
                onPress={handleSkip}
                className="flex-1 bg-gray-100 rounded-xl py-4 items-center"
              >
                <Text className="text-gray-700 font-semibold">Skip</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                className="flex-1 bg-orange-500 rounded-xl py-4 items-center"
              >
                <Text className="text-white font-semibold">Continue</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
