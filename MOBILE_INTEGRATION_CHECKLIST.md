# Mobile UI Integration Checklist

## Overview
Your integration partners care about **what users see and experience**. This checklist ensures your mobile app looks professional and complete.

---

## Phase 1: Home Screen (Week 1)

### Current State
- ✅ Earn section (links, cards, products)
- ❌ No wallet balance display
- ❌ No quick withdraw button
- ❌ No KYC status indicator

### Required Changes

#### 1.1 Add User Profile Card (Top of Home)
**Location:** `mobile/src/app/index.tsx` (at the very top)

```jsx
<View className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 mb-6">
  <View className="flex-row justify-between items-center">
    <View>
      <Text className="text-white text-sm opacity-90">Welcome</Text>
      <Text className="text-white text-2xl font-bold">{user.name}</Text>
    </View>
    <TouchableOpacity className="bg-white/20 rounded-full p-3">
      <Feather name="bell" size={20} color="white" />
    </TouchableOpacity>
  </View>
  
  {/* KYC Status Badge */}
  <View className="mt-3 bg-white/10 rounded-lg px-3 py-2 self-start">
    <Text className="text-white text-xs font-semibold">
      {user.kycStatus === 'approved' ? '✓ KYC Verified' : '⚠ Complete KYC'}
    </Text>
  </View>
</View>
```

#### 1.2 Add Wallet Balance Widget (Below Profile)
```jsx
<TouchableOpacity 
  onPress={() => router.push('/wallet')}
  className="bg-gray-900 rounded-2xl p-5 mb-6"
>
  <Text className="text-gray-400 text-sm mb-2">Total Earnings</Text>
  <View className="flex-row justify-between items-center">
    <Text className="text-white text-3xl font-bold">₹{walletBalance.toLocaleString()}</Text>
    <View className="bg-orange-500/20 rounded-lg px-3 py-1">
      <Text className="text-orange-400 text-xs font-semibold">Available</Text>
    </View>
  </View>
  
  <View className="flex-row justify-between mt-4 pt-4 border-t border-gray-700">
    <View>
      <Text className="text-gray-500 text-xs">Pending Payout</Text>
      <Text className="text-white text-lg font-semibold">₹{pendingPayout.toLocaleString()}</Text>
    </View>
    <View>
      <Text className="text-gray-500 text-xs">Total Earned</Text>
      <Text className="text-white text-lg font-semibold">₹{totalEarned.toLocaleString()}</Text>
    </View>
  </View>
</TouchableOpacity>
```

#### 1.3 Add Action Buttons (Quick Access)
```jsx
<View className="flex-row gap-3 mb-8">
  <TouchableOpacity 
    className="flex-1 bg-orange-500 rounded-xl py-4 justify-center items-center"
    onPress={() => router.push('/withdraw')}
  >
    <Feather name="send" size={20} color="white" />
    <Text className="text-white text-sm font-semibold mt-1">Withdraw</Text>
  </TouchableOpacity>
  
  <TouchableOpacity 
    className="flex-1 bg-blue-500 rounded-xl py-4 justify-center items-center"
    onPress={() => router.push('/recharge')}
  >
    <Feather name="zap" size={20} color="white" />
    <Text className="text-white text-sm font-semibold mt-1">Recharge</Text>
  </TouchableOpacity>
  
  <TouchableOpacity 
    className="flex-1 bg-green-500 rounded-xl py-4 justify-center items-center"
    onPress={() => router.push('/travel')}
  >
    <Feather name="plane" size={20} color="white" />
    <Text className="text-white text-sm font-semibold mt-1">Travel</Text>
  </TouchableOpacity>
</View>
```

---

## Phase 2: Wallet Screen (Week 1-2)

### New File: `mobile/src/app/wallet.tsx`

