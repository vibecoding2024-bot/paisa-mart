import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react-native';
import { useToastStore, type ToastType } from '@/lib/toast-store';

const CONFIG: Record<ToastType, { color: string; bg: string; Icon: typeof Info }> = {
  success: { color: '#16A34A', bg: '#F0FDF4', Icon: CheckCircle2 },
  error: { color: '#DC2626', bg: '#FEF2F2', Icon: AlertCircle },
  info: { color: '#002561', bg: '#EFF4FF', Icon: Info },
};

/**
 * Single global toast renderer. Mounted once at the root so any screen can call
 * `toast.success(...)` without wiring providers. Auto-dismisses after 2.6s.
 */
export default function ToastHost() {
  const insets = useSafeAreaInsets();
  const visible = useToastStore((s) => s.visible);
  const message = useToastStore((s) => s.message);
  const type = useToastStore((s) => s.type);
  const hide = useToastStore((s) => s.hide);

  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 18, stiffness: 220 });
      opacity.value = withTiming(1, { duration: 180 });
      const timer = setTimeout(() => {
        translateY.value = withTiming(-120, { duration: 220 });
        opacity.value = withTiming(0, { duration: 220 }, (finished) => {
          if (finished) runOnJS(hide)();
        });
      }, 2600);
      return () => clearTimeout(timer);
    }
  }, [visible, message, type]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible && opacity.value === 0) return null;

  const { color, bg, Icon } = CONFIG[type];

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: insets.top + 8,
          left: 16,
          right: 16,
          zIndex: 9999,
        },
        animatedStyle,
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#fff',
          borderRadius: 16,
          paddingVertical: 12,
          paddingHorizontal: 14,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          elevation: 8,
        }}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            backgroundColor: bg,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Icon size={20} color={color} />
        </View>
        <Text style={{ flex: 1, color: '#1F2937', fontWeight: '600', fontSize: 14 }} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}
