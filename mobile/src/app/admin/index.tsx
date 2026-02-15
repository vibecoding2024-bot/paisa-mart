import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Shield, Mail, Lock, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAdminStore } from '@/lib/admin-store';

export default function AdminLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const login = useAdminStore(s => s.login);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/admin/dashboard');
      } else {
        setError('Invalid credentials. Try admin@paisamart.com / admin123');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-900">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 justify-center px-6">
            {/* Logo Section */}
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              className="items-center mb-10"
            >
              <View className="w-20 h-20 bg-orange-500 rounded-2xl items-center justify-center mb-4">
                <Shield size={40} color="#fff" />
              </View>
              <Text className="text-white text-3xl font-bold">Admin Portal</Text>
              <Text className="text-slate-400 text-base mt-2">Paisa Mart Operations Dashboard</Text>
            </Animated.View>

            {/* Login Card */}
            <Animated.View
              entering={FadeInUp.delay(200).springify()}
              className="bg-slate-800 rounded-2xl p-6"
            >
              <Text className="text-white text-xl font-semibold mb-6">Sign In</Text>

              {/* Error Message */}
              {error ? (
                <View className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-4 flex-row items-center">
                  <AlertCircle size={18} color="#EF4444" />
                  <Text className="text-red-400 ml-2 flex-1">{error}</Text>
                </View>
              ) : null}

              {/* Email Input */}
              <View className="mb-4">
                <Text className="text-slate-400 text-sm mb-2">Email</Text>
                <View className="flex-row items-center bg-slate-700 rounded-xl px-4 py-3">
                  <Mail size={20} color="#94A3B8" />
                  <TextInput
                    className="flex-1 ml-3 text-white text-base"
                    style={{ minHeight: 44 }}
                    placeholder="admin@paisamart.com"
                    placeholderTextColor="#64748B"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View className="mb-6">
                <Text className="text-slate-400 text-sm mb-2">Password</Text>
                <View className="flex-row items-center bg-slate-700 rounded-xl px-4 py-3">
                  <Lock size={20} color="#94A3B8" />
                  <TextInput
                    className="flex-1 ml-3 text-white text-base"
                    style={{ minHeight: 44 }}
                    placeholder="Enter password"
                    placeholderTextColor="#64748B"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Login Button */}
              <Pressable
                onPress={handleLogin}
                disabled={isLoading}
              >
                {({ pressed }) => (
                  <LinearGradient
                    colors={['#F97316', '#EA580C']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: 12,
                      paddingVertical: 16,
                      opacity: pressed || isLoading ? 0.8 : 1,
                    }}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-white text-center font-bold text-base">
                        Sign In
                      </Text>
                    )}
                  </LinearGradient>
                )}
              </Pressable>

              {/* Demo Credentials */}
              <View className="mt-6 p-4 bg-slate-700/50 rounded-xl">
                <Text className="text-slate-400 text-xs text-center mb-2">Demo Credentials</Text>
                <Text className="text-slate-300 text-sm text-center">admin@paisamart.com</Text>
                <Text className="text-slate-300 text-sm text-center">admin123</Text>
              </View>
            </Animated.View>

            {/* Back to App */}
            <Pressable
              onPress={() => router.back()}
              className="mt-6"
            >
              <Text className="text-slate-400 text-center">
                ← Back to App
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
