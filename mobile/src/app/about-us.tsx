import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, Building2, Globe, Briefcase, MapPin, Phone, Mail, Shield, TrendingUp, Users, Zap } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { toast } from '@/lib/toast-store';

const COMPANY_DETAILS = [
  { icon: Building2, label: 'Company Name', value: 'Paisa Mart Pvt Ltd' },
  { icon: Briefcase, label: 'Industry', value: 'Financial Services / Fintech' },
  { icon: Globe, label: 'Business Model', value: 'Financial Product Distribution & Digital Financial Services' },
  { icon: MapPin, label: 'Coverage', value: 'Pan India' },
];

const CONTACT_DETAILS = [
  { icon: Phone, label: 'Support', value: '+91 9908234067', action: 'tel:9908234067' },
  { icon: Mail, label: 'Email', value: 'paisamartpvtltd@gmail.com', action: 'mailto:paisamartpvtltd@gmail.com' },
];

const HIGHLIGHTS = [
  { icon: TrendingUp, title: 'Pan India Reach', desc: 'Serving customers across all major cities and states in India.' },
  { icon: Users, title: 'Trusted Partners', desc: 'Empowering financial advisors and agents to earn through product distribution.' },
  { icon: Shield, title: 'Secure & Compliant', desc: 'Fully compliant with RBI and IRDAI guidelines for financial product distribution.' },
  { icon: Zap, title: 'Instant Payouts', desc: 'Fast and transparent payout cycles for all partner earnings.' },
];

export default function AboutUsScreen() {
  const router = useRouter();

  const handleContact = async (action: string, fallback: string) => {
    try {
      const supported = await Linking.canOpenURL(action);
      if (supported) {
        await Linking.openURL(action);
      } else {
        toast.info(fallback);
      }
    } catch {
      toast.info(fallback);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <LinearGradient
          colors={['#002561', '#0A3D91']}
          style={{ paddingBottom: 32, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
        >
          <View className="px-5 pt-4">
            <Animated.View entering={FadeInDown.delay(50).springify()} className="mb-5">
              <Pressable onPress={() => router.back()} className="flex-row items-center active:opacity-70">
                <View className="w-9 h-9 bg-white/10 rounded-xl items-center justify-center mr-2">
                  <ArrowLeft size={20} color="#fff" />
                </View>
                <Text className="text-white/90 text-sm font-medium">Back</Text>
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).springify()} className="flex-row items-center">
              <LinearGradient
                colors={['#FF8C00', '#FF6B00']}
                style={{ width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}
              >
                <Building2 size={26} color="#fff" />
              </LinearGradient>
              <View>
                <Text className="text-white text-2xl font-bold">About Us</Text>
                <Text className="text-white/70 text-sm mt-0.5">Paisa Mart Pvt Ltd</Text>
              </View>
            </Animated.View>
          </View>
        </LinearGradient>

        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1 -mt-4"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Mission statement */}
          <Animated.View entering={FadeInUp.delay(150).springify()} className="mx-5 mt-6">
            <View
              className="bg-white rounded-2xl p-5"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 }}
            >
              <Text className="text-[#002561] font-bold text-base mb-2">Our Mission</Text>
              <Text className="text-gray-600 text-sm leading-6">
                Paisa Mart Pvt Ltd is a Pan India fintech platform dedicated to simplifying access to financial products. We connect individuals and businesses with the right financial solutions — from loans and insurance to investment and payment services — empowering partners to earn while they serve.
              </Text>
            </View>
          </Animated.View>

          {/* Company details */}
          <Animated.View entering={FadeInUp.delay(250).springify()} className="mx-5 mt-5">
            <Text className="text-gray-700 font-semibold text-sm mb-3 ml-1">Company Information</Text>
            <View
              className="bg-white rounded-2xl overflow-hidden"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
            >
              {COMPANY_DETAILS.map((item, index) => (
                <View
                  key={item.label}
                  className={`flex-row items-start px-4 py-3.5 ${index < COMPANY_DETAILS.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <View className="w-8 h-8 rounded-lg bg-blue-50 items-center justify-center mr-3 mt-0.5">
                    <item.icon size={16} color="#002561" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-400 text-xs mb-0.5">{item.label}</Text>
                    <Text className="text-gray-800 text-sm font-medium">{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Highlights */}
          <Animated.View entering={FadeInUp.delay(350).springify()} className="mx-5 mt-5">
            <Text className="text-gray-700 font-semibold text-sm mb-3 ml-1">Why Paisa Mart</Text>
            <View className="gap-3">
              {HIGHLIGHTS.map((item, index) => (
                <Animated.View key={item.title} entering={FadeInUp.delay(400 + index * 60).springify()}>
                  <View
                    className="bg-white rounded-2xl p-4 flex-row items-start"
                    style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 }}
                  >
                    <View className="w-10 h-10 rounded-xl bg-orange-50 items-center justify-center mr-3">
                      <item.icon size={20} color="#FF6B00" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-800 font-semibold text-sm">{item.title}</Text>
                      <Text className="text-gray-500 text-xs leading-5 mt-0.5">{item.desc}</Text>
                    </View>
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* Contact */}
          <Animated.View entering={FadeInUp.delay(600).springify()} className="mx-5 mt-5">
            <Text className="text-gray-700 font-semibold text-sm mb-3 ml-1">Get in Touch</Text>
            <View
              className="bg-white rounded-2xl overflow-hidden"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
            >
              {CONTACT_DETAILS.map((item, index) => (
                <Pressable
                  key={item.label}
                  onPress={() => handleContact(item.action, `${item.label}: ${item.value}`)}
                  className={`flex-row items-center px-4 py-3.5 active:bg-gray-50 ${index < CONTACT_DETAILS.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <View className="w-8 h-8 rounded-lg bg-green-50 items-center justify-center mr-3">
                    <item.icon size={16} color="#16A34A" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-400 text-xs mb-0.5">{item.label}</Text>
                    <Text className="text-[#002561] text-sm font-medium">{item.value}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          {/* Footer */}
          <Animated.View entering={FadeInUp.delay(700).springify()} className="mx-5 mt-5">
            <View className="bg-[#002561] rounded-2xl p-5 items-center">
              <Text className="text-white font-bold text-base">Paisa Mart Pvt Ltd</Text>
              <Text className="text-white/60 text-xs mt-1">Financial Solutions · Pan India</Text>
              <Text className="text-white/40 text-xs mt-3">© 2024 Paisa Mart Pvt Ltd. All rights reserved.</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
