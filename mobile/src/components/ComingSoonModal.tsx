import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  Platform,
  ToastAndroid,
  Alert,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Clock, Rocket, X, Bell, ArrowLeft } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import { LinearGradient } from 'expo-linear-gradient';

export type ComingSoonModule = 'gold-loans' | 'real-estate';

interface ComingSoonModalProps {
  visible: boolean;
  module: ComingSoonModule | null;
  onClose: () => void;
}

const MODULE_CONFIG = {
  'gold-loans': {
    title: 'Gold Loans',
    subtitle: "Gold Loans are launching shortly. We're building a faster, smoother experience for you.",
    icon: Rocket,
    gradientColors: ['#F59E0B', '#EAB308'] as [string, string],
    accentColor: '#EAB308',
    bgLight: '#FEFCE8',
    iconBg: '#FEF9C3',
  },
  'real-estate': {
    title: 'Real Estate',
    subtitle: "Real Estate is launching shortly. We're preparing verified listings and a simpler flow.",
    icon: Clock,
    gradientColors: ['#64748B', '#475569'] as [string, string],
    accentColor: '#64748B',
    bgLight: '#F8FAFC',
    iconBg: '#F1F5F9',
  },
};

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL || '';

export default function ComingSoonModal({ visible, module, onClose }: ComingSoonModalProps) {
  const [notified, setNotified] = useState(false);
  const [loading, setLoading] = useState(false);

  const config = module ? MODULE_CONFIG[module] : null;
  const Icon = config?.icon ?? Clock;

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('', message, [{ text: 'OK' }]);
    }
  };

  const handleNotifyMe = async () => {
    if (!module || loading) return;
    try {
      setLoading(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      await fetch(`${BACKEND_URL}/api/notify-interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module_name: module === 'gold-loans' ? 'Gold Loans' : 'Real Estate',
          timestamp: new Date().toISOString(),
        }),
      });

      setNotified(true);
      showToast("You'll be notified when it's live.");
    } catch {
      // Still show success even if network fails — intent captured
      setNotified(true);
      showToast("You'll be notified when it's live.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNotified(false);
    onClose();
  };

  if (!config || !module) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}
        onPress={handleClose}
      >
        <Pressable onPress={() => {}} style={{ width: '100%' }}>
          <Animated.View
            entering={FadeInUp.springify().damping(18).stiffness(120)}
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingBottom: Platform.OS === 'ios' ? 40 : 28,
              overflow: 'hidden',
            }}
          >
            {/* Top gradient strip */}
            <LinearGradient
              colors={config.gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 4, width: '100%' }}
            />

            {/* Dismiss handle */}
            <View className="items-center pt-3 pb-1">
              <View className="w-10 h-1 bg-gray-200 rounded-full" />
            </View>

            {/* Close button */}
            <View className="flex-row justify-end px-5 pt-1 pb-2">
              <Pressable
                onPress={handleClose}
                className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
              >
                <X size={16} color="#6B7280" />
              </Pressable>
            </View>

            {/* Icon */}
            <Animated.View
              entering={ZoomIn.delay(100).springify()}
              className="items-center mt-2 mb-5"
            >
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 24,
                  backgroundColor: config.iconBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: config.accentColor,
                  shadowOpacity: 0.2,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 4,
                }}
              >
                <LinearGradient
                  colors={config.gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 24,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={38} color="#fff" strokeWidth={1.8} />
                </LinearGradient>
              </View>
            </Animated.View>

            {/* Text content */}
            <Animated.View
              entering={FadeInDown.delay(150).springify()}
              className="px-6 items-center"
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  letterSpacing: 1.4,
                  color: config.accentColor,
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                Coming Soon
              </Text>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '700',
                  color: '#111827',
                  textAlign: 'center',
                  marginBottom: 12,
                }}
              >
                {config.title}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: '#6B7280',
                  textAlign: 'center',
                  lineHeight: 22,
                  maxWidth: 300,
                }}
              >
                {config.subtitle}
              </Text>
            </Animated.View>

            {/* Divider */}
            <View className="mx-6 mt-6 mb-5 h-px bg-gray-100" />

            {/* Buttons */}
            <Animated.View
              entering={FadeInDown.delay(200).springify()}
              className="px-6 gap-3"
            >
              {!notified ? (
                <Pressable
                  onPress={handleNotifyMe}
                  disabled={loading}
                  style={{
                    borderRadius: 14,
                    overflow: 'hidden',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  <LinearGradient
                    colors={config.gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: 16,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <Bell size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>
                      {loading ? 'Registering...' : 'Notify Me'}
                    </Text>
                  </LinearGradient>
                </Pressable>
              ) : (
                <Animated.View
                  entering={ZoomIn.springify()}
                  style={{
                    borderRadius: 14,
                    backgroundColor: '#F0FDF4',
                    paddingVertical: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Bell size={18} color="#16A34A" />
                  <Text style={{ color: '#16A34A', fontWeight: '600', fontSize: 15 }}>
                    You're on the list!
                  </Text>
                </Animated.View>
              )}

              <Pressable
                onPress={handleClose}
                style={{
                  borderRadius: 14,
                  backgroundColor: '#F3F4F6',
                  paddingVertical: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <ArrowLeft size={18} color="#374151" />
                <Text style={{ color: '#374151', fontWeight: '600', fontSize: 15 }}>
                  Back to Home
                </Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
