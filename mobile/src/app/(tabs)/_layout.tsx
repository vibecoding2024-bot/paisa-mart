import React, { useEffect, useState } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { ActivityIndicator, Text, View, Platform } from 'react-native';
import { Home, Grid3X3, Wallet, User, GraduationCap } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';
import { useUserProfileStore } from '@/lib/user-profile-store';
import { useIncentiveStore } from '@/lib/incentive-store';
import { fetchUserProfile } from '@/lib/user-profile-api';
import { getPostAuthRoute, normalizeKycStatus } from '@/lib/onboarding-flow';

export default function TabLayout() {
  const router = useRouter();
  const profile = useUserProfileStore((s) => s.profile);
  const setProfile = useUserProfileStore((s) => s.setProfile);
  const profileHasHydrated = useUserProfileStore((s) => s.hasHydrated);
  const userKYC = useIncentiveStore((s) => s.userKYC);
  const setKYCStatus = useIncentiveStore((s) => s.setKYCStatus);
  const kycHasHydrated = useIncentiveStore((s) => s.hasHydrated);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    if (!profileHasHydrated || !kycHasHydrated) return;

    let isMounted = true;

    const guardDashboard = async () => {
      const localRoute = getPostAuthRoute(profile, userKYC?.status);
      if (localRoute !== '/(tabs)') {
        router.replace(
          profile?.phoneNumber
            ? { pathname: localRoute, params: { phone: profile.phoneNumber } }
            : localRoute
        );
        return;
      }

      if (!profile?.phoneNumber) {
        router.replace('/basic-info');
        return;
      }

      try {
        const serverProfile = await fetchUserProfile(profile.phoneNumber);
        if (!serverProfile) {
          router.replace({ pathname: '/basic-info', params: { phone: profile.phoneNumber } });
          return;
        }

        const serverKycStatus = normalizeKycStatus(serverProfile.kycStatus);
        const profileChanged =
          profile.name !== serverProfile.name ||
          profile.email !== serverProfile.email ||
          profile.occupation !== serverProfile.occupation ||
          profile.qualification !== serverProfile.qualification ||
          profile.annualIncome !== serverProfile.annualIncome ||
          profile.pincode !== serverProfile.pincode ||
          profile.dateOfBirth?.day !== serverProfile.dateOfBirth?.day ||
          profile.dateOfBirth?.month !== serverProfile.dateOfBirth?.month ||
          profile.dateOfBirth?.year !== serverProfile.dateOfBirth?.year;

        if (profileChanged) {
          setProfile(serverProfile);
        }
        setKYCStatus(serverProfile.phoneNumber, serverKycStatus);

        const serverRoute = getPostAuthRoute(serverProfile, serverKycStatus);
        if (serverRoute !== '/(tabs)') {
          router.replace({
            pathname: serverRoute,
            params: { phone: serverProfile.phoneNumber },
          });
          return;
        }
      } catch (error) {
        console.warn('Dashboard access check failed, using local profile state', error);
      }

      if (isMounted) setIsCheckingAccess(false);
    };

    guardDashboard();

    return () => {
      isMounted = false;
    };
  }, [
    kycHasHydrated,
    profile,
    profileHasHydrated,
    router,
    setKYCStatus,
    setProfile,
    userKYC?.status,
  ]);

  if (!profileHasHydrated || !kycHasHydrated || isCheckingAccess) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <ActivityIndicator size="large" color="#FF8C00" />
        <Text className="text-gray-500 text-sm mt-3 text-center">Checking your profile status...</Text>
      </View>
    );
  }

  return (
    <Tabs
      screenListeners={{
        tabPress: () => {
          if (Platform.OS !== 'web') {
            Haptics.selectionAsync();
          }
        },
      }}
      screenOptions={{
        tabBarActiveTintColor: '#FF8C00',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 0,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: '#0A3D91',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-orange-50 px-3 py-1 rounded-full' : 'px-3 py-1'}>
              <Home size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-orange-50 px-3 py-1 rounded-full' : 'px-3 py-1'}>
              <Grid3X3 size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-orange-50 px-3 py-1 rounded-full' : 'px-3 py-1'}>
              <GraduationCap size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-orange-50 px-3 py-1 rounded-full' : 'px-3 py-1'}>
              <Wallet size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-orange-50 px-3 py-1 rounded-full' : 'px-3 py-1'}>
              <User size={22} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
