import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Phone, MessageCircle, Mail, ChevronDown, Headphones, Clock, ShieldCheck } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from '@/lib/haptics';
import { toast } from '@/lib/toast-store';

// Support contact details
const SUPPORT_PHONE = '18001234567';
const SUPPORT_WHATSAPP = '919876543210';
const SUPPORT_EMAIL = 'support@paisamart.in';

const FAQS = [
  {
    q: 'How do I add money to my wallet?',
    a: 'Open Cash on Credit Card, tap "Add Money", enter the amount and pay using your credit/debit card, UPI or net banking. The balance updates instantly.',
  },
  {
    q: 'How long does a bank withdrawal take?',
    a: 'Withdrawals from your wallet to a linked bank account are usually credited within a few minutes, and may take up to 2 hours during banking off-hours.',
  },
  {
    q: 'Is there a charge for adding money via credit card?',
    a: 'Adding money to your wallet is free. Your card issuer may apply their own terms, so please check with your bank for any applicable charges.',
  },
  {
    q: 'My money was deducted but wallet not updated. What do I do?',
    a: 'Do not worry — failed top-ups are auto-refunded to your source within 5–7 working days. If you need help sooner, contact our support team below with your transaction details.',
  },
];

export default function SupportScreen() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const openUrl = async (url: string, fallbackMsg: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        toast.info(fallbackMsg);
      }
    } catch {
      toast.info(fallbackMsg);
    }
  };

  const toggleFaq = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  const CONTACT_OPTIONS = [
    {
      key: 'call',
      label: 'Call Support',
      sub: '1800 123 4567 · Toll free',
      icon: Phone,
      color: '#16A34A',
      bg: '#F0FDF4',
      onPress: () => openUrl(`tel:${SUPPORT_PHONE}`, `Call us at ${SUPPORT_PHONE}`),
    },
    {
      key: 'whatsapp',
      label: 'Chat on WhatsApp',
      sub: 'Quick replies, 9 AM – 9 PM',
      icon: MessageCircle,
      color: '#25D366',
      bg: '#F0FDF4',
      onPress: () => openUrl(`https://wa.me/${SUPPORT_WHATSAPP}`, `WhatsApp us at +${SUPPORT_WHATSAPP}`),
    },
    {
      key: 'email',
      label: 'Email Us',
      sub: SUPPORT_EMAIL,
      icon: Mail,
      color: '#2563EB',
      bg: '#EFF6FF',
      onPress: () => openUrl(`mailto:${SUPPORT_EMAIL}?subject=Wallet%20Support%20Request`, `Email us at ${SUPPORT_EMAIL}`),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <LinearGradient
          colors={['#002561', '#003380']}
          style={{ paddingBottom: 30, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}
        >
          <View className="px-6 pt-4">
            <Animated.View entering={FadeInDown.delay(50).springify()} className="mb-4">
              <Pressable onPress={handleBack} className="flex-row items-center active:opacity-70">
                <View className="w-9 h-9 bg-white/10 rounded-xl items-center justify-center mr-2">
                  <ArrowLeft size={20} color="#fff" />
                </View>
                <Text className="text-white/90 text-sm font-medium">Back</Text>
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).springify()} className="flex-row items-center">
              <View className="w-12 h-12 bg-white/15 rounded-2xl items-center justify-center mr-3">
                <Headphones size={24} color="#FFB870" />
              </View>
              <View>
                <Text className="text-white text-2xl font-bold">Help & Support</Text>
                <Text className="text-white/70 text-sm mt-0.5">We're here to help you</Text>
              </View>
            </Animated.View>

            {/* Assurance row */}
            <Animated.View entering={FadeInDown.delay(200).springify()} className="flex-row gap-3 mt-4">
              <View className="flex-row items-center bg-white/10 px-3 py-2 rounded-full">
                <Clock size={13} color="#FFB870" />
                <Text className="text-white/80 text-xs ml-1.5">Avg. reply in 5 min</Text>
              </View>
              <View className="flex-row items-center bg-white/10 px-3 py-2 rounded-full">
                <ShieldCheck size={13} color="#4ADE80" />
                <Text className="text-white/80 text-xs ml-1.5">100% Secure</Text>
              </View>
            </Animated.View>
          </View>
        </LinearGradient>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          className="flex-1 -mt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Contact options */}
          <View className="px-6 mt-6">
            <Text className="text-gray-900 font-semibold text-base mb-3">Reach Our Support Team</Text>
            <View className="gap-3">
              {CONTACT_OPTIONS.map((opt, index) => (
                <Animated.View key={opt.key} entering={FadeInUp.delay(300 + index * 80).springify()}>
                  <Pressable
                    onPress={opt.onPress}
                    className="bg-white rounded-2xl p-4 flex-row items-center active:scale-98"
                    style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
                  >
                    <View className="w-12 h-12 rounded-2xl items-center justify-center mr-3" style={{ backgroundColor: opt.bg }}>
                      <opt.icon size={22} color={opt.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-semibold text-sm">{opt.label}</Text>
                      <Text className="text-gray-400 text-xs mt-0.5">{opt.sub}</Text>
                    </View>
                    <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: opt.bg }}>
                      <opt.icon size={16} color={opt.color} />
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* FAQ */}
          <View className="px-6 mt-7">
            <Text className="text-gray-900 font-semibold text-base mb-3">Frequently Asked Questions</Text>
            <View className="gap-3">
              {FAQS.map((faq, index) => {
                const open = openFaq === index;
                return (
                  <Animated.View
                    key={index}
                    entering={FadeInUp.delay(500 + index * 70).springify()}
                    className="bg-white rounded-2xl overflow-hidden"
                    style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
                  >
                    <Pressable onPress={() => toggleFaq(index)} className="p-4 flex-row items-center">
                      <Text className="flex-1 text-gray-900 font-semibold text-sm pr-3">{faq.q}</Text>
                      <View
                        className="w-7 h-7 rounded-full items-center justify-center bg-gray-50"
                        style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}
                      >
                        <ChevronDown size={16} color="#6B7280" />
                      </View>
                    </Pressable>
                    {open && (
                      <View className="px-4 pb-4 -mt-1">
                        <Text className="text-gray-500 text-sm leading-5">{faq.a}</Text>
                      </View>
                    )}
                  </Animated.View>
                );
              })}
            </View>
          </View>

          {/* Footer note */}
          <Animated.View entering={FadeInUp.delay(800).springify()} className="px-6 mt-7">
            <View className="bg-blue-50 rounded-2xl p-5">
              <Text className="text-[#002561] font-semibold text-sm mb-1">Still need help?</Text>
              <Text className="text-gray-600 text-xs leading-5">
                Our support team is available every day from 9 AM to 9 PM. For wallet or payment issues, please keep your transaction details ready for faster resolution.
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
