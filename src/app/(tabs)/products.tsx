import { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, ChevronRight, CreditCard, Landmark, Shield, Home, Car, Briefcase, Zap, Heart, UserCheck, Gem, Building2, Umbrella, Share2 } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useProductStore } from '@/lib/product-store';

const CATEGORIES = [
  { id: 'credit-cards', icon: CreditCard, label: 'Credit Cards', color: '#3B82F6' },
  { id: 'bank-accounts', icon: Landmark, label: 'Bank Accounts', color: '#06B6D4' },
  { id: 'home-loans', icon: Home, label: 'Home Loans', color: '#8B5CF6' },
  { id: 'personal-loans', icon: UserCheck, label: 'Personal Loans', color: '#10B981' },
  { id: 'vehicle-loans', icon: Car, label: 'Vehicle Loans', color: '#EF4444' },
  { id: 'business-loans', icon: Briefcase, label: 'Business Loans', color: '#EC4899' },
  { id: 'insta-loans', icon: Zap, label: 'Insta Loans', color: '#F59E0B' },
  { id: 'health-insurance', icon: Heart, label: 'Health Insurance', color: '#22C55E' },
  { id: 'life-insurance', icon: Shield, label: 'Life Insurance', color: '#6366F1' },
  { id: 'motor-insurance', icon: Umbrella, label: 'Motor Insurance', color: '#0EA5E9' },
  { id: 'gold-loans', icon: Gem, label: 'Gold Loans', color: '#EAB308' },
  { id: 'real-estate', icon: Building2, label: 'Real Estate', color: '#64748B' },
];

interface Partner {
  id?: string;
  name: string;
  tag?: string;
  commission?: string;
  productType?: string;
}

interface CategoryData {
  [key: string]: {
    sections: {
      title: string;
      partners: Partner[];
    }[];
  };
}

// Map bank names to product IDs in the product store
const getProductId = (partnerName: string, categoryId: string): string => {
  const normalized = partnerName.toLowerCase().replace(/\s+/g, '-');
  const categoryMapping: { [key: string]: string } = {
    'credit-cards': 'credit-card',
    'bank-accounts': 'savings-account',
    'home-loans': 'home-loan',
    'personal-loans': 'personal-loan',
    'insta-loans': 'insta-loan',
    'vehicle-loans': 'vehicle-loan',
    'business-loans': 'business-loan',
    'health-insurance': 'health-insurance',
    'life-insurance': 'life-insurance',
    'motor-insurance': 'motor-insurance',
    'gold-loans': 'gold-loan',
    'real-estate': 'real-estate',
  };

  const productType = categoryMapping[categoryId] || 'product';
  return `${normalized}-${productType}`;
};

