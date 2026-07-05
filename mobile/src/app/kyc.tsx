import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  Clock,
  ExternalLink,
  FileText,
  RefreshCw,
} from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import { useIncentiveStore, type KYCStatus } from '@/lib/incentive-store';
import { useUserProfileStore } from '@/lib/user-profile-store';
import { getDigiLockerKycStatus, startDigiLockerKyc } from '@/lib/kyc-api';

const STATUS_CONFIG: Record<KYCStatus, { bg: string; text: string; title: string; message: string; icon: React.ReactNode }> = {
  not_started: {
    bg: '#F3F4F6',
    text: '#6B7280',
    title: 'DigiLocker KYC Pending',
    message: 'Start DigiLocker verification to complete your KYC.',
    icon: <Clock size={16} color="#6B7280" />,
  },
  submitted: {
    bg: '#FEF3C7',
    text: '#F59E0B',
    title: 'Waiting for DigiLocker',
    message: 'Finish the authorization in the browser window.',
    icon: <Clock size={16} color="#F59E0B" />,
  },
  verified: {
    bg: '#D1FAE5',
    text: '#10B981',
    title: 'KYC Verified',
    message: 'Your DigiLocker KYC is complete.',
    icon: <CheckCircle size={16} color="#10B981" />,
  },
  rejected: {
    bg: '#FEE2E2',
    text: '#EF4444',
    title: 'KYC Failed',
    message: 'DigiLocker verification was not completed. Please try again.',
    icon: <XCircle size={16} color="#EF4444" />,
  },
};

