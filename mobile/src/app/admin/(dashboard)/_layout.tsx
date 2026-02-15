import { useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter, usePathname, Slot } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  LayoutDashboard,
  Users,
  Kanban,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  Bell,
  Wallet,
  CreditCard,
  Package,
} from 'lucide-react-native';
import { useAdminStore } from '@/lib/admin-store';

export default function AdminTabsLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAdminStore(s => s.isAuthenticated);
  const currentAdmin = useAdminStore(s => s.currentAdmin);
  const logout = useAdminStore(s => s.logout);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/admin');
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    { path: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
    { path: '/admin/leads', label: 'Leads', icon: Users },
    { path: '/admin/pipeline', label: 'Pipeline', icon: Kanban },
    { path: '/admin/products', label: 'Products', icon: Package },
    { path: '/admin/incentives', label: 'Incentives', icon: Wallet },
    { path: '/admin/payouts', label: 'Payouts', icon: CreditCard },
    { path: '/admin/tasks', label: 'Tasks', icon: ClipboardList },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    router.replace('/admin');
  };

  const handleNavPress = (path: string) => {
    router.push(path as any);
  };

  return (
    <View className="flex-1 bg-slate-900">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Top Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-800">
          <View className="flex-row items-center">
            <View className="w-8 h-8 bg-orange-500 rounded-lg items-center justify-center mr-2">
              <Shield size={18} color="#fff" />
            </View>
            <Text className="text-white font-bold text-lg">Paisa Mart Admin</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Pressable className="w-9 h-9 bg-slate-800 rounded-full items-center justify-center">
              <Bell size={18} color="#94A3B8" />
            </Pressable>
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-slate-700 rounded-full items-center justify-center mr-2">
                <Text className="text-white font-bold text-sm">
                  {currentAdmin?.name?.charAt(0) || 'A'}
                </Text>
              </View>
              <View>
                <Text className="text-white text-sm font-medium">{currentAdmin?.name}</Text>
                <Text className="text-slate-400 text-xs capitalize">{currentAdmin?.role}</Text>
              </View>
            </View>
            <Pressable
              onPress={handleLogout}
              className="w-9 h-9 bg-red-500/20 rounded-full items-center justify-center ml-2"
            >
              <LogOut size={18} color="#EF4444" />
            </Pressable>
          </View>
        </View>

        {/* Navigation Tabs */}
        <View className="border-b border-slate-800">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
          >
            {navItems.map((item) => {
              const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
              return (
                <Pressable
                  key={item.path}
                  onPress={() => handleNavPress(item.path)}
                  className={`flex-row items-center px-4 py-2 rounded-lg mr-2 ${
                    isActive ? 'bg-orange-500' : 'bg-slate-800'
                  }`}
                >
                  <item.icon size={16} color={isActive ? '#fff' : '#94A3B8'} />
                  <Text
                    className={`ml-2 text-sm font-medium ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Content */}
        <View className="flex-1">
          <Slot />
        </View>
      </SafeAreaView>
    </View>
  );
}
