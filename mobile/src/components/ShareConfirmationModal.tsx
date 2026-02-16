import { useEffect } from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface ShareConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  productName?: string;
  bankName?: string;
}

export default function ShareConfirmationModal({
  visible,
  onClose,
  productName,
  bankName,
}: ShareConfirmationModalProps) {
  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/70 justify-center items-center px-6">
        <Animated.View
          entering={FadeIn.duration(200)}
          className="bg-white rounded-3xl w-full max-w-md overflow-hidden"
        >
          {/* Success Icon */}
          <Animated.View
            entering={FadeInDown.delay(100)}
            className="items-center pt-8 pb-4"
          >
            <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center">
              <CheckCircle size={48} color="#16A34A" strokeWidth={2} />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View
            entering={FadeInDown.delay(200)}
            className="px-6 pb-2"
          >
            <Text className="text-gray-900 font-bold text-2xl text-center">
              Request Shared Successfully
            </Text>
          </Animated.View>

          {/* Message */}
          <Animated.View
            entering={FadeInDown.delay(300)}
            className="px-6 pb-4"
          >
            <Text className="text-gray-600 text-base text-center leading-6">
              Thanks! Our team will reach out within the next few hours to understand your requirement and guide you on the next steps.
            </Text>

            {productName && bankName && (
              <View className="mt-4 bg-gray-50 p-3 rounded-xl">
                <Text className="text-gray-500 text-xs text-center">
                  You selected: {productName} | {bankName}
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Working Hours Note */}
          <Animated.View
            entering={FadeInDown.delay(400)}
            className="px-6 pb-6"
          >
            <View className="bg-blue-50 p-3 rounded-xl border border-blue-100">
              <Text className="text-blue-700 text-xs text-center">
                📞 If shared after business hours, we will contact you the next morning
              </Text>
            </View>
          </Animated.View>

          {/* Close Button */}
          <Animated.View entering={FadeInDown.delay(500)} className="px-6 pb-6">
            <Pressable
              onPress={onClose}
              className="bg-orange-500 rounded-xl py-4 items-center"
              style={{
                shadowColor: '#F97316',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text className="text-white font-semibold text-base">Got it!</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}
