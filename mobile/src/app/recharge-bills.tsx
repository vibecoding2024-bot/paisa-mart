import { View, Text, ScrollView, Pressable, TextInput, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Smartphone, Zap, Lightbulb, Flame, Droplet, Wifi, CreditCard as CreditCardIcon, Car, ChevronDown, X } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import NoPayout_TCGate from '@/components/NoPayout_TCGate';

const OPERATORS = {
  mobile: ['Airtel', 'Jio', 'Vi (Vodafone Idea)', 'BSNL'],
  dth: ['Tata Sky', 'Airtel Digital TV', 'Dish TV', 'Sun Direct', 'd2h'],
  electricity: ['TATA Power', 'Adani Electricity', 'BESCOM', 'MSEDCL', 'Other'],
  gas: ['Indraprastha Gas', 'Gujarat Gas', 'Mahanagar Gas', 'Other'],
  water: ['Delhi Jal Board', 'Mumbai Water', 'Bangalore Water', 'Other'],
  broadband: ['Airtel Broadband', 'Jio Fiber', 'ACT Fibernet', 'BSNL', 'Other'],
  fastag: ['HDFC FASTag', 'ICICI FASTag', 'Paytm FASTag', 'Axis FASTag'],
};

const BILL_CATEGORIES = [
  { id: 'electricity', label: 'Electricity', icon: Lightbulb, color: '#EAB308', bg: '#FEFCE8' },
  { id: 'gas', label: 'Gas', icon: Flame, color: '#F97316', bg: '#FFF7ED' },
  { id: 'water', label: 'Water', icon: Droplet, color: '#06B6D4', bg: '#ECFEFF' },
  { id: 'broadband', label: 'Broadband', icon: Wifi, color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'fastag', label: 'FASTag', icon: Car, color: '#10B981', bg: '#ECFDF5' },
  { id: 'credit-card', label: 'Credit Card', icon: CreditCardIcon, color: '#3B82F6', bg: '#EFF6FF' },
];

