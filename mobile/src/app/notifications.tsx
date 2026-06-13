import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  X,
  CheckCheck,
  BellOff,
  Gift,
  Wallet,
  ShieldCheck,
  ShieldX,
  Bell,
} from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import PressableScale from '@/components/PressableScale';
import { useNotificationStore, type NotificationType } from '@/lib/notification-store';

const ICON_BY_TYPE: Record<NotificationType, { Icon: typeof Bell; color: string; bg: string }> = {
  incentive_approved: { Icon: Gift, color: '#16A34A', bg: '#F0FDF4' },
  payout_success: { Icon: Wallet, color: '#2563EB', bg: '#EFF6FF' },
  kyc_approved: { Icon: ShieldCheck, color: '#0EA5E9', bg: '#F0F9FF' },
  kyc_rejected: { Icon: ShieldX, color: '#DC2626', bg: '#FEF2F2' },
  general: { Icon: Bell, color: '#F97316', bg: '#FFF7ED' },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  const handlePress = (id: string, actionUrl?: string) => {
    markAsRead(id);
    if (actionUrl) {
      router.back();
      // allow the modal to dismiss before navigating
      setTimeout(() => router.push(actionUrl as any), 250);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <LinearGradient colors={['#002561', '#0A3D91']} style={{ paddingBottom: 18 }}>
        <SafeAreaView edges={['top']}>
          <View className="px-4 pt-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Text className="text-white text-xl font-bold">Notifications</Text>
                {unreadCount > 0 && (
                  <View className="bg-orange-500 px-2 py-0.5 rounded-full ml-2">
                    <Text className="text-white text-xs font-bold">{unreadCount} new</Text>
                  </View>
                )}
              </View>
              <PressableScale
                haptic="light"
                onPress={() => router.back()}
                className="w-9 h-9 bg-white/15 rounded-full items-center justify-center"
              >
                <X size={18} color="#fff" />
              </PressableScale>
            </View>

            {unreadCount > 0 && (
              <PressableScale
                haptic="selection"
                onPress={markAllAsRead}
                className="flex-row items-center self-start mt-3 bg-white/15 px-3 py-1.5 rounded-full"
              >
                <CheckCheck size={14} color="#fff" />
                <Text className="text-white text-xs font-semibold ml-1.5">Mark all as read</Text>
              </PressableScale>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        {notifications.length === 0 ? (
          <View className="items-center justify-center mt-24">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <BellOff size={32} color="#9CA3AF" />
            </View>
            <Text className="text-gray-800 font-semibold text-base">No notifications yet</Text>
            <Text className="text-gray-400 text-sm mt-1 text-center px-8">
              You'll see updates on payouts, KYC and incentives here.
            </Text>
          </View>
        ) : (
          notifications.map((n, index) => {
            const { Icon, color, bg } = ICON_BY_TYPE[n.type];
            return (
              <Animated.View key={n.id} entering={FadeInDown.delay(index * 60).springify()}>
                <PressableScale
                  activeScale={0.98}
                  haptic="light"
                  onPress={() => handlePress(n.id, n.actionUrl)}
                  className={`flex-row p-4 rounded-2xl mb-3 ${n.read ? 'bg-white' : 'bg-white'}`}
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                    elevation: 2,
                    borderWidth: n.read ? 0 : 1,
                    borderColor: '#FFE4CC',
                  }}
                >
                  <View
                    className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: bg }}
                  >
                    <Icon size={22} color={color} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-900 font-semibold flex-1" numberOfLines={1}>
                        {n.title}
                      </Text>
                      {!n.read && <View className="w-2.5 h-2.5 bg-orange-500 rounded-full ml-2" />}
                    </View>
                    <Text className="text-gray-500 text-sm mt-0.5 leading-5" numberOfLines={3}>
                      {n.message}
                    </Text>
                    <Text className="text-gray-400 text-xs mt-2">{timeAgo(n.createdAt)}</Text>
                  </View>
                </PressableScale>
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
