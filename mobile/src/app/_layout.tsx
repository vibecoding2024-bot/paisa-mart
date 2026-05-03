import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/lib/useColorScheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useEffect } from 'react';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav({ colorScheme }: { colorScheme: 'light' | 'dark' | null | undefined }) {
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="otp" options={{ headerShown: false }} />
        <Stack.Screen name="basic-info" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="kyc" options={{ headerShown: false }} />
        <Stack.Screen name="bank-details" options={{ headerShown: false }} />
        <Stack.Screen name="admin/index" options={{ headerShown: false }} />
        <Stack.Screen name="admin/(dashboard)" options={{ headerShown: false }} />
        <Stack.Screen name="share-card" options={{ headerShown: false }} />
        <Stack.Screen name="cash-cards" options={{ headerShown: false }} />
        <Stack.Screen name="recharge-bills" options={{ headerShown: false }} />
        <Stack.Screen name="travel-tickets" options={{ headerShown: false }} />
        <Stack.Screen name="travel/flights" options={{ headerShown: false }} />
        <Stack.Screen name="travel/hotels" options={{ headerShown: false }} />
        <Stack.Screen name="travel/bus" options={{ headerShown: false }} />
        <Stack.Screen name="travel/train" options={{ headerShown: false }} />
        <Stack.Screen name="business-loans-details" options={{ headerShown: false }} />
        <Stack.Screen name="personal-loans-details" options={{ headerShown: false }} />
        <Stack.Screen name="health-insurance-members" options={{ headerShown: false }} />
        <Stack.Screen name="health-insurance-details" options={{ headerShown: false }} />
        <Stack.Screen name="motor-insurance-details" options={{ headerShown: false }} />
        <Stack.Screen name="life-insurance-details" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}



export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <RootLayoutNav colorScheme={colorScheme} />
        </KeyboardProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}