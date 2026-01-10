import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  Shield,
  Camera,
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  CreditCard,
  User,
  FileText,
  Smile,
  Clock,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useIncentiveStore, KYCDocument } from '@/lib/incentive-store';

const KYC_STEPS = [
  { id: 'aadhaar_front', label: 'Aadhaar Front', icon: CreditCard, description: 'Upload front side of your Aadhaar card' },
  { id: 'aadhaar_back', label: 'Aadhaar Back', icon: CreditCard, description: 'Upload back side of your Aadhaar card' },
  { id: 'pan', label: 'PAN Card', icon: FileText, description: 'Upload your PAN card' },
  { id: 'selfie', label: 'Selfie', icon: Smile, description: 'Take a clear selfie for verification' },
] as const;

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  not_started: { bg: '#F3F4F6', text: '#6B7280', icon: <Clock size={16} color="#6B7280" /> },
  submitted: { bg: '#FEF3C7', text: '#F59E0B', icon: <Clock size={16} color="#F59E0B" /> },
  verified: { bg: '#D1FAE5', text: '#10B981', icon: <CheckCircle size={16} color="#10B981" /> },
  rejected: { bg: '#FEE2E2', text: '#EF4444', icon: <XCircle size={16} color="#EF4444" /> },
  pending: { bg: '#E0E7FF', text: '#6366F1', icon: <Clock size={16} color="#6366F1" /> },
};

