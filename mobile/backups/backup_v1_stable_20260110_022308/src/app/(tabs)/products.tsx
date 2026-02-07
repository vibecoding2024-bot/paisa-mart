import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, ChevronRight, CreditCard, Landmark, Shield, Home, Car, Briefcase, Zap, Heart, UserCheck, Gem, Building2, Umbrella } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useLocalSearchParams } from 'expo-router';

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
  name: string;
  tag?: string;
  commission?: string;
}

interface CategoryData {
  [key: string]: {
    sections: {
      title: string;
      partners: Partner[];
    }[];
  };
}

const CATEGORY_DATA: CategoryData = {
  'credit-cards': {
    sections: [
      {
        title: 'Credit Cards',
        partners: [
          { name: 'Axis Bank', tag: 'Bank', commission: 'Earn up to ₹2,000' },
          { name: 'IDFC First Bank', tag: 'Bank', commission: 'Earn up to ₹2,000' },
          { name: 'Federal Bank', tag: 'Bank', commission: 'Earn up to ₹2,000' },
          { name: 'HDFC Bank', tag: 'Bank', commission: 'Earn up to ₹3,000' },
          { name: 'Yes Bank', tag: 'Bank', commission: 'Earn up to ₹2,000' },
          { name: 'Bank of Baroda', tag: 'Bank', commission: 'Earn up to ₹1,500' },
          { name: 'SBI', tag: 'Bank', commission: 'Earn up to ₹3,000' },
          { name: 'Equitas Small Finance Bank', tag: 'SFB', commission: 'Earn up to ₹3,000' },
          { name: 'RBL', tag: 'Bank', commission: 'Earn up to ₹2,000' },
          { name: 'AU Small Finance Bank', tag: 'SFB', commission: 'Earn up to ₹2,000' },
          { name: 'IndusInd Bank', tag: 'Bank', commission: 'Earn up to ₹2,000' },
          { name: 'HSBC', tag: 'Bank', commission: 'Earn up to ₹4,000' },
        ],
      },
    ],
  },
  'bank-accounts': {
    sections: [
      {
        title: 'Savings Accounts',
        partners: [
          { name: 'Kotak Mahindra Bank', tag: 'Bank', commission: 'Earn up to ₹600' },
          { name: 'Airtel Payments Bank', tag: 'Payments Bank', commission: 'Earn up to ₹600' },
          { name: 'DBS Bank', tag: 'Bank', commission: 'Earn up to ₹600' },
          { name: 'Equitas Small Finance Bank', tag: 'SFB', commission: 'Earn up to ₹600' },
          { name: 'IDFC First Bank', tag: 'Bank', commission: 'Earn up to ₹600' },
        ],
      },
    ],
  },
  'home-loans': {
    sections: [
      {
        title: 'Banks',
        partners: [
          { name: 'Axis Bank', tag: 'Bank', commission: 'up to 1.5%' },
          { name: 'Yes Bank', tag: 'Bank', commission: 'up to 1.5%' },
          { name: 'DCB Bank', tag: 'Bank', commission: 'up to 1.5%' },
          { name: 'ICICI Bank', tag: 'Bank', commission: 'up to 1.5%' },
          { name: 'HDFC Bank', tag: 'Bank', commission: 'up to 1.5%' },
        ],
      },
      {
        title: 'Housing Finance / NBFCs',
        partners: [
          { name: 'ICICI Home Finance', tag: 'HFC', commission: 'up to 1.5%' },
          { name: 'Bajaj Housing Finance', tag: 'HFC', commission: 'up to 1.5%' },
          { name: 'L&T Housing Finance', tag: 'HFC', commission: 'up to 1.5%' },
          { name: 'Muthoot Home Finance', tag: 'HFC', commission: 'up to 1.5%' },
          { name: 'IIFL Home Finance', tag: 'HFC', commission: 'up to 1.5%' },
          { name: 'InCred Home Finance', tag: 'HFC', commission: 'up to 1.5%' },
          { name: 'Cholamandalam Home Finance', tag: 'HFC', commission: 'up to 1.5%' },
          { name: 'Piramal Finance', tag: 'NBFC', commission: 'up to 1.5%' },
          { name: 'UGRO Capital', tag: 'NBFC', commission: 'up to 1.5%' },
        ],
      },
    ],
  },
  'personal-loans': {
    sections: [
      {
        title: 'Bank Loans (DSA)',
        partners: [
          { name: 'Axis Bank', tag: 'Bank', commission: 'up to 2.5%' },
          { name: 'HDFC Bank', tag: 'Bank', commission: 'up to 2.5%' },
          { name: 'Bajaj Finance', tag: 'NBFC', commission: 'up to 2.5%' },
          { name: 'InCred', tag: 'NBFC', commission: 'up to 2.5%' },
          { name: 'L&T Finance', tag: 'NBFC', commission: 'up to 2.5%' },
          { name: 'Cholamandalam', tag: 'NBFC', commission: 'up to 2.5%' },
          { name: 'Piramal', tag: 'NBFC', commission: 'up to 2.5%' },
          { name: 'Aditya Birla Finance', tag: 'NBFC', commission: 'up to 2.5%' },
          { name: 'Hero Fincorp', tag: 'NBFC', commission: 'up to 2.5%' },
          { name: 'IIFL', tag: 'NBFC', commission: 'up to 2.5%' },
          { name: 'Muthoot Finance', tag: 'NBFC', commission: 'up to 2.5%' },
          { name: 'Lendingkart', tag: 'Fintech', commission: 'up to 2.5%' },
          { name: 'Tata Capital', tag: 'NBFC', commission: 'up to 2.5%' },
        ],
      },
    ],
  },
  'insta-loans': {
    sections: [
      {
        title: 'App-Based Fintechs',
        partners: [
          { name: 'Moneyview', tag: 'App-Based', commission: 'up to 3.5%' },
          { name: 'InCred Finance', tag: 'App-Based', commission: 'up to 3.5%' },
          { name: 'Kissht', tag: 'App-Based', commission: 'up to 3.5%' },
          { name: 'Fi Money', tag: 'App-Based', commission: 'up to 3.5%' },
          { name: 'CASHe', tag: 'App-Based', commission: 'up to 3.5%' },
          { name: 'FlexiLoans', tag: 'App-Based', commission: 'up to 3.5%' },
          { name: 'Prefr', tag: 'App-Based', commission: 'up to 3.5%' },
          { name: 'KreditBee', tag: 'App-Based', commission: 'up to 3.5%' },
          { name: 'Te2 Credit', tag: 'App-Based', commission: 'up to 3.5%' },
          { name: 'My Flot', tag: 'App-Based', commission: 'up to 3.5%' },
          { name: 'ZYPE', tag: 'App-Based', commission: 'up to 3.5%' },
          { name: 'Credit Sea', tag: 'App-Based', commission: 'up to 3.5%' },
          { name: 'Ring Power', tag: 'App-Based', commission: 'up to 3.5%' },
        ],
      },
    ],
  },
  'vehicle-loans': {
    sections: [
      {
        title: 'Vehicle Finance Partners',
        partners: [
          { name: 'Cholamandalam', tag: 'NBFC', commission: 'up to 2.5%' },
          { name: 'HDFC Bank', tag: 'Bank', commission: 'up to 2.5%' },
          { name: 'ICICI Bank', tag: 'Bank', commission: 'up to 2.5%' },
          { name: 'Axis Bank', tag: 'Bank', commission: 'up to 2.5%' },
          { name: 'Bajaj Finance', tag: 'NBFC', commission: 'up to 2.5%' },
        ],
      },
    ],
  },
  'business-loans': {
    sections: [
      {
        title: 'Business Finance Partners',
        partners: [
          { name: 'Lendingkart', tag: 'Fintech', commission: 'up to 2.5%' },
          { name: 'UGRO Capital', tag: 'NBFC', commission: 'up to 2.5%' },
          { name: 'FlexiLoans', tag: 'Fintech', commission: 'up to 2.5%' },
          { name: 'L&T Finance', tag: 'NBFC', commission: 'up to 2.5%' },
          { name: 'Bajaj Finance', tag: 'NBFC', commission: 'up to 2.5%' },
          { name: 'Tata Capital', tag: 'NBFC', commission: 'up to 2.5%' },
        ],
      },
    ],
  },
  'health-insurance': {
    sections: [
      {
        title: 'Health Insurance Partners',
        partners: [
          { name: 'Star Health Assure', tag: 'Insurance', commission: 'up to 15%' },
          { name: 'HDFC Ergo Health', tag: 'Insurance', commission: 'up to 15%' },
          { name: 'ICICI Lombard Health', tag: 'Insurance', commission: 'up to 15%' },
        ],
      },
    ],
  },
  'life-insurance': {
    sections: [
      {
        title: 'Life Insurance Partners',
        partners: [
          { name: 'LIC', tag: 'Insurance', commission: 'up to 20%' },
          { name: 'HDFC Life', tag: 'Insurance', commission: 'up to 20%' },
          { name: 'ICICI Prudential', tag: 'Insurance', commission: 'up to 20%' },
          { name: 'SBI Life', tag: 'Insurance', commission: 'up to 20%' },
        ],
      },
    ],
  },
  'motor-insurance': {
    sections: [
      {
        title: 'Motor Insurance Partners',
        partners: [
          { name: 'Digit Insurance', tag: 'Insurance', commission: 'up to 30%' },
          { name: 'ICICI Lombard', tag: 'Insurance', commission: 'up to 30%' },
          { name: 'Magma HDI', tag: 'Insurance', commission: 'up to 30%' },
          { name: 'New India Assurance', tag: 'PSU', commission: 'up to 30%' },
          { name: 'Liberty General', tag: 'Insurance', commission: 'up to 30%' },
          { name: 'SBI General', tag: 'Insurance', commission: 'up to 30%' },
          { name: 'Reliance General', tag: 'Insurance', commission: 'up to 30%' },
          { name: 'Royal Sundaram', tag: 'Insurance', commission: 'up to 30%' },
          { name: 'IFFCO Tokio', tag: 'Insurance', commission: 'up to 30%' },
          { name: 'Universal Sompo', tag: 'Insurance', commission: 'up to 30%' },
          { name: 'TATA AIG', tag: 'Insurance', commission: 'up to 30%' },
          { name: 'National Insurance', tag: 'PSU', commission: 'up to 30%' },
          { name: 'Shriram General', tag: 'Insurance', commission: 'up to 30%' },
        ],
      },
    ],
  },
  'gold-loans': {
    sections: [
      {
        title: 'Gold Loan Partners',
        partners: [
          { name: 'Muthoot Finance', tag: 'NBFC', commission: '0.7%' },
          { name: 'Manappuram Finance', tag: 'NBFC', commission: '0.7%' },
          { name: 'IIFL Gold Loan', tag: 'NBFC', commission: '0.7%' },
          { name: 'Federal Bank Gold Loan', tag: 'Bank', commission: '0.7%' },
        ],
      },
    ],
  },
  'real-estate': {
    sections: [
      {
        title: 'Real Estate Partners',
        partners: [
          { name: 'NoBroker', tag: 'Platform', commission: 'up to 20%' },
          { name: 'Housing.com', tag: 'Platform', commission: 'up to 20%' },
          { name: 'MagicBricks', tag: 'Platform', commission: 'up to 20%' },
          { name: '99acres', tag: 'Platform', commission: 'up to 20%' },
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
  const { category } = useLocalSearchParams<{ category?: string }>();
  const [selectedCategory, setSelectedCategory] = useState('credit-cards');
  const categoryData = CATEGORY_DATA[selectedCategory];

  // Set category from navigation params
  useEffect(() => {
    if (category && CATEGORIES.some(c => c.id === category)) {
      setSelectedCategory(category);
    }
  }, [category]);
  const selectedCategoryInfo = CATEGORIES.find(c => c.id === selectedCategory);

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
          >
            {CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category.id;
              return (
                <Pressable
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${
                    isSelected ? 'bg-orange-500' : 'bg-gray-100'
                  }`}
                >
                  <category.icon size={16} color={isSelected ? '#fff' : category.color} />
                  <Text
                    className={`ml-2 text-sm font-medium ${
                      isSelected ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {category.label}
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
                      className="bg-white rounded-xl p-4 mb-2 flex-row items-center"
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
                      <View className="items-end">
                        <Text className="text-green-600 font-bold text-sm">{partner.commission}</Text>
                        <Text className="text-gray-400 text-xs">commission</Text>
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
