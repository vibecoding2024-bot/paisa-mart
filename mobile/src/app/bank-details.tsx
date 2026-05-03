import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  ChevronLeft,
  Building2,
  User,
  Hash,
  CreditCard,
  Plus,
  CheckCircle,
  Trash2,
  Shield,
  AlertTriangle,
} from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import { useIncentiveStore, BankAccount } from '@/lib/incentive-store';

export default function BankDetailsScreen() {
  const router = useRouter();
  const bankAccounts = useIncentiveStore(s => s.bankAccounts);
  const addBankAccount = useIncentiveStore(s => s.addBankAccount);
  const removeBankAccount = useIncentiveStore(s => s.removeBankAccount);
  const setPrimaryBankAccount = useIncentiveStore(s => s.setPrimaryBankAccount);

  const [showAddForm, setShowAddForm] = useState(false);
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!accountHolderName.trim()) {
      newErrors.accountHolderName = 'Account holder name is required';
    }

    if (!accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (accountNumber.length < 9 || accountNumber.length > 18) {
      newErrors.accountNumber = 'Invalid account number length';
    }

    if (accountNumber !== confirmAccountNumber) {
      newErrors.confirmAccountNumber = 'Account numbers do not match';
    }

    if (!ifscCode.trim()) {
      newErrors.ifscCode = 'IFSC code is required';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode.toUpperCase())) {
      newErrors.ifscCode = 'Invalid IFSC code format';
    }

    if (!bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddAccount = () => {
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    addBankAccount({
      userId: 'user-current',
      accountHolderName: accountHolderName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.toUpperCase().trim(),
      bankName: bankName.trim(),
      isPrimary: bankAccounts.length === 0,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowAddForm(false);
    resetForm();
  };

  const resetForm = () => {
    setAccountHolderName('');
    setAccountNumber('');
    setConfirmAccountNumber('');
    setIfscCode('');
    setBankName('');
    setErrors({});
  };

  const handleRemoveAccount = (accountId: string) => {
    Alert.alert(
      'Remove Account',
      'Are you sure you want to remove this bank account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeBankAccount(accountId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleSetPrimary = (accountId: string) => {
    setPrimaryBankAccount(accountId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <LinearGradient
          colors={['#002561', '#003380']}
          style={{ paddingBottom: 20 }}
        >
          <View className="px-4 pt-2">
            <View className="flex-row items-center">
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 bg-white/10 rounded-full items-center justify-center mr-3"
              >
                <ChevronLeft size={24} color="#fff" />
              </Pressable>
              <View className="flex-1">
                <Text className="text-white text-xl font-semibold">Bank Details</Text>
                <Text className="text-white/70 text-sm">Manage your payout accounts</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Info Banner */}
          <Animated.View entering={FadeInDown.delay(100).springify()} className="px-4 mt-4">
            <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex-row">
              <Shield size={20} color="#3B82F6" />
              <View className="flex-1 ml-3">
                <Text className="text-blue-800 font-medium">Secure Payouts</Text>
                <Text className="text-blue-600 text-sm mt-0.5">
                  Your bank details are encrypted and secure. Admin approval required for first payout.
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Saved Accounts */}
          {bankAccounts.length > 0 && (
            <Animated.View entering={FadeInDown.delay(150).springify()} className="px-4 mt-6">
              <Text className="text-gray-800 font-semibold mb-3">Saved Accounts</Text>
              {bankAccounts.map((account, index) => (
                <View key={account.id} className="bg-white rounded-xl p-4 mb-3 border border-gray-200">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="w-12 h-12 bg-gray-100 rounded-xl items-center justify-center mr-3">
                        <Building2 size={24} color="#6B7280" />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <Text className="text-gray-800 font-semibold">{account.bankName}</Text>
                          {account.isPrimary && (
                            <View className="bg-green-100 px-2 py-0.5 rounded-full ml-2">
                              <Text className="text-green-600 text-xs font-medium">Primary</Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-gray-500 text-sm">{account.accountHolderName}</Text>
                        <Text className="text-gray-400 text-xs mt-1">
                          •••• •••• {account.accountNumber.slice(-4)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row mt-3 pt-3 border-t border-gray-100 gap-2">
                    {!account.isPrimary && (
                      <Pressable
                        onPress={() => handleSetPrimary(account.id)}
                        className="flex-1 bg-gray-100 py-2 rounded-lg items-center"
                      >
                        <Text className="text-gray-600 text-sm font-medium">Set Primary</Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => handleRemoveAccount(account.id)}
                      className="flex-1 bg-red-50 py-2 rounded-lg flex-row items-center justify-center"
                    >
                      <Trash2 size={16} color="#EF4444" />
                      <Text className="text-red-500 text-sm font-medium ml-1">Remove</Text>
                    </Pressable>
                  </View>

                  {!account.isVerified && (
                    <View className="mt-3 bg-yellow-50 rounded-lg p-2 flex-row items-center">
                      <AlertTriangle size={14} color="#F59E0B" />
                      <Text className="text-yellow-700 text-xs ml-2">Pending verification</Text>
                    </View>
                  )}
                </View>
              ))}
            </Animated.View>
          )}

          {/* Add New Account Button */}
          {!showAddForm && (
            <Animated.View entering={FadeInDown.delay(200).springify()} className="px-4 mt-4">
              <Pressable
                onPress={() => setShowAddForm(true)}
                className="bg-white rounded-xl p-4 border-2 border-dashed border-gray-300 flex-row items-center justify-center"
              >
                <Plus size={20} color="#6B7280" />
                <Text className="text-gray-600 font-medium ml-2">Add Bank Account</Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Add Account Form */}
          {showAddForm && (
            <Animated.View entering={FadeInUp.delay(100).springify()} className="px-4 mt-4">
              <View className="bg-white rounded-xl p-4 border border-gray-200">
                <Text className="text-gray-800 font-semibold mb-4">Add New Account</Text>

                {/* Account Holder Name */}
                <View className="mb-4">
                  <Text className="text-gray-600 text-sm mb-2">Account Holder Name</Text>
                  <View className={`flex-row items-center bg-gray-50 rounded-xl px-4 border-2 ${errors.accountHolderName ? 'border-red-500' : 'border-gray-200'}`}>
                    <User size={20} color="#6B7280" />
                    <TextInput
                      className="flex-1 ml-3 text-gray-800 text-base py-3"
                      placeholder="Enter name as per bank records"
                      placeholderTextColor="#9CA3AF"
                      value={accountHolderName}
                      onChangeText={setAccountHolderName}
                      autoCapitalize="words"
                    />
                  </View>
                  {errors.accountHolderName && (
                    <Text className="text-red-500 text-xs mt-1">{errors.accountHolderName}</Text>
                  )}
                </View>

                {/* Account Number */}
                <View className="mb-4">
                  <Text className="text-gray-600 text-sm mb-2">Account Number</Text>
                  <View className={`flex-row items-center bg-gray-50 rounded-xl px-4 border-2 ${errors.accountNumber ? 'border-red-500' : 'border-gray-200'}`}>
                    <Hash size={20} color="#6B7280" />
                    <TextInput
                      className="flex-1 ml-3 text-gray-800 text-base py-3"
                      placeholder="Enter account number"
                      placeholderTextColor="#9CA3AF"
                      value={accountNumber}
                      onChangeText={(text) => setAccountNumber(text.replace(/\D/g, ''))}
                      keyboardType="number-pad"
                      maxLength={18}
                    />
                  </View>
                  {errors.accountNumber && (
                    <Text className="text-red-500 text-xs mt-1">{errors.accountNumber}</Text>
                  )}
                </View>

                {/* Confirm Account Number */}
                <View className="mb-4">
                  <Text className="text-gray-600 text-sm mb-2">Confirm Account Number</Text>
                  <View className={`flex-row items-center bg-gray-50 rounded-xl px-4 border-2 ${errors.confirmAccountNumber ? 'border-red-500' : 'border-gray-200'}`}>
                    <Hash size={20} color="#6B7280" />
                    <TextInput
                      className="flex-1 ml-3 text-gray-800 text-base py-3"
                      placeholder="Re-enter account number"
                      placeholderTextColor="#9CA3AF"
                      value={confirmAccountNumber}
                      onChangeText={(text) => setConfirmAccountNumber(text.replace(/\D/g, ''))}
                      keyboardType="number-pad"
                      maxLength={18}
                    />
                  </View>
                  {errors.confirmAccountNumber && (
                    <Text className="text-red-500 text-xs mt-1">{errors.confirmAccountNumber}</Text>
                  )}
                </View>

                {/* IFSC Code */}
                <View className="mb-4">
                  <Text className="text-gray-600 text-sm mb-2">IFSC Code</Text>
                  <View className={`flex-row items-center bg-gray-50 rounded-xl px-4 border-2 ${errors.ifscCode ? 'border-red-500' : 'border-gray-200'}`}>
                    <CreditCard size={20} color="#6B7280" />
                    <TextInput
                      className="flex-1 ml-3 text-gray-800 text-base py-3"
                      placeholder="e.g., HDFC0001234"
                      placeholderTextColor="#9CA3AF"
                      value={ifscCode}
                      onChangeText={(text) => setIfscCode(text.toUpperCase())}
                      autoCapitalize="characters"
                      maxLength={11}
                    />
                  </View>
                  {errors.ifscCode && (
                    <Text className="text-red-500 text-xs mt-1">{errors.ifscCode}</Text>
                  )}
                </View>

                {/* Bank Name */}
                <View className="mb-4">
                  <Text className="text-gray-600 text-sm mb-2">Bank Name</Text>
                  <View className={`flex-row items-center bg-gray-50 rounded-xl px-4 border-2 ${errors.bankName ? 'border-red-500' : 'border-gray-200'}`}>
                    <Building2 size={20} color="#6B7280" />
                    <TextInput
                      className="flex-1 ml-3 text-gray-800 text-base py-3"
                      placeholder="e.g., HDFC Bank"
                      placeholderTextColor="#9CA3AF"
                      value={bankName}
                      onChangeText={setBankName}
                      autoCapitalize="words"
                    />
                  </View>
                  {errors.bankName && (
                    <Text className="text-red-500 text-xs mt-1">{errors.bankName}</Text>
                  )}
                </View>

                {/* Buttons */}
                <View className="flex-row gap-3 mt-2">
                  <Pressable
                    onPress={() => {
                      setShowAddForm(false);
                      resetForm();
                    }}
                    className="flex-1 bg-gray-100 py-4 rounded-xl items-center"
                  >
                    <Text className="text-gray-600 font-semibold">Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleAddAccount}
                    className="flex-1 bg-orange-500 py-4 rounded-xl items-center"
                  >
                    <Text className="text-white font-semibold">Add Account</Text>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Empty State */}
          {bankAccounts.length === 0 && !showAddForm && (
            <Animated.View entering={FadeInDown.delay(250).springify()} className="px-4 mt-8 items-center">
              <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Building2 size={40} color="#9CA3AF" />
              </View>
              <Text className="text-gray-800 font-semibold text-lg">No Bank Account Added</Text>
              <Text className="text-gray-500 text-center mt-2">
                Add your bank account details to receive{'\n'}incentive payouts directly
              </Text>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
