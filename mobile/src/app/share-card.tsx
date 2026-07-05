import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  type ImageSourcePropType,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  X,
  Info,
  Check,
  AlertCircle,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import {
  useProductStore,
  SUPPORT_PHONES,
  type Language,
  type ProductDetails,
} from '@/lib/product-store';

const LANGUAGE_OPTIONS: { id: Language; label: string; icon: string }[] = [
  { id: 'english', label: 'English', icon: 'ABC' },
  { id: 'hindi', label: 'Hindi', icon: 'कखग' },
  { id: 'telugu', label: 'Telugu', icon: 'అఆఇ' },
];

const LOCAL_BANNER_IMAGES: Record<string, ImageSourcePropType> = {
  'bank-account:kotak-811-banner': require('../../assets/bank-accounts/kotak-811-banner.jpeg'),
  'bank-account:indus-delite-banner': require('../../assets/bank-accounts/indus-delite-banner.jpeg'),
};

const getBannerImageSource = (bannerImageUrl: string): ImageSourcePropType => {
  return LOCAL_BANNER_IMAGES[bannerImageUrl] || { uri: bannerImageUrl };
};

// Create a fallback product for products not in the store
const createFallbackProduct = (
  productId: string,
  partnerName?: string,
  category?: string,
  commission?: string,
  tag?: string
): ProductDetails => {
  const name = partnerName || productId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const productType = category?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Product';

  return {
    id: productId,
    providerName: name,
    productName: productType,
    category: category || 'general',
    bannerImageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
    commission: commission || 'Commission available',
    tag: tag,
    enabled: true,
    content: {
      headline: {
        english: `Get the best ${productType.toLowerCase()} deals!`,
        hindi: `सर्वोत्तम ${productType.toLowerCase()} डील्स पाएं!`,
        telugu: `ఉత్తమ ${productType.toLowerCase()} డీల్స్ పొందండి!`,
      },
      description: {
        english: `Apply for ${name} ${productType} and enjoy exclusive benefits and offers.`,
        hindi: `${name} ${productType} के लिए आवेदन करें और विशेष लाभ और ऑफ़र्स का आनंद लें।`,
        telugu: `${name} ${productType} కోసం అప్లై చేసి ప్రత్యేక ప్రయోజనాలు మరియు ఆఫర్లు పొందండి.`,
      },
      benefits: [
        {
          english: 'Quick and easy application',
          hindi: 'त्वरित और आसान आवेदन',
          telugu: 'త్వరిత మరియు సులభమైన అప్లికేషన్',
        },
        {
          english: 'Competitive rates',
          hindi: 'प्रतिस्पर्धी दरें',
          telugu: 'పోటీ రేట్లు',
        },
        {
          english: 'Excellent customer service',
          hindi: 'उत्कृष्ट ग्राहक सेवा',
          telugu: 'అత్యుత్తమ కస్టమర్ సర్వీస్',
        },
      ],
      reasons: [
        {
          english: 'Fast processing',
          hindi: 'तेज प्रोसेसिंग',
          telugu: 'వేగవంతమైన ప్రాసెసింగ్',
        },
        {
          english: 'Minimal documentation',
          hindi: 'कम से कम दस्तावेज़',
          telugu: 'కనిష్ట డాక్యుమెంటేషన్',
        },
      ],
    },
  };
};

