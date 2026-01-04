import { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Wallet, TrendingUp, ArrowDownLeft, ArrowUpRight, ChevronRight, Clock, CheckCircle, XCircle, X, AlertTriangle, Shield } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useIncentiveStore } from '@/lib/incentive-store';

const TRANSACTIONS = [
  { type: 'credit', title: 'HDFC Credit Card Sale', amount: '₹2,100', date: 'Today', status: 'completed' },
  { type: 'credit', title: 'SBI Personal Loan', amount: '₹3,500', date: 'Yesterday', status: 'completed' },
  { type: 'debit', title: 'Withdrawal to Bank', amount: '₹5,000', date: '2 days ago', status: 'completed' },
  { type: 'credit', title: 'Referral Bonus', amount: '₹500', date: '3 days ago', status: 'completed' },
  { type: 'credit', title: 'ICICI Credit Card', amount: '₹1,800', date: '5 days ago', status: 'pending' },
];

export default function EarningsScreen() {
  const router = useRouter();
  const userKYC = useIncentiveStore(s => s.userKYC);
  const bankAccounts = useIncentiveStore(s => s.bankAccounts);
  const minWithdrawalAmount = useIncentiveStore(s => s.minWithdrawalAmount);
  const initiatePayout = useIncentiveStore(s => s.initiatePayout);

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);

  const availableBalance = 7900; // In real app, this would come from the store

  const canWithdraw = useMemo(() => {
    return userKYC?.status === 'verified' && bankAccounts.length > 0;
  }, [userKYC, bankAccounts]);

  const primaryBank = useMemo(() => {
    return bankAccounts.find(a => a.isPrimary) || bankAccounts[0];
  }, [bankAccounts]);

  const handleWithdraw = () => {
    if (!canWithdraw) {
      if (userKYC?.status !== 'verified') {
        Alert.alert(
          'KYC Required',
          'Please complete your KYC verification before making a withdrawal.',
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Complete KYC', onPress: () => router.push('/kyc') },
          ]
        );
      } else {
        Alert.alert(
          'Bank Account Required',
          'Please add a bank account before making a withdrawal.',
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Add Account', onPress: () => router.push('/bank-details') },
          ]
        );
      }
      return;
    }
    setShowWithdrawModal(true);
    setSelectedBankId(primaryBank?.id || null);
  };

  const handleConfirmWithdraw = () => {
    const amount = parseInt(withdrawAmount, 10);

    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid withdrawal amount.');
      return;
    }

    if (amount < minWithdrawalAmount) {
      Alert.alert('Minimum Amount', `Minimum withdrawal amount is ₹${minWithdrawalAmount}`);
      return;
    }

    if (amount > availableBalance) {
      Alert.alert('Insufficient Balance', 'You don\'t have enough balance for this withdrawal.');
      return;
    }

    if (!selectedBankId) {
      Alert.alert('Select Bank', 'Please select a bank account for withdrawal.');
      return;
    }

    const success = initiatePayout('user-current', 'Partner Name', amount, selectedBankId);

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Withdrawal Initiated',
        `₹${amount} withdrawal has been initiated. You'll receive it within 24-48 hours.`,
        [{ text: 'OK' }]
      );
      setShowWithdrawModal(false);
      setWithdrawAmount('');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to initiate withdrawal. Please try again.');
    }
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
            <Text className="text-white text-xl font-semibold">My Earnings</Text>

            {/* Balance Card */}
            <View className="bg-white/10 rounded-2xl p-4 mt-4">
              <Text className="text-white/70 text-xs">Available Balance</Text>
              <Text className="text-white font-bold text-3xl mt-1">₹{availableBalance.toLocaleString()}</Text>

              <View className="flex-row mt-4 gap-3">
                <Pressable
                  onPress={handleWithdraw}
                  className="flex-1 bg-orange-500 rounded-xl py-3 flex-row items-center justify-center"
                >
                  <ArrowUpRight size={18} color="#fff" />
                  <Text className="text-white font-semibold ml-2">Withdraw</Text>
                </Pressable>
                <Pressable className="flex-1 bg-white/20 rounded-xl py-3 flex-row items-center justify-center">
                  <Clock size={18} color="#fff" />
                  <Text className="text-white font-semibold ml-2">History</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </LinearGradient>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* KYC/Bank Warning */}
          {!canWithdraw && (
            <Animated.View entering={FadeInDown.delay(50).springify()} className="px-4 mt-4">
              <Pressable
                onPress={() => {
                  if (userKYC?.status !== 'verified') {
                    router.push('/kyc');
                  } else {
                    router.push('/bank-details');
                  }
                }}
                className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex-row items-center"
              >
                <AlertTriangle size={20} color="#F59E0B" />
                <View className="flex-1 ml-3">
                  <Text className="text-yellow-800 font-medium">
                    {userKYC?.status !== 'verified' ? 'Complete KYC' : 'Add Bank Account'}
                  </Text>
                  <Text className="text-yellow-700 text-sm">
                    {userKYC?.status !== 'verified'
                      ? 'Verify your identity to enable withdrawals'
                      : 'Add bank account to receive payouts'}
                  </Text>
                </View>
                <ChevronRight size={20} color="#F59E0B" />
              </Pressable>
            </Animated.View>
          )}

          {/* Stats */}
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            className="flex-row px-4 mt-4 gap-3"
          >
            <View className="flex-1 bg-white rounded-xl p-4">
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-green-100 rounded-lg items-center justify-center">
                  <TrendingUp size={16} color="#22C55E" />
                </View>
              </View>
              <Text className="text-gray-800 font-bold text-xl mt-2">₹12,400</Text>
              <Text className="text-gray-400 text-xs">This Month</Text>
            </View>
            <View className="flex-1 bg-white rounded-xl p-4">
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-blue-100 rounded-lg items-center justify-center">
                  <Wallet size={16} color="#3B82F6" />
                </View>
              </View>
              <Text className="text-gray-800 font-bold text-xl mt-2">₹45,600</Text>
              <Text className="text-gray-400 text-xs">Total Earned</Text>
            </View>
          </Animated.View>

          {/* Pending */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            className="px-4 mt-4"
          >
            <View className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-gray-600 text-xs">Pending Earnings</Text>
                  <Text className="text-gray-800 font-bold text-lg">₹1,800</Text>
                </View>
                <View className="bg-yellow-400 px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-medium">Processing</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Transactions */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            className="px-4 mt-4"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-800 font-semibold">Recent Transactions</Text>
              <Pressable className="flex-row items-center">
                <Text className="text-orange-500 text-sm font-medium">View All</Text>
                <ChevronRight size={16} color="#FF8C00" />
              </Pressable>
            </View>

            {TRANSACTIONS.map((transaction, index) => (
              <View
                key={index}
                className="bg-white rounded-xl p-4 mb-3 flex-row items-center"
              >
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                    transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                  }`}
                >
                  {transaction.type === 'credit' ? (
                    <ArrowDownLeft size={20} color="#22C55E" />
                  ) : (
                    <ArrowUpRight size={20} color="#EF4444" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-medium">{transaction.title}</Text>
                  <View className="flex-row items-center mt-0.5">
                    <Text className="text-gray-400 text-xs">{transaction.date}</Text>
                    {transaction.status === 'pending' && (
                      <View className="flex-row items-center ml-2">
                        <Clock size={10} color="#F59E0B" />
                        <Text className="text-yellow-500 text-xs ml-1">Pending</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text
                  className={`font-bold ${
                    transaction.type === 'credit' ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {transaction.type === 'credit' ? '+' : '-'}{transaction.amount}
                </Text>
              </View>
            ))}
          </Animated.View>

          <View className="h-6" />
        </ScrollView>
      </SafeAreaView>

      {/* Withdraw Modal */}
      <Modal visible={showWithdrawModal} transparent animationType="slide">
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setShowWithdrawModal(false)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-white rounded-t-3xl p-6">
              <View className="flex-row items-center justify-between mb-6">
                <Text className="text-gray-800 text-xl font-bold">Withdraw Funds</Text>
                <Pressable onPress={() => setShowWithdrawModal(false)} className="p-2">
                  <X size={20} color="#6B7280" />
                </Pressable>
              </View>

              {/* Available Balance */}
              <View className="bg-gray-100 rounded-xl p-4 mb-4">
                <Text className="text-gray-500 text-xs">Available Balance</Text>
                <Text className="text-gray-800 text-2xl font-bold">₹{availableBalance.toLocaleString()}</Text>
              </View>

              {/* Amount Input */}
              <View className="mb-4">
                <Text className="text-gray-600 text-sm mb-2">Enter Amount</Text>
                <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border-2 border-gray-200">
                  <Text className="text-gray-800 text-xl font-bold">₹</Text>
                  <TextInput
                    className="flex-1 ml-2 text-gray-800 text-xl font-bold py-3"
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                    value={withdrawAmount}
                    onChangeText={(text) => setWithdrawAmount(text.replace(/\D/g, ''))}
                    keyboardType="number-pad"
                  />
                </View>
                <Text className="text-gray-500 text-xs mt-1">
                  Minimum withdrawal: ₹{minWithdrawalAmount}
                </Text>
              </View>

              {/* Quick Amounts */}
              <View className="flex-row gap-2 mb-4">
                {[500, 1000, 2000, 5000].map((amount) => (
                  <Pressable
                    key={amount}
                    onPress={() => setWithdrawAmount(String(amount))}
                    className={`flex-1 py-2 rounded-lg items-center ${
                      withdrawAmount === String(amount) ? 'bg-orange-500' : 'bg-gray-100'
                    }`}
                  >
                    <Text
                      className={`font-medium ${
                        withdrawAmount === String(amount) ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      ₹{amount}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Bank Account Selection */}
              {bankAccounts.length > 0 && (
                <View className="mb-4">
                  <Text className="text-gray-600 text-sm mb-2">Withdraw to</Text>
                  {bankAccounts.map((account) => (
                    <Pressable
                      key={account.id}
                      onPress={() => setSelectedBankId(account.id)}
                      className={`flex-row items-center p-3 rounded-xl mb-2 border-2 ${
                        selectedBankId === account.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <View className="w-10 h-10 bg-gray-200 rounded-lg items-center justify-center mr-3">
                        <Shield size={20} color="#6B7280" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-800 font-medium">{account.bankName}</Text>
                        <Text className="text-gray-500 text-xs">•••• {account.accountNumber.slice(-4)}</Text>
                      </View>
                      {selectedBankId === account.id && (
                        <CheckCircle size={20} color="#F97316" />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Confirm Button */}
              <Pressable
                onPress={handleConfirmWithdraw}
                className="bg-orange-500 py-4 rounded-xl items-center"
              >
                <Text className="text-white font-bold text-base">
                  Withdraw ₹{withdrawAmount || '0'}
                </Text>
              </Pressable>

              <Text className="text-gray-500 text-center text-xs mt-3">
                Funds will be transferred within 24-48 hours
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