export default function RechargeBillsScreen() {
  const router = useRouter();
  const [tcVisible, setTcVisible] = useState(true);
  const [tcAccepted, setTcAccepted] = useState(false);
  const [activeTab, setActiveTab] = useState<'recharge' | 'bills'>('recharge');

  // Recharge states
  const [rechargeType, setRechargeType] = useState<'mobile' | 'dth'>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [operatorModalVisible, setOperatorModalVisible] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState('');
  const [amount, setAmount] = useState('');

  // Bill payment states
  const [selectedBillType, setSelectedBillType] = useState('');
  const [consumerId, setConsumerId] = useState('');
  const [billOperator, setBillOperator] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billOperatorModalVisible, setBillOperatorModalVisible] = useState(false);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleTabChange = (tab: 'recharge' | 'bills') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
  };

  const handleRechargeTypeChange = (type: 'mobile' | 'dth') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRechargeType(type);
    setSelectedOperator('');
  };

  const handleContinue = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    // Payment gateway integration placeholder
  };

  const handleBillPayment = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    // Payment gateway integration placeholder
  };

  const handleSelectBillCategory = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedBillType(categoryId);
    setBillOperator('');
    setConsumerId('');
    setBillAmount('');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <NoPayout_TCGate
        visible={tcVisible}
        module="recharge-bills"
        onAccept={() => { setTcAccepted(true); setTcVisible(false); }}
        onDecline={() => router.back()}
      />
      {tcAccepted && (
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <LinearGradient
          colors={['#002561', '#003380']}
          style={{ paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}
        >
          <View className="px-6 pt-4">
            <Animated.View entering={FadeInDown.delay(50).springify()} className="mb-4">
              <Pressable onPress={handleBack} className="flex-row items-center active:opacity-70">
                <View className="w-9 h-9 bg-white/10 rounded-xl items-center justify-center mr-2">
                  <ArrowLeft size={20} color="#fff" />
                </View>
                <Text className="text-white/90 text-sm font-medium">Back to Home</Text>
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <Text className="text-white text-2xl font-bold">Recharge & Pay Bills</Text>
              <Text className="text-white/70 text-sm mt-1">Quick recharges and bill payments</Text>
            </Animated.View>

            {/* No-Payout Strip */}
            <Animated.View
              entering={FadeInDown.delay(120).springify()}
              style={{
                backgroundColor: 'rgba(239,68,68,0.15)',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginTop: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                borderWidth: 1,
                borderColor: 'rgba(239,68,68,0.2)',
              }}
            >
              <Text style={{ color: '#FCA5A5', fontSize: 11, fontWeight: '600', flex: 1 }}>
                No Payout Module — 0% Commission · Not included in earnings
              </Text>
            </Animated.View>

            {/* Tabs */}
            <Animated.View entering={FadeInDown.delay(150).springify()} className="flex-row mt-5 bg-white/10 rounded-xl p-1">
              <Pressable
                onPress={() => handleTabChange('recharge')}
                className={`flex-1 py-2.5 rounded-lg ${activeTab === 'recharge' ? 'bg-white' : ''}`}
              >
                <Text className={`text-center font-semibold text-sm ${activeTab === 'recharge' ? 'text-blue-900' : 'text-white/70'}`}>
                  Recharge
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleTabChange('bills')}
                className={`flex-1 py-2.5 rounded-lg ${activeTab === 'bills' ? 'bg-white' : ''}`}
              >
                <Text className={`text-center font-semibold text-sm ${activeTab === 'bills' ? 'text-blue-900' : 'text-white/70'}`}>
                  Bill Payments
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </LinearGradient>

        <ScrollView className="flex-1 -mt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {activeTab === 'recharge' ? (
            <Animated.View entering={FadeInUp.delay(200).springify()} className="mx-6 bg-white rounded-2xl p-5 shadow-sm" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
              {/* Recharge Type Selector */}
              <View className="flex-row mb-5 bg-gray-100 rounded-xl p-1">
                <Pressable
                  onPress={() => handleRechargeTypeChange('mobile')}
                  className={`flex-1 py-2.5 rounded-lg flex-row items-center justify-center ${rechargeType === 'mobile' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Smartphone size={18} color={rechargeType === 'mobile' ? '#002561' : '#6B7280'} />
                  <Text className={`ml-2 font-semibold text-sm ${rechargeType === 'mobile' ? 'text-gray-900' : 'text-gray-500'}`}>
                    Mobile
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => handleRechargeTypeChange('dth')}
                  className={`flex-1 py-2.5 rounded-lg flex-row items-center justify-center ${rechargeType === 'dth' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Zap size={18} color={rechargeType === 'dth' ? '#002561' : '#6B7280'} />
                  <Text className={`ml-2 font-semibold text-sm ${rechargeType === 'dth' ? 'text-gray-900' : 'text-gray-500'}`}>
                    DTH
                  </Text>
                </Pressable>
              </View>

              {/* Mobile/DTH Number */}
              <View className="mb-4">
                <Text className="text-gray-700 font-medium text-sm mb-2">
                  {rechargeType === 'mobile' ? 'Mobile Number' : 'DTH Customer ID'}
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border-2 border-gray-200"
                  placeholder={rechargeType === 'mobile' ? 'Enter 10-digit mobile number' : 'Enter DTH customer ID'}
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  maxLength={rechargeType === 'mobile' ? 10 : 20}
                />
              </View>

              {/* Operator Dropdown */}
              <View className="mb-4">
                <Text className="text-gray-700 font-medium text-sm mb-2">Select Operator</Text>
                <Pressable
                  onPress={() => setOperatorModalVisible(true)}
                  className="bg-gray-50 rounded-xl px-4 py-3 border-2 border-gray-200 flex-row items-center justify-between"
                >
                  <Text className={selectedOperator ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedOperator || 'Choose operator'}
                  </Text>
                  <ChevronDown size={20} color="#6B7280" />
                </Pressable>
              </View>

              {/* Amount */}
              <View className="mb-5">
                <Text className="text-gray-700 font-medium text-sm mb-2">Amount</Text>
                <TextInput
                  className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border-2 border-gray-200"
                  placeholder="Enter amount"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              {/* Coming Soon Label */}
              <View className="bg-orange-50 rounded-xl p-3 mb-4 border border-orange-200">
                <Text className="text-orange-700 text-xs text-center font-medium">
                  🚀 Payments coming soon - Integration in progress
                </Text>
              </View>

              {/* Continue Button */}
              <Pressable
                onPress={handleContinue}
                disabled={!mobileNumber || !selectedOperator || !amount}
                className={`rounded-xl py-4 items-center ${mobileNumber && selectedOperator && amount ? 'bg-orange-500' : 'bg-gray-300'}`}
              >
                <Text className={`font-bold text-base ${mobileNumber && selectedOperator && amount ? 'text-white' : 'text-gray-500'}`}>
                  Continue
                </Text>
              </Pressable>
            </Animated.View>
          ) : (
            <View className="mx-6">
              {/* Bill Categories */}
              <Animated.View entering={FadeInUp.delay(200).springify()} className="mb-4">
                <Text className="text-gray-900 font-semibold text-base mb-3">Select Bill Type</Text>
                <View className="flex-row flex-wrap gap-3">
                  {BILL_CATEGORIES.map((category, index) => (
                    <Pressable
                      key={category.id}
                      onPress={() => handleSelectBillCategory(category.id)}
                      className={`bg-white rounded-2xl p-4 shadow-sm flex-row items-center ${selectedBillType === category.id ? 'border-2 border-orange-500' : ''}`}
                      style={{ width: '48%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
                    >
                      <View className="w-10 h-10 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: category.bg }}>
                        <category.icon size={20} color={category.color} />
                      </View>
                      <Text className="text-gray-900 font-medium text-sm flex-1">{category.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </Animated.View>

              {/* Bill Payment Form */}
              {selectedBillType && (
                <Animated.View entering={FadeInUp.delay(250).springify()} className="bg-white rounded-2xl p-5 shadow-sm" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
                  {/* Consumer ID */}
                  <View className="mb-4">
                    <Text className="text-gray-700 font-medium text-sm mb-2">
                      {selectedBillType === 'credit-card' ? 'Credit Card Number' : 'Consumer ID / Account Number'}
                    </Text>
                    <TextInput
                      className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border-2 border-gray-200"
                      placeholder={selectedBillType === 'credit-card' ? 'Enter 16-digit card number' : 'Enter consumer/account number'}
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      value={consumerId}
                      onChangeText={setConsumerId}
                    />
                  </View>

                  {/* Provider Dropdown */}
                  <View className="mb-4">
                    <Text className="text-gray-700 font-medium text-sm mb-2">Select Provider</Text>
                    <Pressable
                      onPress={() => setBillOperatorModalVisible(true)}
                      className="bg-gray-50 rounded-xl px-4 py-3 border-2 border-gray-200 flex-row items-center justify-between"
                    >
                      <Text className={billOperator ? 'text-gray-900' : 'text-gray-400'}>
                        {billOperator || 'Choose provider'}
                      </Text>
                      <ChevronDown size={20} color="#6B7280" />
                    </Pressable>
                  </View>

                  {/* Amount (optional for some bills) */}
                  <View className="mb-5">
                    <Text className="text-gray-700 font-medium text-sm mb-2">Amount (if applicable)</Text>
                    <TextInput
                      className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border-2 border-gray-200"
                      placeholder="Enter amount or fetch bill"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="numeric"
                      value={billAmount}
                      onChangeText={setBillAmount}
                    />
                  </View>

                  {/* Coming Soon Label */}
                  <View className="bg-orange-50 rounded-xl p-3 mb-4 border border-orange-200">
                    <Text className="text-orange-700 text-xs text-center font-medium">
                      🚀 Payments coming soon - Integration in progress
                    </Text>
                  </View>

                  {/* Pay Now Button */}
                  <Pressable
                    onPress={handleBillPayment}
                    disabled={!consumerId || !billOperator}
                    className={`rounded-xl py-4 items-center ${consumerId && billOperator ? 'bg-orange-500' : 'bg-gray-300'}`}
                  >
                    <Text className={`font-bold text-base ${consumerId && billOperator ? 'text-white' : 'text-gray-500'}`}>
                      Pay Now
                    </Text>
                  </Pressable>
                </Animated.View>
              )}
            </View>
          )}
        </ScrollView>

        {/* Operator Modal */}
        <Modal visible={operatorModalVisible} transparent animationType="slide">
          <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setOperatorModalVisible(false)}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View className="bg-white rounded-t-3xl max-h-[70%]">
                <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
                  <Text className="text-gray-800 text-lg font-semibold">Select Operator</Text>
                  <Pressable onPress={() => setOperatorModalVisible(false)} className="p-2">
                    <X size={20} color="#6B7280" />
                  </Pressable>
                </View>
                <FlatList
                  data={rechargeType === 'mobile' ? OPERATORS.mobile : OPERATORS.dth}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => {
                        setSelectedOperator(item);
                        setOperatorModalVisible(false);
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

        {/* Bill Operator Modal */}
        <Modal visible={billOperatorModalVisible} transparent animationType="slide">
          <Pressable className="flex-1 bg-black/50 justify-end" onPress={() => setBillOperatorModalVisible(false)}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View className="bg-white rounded-t-3xl max-h-[70%]">
                <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
                  <Text className="text-gray-800 text-lg font-semibold">Select Provider</Text>
                  <Pressable onPress={() => setBillOperatorModalVisible(false)} className="p-2">
                    <X size={20} color="#6B7280" />
                  </Pressable>
                </View>
                <FlatList
                  data={OPERATORS[selectedBillType as keyof typeof OPERATORS] || []}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => {
                        setBillOperator(item);
                        setBillOperatorModalVisible(false);
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
      </SafeAreaView>
      )}
    </View>
  );
}