const CATEGORY_DATA: CategoryData = {
  'credit-cards': {
    sections: [
      {
        title: 'Credit Cards',
        partners: [
          { name: 'Axis Bank', tag: 'Bank', commission: 'Earn up to ₹2,000', id: 'axis-bank-credit-card' },
          { name: 'IDFC First Bank', tag: 'Bank', commission: 'Earn up to ₹2,000', id: 'idfc-first-bank-credit-card' },
          { name: 'Federal Bank', tag: 'Bank', commission: 'Earn up to ₹2,000', id: 'federal-bank-credit-card' },
          { name: 'HDFC Bank', tag: 'Bank', commission: 'Earn up to ₹3,000', id: 'hdfc-bank-credit-card' },
          { name: 'Yes Bank', tag: 'Bank', commission: 'Earn up to ₹2,000', id: 'yes-bank-credit-card' },
          { name: 'Bank of Baroda', tag: 'Bank', commission: 'Earn up to ₹1,500', id: 'bank-of-baroda-credit-card' },
          { name: 'SBI', tag: 'Bank', commission: 'Earn up to ₹3,000', id: 'sbi-credit-card' },
          { name: 'Equitas Small Finance Bank', tag: 'SFB', commission: 'Earn up to ₹3,000', id: 'equitas-credit-card' },
          { name: 'RBL', tag: 'Bank', commission: 'Earn up to ₹2,000', id: 'rbl-credit-card' },
          { name: 'AU Small Finance Bank', tag: 'SFB', commission: 'Earn up to ₹2,000', id: 'au-small-finance-bank-credit-card' },
          { name: 'IndusInd Bank', tag: 'Bank', commission: 'Earn up to ₹2,000', id: 'indusind-bank-credit-card' },
          { name: 'HSBC', tag: 'Bank', commission: 'Earn up to ₹4,000', id: 'hsbc-credit-card' },
        ],
      },
    ],
  },
  'bank-accounts': {
    sections: [
      {
        title: 'Savings Accounts',
        partners: [
          { name: 'Kotak Mahindra Bank', tag: 'Bank', commission: 'Earn up to ₹600', id: 'kotak-savings-account' },
          { name: 'Airtel Payments Bank', tag: 'Payments Bank', commission: 'Earn up to ₹600', id: 'airtel-savings-account' },
          { name: 'DBS Bank', tag: 'Bank', commission: 'Earn up to ₹600', id: 'dbs-savings-account' },
          { name: 'Equitas Small Finance Bank', tag: 'SFB', commission: 'Earn up to ₹600', id: 'equitas-savings-account' },
          { name: 'IDFC First Bank', tag: 'Bank', commission: 'Earn up to ₹600', id: 'idfc-savings-account' },
        ],
      },
      {
        title: 'Business Savings Accounts',
        partners: [
          { name: 'IndusInd Bank', tag: 'Bank', commission: 'Earn up to ₹600', id: 'indusind-bank-business-savings-account' },
          { name: 'Tide Business', tag: 'Bank', commission: 'Earn up to ₹600', id: 'tide-business-savings-account' },
        ],
      },
    ],
  },
  'home-loans': {
    sections: [
      {
        title: 'Banks',
        partners: [
          { name: 'Axis Bank', tag: 'Bank', commission: 'up to 1.5%', id: 'axis-bank-home-loan' },
          { name: 'Yes Bank', tag: 'Bank', commission: 'up to 1.5%', id: 'yes-bank-home-loan' },
          { name: 'DCB Bank', tag: 'Bank', commission: 'up to 1.5%', id: 'dcb-bank-home-loan' },
          { name: 'ICICI Bank', tag: 'Bank', commission: 'up to 1.5%', id: 'icici-bank-home-loan' },
          { name: 'HDFC Bank', tag: 'Bank', commission: 'up to 1.5%', id: 'hdfc-bank-home-loan' },
        ],
      },
      {
        title: 'Housing Finance / NBFCs',
        partners: [
          { name: 'ICICI Home Finance', tag: 'HFC', commission: 'up to 1.5%', id: 'icici-home-finance-home-loan' },
          { name: 'Bajaj Housing Finance', tag: 'HFC', commission: 'up to 1.5%', id: 'bajaj-housing-finance-home-loan' },
          { name: 'L&T Housing Finance', tag: 'HFC', commission: 'up to 1.5%', id: 'lt-housing-finance-home-loan' },
          { name: 'Muthoot Home Finance', tag: 'HFC', commission: 'up to 1.5%', id: 'muthoot-home-finance-home-loan' },
          { name: 'IIFL Home Finance', tag: 'HFC', commission: 'up to 1.5%', id: 'iifl-home-finance-home-loan' },
          { name: 'InCred Home Finance', tag: 'HFC', commission: 'up to 1.5%', id: 'incred-home-finance-home-loan' },
          { name: 'Cholamandalam Home Finance', tag: 'HFC', commission: 'up to 1.5%', id: 'cholamandalam-home-finance-home-loan' },
          { name: 'Piramal Finance', tag: 'NBFC', commission: 'up to 1.5%', id: 'piramal-finance-home-loan' },
          { name: 'UGRO Capital', tag: 'NBFC', commission: 'up to 1.5%', id: 'ugro-capital-home-loan' },
        ],
      },
    ],
  },
  'personal-loans': {
    sections: [
      {
        title: 'Bank Loans (DSA)',
        partners: [
          { name: 'Axis Bank', tag: 'Bank', commission: 'up to 2.5%', id: 'axis-bank-personal-loan' },
          { name: 'HDFC Bank', tag: 'Bank', commission: 'up to 2.5%', id: 'hdfc-bank-personal-loan' },
          { name: 'Bajaj Finance', tag: 'NBFC', commission: 'up to 2.5%', id: 'bajaj-personal-loan' },
          { name: 'InCred', tag: 'NBFC', commission: 'up to 2.5%', id: 'incred-personal-loan' },
          { name: 'L&T Finance', tag: 'NBFC', commission: 'up to 2.5%', id: 'lt-finance-personal-loan' },
          { name: 'Cholamandalam', tag: 'NBFC', commission: 'up to 2.5%', id: 'cholamandalam-personal-loan' },
          { name: 'Piramal', tag: 'NBFC', commission: 'up to 2.5%', id: 'piramal-personal-loan' },
          { name: 'Aditya Birla Finance', tag: 'NBFC', commission: 'up to 2.5%', id: 'aditya-birla-personal-loan' },
          { name: 'Hero Fincorp', tag: 'NBFC', commission: 'up to 2.5%', id: 'hero-fincorp-personal-loan' },
          { name: 'IIFL', tag: 'NBFC', commission: 'up to 2.5%', id: 'iifl-personal-loan' },
          { name: 'Muthoot Finance', tag: 'NBFC', commission: 'up to 2.5%', id: 'muthoot-personal-loan' },
          { name: 'Lendingkart', tag: 'Fintech', commission: 'up to 2.5%', id: 'lendingkart-personal-loan' },
          { name: 'Tata Capital', tag: 'NBFC', commission: 'up to 2.5%', id: 'tata-capital-personal-loan' },
        ],
      },
    ],
  },
  'insta-loans': {
    sections: [
      {
        title: 'App-Based Fintechs',
        partners: [
          { name: 'Moneyview', tag: 'App-Based', commission: 'up to 3.5%', id: 'moneyview-insta-loan' },
          { name: 'InCred Finance', tag: 'App-Based', commission: 'up to 3.5%', id: 'incred-finance-insta-loan' },
          { name: 'Kissht', tag: 'App-Based', commission: 'up to 3.5%', id: 'kissht-insta-loan' },
          { name: 'Fi Money', tag: 'App-Based', commission: 'up to 3.5%', id: 'fi-money-insta-loan' },
          { name: 'CASHe', tag: 'App-Based', commission: 'up to 3.5%', id: 'cashe-insta-loan' },
          { name: 'FlexiLoans', tag: 'App-Based', commission: 'up to 3.5%', id: 'flexiloans-insta-loan' },
          { name: 'Prefr', tag: 'App-Based', commission: 'up to 3.5%', id: 'prefr-insta-loan' },
          { name: 'KreditBee', tag: 'App-Based', commission: 'up to 3.5%', id: 'kreditbee-insta-loan' },
          { name: 'Te2 Credit', tag: 'App-Based', commission: 'up to 3.5%', id: 'te2-credit-insta-loan' },
          { name: 'My Flot', tag: 'App-Based', commission: 'up to 3.5%', id: 'my-flot-insta-loan' },
          { name: 'ZYPE', tag: 'App-Based', commission: 'up to 3.5%', id: 'zype-insta-loan' },
          { name: 'Credit Sea', tag: 'App-Based', commission: 'up to 3.5%', id: 'credit-sea-insta-loan' },
          { name: 'Ring Power', tag: 'App-Based', commission: 'up to 3.5%', id: 'ring-power-insta-loan' },
        ],
      },
    ],
  },
  'vehicle-loans': {
    sections: [
      {
        title: 'Vehicle Finance Partners',
        partners: [
          { name: 'Cholamandalam', tag: 'NBFC', commission: 'up to 2.5%', id: 'cholamandalam-vehicle-loan' },
          { name: 'HDFC Bank', tag: 'Bank', commission: 'up to 2.5%', id: 'hdfc-bank-vehicle-loan' },
          { name: 'ICICI Bank', tag: 'Bank', commission: 'up to 2.5%', id: 'icici-bank-vehicle-loan' },
          { name: 'Axis Bank', tag: 'Bank', commission: 'up to 2.5%', id: 'axis-bank-vehicle-loan' },
          { name: 'Bajaj Finance', tag: 'NBFC', commission: 'up to 2.5%', id: 'bajaj-finance-vehicle-loan' },
        ],
      },
    ],
  },
  'business-loans': {
    sections: [
      {
        title: 'Business Finance Partners',
        partners: [
          { name: 'Lendingkart', tag: 'Fintech', commission: 'up to 2.5%', id: 'lendingkart-business-loan' },
          { name: 'UGRO Capital', tag: 'NBFC', commission: 'up to 2.5%', id: 'ugro-capital-business-loan' },
          { name: 'FlexiLoans', tag: 'Fintech', commission: 'up to 2.5%', id: 'flexiloans-business-loan' },
          { name: 'L&T Finance', tag: 'NBFC', commission: 'up to 2.5%', id: 'lt-finance-business-loan' },
          { name: 'Bajaj Finance', tag: 'NBFC', commission: 'up to 2.5%', id: 'bajaj-finance-business-loan' },
          { name: 'Tata Capital', tag: 'NBFC', commission: 'up to 2.5%', id: 'tata-capital-business-loan' },
        ],
      },
    ],
  },
  'health-insurance': {
    sections: [
      {
        title: 'Health Insurance Partners',
        partners: [
          { name: 'Star Health Assure', tag: 'Insurance', commission: 'up to 15%', id: 'star-health-insurance' },
          { name: 'HDFC Ergo Health', tag: 'Insurance', commission: 'up to 15%', id: 'hdfc-ergo-health-insurance' },
          { name: 'ICICI Lombard Health', tag: 'Insurance', commission: 'up to 15%', id: 'icici-lombard-health-insurance' },
        ],
      },
    ],
  },
  'life-insurance': {
    sections: [
      {
        title: 'Life Insurance Partners',
        partners: [
          { name: 'LIC', tag: 'Insurance', commission: 'up to 20%', id: 'lic-life-insurance' },
          { name: 'HDFC Life', tag: 'Insurance', commission: 'up to 20%', id: 'hdfc-life-insurance' },
          { name: 'ICICI Prudential', tag: 'Insurance', commission: 'up to 20%', id: 'icici-prudential-life-insurance' },
          { name: 'SBI Life', tag: 'Insurance', commission: 'up to 20%', id: 'sbi-life-insurance' },
        ],
      },
    ],
  },
  'motor-insurance': {
    sections: [
      {
        title: 'Motor Insurance Partners',
        partners: [
          { name: 'Digit Insurance', tag: 'Insurance', commission: 'up to 30%', id: 'digit-motor-insurance' },
          { name: 'ICICI Lombard', tag: 'Insurance', commission: 'up to 30%', id: 'icici-lombard-motor-insurance' },
          { name: 'Magma HDI', tag: 'Insurance', commission: 'up to 30%', id: 'magma-hdi-motor-insurance' },
          { name: 'New India Assurance', tag: 'PSU', commission: 'up to 30%', id: 'new-india-assurance-motor-insurance' },
          { name: 'Liberty General', tag: 'Insurance', commission: 'up to 30%', id: 'liberty-general-motor-insurance' },
          { name: 'SBI General', tag: 'Insurance', commission: 'up to 30%', id: 'sbi-general-motor-insurance' },
          { name: 'Reliance General', tag: 'Insurance', commission: 'up to 30%', id: 'reliance-general-motor-insurance' },
          { name: 'Royal Sundaram', tag: 'Insurance', commission: 'up to 30%', id: 'royal-sundaram-motor-insurance' },
          { name: 'IFFCO Tokio', tag: 'Insurance', commission: 'up to 30%', id: 'iffco-tokio-motor-insurance' },
          { name: 'Universal Sompo', tag: 'Insurance', commission: 'up to 30%', id: 'universal-sompo-motor-insurance' },
          { name: 'TATA AIG', tag: 'Insurance', commission: 'up to 30%', id: 'tata-aig-motor-insurance' },
          { name: 'National Insurance', tag: 'PSU', commission: 'up to 30%', id: 'national-insurance-motor-insurance' },
          { name: 'Shriram General', tag: 'Insurance', commission: 'up to 30%', id: 'shriram-general-motor-insurance' },
        ],
      },
    ],
  },
  'gold-loans': {
    sections: [
      {
        title: 'Gold Loan Partners',
        partners: [
          { name: 'Muthoot Finance', tag: 'NBFC', commission: '0.7%', id: 'muthoot-gold-loan' },
          { name: 'Manappuram Finance', tag: 'NBFC', commission: '0.7%', id: 'manappuram-gold-loan' },
          { name: 'IIFL Gold Loan', tag: 'NBFC', commission: '0.7%', id: 'iifl-gold-loan' },
          { name: 'Federal Bank Gold Loan', tag: 'Bank', commission: '0.7%', id: 'federal-bank-gold-loan' },
        ],
      },
    ],
  },
  'real-estate': {
    sections: [
      {
        title: 'Real Estate Partners',
        partners: [
          { name: 'NoBroker', tag: 'Platform', commission: 'up to 20%', id: 'nobroker-real-estate' },
          { name: 'Housing.com', tag: 'Platform', commission: 'up to 20%', id: 'housing-com-real-estate' },
          { name: 'MagicBricks', tag: 'Platform', commission: 'up to 20%', id: 'magicbricks-real-estate' },
          { name: '99acres', tag: 'Platform', commission: 'up to 20%', id: '99acres-real-estate' },
        ],
      },
    ],
  },
};