```jsx
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';

export default function WalletScreen() {
  const [balance, setBalance] = useState({ balance: 0, locked: 0, available: 0 });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const [balanceRes, txnRes] = await Promise.all([
        fetch('http://localhost:3000/api/v1/wallet/balance', {
          headers: { Authorization: `Bearer ${await getToken()}` }
        }),
        fetch('http://localhost:3000/api/v1/wallet/history?limit=20', {
          headers: { Authorization: `Bearer ${await getToken()}` }
        })
      ]);

      setBalance(await balanceRes.json());
      const data = await txnRes.json();
      setTransactions(data.transactions || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-black">
      {/* Header */}
      <View className="px-4 py-6 pt-12 bg-gray-900">
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="chevron-left" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-3xl font-bold mt-4">Wallet</Text>
      </View>

      <View className="px-4 py-6">
        {/* Balance Card */}
        <View className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 mb-6">
          <Text className="text-white/80 text-sm mb-2">Available Balance</Text>
          <Text className="text-white text-4xl font-bold mb-6">
            ₹{balance.available?.toLocaleString() || '0'}
          </Text>

          <View className="flex-row justify-between pt-4 border-t border-white/20">
            <View>
              <Text className="text-white/80 text-xs">Total Balance</Text>
              <Text className="text-white text-xl font-semibold">
                ₹{balance.balance?.toLocaleString() || '0'}
              </Text>
            </View>
            <View>
              <Text className="text-white/80 text-xs">Locked</Text>
              <Text className="text-white text-xl font-semibold">
                ₹{balance.locked?.toLocaleString() || '0'}
              </Text>
            </View>
          </View>
        </View>

        {/* Withdraw Button */}
        <TouchableOpacity 
          className="bg-orange-500 rounded-xl py-4 items-center mb-8"
          onPress={() => router.push('/withdraw')}
        >
          <Text className="text-white font-bold text-lg">Withdraw Now</Text>
        </TouchableOpacity>

        {/* Recent Transactions */}
        <Text className="text-white text-lg font-bold mb-4">Recent Transactions</Text>
        <FlatList
          scrollEnabled={false}
          data={transactions}
          renderItem={({ item }) => (
            <View className="flex-row justify-between items-center bg-gray-900 rounded-lg p-4 mb-2">
              <View>
                <Text className="text-white font-semibold capitalize">{item.type}</Text>
                <Text className="text-gray-400 text-sm">{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text className={`text-lg font-bold ${item.type === 'earn' ? 'text-green-400' : 'text-orange-400'}`}>
                {item.type === 'earn' ? '+' : '-'}₹{item.amount.toLocaleString()}
              </Text>
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
      </View>
    </ScrollView>
  );
}
```

---

## Phase 3: KYC Verification Screen (Week 2)

### New File: `mobile/src/app/kyc-verification.tsx`