export default function KYCScreen() {
  const router = useRouter();
  const userKYC = useIncentiveStore(s => s.userKYC);
  const initializeKYC = useIncentiveStore(s => s.initializeKYC);
  const uploadKYCDocument = useIncentiveStore(s => s.uploadKYCDocument);
  const submitKYC = useIncentiveStore(s => s.submitKYC);

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!userKYC) {
      initializeKYC('user-current');
    }
  }, []);

  const getDocumentStatus = (docType: KYCDocument['type']) => {
    const doc = userKYC?.documents.find(d => d.type === docType);
    return doc?.status || 'not_uploaded';
  };

  const getDocumentUri = (docType: KYCDocument['type']) => {
    const doc = userKYC?.documents.find(d => d.type === docType);
    return doc?.uri;
  };

  const handlePickImage = async (docType: KYCDocument['type'], useCamera: boolean = false) => {
    try {
      setIsUploading(true);

      let result;
      if (useCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
          setIsUploading(false);
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: docType === 'selfie' ? [1, 1] : [4, 3],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: docType === 'selfie' ? [1, 1] : [4, 3],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        uploadKYCDocument(docType, result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitKYC = () => {
    const requiredDocs = ['aadhaar_front', 'aadhaar_back', 'pan', 'selfie'];
    const uploadedDocs = userKYC?.documents.map(d => d.type) || [];
    const missingDocs = requiredDocs.filter(d => !uploadedDocs.includes(d as KYCDocument['type']));

    if (missingDocs.length > 0) {
      Alert.alert('Incomplete', 'Please upload all required documents before submitting.');
      return;
    }

    Alert.alert(
      'Submit KYC',
      'Are you sure you want to submit your KYC documents for verification? You won\'t be able to modify them after submission.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          onPress: () => {
            submitKYC();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const canSubmit = userKYC && userKYC.progressPercentage === 100 && userKYC.status === 'not_started';

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
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
                <Text className="text-white/70 text-sm">Complete your KYC to enable withdrawals</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View className="bg-white/20 rounded-full h-3 mt-2">
              <Animated.View
                entering={FadeInDown.delay(200).springify()}
                className="h-3 rounded-full bg-orange-500"
                style={{ width: `${userKYC?.progressPercentage || 0}%` }}
              />
            </View>
            <Text className="text-white/80 text-sm mt-2 text-center">
              {userKYC?.progressPercentage || 0}% Complete
            </Text>
          </View>
        </LinearGradient>

        <ScrollView
          className="flex-1 -mt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* KYC Status Card */}
          {userKYC && userKYC.status !== 'not_started' && (
            <Animated.View entering={FadeInUp.delay(100).springify()} className="mx-4 mt-4">
              <View
                className="rounded-xl p-4 flex-row items-center"
                style={{ backgroundColor: STATUS_CONFIG[userKYC.status]?.bg || '#F3F4F6' }}
              >
                {STATUS_CONFIG[userKYC.status]?.icon}
                <View className="flex-1 ml-3">
                  <Text className="font-semibold" style={{ color: STATUS_CONFIG[userKYC.status]?.text }}>
                    {userKYC.status === 'submitted' && 'Under Review'}
                    {userKYC.status === 'verified' && 'KYC Verified'}
                    {userKYC.status === 'rejected' && 'KYC Rejected'}
                  </Text>
                  <Text className="text-gray-600 text-sm mt-0.5">
                    {userKYC.status === 'submitted' && 'Your documents are being verified'}
                    {userKYC.status === 'verified' && 'You can now withdraw your earnings'}
                    {userKYC.status === 'rejected' && userKYC.rejectionReason}
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Important Notice */}
          <Animated.View entering={FadeInUp.delay(150).springify()} className="mx-4 mt-4">
            <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <View className="flex-row items-center mb-2">
                <AlertTriangle size={18} color="#F59E0B" />
                <Text className="text-yellow-800 font-semibold ml-2">Important</Text>
              </View>
              <Text className="text-yellow-700 text-sm">
                • Name on PAN and Aadhaar must match{'\n'}
                • Documents must be clear and readable{'\n'}
                • Selfie must be taken in good lighting{'\n'}
                • KYC is mandatory for withdrawals
              </Text>
            </View>
          </Animated.View>

          {/* Document Upload Cards */}
          {KYC_STEPS.map((step, index) => {
            const docStatus = getDocumentStatus(step.id);
            const docUri = getDocumentUri(step.id);
            const isUploaded = !!docUri;
            const isDisabled = userKYC?.status === 'submitted' || userKYC?.status === 'verified';

            return (
              <Animated.View
                key={step.id}
                entering={FadeInUp.delay(200 + index * 50).springify()}
                className="mx-4 mt-4"
              >
                <View className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <View className="p-4">
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center">
                        <View className="w-10 h-10 bg-gray-100 rounded-xl items-center justify-center mr-3">
                          <step.icon size={20} color="#6B7280" />
                        </View>
                        <View>
                          <Text className="text-gray-800 font-semibold">{step.label}</Text>
                          <Text className="text-gray-500 text-xs">{step.description}</Text>
                        </View>
                      </View>
                      {isUploaded && (
                        <View
                          className="px-2 py-1 rounded-full"
                          style={{ backgroundColor: STATUS_CONFIG[docStatus]?.bg || STATUS_CONFIG.pending.bg }}
                        >
                          <Text
                            className="text-xs font-medium"
                            style={{ color: STATUS_CONFIG[docStatus]?.text || STATUS_CONFIG.pending.text }}
                          >
                            {docStatus === 'verified' ? 'Verified' : docStatus === 'rejected' ? 'Rejected' : 'Uploaded'}
                          </Text>
                        </View>
                      )}
                    </View>

                    {isUploaded && docUri ? (
                      <View className="bg-gray-100 rounded-xl overflow-hidden">
                        <Image
                          source={{ uri: docUri }}
                          className="w-full h-40"
                          resizeMode="cover"
                        />
                      </View>
                    ) : (
                      <View className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-6 items-center">
                        <Upload size={32} color="#9CA3AF" />
                        <Text className="text-gray-500 text-sm mt-2">Tap to upload</Text>
                      </View>
                    )}

                    {!isDisabled && (
                      <View className="flex-row gap-3 mt-3">
                        <Pressable
                          onPress={() => handlePickImage(step.id, false)}
                          disabled={isUploading}
                          className="flex-1 bg-gray-100 py-3 rounded-xl flex-row items-center justify-center"
                        >
                          {isUploading ? (
                            <ActivityIndicator size="small" color="#6B7280" />
                          ) : (
                            <>
                              <Upload size={18} color="#6B7280" />
                              <Text className="text-gray-600 font-medium ml-2">Gallery</Text>
                            </>
                          )}
                        </Pressable>
                        {step.id === 'selfie' && (
                          <Pressable
                            onPress={() => handlePickImage(step.id, true)}
                            disabled={isUploading}
                            className="flex-1 bg-orange-500 py-3 rounded-xl flex-row items-center justify-center"
                          >
                            <Camera size={18} color="#fff" />
                            <Text className="text-white font-medium ml-2">Camera</Text>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              </Animated.View>
            );
          })}

          {/* Submit Button */}
          {userKYC?.status === 'not_started' && (
            <Animated.View entering={FadeInUp.delay(450).springify()} className="mx-4 mt-6">
              <Pressable
                onPress={handleSubmitKYC}
                disabled={!canSubmit}
                className={`py-4 rounded-xl items-center ${canSubmit ? 'bg-orange-500' : 'bg-gray-300'}`}
              >
                <Text className={`font-bold text-base ${canSubmit ? 'text-white' : 'text-gray-500'}`}>
                  Submit for Verification
                </Text>
              </Pressable>
              {!canSubmit && (
                <Text className="text-gray-500 text-center text-sm mt-2">
                  Upload all documents to submit
                </Text>
              )}
            </Animated.View>
          )}

          {/* Resubmit Option */}
          {userKYC?.status === 'rejected' && (
            <Animated.View entering={FadeInUp.delay(450).springify()} className="mx-4 mt-6">
              <Pressable
                onPress={() => initializeKYC('user-current')}
                className="bg-orange-500 py-4 rounded-xl items-center"
              >
                <Text className="text-white font-bold text-base">Re-upload Documents</Text>
              </Pressable>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