const getTagColor = (tag: string) => {
  switch (tag) {
    case 'Bank': return { bg: '#EFF6FF', text: '#3B82F6' };
    case 'NBFC': return { bg: '#F0FDF4', text: '#22C55E' };
    case 'SFB': return { bg: '#FDF4FF', text: '#A855F7' };
    case 'HFC': return { bg: '#FFF7ED', text: '#F97316' };
    case 'Fintech': return { bg: '#ECFEFF', text: '#06B6D4' };
    case 'App-Based': return { bg: '#FFFBEB', text: '#F59E0B' };
    case 'Insurance': return { bg: '#F0F9FF', text: '#0EA5E9' };
    case 'PSU': return { bg: '#FEF2F2', text: '#EF4444' };
    case 'Platform': return { bg: '#F5F3FF', text: '#8B5CF6' };
    case 'Payments Bank': return { bg: '#ECFDF5', text: '#10B981' };
    default: return { bg: '#F3F4F6', text: '#6B7280' };
  }
};

export default function ProductsScreen() {
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const [selectedCategory, setSelectedCategory] = useState('credit-cards');
  const categoryData = CATEGORY_DATA[selectedCategory];
  const products = useProductStore((s) => s.products);

  // Set category from navigation params
  useEffect(() => {
    if (category && CATEGORIES.some(c => c.id === category)) {
      setSelectedCategory(category);
    }
  }, [category]);

  const selectedCategoryInfo = CATEGORIES.find(c => c.id === selectedCategory);

  // Navigate to share card screen
  const handleProductPress = useCallback((partner: Partner, categoryId: string) => {
    // Check if product exists in store, otherwise create a temporary product ID
    const productId = partner.id || getProductId(partner.name, categoryId);

    // Check if the product exists in the store
    const existingProduct = products.find(p => p.id === productId);

    if (existingProduct) {
      router.push({ pathname: '/share-card', params: { productId } });
    } else {
      // For products not in the store, create a dynamic ID based on name and category
      // This will show a fallback in the share card screen
      router.push({
        pathname: '/share-card',
        params: {
          productId,
          partnerName: partner.name,
          category: categoryId,
          commission: partner.commission,
          tag: partner.tag,
        }
      });
    }
  }, [router, products]);

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <LinearGradient
          colors={['#002561', '#003380']}
          style={{ paddingBottom: 16 }}
        >
          <View className="px-4 pt-2">
            <Text className="text-white text-xl font-semibold">Products</Text>
            <Text className="text-white/70 text-sm mt-1">Browse financial products to sell</Text>

            {/* Search Bar */}
            <Pressable className="bg-white/10 rounded-xl px-4 py-3 mt-4 flex-row items-center">
              <Search size={20} color="#fff" />
              <Text className="text-white/50 ml-3">Search products...</Text>
            </Pressable>
          </View>
        </LinearGradient>

        {/* Category Tabs */}
        <View className="bg-white border-b border-gray-100">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="py-3"
            contentContainerStyle={{ paddingHorizontal: 12 }}
            style={{ flexGrow: 0 }}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${
                    isSelected ? 'bg-orange-500' : 'bg-gray-100'
                  }`}
                >
                  <cat.icon size={16} color={isSelected ? '#fff' : cat.color} />
                  <Text
                    className={`ml-2 text-sm font-medium ${
                      isSelected ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Products List */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            className="px-4 mt-4"
          >
            {categoryData?.sections.map((section, sectionIndex) => (
              <View key={sectionIndex} className="mb-6">
                <View className="flex-row items-center mb-3">
                  <View
                    className="w-1 h-5 rounded-full mr-2"
                    style={{ backgroundColor: selectedCategoryInfo?.color }}
                  />
                  <Text className="text-gray-800 font-semibold">{section.title}</Text>
                  <View className="bg-gray-200 px-2 py-0.5 rounded-full ml-2">
                    <Text className="text-gray-500 text-xs">{section.partners.length}</Text>
                  </View>
                </View>

                {section.partners.map((partner, partnerIndex) => {
                  const tagColors = getTagColor(partner.tag || '');
                  return (
                    <Pressable
                      key={partnerIndex}
                      onPress={() => handleProductPress(partner, selectedCategory)}
                      className="bg-white rounded-xl p-4 mb-2 flex-row items-center active:bg-gray-50"
                      style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                        elevation: 2,
                      }}
                    >
                      <View
                        className="w-11 h-11 rounded-xl items-center justify-center mr-3"
                        style={{ backgroundColor: selectedCategoryInfo?.color + '15' }}
                      >
                        <Text className="font-bold text-base" style={{ color: selectedCategoryInfo?.color }}>
                          {partner.name.charAt(0)}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-800 font-medium text-sm">{partner.name}</Text>
                        {partner.tag && (
                          <View
                            className="self-start px-2 py-0.5 rounded-full mt-1"
                            style={{ backgroundColor: tagColors.bg }}
                          >
                            <Text className="text-xs font-medium" style={{ color: tagColors.text }}>
                              {partner.tag}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View className="items-end mr-2">
                        <Text className="text-green-600 font-bold text-sm">{partner.commission}</Text>
                        <Text className="text-gray-400 text-xs">commission</Text>
                      </View>
                      <View className="w-8 h-8 bg-green-50 rounded-full items-center justify-center">
                        <Share2 size={16} color="#22C55E" />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </Animated.View>

          <View className="h-6" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
