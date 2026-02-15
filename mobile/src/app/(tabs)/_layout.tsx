import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Home, Grid3X3, Wallet, User, GraduationCap, CreditCard } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF8C00',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-orange-50 p-1.5 rounded-lg' : 'p-1.5'}>
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
            <View className={focused ? 'bg-orange-50 p-1.5 rounded-lg' : 'p-1.5'}>
              <Grid3X3 size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="cash-cards"
        options={{
          title: 'Cash & Cards',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-orange-50 p-1.5 rounded-lg' : 'p-1.5'}>
              <CreditCard size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color, focused }) => (
            <View className={focused ? 'bg-orange-50 p-1.5 rounded-lg' : 'p-1.5'}>
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
            <View className={focused ? 'bg-orange-50 p-1.5 rounded-lg' : 'p-1.5'}>
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
            <View className={focused ? 'bg-orange-50 p-1.5 rounded-lg' : 'p-1.5'}>
              <User size={22} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