```jsx
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { TextInput } from 'react-native-gesture-handler';

export default function KycVerificationScreen() {
  const [kycStatus, setKycStatus] = useState(null);
  const [form, setForm] = useState({ aadhar: '', pan: '', accountNumber: '', ifsc: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkKycStatus();
  }, []);

  const checkKycStatus = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/v1/kyc/status', {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });
      setKycStatus(await res.json());
    } catch (error) {
      console.error(error);
    }
  };

  const verifyAadhar = async () => {
    if (!form.aadhar || form.aadhar.length !== 12) {
      Alert.alert('Invalid', 'Aadhar must be 12 digits');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/v1/kyc/aadhar/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getToken()}`
        },
        body: JSON.stringify({ aadharNumber: form.aadhar })
      });
      const data = await res.json();
      if (data.status === 'success') {
        Alert.alert('Success', 'Aadhar verified');
        await checkKycStatus();
      } else {
        Alert.alert('Failed', data.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Similar for PAN and Bank Account...

  return (
    <ScrollView className="flex-1 bg-black">
      <View className="px-4 py-6 pt-12 bg-gray-900">
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="chevron-left" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-3xl font-bold mt-4">KYC Verification</Text>
      </View>

      <View className="px-4 py-6">
        {/* KYC Status Overview */}
        <View className="bg-gray-900 rounded-xl p-4 mb-6">
          <View className="flex-row justify-between mb-4">
            <View className="flex-1">
              <View className="flex-row items-center mb-2">
                <Feather name={kycStatus?.aadharVerified ? 'check-circle' : 'circle'} size={20} color={kycStatus?.aadharVerified ? '#10b981' : '#6b7280'} />
                <Text className="text-white ml-2 font-semibold">Aadhar</Text>
              </View>
            </View>
            <Text className={kycStatus?.aadharVerified ? 'text-green-400' : 'text-gray-400'}>{kycStatus?.aadharVerified ? 'Verified' : 'Pending'}</Text>
          </View>

          {/* PAN Row */}
          <View className="flex-row justify-between mb-4">
            <View className="flex-1">
              <View className="flex-row items-center mb-2">
                <Feather name={kycStatus?.panVerified ? 'check-circle' : 'circle'} size={20} color={kycStatus?.panVerified ? '#10b981' : '#6b7280'} />
                <Text className="text-white ml-2 font-semibold">PAN</Text>
              </View>
            </View>
            <Text className={kycStatus?.panVerified ? 'text-green-400' : 'text-gray-400'}>{kycStatus?.panVerified ? 'Verified' : 'Pending'}</Text>
          </View>

          {/* Bank Account Row */}
          <View className="flex-row justify-between">
            <View className="flex-1">
              <View className="flex-row items-center">
                <Feather name={kycStatus?.bankAccountVerified ? 'check-circle' : 'circle'} size={20} color={kycStatus?.bankAccountVerified ? '#10b981' : '#6b7280'} />
                <Text className="text-white ml-2 font-semibold">Bank Account</Text>
              </View>
            </View>
            <Text className={kycStatus?.bankAccountVerified ? 'text-green-400' : 'text-gray-400'}>{kycStatus?.bankAccountVerified ? 'Verified' : 'Pending'}</Text>
          </View>
        </View>

        {!kycStatus?.aadharVerified && (
          <View className="bg-gray-900 rounded-xl p-4 mb-4">
            <Text className="text-white font-semibold mb-3">Enter Aadhar Number</Text>
            <TextInput
              placeholder="12-digit Aadhar"
              placeholderTextColor="#6b7280"
              className="bg-black border border-gray-700 rounded-lg p-3 text-white mb-3"
              keyboardType="numeric"
              maxLength={12}
              value={form.aadhar}
              onChangeText={(text) => setForm({ ...form, aadhar: text })}
            />
            <TouchableOpacity 
              className="bg-orange-500 rounded-lg py-3 items-center"
              onPress={verifyAadhar}
              disabled={loading}
            >
              <Text className="text-white font-bold">{loading ? 'Verifying...' : 'Verify Aadhar'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* PAN and Bank Account forms similar... */}

        {kycStatus?.canWithdraw && (
          <View className="bg-green-500/10 border border-green-500 rounded-lg p-4">
            <View className="flex-row items-center">
              <Feather name="check-circle" size={20} color="#10b981" />
              <Text className="text-green-400 font-semibold ml-2">All KYC Complete! Ready to withdraw.</Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
```

---

## Phase 4: Withdraw Screen (Week 2)

### New File: `mobile/src/app/withdraw.tsx`

```jsx
import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useState, useEffect } from 'react';

export default function WithdrawScreen() {
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/v1/wallet/balance', {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });
      const data = await res.json();
      setBalance(data.available || 0);
    } catch (error) {
      console.error(error);
    }
  };

  const requestPayout = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum < 100) {
      Alert.alert('Invalid', 'Minimum withdrawal is ₹100');
      return;
    }
    if (amountNum > balance) {
      Alert.alert('Insufficient', 'You don\'t have enough balance');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/v1/payouts/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getToken()}`
        },
        body: JSON.stringify({ amount: amountNum })
      });

      if (res.ok) {
        Alert.alert('Success', 'Payout initiated! Check your bank account in 1-2 hours.');
        router.back();
      } else {
        const data = await res.json();
        Alert.alert('Failed', data.error || 'Payout failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-black">
      <View className="px-4 py-6 pt-12 bg-gray-900">
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="chevron-left" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-3xl font-bold mt-4">Withdraw</Text>
      </View>

      <View className="px-4 py-6">
        {/* Balance Info */}
        <View className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 mb-6">
          <Text className="text-white/80 text-sm">Available to Withdraw</Text>
          <Text className="text-white text-3xl font-bold">₹{balance.toLocaleString()}</Text>
        </View>

        {/* Amount Input */}
        <Text className="text-white font-semibold mb-2">Enter Amount</Text>
        <View className="flex-row items-center bg-gray-900 rounded-lg px-3 py-2 mb-4 border border-gray-700">
          <Text className="text-white text-xl">₹</Text>
          <TextInput
            placeholder="Enter amount"
            placeholderTextColor="#6b7280"
            className="flex-1 text-white text-lg ml-2 py-2"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        {/* Quick Select */}
        <View className="flex-row gap-2 mb-6">
          {[100, 500, 1000, 5000].map((preset) => (
            <TouchableOpacity
              key={preset}
              className={`flex-1 py-2 rounded-lg border ${amount === preset.toString() ? 'bg-orange-500 border-orange-500' : 'bg-gray-900 border-gray-700'}`}
              onPress={() => setAmount(preset.toString())}
            >
              <Text className={`text-center font-semibold ${amount === preset.toString() ? 'text-white' : 'text-gray-400'}`}>
                ₹{preset}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Box */}
        <View className="bg-blue-500/10 border border-blue-500 rounded-lg p-3 mb-6">
          <View className="flex-row">
            <Feather name="info" size={16} color="#3b82f6" />
            <Text className="text-blue-400 text-xs ml-2 flex-1">Payouts typically arrive in 1-2 hours. Weekends may take longer.</Text>
          </View>
        </View>

        {/* Withdraw Button */}
        <TouchableOpacity 
          className="bg-orange-500 rounded-lg py-4 items-center"
          onPress={requestPayout}
          disabled={loading || !amount}
        >
          <Text className="text-white font-bold text-lg">
            {loading ? 'Processing...' : `Withdraw ₹${amount || '0'}`}
          </Text>
        </TouchableOpacity>

        {/* Disclaimer */}
        <Text className="text-gray-500 text-xs text-center mt-4">
          By withdrawing, you agree to our payment terms and privacy policy.
        </Text>
      </View>
    </ScrollView>
  );
}
```

---

## Integration Partner Checklist

### What Partners Will Audit

- [ ] **Home screen shows balance** (✓ adds trust)
- [ ] **One-click withdraw** (✓ reduces friction)
- [ ] **Clear KYC status** (✓ shows progress)
- [ ] **Transaction history** (✓ transparency)
- [ ] **Real payout processing** (✓ not mock)
- [ ] **Error handling** (✓ no crashes)
- [ ] **Fast load times** (✓ < 2s)
- [ ] **Professional branding** (✓ looks complete)

### Live Partner Demo Flow

Partners will test this sequence:

1. **Onboard user** → Phone number + OTP
2. **Complete KYC** → Aadhar, PAN, Bank
3. **Earn balance** → Through payments/commissions
4. **View balance** → Wallet screen shows ₹
5. **Request payout** → Withdraw button → Confirm
6. **Verify payout** → Check their backend webhook logs
7. **Confirm receipt** → Bank statement shows money

**If any step fails, partners will reject integration.**

---

## Before Partner Demo

Run this checklist:

- [ ] All screens load without crashes
- [ ] Balance updates in real-time
- [ ] Payout succeeds & money actually transfers
- [ ] Error messages are clear (not technical)
- [ ] UI is polished (no typos, consistent colors)
- [ ] No console errors
- [ ] Network requests log cleanly
- [ ] Tested on both iOS and Android

---

## Critical Success Metrics

Partners measure:

| Metric | Target | Partners care because |
|--------|--------|----------------------|
| App stability (crash rate) | < 0.1% | Users will abandon app |
| Balance accuracy | 100% | Financial trust is critical |
| Payout success rate | > 99% | Users demand their money |
| Payout settlement time | < 2 hours | Users get frustrated waiting |
| KYC approval time | < 5 minutes | Slow KYC = lower conversion |

---

## Final Notes

- **Partners are not investors.** They care about uptime, accuracy, and compliance.
- **Every screen you add = support overhead.** Prioritize the money flows (balance → payout).
- **Test with real money.** Mock payments won't convince partners. Use test accounts on Razorpay sandbox.
- **Document everything.** Partners will ask "how do users withdraw?" — show them.

---

**Document Status:** Ready for mobile implementation  
**Screens to add:** 5 (Wallet, KYC Verification, Withdraw, Recharge, Travel)  
**Estimated time:** 4 days