export default function KYCScreen() {
  const router = useRouter();
  const userKYC = useIncentiveStore(s => s.userKYC);
  const initializeKYC = useIncentiveStore(s => s.initializeKYC);
  const setKYCStatus = useIncentiveStore(s => s.setKYCStatus);
  const profile = useUserProfileStore(s => s.profile);

  const [isStarting, setIsStarting] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');

  const phoneNumber = profile?.phoneNumber || userKYC?.userId || '';
  const kycStatus = userKYC?.status || 'not_started';
  const statusConfig = STATUS_CONFIG[kycStatus];
  const progressPercentage = kycStatus === 'verified' ? 100 : kycStatus === 'submitted' ? 50 : 0;

  useEffect(() => {
    if (!userKYC) {
      initializeKYC(profile?.phoneNumber || 'user-current');
    }
  }, [initializeKYC, profile?.phoneNumber, userKYC]);

  useEffect(() => {
    if (userKYC?.status === 'verified') {
      router.replace('/(tabs)');
    }
  }, [router, userKYC?.status]);

  useEffect(() => {
    if (!activeSessionId) return;

    let isMounted = true;
    const interval = setInterval(async () => {
      try {
        const result = await getDigiLockerKycStatus(activeSessionId);
        if (!isMounted) return;

        if (result.status === 'verified' || result.kycStatus === 'verified') {
          setKYCStatus(phoneNumber, 'verified');
          setStatusMessage('DigiLocker KYC verified successfully.');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setActiveSessionId(null);
          router.replace('/(tabs)');
        } else if (result.status === 'failed' || result.kycStatus === 'rejected') {
          setKYCStatus(phoneNumber, 'rejected');
          setStatusMessage(result.error || 'DigiLocker KYC failed. Please try again.');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setActiveSessionId(null);
        } else {
          setKYCStatus(phoneNumber, 'submitted');
          setStatusMessage('Waiting for DigiLocker authorization...');
        }
      } catch (error) {
        if (!isMounted) return;
        setStatusMessage(error instanceof Error ? error.message : 'Unable to check DigiLocker status.');
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeSessionId, phoneNumber, router, setKYCStatus]);

  const handleStartDigiLocker = async () => {
    const normalizedPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    if (normalizedPhone.length !== 10) {
      Alert.alert('Profile Required', 'Please complete your profile before starting KYC.');
      router.push('/basic-info');
      return;
    }

    setIsStarting(true);
    setStatusMessage('');

    try {
      const result = await startDigiLockerKyc(normalizedPhone);
      setActiveSessionId(result.sessionId);
      setKYCStatus(normalizedPhone, 'submitted');
      setStatusMessage('Opening DigiLocker. Complete authorization to finish KYC.');

      const canOpen = await Linking.canOpenURL(result.authUrl);
      if (!canOpen) throw new Error('Unable to open DigiLocker on this device.');
      await Linking.openURL(result.authUrl);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to start DigiLocker KYC.';
      setStatusMessage(message);
      Alert.alert('DigiLocker KYC', message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsStarting(false);
    }
  };

  const buttonDisabled = isStarting || Boolean(activeSessionId) || kycStatus === 'verified';
  const buttonLabel =
    isStarting ? 'Starting DigiLocker...' :
    activeSessionId ? 'Waiting for DigiLocker' :
    kycStatus === 'verified' ? 'KYC Verified' :
    kycStatus === 'submitted' ? 'Restart DigiLocker KYC' :
    'Start DigiLocker KYC';

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1" edges={['top']}>
        <LinearGradient
          colors={['#002561', '#003380']}
          style={{ paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}
        >
          <View className="px-4 pt-2">
            <View className="flex-row items-center mb-4">
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 bg-white/10 rounded-full items-center justify-center mr-3"
              >
                <ChevronLeft size={24} color="#fff" />
              </Pressable>
              <View className="flex-1">
                <Text className="text-white text-xl font-semibold">KYC Verification</Text>
                <Text className="text-white/70 text-sm">Verify securely with DigiLocker</Text>
              </View>
            </View>

            <View className="bg-white/20 rounded-full h-3 mt-2">
              <Animated.View
                entering={FadeInDown.delay(200).springify()}
                className="h-3 rounded-full bg-orange-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </View>
            <Text className="text-white/80 text-sm mt-2 text-center">
              {progressPercentage}% Complete
            </Text>
          </View>
        </LinearGradient>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          className="flex-1 -mt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <Animated.View entering={FadeInUp.delay(100).springify()} className="mx-4 mt-4">
            <View
              className="rounded-xl p-4 flex-row items-center"
              style={{ backgroundColor: statusConfig.bg }}
            >
              {statusConfig.icon}
              <View className="flex-1 ml-3">
                <Text className="font-semibold" style={{ color: statusConfig.text }}>
                  {statusConfig.title}
                </Text>
                <Text className="text-gray-600 text-sm mt-0.5">
                  {statusMessage || statusConfig.message}
                </Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(150).springify()} className="mx-4 mt-4">
            <View className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <View className="flex-row items-center mb-2">
                <Shield size={18} color="#0A3D91" />
                <Text className="text-blue-900 font-semibold ml-2">DigiLocker Based KYC</Text>
              </View>
              <Text className="text-blue-800 text-sm leading-5">
                Authorize Paisa Mart through DigiLocker to verify your identity digitally. You will be redirected to DigiLocker and brought back after authorization.
              </Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(200).springify()} className="mx-4 mt-4">
            <View className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <View className="p-4">
                <View className="flex-row items-center mb-4">
                  <View className="w-11 h-11 bg-orange-50 rounded-xl items-center justify-center mr-3">
                    <FileText size={22} color="#FF8C00" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-bold">Verify using DigiLocker</Text>
                    <Text className="text-gray-500 text-xs mt-0.5">Aadhaar and issued document verification</Text>
                  </View>
                </View>

                <View className="bg-gray-50 rounded-xl p-4 mb-4">
                  <View className="flex-row items-start mb-3">
                    <CheckCircle size={16} color="#10B981" />
                    <Text className="text-gray-700 text-sm ml-2 flex-1">No manual Aadhaar, PAN or selfie uploads</Text>
                  </View>
                  <View className="flex-row items-start mb-3">
                    <CheckCircle size={16} color="#10B981" />
                    <Text className="text-gray-700 text-sm ml-2 flex-1">Secure consent-based verification</Text>
                  </View>
                  <View className="flex-row items-start">
                    <CheckCircle size={16} color="#10B981" />
                    <Text className="text-gray-700 text-sm ml-2 flex-1">KYC status updates automatically after completion</Text>
                  </View>
                </View>

                <Pressable
                  onPress={handleStartDigiLocker}
                  disabled={buttonDisabled}
                  className={`py-4 rounded-xl flex-row items-center justify-center ${
                    buttonDisabled ? 'bg-gray-300' : 'bg-orange-500'
                  }`}
                >
                  {isStarting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : activeSessionId || kycStatus === 'submitted' ? (
                    <RefreshCw size={18} color="#6B7280" />
                  ) : (
                    <ExternalLink size={18} color={buttonDisabled ? '#6B7280' : '#fff'} />
                  )}
                  <Text className={`font-bold text-base ml-2 ${buttonDisabled ? 'text-gray-600' : 'text-white'}`}>
                    {buttonLabel}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(250).springify()} className="mx-4 mt-4">
            <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <View className="flex-row items-center mb-2">
                <AlertTriangle size={18} color="#F59E0B" />
                <Text className="text-yellow-800 font-semibold ml-2">Before You Start</Text>
              </View>
              <Text className="text-yellow-700 text-sm leading-5">
                Keep your DigiLocker login ready. If the browser does not return automatically, come back to this screen and it will keep checking your KYC status.
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