export default function ShareCardScreen() {
  const router = useRouter();
  const { productId, partnerName, category, commission, tag } = useLocalSearchParams<{
    productId: string;
    partnerName?: string;
    category?: string;
    commission?: string;
    tag?: string;
  }>();

  const storeProduct = useProductStore((s) => s.getProductById(productId ?? ''));
  const advisor = useProductStore((s) => s.advisor);
  const selectedLanguage = useProductStore((s) => s.selectedLanguage);
  const setSelectedLanguage = useProductStore((s) => s.setSelectedLanguage);

  // Use store product or create fallback
  const product = useMemo(() => {
    if (storeProduct) return storeProduct;
    if (productId) {
      return createFallbackProduct(productId, partnerName, category, commission, tag);
    }
    return null;
  }, [storeProduct, productId, partnerName, category, commission, tag]);

  const [showTnCModal, setShowTnCModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleClose = useCallback(() => {
    router.dismissAll();
    router.push('/(tabs)/products');
  }, [router]);

  if (!product) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-500">Product not found</Text>
        <Pressable
          onPress={handleBack}
          className="mt-4 bg-blue-500 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const content = product.content;
  const referralLink = product.applicationUrl || `https://apply.paisamart.in/${product.id}?ref=${advisor.referralCode}`;
  const supportPhones = product.supportPhones || SUPPORT_PHONES;
  const messageFooter = product.messageFooter || {
    name: advisor.name,
    title: advisor.title,
  };

  return (
    <View className="flex-1 bg-gray-100">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <Pressable
            onPress={handleBack}
            className="w-10 h-10 items-center justify-center"
          >
            <ChevronLeft size={24} color="#374151" />
          </Pressable>
          <Text className="text-gray-800 font-semibold text-lg">
            Product Details
          </Text>
          <Pressable
            onPress={handleClose}
            className="w-10 h-10 items-center justify-center"
          >
            <X size={22} color="#374151" />
          </Pressable>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled"
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Info Text */}
          <Animated.View entering={FadeInDown.delay(100)} className="px-4 py-3">
            <Text className="text-gray-600 text-sm">
              The below message will be sent to your customer
            </Text>
          </Animated.View>

          {/* Message Preview Card */}
          <Animated.View
            entering={FadeInDown.delay(200)}
            className="mx-4 bg-green-50 rounded-2xl overflow-hidden border border-green-100"
          >
            {/* Banner Image */}
            <View className="mx-4 mt-4">
              {!imageError ? (
                <Image
                  source={getBannerImageSource(product.bannerImageUrl)}
                  className="w-full h-48 rounded-xl"
                  resizeMode="cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <View className="w-full h-48 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 items-center justify-center">
                  <Text className="text-white font-bold text-xl">
                    {product.providerName}
                  </Text>
                  <Text className="text-white/80 text-sm mt-1">
                    {product.productName}
                  </Text>
                </View>
              )}
            </View>

            {/* Message Content */}
            <View className="p-4">
              {/* Greeting */}
              {!product.applicationUrl && (
                <Text className="text-gray-800 font-bold text-base">
                  {selectedLanguage === 'english'
                    ? 'Namaste 🙏,'
                    : selectedLanguage === 'hindi'
                    ? 'नमस्ते 🙏,'
                    : 'నమస్తే 🙏,'}
                </Text>
              )}

              {/* Headline */}
              <Text className={`text-gray-700 ${product.applicationUrl ? 'font-semibold' : 'italic mt-2'}`}>
                {product.applicationUrl
                  ? content.headline[selectedLanguage]
                  : `*${content.headline[selectedLanguage]}*`}
              </Text>

              {/* Description */}
              <Text className="text-gray-700 mt-1">
                {content.description[selectedLanguage]}
              </Text>

              {/* Benefits */}
              {!product.applicationUrl && (
                <Text className="text-gray-800 font-semibold mt-4">
                  {selectedLanguage === 'english'
                    ? 'You will get:'
                    : selectedLanguage === 'hindi'
                    ? 'आपको मिलेगा:'
                    : 'మీకు లభిస్తుంది:'}
                </Text>
              )}
              {content.benefits.map((benefit, index) => (
                product.applicationUrl ? (
                  <Text key={index} className="text-gray-700 mt-2">
                    {benefit[selectedLanguage]}
                  </Text>
                ) : (
                  <View key={index} className="flex-row items-center mt-2">
                    <View className="w-5 h-5 bg-green-500 rounded items-center justify-center mr-2">
                      <Check size={14} color="#fff" />
                    </View>
                    <Text className="text-gray-700 flex-1">
                      {benefit[selectedLanguage]}
                    </Text>
                  </View>
                )
              ))}

              {/* Reasons */}
              <Text className="text-gray-800 font-semibold mt-4">
                {selectedLanguage === 'english'
                  ? 'Why you should apply from here:'
                  : selectedLanguage === 'hindi'
                  ? 'यहाँ से क्यों आवेदन करें:'
                  : 'ఇక్కడ నుండి ఎందుకు అప్లై చేయాలి:'}
              </Text>
              {content.reasons.map((reason, index) => (
                <View key={index} className="flex-row items-center mt-2">
                  <Text className="text-green-600 font-bold mr-2">✓</Text>
                  <Text className="text-gray-700 flex-1">
                    {reason[selectedLanguage]}
                  </Text>
                </View>
              ))}

              {/* Apply Now */}
              <Text className="text-gray-700 mt-4">
                {product.applicationUrl && selectedLanguage === 'english'
                  ? `Now open a savings account from the comfort of your home - ${referralLink}`
                  : selectedLanguage === 'english'
                  ? `Apply now to get your ${product.providerName} ${product.productName} -`
                  : selectedLanguage === 'hindi'
                  ? `अभी आवेदन करें अपना ${product.providerName} ${product.productName} पाने के लिए -`
                  : `మీ ${product.providerName} ${product.productName} పొందడానికి ఇప్పుడే అప్లై చేయండి -`}
              </Text>

              {/* Support Info */}
              <Text className="text-gray-700 mt-3">
                {selectedLanguage === 'english'
                  ? `For any doubts, please call on ${supportPhones.primary}`
                  : selectedLanguage === 'hindi'
                  ? `किसी भी संदेह के लिए कॉल करें ${supportPhones.primary}`
                  : `ఏవైనా సందేహాలకు కాల్ చేయండి ${supportPhones.primary}`}
              </Text>
              <Text className="text-gray-700 mt-1">
                {selectedLanguage === 'english'
                  ? `If the above number is unavailable, you can call ${supportPhones.secondary} for a quick response.`
                  : selectedLanguage === 'hindi'
                  ? `अगर उपरोक्त नंबर उपलब्ध नहीं है, तो ${supportPhones.secondary} पर कॉल करें।`
                  : `పై నంబర్ అందుబాటులో లేకపోతే, ${supportPhones.secondary} కు కాల్ చేయండి.`}
              </Text>

              {/* Advisor Info */}
              <View className="mt-4 pt-3 border-t border-green-200">
                <Text className="text-gray-800 font-semibold">
                  {messageFooter.name}
                </Text>
                <Text className="text-gray-600 text-sm">{messageFooter.title}</Text>
              </View>
            </View>
          </Animated.View>

          {/* T&C Link */}
          {product.payoutTnC && (
            <Animated.View entering={FadeInDown.delay(300)} className="px-4 mt-3">
              <Pressable
                onPress={() => setShowTnCModal(true)}
                className="flex-row items-center"
              >
                <Info size={16} color="#3B82F6" />
                <Text className="text-blue-500 text-sm ml-1 underline">
                  {selectedLanguage === 'english'
                    ? 'View T&C for Payout'
                    : selectedLanguage === 'hindi'
                    ? 'पेआउट के लिए T&C देखें'
                    : 'పేఅవుట్ కోసం T&C చూడండి'}
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Language Selector */}
          <Animated.View
            entering={FadeInDown.delay(400)}
            className="px-4 mt-6"
          >
            <Text className="text-gray-700 font-medium mb-3">
              Select Message Language
            </Text>
            <View className="flex-row gap-3">
              {LANGUAGE_OPTIONS.map((lang) => {
                const isSelected = selectedLanguage === lang.id;
                return (
                  <Pressable
                    key={lang.id}
                    onPress={() => setSelectedLanguage(lang.id)}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 flex-row items-center justify-center ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium mr-2 ${
                        isSelected ? 'text-blue-600' : 'text-gray-400'
                      }`}
                    >
                      {lang.icon}
                    </Text>
                    <Text
                      className={`text-sm font-medium ${
                        isSelected ? 'text-blue-600' : 'text-gray-600'
                      }`}
                    >
                      {lang.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        </ScrollView>

        {/* T&C Modal */}
        <TnCModal
          visible={showTnCModal}
          onClose={() => setShowTnCModal(false)}
          product={product}
          language={selectedLanguage}
        />

      </SafeAreaView>
    </View>
  );
}

// T&C Modal Component
function TnCModal({
  visible,
  onClose,
  product,
  language,
}: {
  visible: boolean;
  onClose: () => void;
  product: ProductDetails;
  language: Language;
}) {
  const tnc = product.payoutTnC;

  if (!tnc) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <Animated.View
          entering={FadeIn}
          className="bg-white rounded-t-3xl max-h-[70%]"
        >
          {/* Handle */}
          <View className="items-center pt-3 pb-2">
            <View className="w-10 h-1 bg-gray-300 rounded-full" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
            <View className="flex-row items-center">
              <AlertCircle size={20} color="#374151" />
              <Text className="text-gray-800 font-semibold text-lg ml-2">
                T&C for Payout
              </Text>
            </View>
            <Pressable onPress={onClose} className="p-2">
              <X size={20} color="#6B7280" />
            </Pressable>
          </View>

          {/* Content */}
          <ScrollView keyboardShouldPersistTaps="handled" className="p-4">
            <Text className="text-gray-800 font-semibold text-base">
              {tnc.eligibilityTitle[language]}
            </Text>
            <Text className="text-gray-600 mt-2">
              {tnc.eligibilityDescription[language]}
            </Text>

            <View className="mt-3">
              {tnc.conditions.map((condition, index) => (
                <Text key={index} className="text-gray-700 mt-2">
                  {index + 1}. {condition[language]}
                </Text>
              ))}
            </View>

            {tnc.ltfTitle && tnc.ltfDescription && (
              <View className="mt-4">
                <Text className="text-gray-800 font-semibold">
                  {tnc.ltfTitle[language]}
                </Text>
                <Text className="text-gray-600 mt-1">
                  {tnc.ltfDescription[language]}
                </Text>
              </View>
            )}

            <View className="h-4" />
          </ScrollView>

          {/* Continue Button */}
          <View className="p-4 border-t border-gray-100">
            <Pressable
              onPress={onClose}
              className="bg-blue-500 py-4 rounded-xl items-center"
            >
              <Text className="text-white font-semibold text-base">
                Continue
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
