import { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, ChevronRight, CreditCard, Landmark, Shield, Home, Car, Briefcase, Zap, Heart, UserCheck, Gem, Building2, Umbrella, Share2 } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useProductStore } from '@/lib/product-store';
import { useFeatureFlags } from '@/lib/feature-flags';
import ComingSoonModal, { type ComingSoonModule } from '@/components/ComingSoonModal';

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
          { name: 'Axis Bank Limited', tag: 'Bank', commission: 'up to 1.5%', id: 'axis-bank-home-loan' },
          { name: 'Bandhan Bank Limited', tag: 'Bank', commission: 'up to 1.5%', id: 'bandhan-bank-home-loan' },
          { name: 'Deutsche Bank India', tag: 'Bank', commission: 'up to 1.5%', id: 'deutsche-bank-home-loan' },
          { name: 'HDFC Bank Limited', tag: 'Bank', commission: 'up to 1.5%', id: 'hdfc-bank-home-loan' },
          { name: 'ICICI Bank Limited', tag: 'Bank', commission: 'up to 1.5%', id: 'icici-bank-home-loan' },
          { name: 'IDFC First Bank Limited', tag: 'Bank', commission: 'up to 1.5%', id: 'idfc-first-bank-home-loan' },
          { name: 'IndusInd Bank Limited', tag: 'Bank', commission: 'up to 1.5%', id: 'indusind-bank-home-loan' },
          { name: 'Kotak Mahindra Bank Limited', tag: 'Bank', commission: 'up to 1.5%', id: 'kotak-mahindra-bank-home-loan' },
          { name: 'KVB (Karur Vysya Bank)', tag: 'Bank', commission: 'up to 1.5%', id: 'kvb-home-loan' },
          { name: 'Standard Chartered Bank', tag: 'Bank', commission: 'up to 1.5%', id: 'standard-chartered-home-loan' },
          { name: 'SBM Bank (India) Ltd', tag: 'Bank', commission: 'up to 1.5%', id: 'sbm-bank-home-loan' },
          { name: 'Unity Small Finance Bank', tag: 'SFB', commission: 'up to 1.5%', id: 'unity-sfb-home-loan' },
          { name: 'Utkarsh Small Finance Bank', tag: 'SFB', commission: 'up to 1.5%', id: 'utkarsh-sfb-home-loan' },
          { name: 'YES Bank Limited', tag: 'Bank', commission: 'up to 1.5%', id: 'yes-bank-home-loan' },
        ],
      },
      {
        title: 'NBFCs / HFCs / Fintech Partners',
        partners: [
          { name: 'Aditya Birla Finance Limited', tag: 'NBFC', commission: 'up to 1.5%', id: 'aditya-birla-home-loan' },
          { name: 'Ambit Finvest Private Limited', tag: 'NBFC', commission: 'up to 1.5%', id: 'ambit-finvest-home-loan' },
          { name: 'Arka Fincorp Limited', tag: 'NBFC', commission: 'up to 1.5%', id: 'arka-fincorp-home-loan' },
          { name: 'Axis Finance Limited', tag: 'NBFC', commission: 'up to 1.5%', id: 'axis-finance-home-loan' },
          { name: 'Bajaj Finance Limited', tag: 'NBFC', commission: 'up to 1.5%', id: 'bajaj-finance-home-loan' },
          { name: 'Bajaj Finserv Limited', tag: 'NBFC', commission: 'up to 1.5%', id: 'bajaj-finserv-home-loan' },
          { name: 'Cholamandalam Investment and Finance Company Limited', tag: 'NBFC', commission: 'up to 1.5%', id: 'cholamandalam-home-loan' },
          { name: 'Clix Capital Services Private Limited', tag: 'NBFC', commission: 'up to 1.5%', id: 'clix-capital-home-loan' },
          { name: 'Credit Saison India', tag: 'NBFC', commission: 'up to 1.5%', id: 'credit-saison-home-loan' },
          { name: 'Dhanvarsha Finvest Limited', tag: 'NBFC', commission: 'up to 1.5%', id: 'dhanvarsha-home-loan' },
          { name: 'Edelweiss Financial Services Limited', tag: 'NBFC', commission: 'up to 1.5%', id: 'edelweiss-home-loan' },
          { name: 'FT Cash Limited', tag: 'Fintech', commission: 'up to 1.5%', id: 'ft-cash-home-loan' },
          { name: 'Fintree Finance Private Limited', tag: 'NBFC', commission: 'up to 1.5%', id: 'fintree-home-loan' },
          { name: 'Finplex Finance', tag: 'NBFC', commission: 'up to 1.5%', id: 'finplex-home-loan' },
          { name: 'FlexiLoans', tag: 'Fintech', commission: 'up to 1.5%', id: 'flexiloans-home-loan' },
          { name: 'Godrej Capital Limited', tag: 'NBFC', commission: 'up to 1.5%', id: 'godrej-capital-home-loan' },
          { name: 'Gosree Finance Limited', tag: 'NBFC', commission: 'up to 1.5%', id: 'gosree-finance-home-loan' },
          { name: 'Hero FinCorp Limited', tag: 'NBFC', commission: 'up to 1.5%', id: 'hero-fincorp-home-loan' },
          { name: 'IIFL Finance Limited', tag: 'NBFC', commission: 'up to 1.5%', id: 'iifl-home-loan' },
          { name: 'Indifi Technologies Private Limited', tag: 'Fintech', commission: 'up to 1.5%', id: 'indifi-home-loan' },
          { name: 'KrazyBee Services Private Limited', tag: 'Fintech', commission: 'up to 1.5%', id: 'krazybee-home-loan' },
          { name: 'L&T Financial Services Limited', tag: 'NBFC', commission: 'up to 1.5%', id: 'lt-finance-home-loan' },
          { name: 'Lendingkart Finance Limited', tag: 'Fintech', commission: 'up to 1.5%', id: 'lendingkart-home-loan' },
          { name: 'MAS Financial Services Limited', tag: 'NBFC', commission: 'up to 1.5%', id: 'mas-financial-home-loan' },
          { name: 'Mahindra & Mahindra Financial Services Limited', tag: 'NBFC', commission: 'up to 1.5%', id: 'mahindra-finance-home-loan' },
          { name: 'NeoGrowth Credit Private Limited', tag: 'NBFC', commission: 'up to 1.5%', id: 'neogrowth-home-loan' },
          { name: 'Open Capital', tag: 'Fintech', commission: 'up to 1.5%', id: 'open-capital-home-loan' },
          { name: 'Piramal Capital & Housing Finance Limited', tag: 'HFC', commission: 'up to 1.5%', id: 'piramal-home-loan' },
          { name: 'Poonawalla Fincorp Limited', tag: 'NBFC', commission: 'up to 1.5%', id: 'poonawalla-home-loan' },
          { name: 'Protium Finance Limited', tag: 'NBFC', commission: 'up to 1.5%', id: 'protium-home-loan' },
          { name: 'Shriram Finance Limited', tag: 'NBFC', commission: 'up to 1.5%', id: 'shriram-home-loan' },
          { name: 'SMC Finance', tag: 'NBFC', commission: 'up to 1.5%', id: 'smc-finance-home-loan' },
          { name: 'SVAKARMA Finance Private Limited', tag: 'NBFC', commission: 'up to 1.5%', id: 'svakarma-home-loan' },
          { name: 'Tata Capital Limited', tag: 'NBFC', commission: 'up to 1.5%', id: 'tata-capital-home-loan' },
          { name: 'UGRO Capital Limited', tag: 'NBFC', commission: 'up to 1.5%', id: 'ugro-capital-home-loan' },
          { name: 'United Capital', tag: 'NBFC', commission: 'up to 1.5%', id: 'united-capital-home-loan' },
          { name: 'Vivifi India Finance Private Limited', tag: 'NBFC', commission: 'up to 1.5%', id: 'vivifi-home-loan' },
        ],
      },
    ],
  },
  'personal-loans': {
    sections: [
      {
        title: 'Banks',
        partners: [
          { name: 'Axis Bank Limited', tag: 'Bank', commission: 'up to 2.5%', id: 'axis-bank-personal-loan' },
          { name: 'Bandhan Bank Limited', tag: 'Bank', commission: 'up to 2.5%', id: 'bandhan-bank-personal-loan' },
          { name: 'Deutsche Bank India', tag: 'Bank', commission: 'up to 2.5%', id: 'deutsche-bank-personal-loan' },
          { name: 'HDFC Bank Limited', tag: 'Bank', commission: 'up to 2.5%', id: 'hdfc-bank-personal-loan' },
          { name: 'ICICI Bank Limited', tag: 'Bank', commission: 'up to 2.5%', id: 'icici-bank-personal-loan' },
          { name: 'IDFC First Bank Limited', tag: 'Bank', commission: 'up to 2.5%', id: 'idfc-first-bank-personal-loan' },
          { name: 'IndusInd Bank Limited', tag: 'Bank', commission: 'up to 2.5%', id: 'indusind-bank-personal-loan' },
          { name: 'Kotak Mahindra Bank Limited', tag: 'Bank', commission: 'up to 2.5%', id: 'kotak-mahindra-bank-personal-loan' },
          { name: 'KVB (Karur Vysya Bank)', tag: 'Bank', commission: 'up to 2.5%', id: 'kvb-personal-loan' },
          { name: 'Standard Chartered Bank', tag: 'Bank', commission: 'up to 2.5%', id: 'standard-chartered-personal-loan' },
          { name: 'SBM Bank (India) Ltd', tag: 'Bank', commission: 'up to 2.5%', id: 'sbm-bank-personal-loan' },
          { name: 'Unity Small Finance Bank', tag: 'SFB', commission: 'up to 2.5%', id: 'unity-sfb-personal-loan' },
          { name: 'Utkarsh Small Finance Bank', tag: 'SFB', commission: 'up to 2.5%', id: 'utkarsh-sfb-personal-loan' },
          { name: 'YES Bank Limited', tag: 'Bank', commission: 'up to 2.5%', id: 'yes-bank-personal-loan' },
        ],
      },
      {
        title: 'NBFCs / Fintech Partners',
        partners: [
          { name: 'Aditya Birla Finance Limited', tag: 'NBFC', commission: 'up to 2.5%', id: 'aditya-birla-personal-loan' },
          { name: 'Ambit Finvest Private Limited', tag: 'NBFC', commission: 'up to 2.5%', id: 'ambit-finvest-personal-loan' },
          { name: 'Arka Fincorp Limited', tag: 'NBFC', commission: 'up to 2.5%', id: 'arka-fincorp-personal-loan' },
          { name: 'Axis Finance Limited', tag: 'NBFC', commission: 'up to 2.5%', id: 'axis-finance-personal-loan' },
          { name: 'Bajaj Finance Limited', tag: 'NBFC', commission: 'up to 2.5%', id: 'bajaj-finance-personal-loan' },
          { name: 'Bajaj Finserv Limited', tag: 'NBFC', commission: 'up to 2.5%', id: 'bajaj-finserv-personal-loan' },
          { name: 'Cholamandalam Investment and Finance Company Limited', tag: 'NBFC', commission: 'up to 2.5%', id: 'cholamandalam-personal-loan' },
          { name: 'Clix Capital Services Private Limited', tag: 'NBFC', commission: 'up to 2.5%', id: 'clix-capital-personal-loan' },
          { name: 'Credit Saison India', tag: 'NBFC', commission: 'up to 2.5%', id: 'credit-saison-personal-loan' },
          { name: 'Dhanvarsha Finvest Limited', tag: 'NBFC', commission: 'up to 2.5%', id: 'dhanvarsha-personal-loan' },
          { name: 'Edelweiss Financial Services Limited', tag: 'NBFC', commission: 'up to 2.5%', id: 'edelweiss-personal-loan' },
          { name: 'FT Cash Limited', tag: 'Fintech', commission: 'up to 2.5%', id: 'ft-cash-personal-loan' },
          { name: 'Fintree Finance Private Limited', tag: 'NBFC', commission: 'up to 2.5%', id: 'fintree-personal-loan' },
          { name: 'Finplex Finance', tag: 'NBFC', commission: 'up to 2.5%', id: 'finplex-personal-loan' },
          { name: 'FlexiLoans', tag: 'Fintech', commission: 'up to 2.5%', id: 'flexiloans-personal-loan' },
          { name: 'Godrej Capital Limited', tag: 'NBFC', commission: 'up to 2.5%', id: 'godrej-capital-personal-loan' },
          { name: 'Gosree Finance Limited', tag: 'NBFC', commission: 'up to 2.5%', id: 'gosree-finance-personal-loan' },
          { name: 'Hero FinCorp Limited', tag: 'NBFC', commission: 'up to 2.5%', id: 'hero-fincorp-personal-loan' },
          { name: 'IIFL Finance Limited', tag: 'NBFC', commission: 'up to 2.5%', id: 'iifl-personal-loan' },
          { name: 'Indifi Technologies Private Limited', tag: 'Fintech', commission: 'up to 2.5%', id: 'indifi-personal-loan' },
          { name: 'KrazyBee Services Private Limited', tag: 'Fintech', commission: 'up to 2.5%', id: 'krazybee-personal-loan' },
          { name: 'L&T Financial Services Limited', tag: 'NBFC', commission: 'up to 2.5%', id: 'lt-finance-personal-loan' },
          { name: 'Lendingkart Finance Limited', tag: 'Fintech', commission: 'up to 2.5%', id: 'lendingkart-personal-loan' },
          { name: 'MAS Financial Services Limited', tag: 'NBFC', commission: 'up to 2.5%', id: 'mas-financial-personal-loan' },
          { name: 'Mahindra & Mahindra Financial Services Limited', tag: 'NBFC', commission: 'up to 2.5%', id: 'mahindra-finance-personal-loan' },
          { name: 'NeoGrowth Credit Private Limited', tag: 'NBFC', commission: 'up to 2.5%', id: 'neogrowth-personal-loan' },
          { name: 'Piramal Capital & Housing Finance Limited', tag: 'NBFC', commission: 'up to 2.5%', id: 'piramal-personal-loan' },
          { name: 'Poonawalla Fincorp Limited', tag: 'NBFC', commission: 'up to 2.5%', id: 'poonawalla-personal-loan' },
          { name: 'Protium Finance Limited', tag: 'NBFC', commission: 'up to 2.5%', id: 'protium-personal-loan' },
          { name: 'Shriram Finance Limited', tag: 'NBFC', commission: 'up to 2.5%', id: 'shriram-personal-loan' },
          { name: 'SMC Finance', tag: 'NBFC', commission: 'up to 2.5%', id: 'smc-finance-personal-loan' },
          { name: 'SVAKARMA Finance Private Limited', tag: 'NBFC', commission: 'up to 2.5%', id: 'svakarma-personal-loan' },
          { name: 'Tata Capital Limited', tag: 'NBFC', commission: 'up to 2.5%', id: 'tata-capital-personal-loan' },
          { name: 'UGRO Capital Limited', tag: 'NBFC', commission: 'up to 2.5%', id: 'ugro-capital-personal-loan' },
          { name: 'Vivifi India Finance Private Limited', tag: 'NBFC', commission: 'up to 2.5%', id: 'vivifi-personal-loan' },
          { name: 'Open Capital', tag: 'Fintech', commission: 'up to 2.5%', id: 'open-capital-personal-loan' },
          { name: 'United Capital', tag: 'NBFC', commission: 'up to 2.5%', id: 'united-capital-personal-loan' },
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
        title: 'Banks',
        partners: [
          { name: 'Axis Bank', tag: 'Bank', commission: 'up to 2.5%', id: 'axis-bank-vehicle-loan' },
          { name: 'YES Bank', tag: 'Bank', commission: 'up to 2.5%', id: 'yes-bank-vehicle-loan' },
          { name: 'DCB Bank', tag: 'Bank', commission: 'up to 2.5%', id: 'dcb-bank-vehicle-loan' },
          { name: 'HDFC Bank', tag: 'Bank', commission: 'up to 2.5%', id: 'hdfc-bank-vehicle-loan' },
        ],
      },
      {
        title: 'NBFCs / Finance Partners',
        partners: [
          { name: 'Shriram Finance', tag: 'NBFC', commission: 'up to 2.5%', id: 'shriram-finance-vehicle-loan' },
          { name: 'Muthoot Money', tag: 'NBFC', commission: 'up to 2.5%', id: 'muthoot-money-vehicle-loan' },
          { name: 'IKF Finance', tag: 'NBFC', commission: 'up to 2.5%', id: 'ikf-finance-vehicle-loan' },
          { name: 'TVS Credit', tag: 'NBFC', commission: 'up to 2.5%', id: 'tvs-credit-vehicle-loan' },
          { name: 'Sundaram Finance', tag: 'NBFC', commission: 'up to 2.5%', id: 'sundaram-finance-vehicle-loan' },
          { name: 'Cholamandalam Finance', tag: 'NBFC', commission: 'up to 2.5%', id: 'cholamandalam-vehicle-loan' },
        ],
      },
    ],
  },
  'business-loans': {
    sections: [
      {
        title: 'Banks',
        partners: [
          { name: 'Axis Bank Limited', tag: 'Bank', commission: '2.5%', id: 'axis-bank-business-loan' },
          { name: 'Bandhan Bank Limited', tag: 'Bank', commission: '2.5%', id: 'bandhan-bank-business-loan' },
          { name: 'Deutsche Bank India', tag: 'Bank', commission: '2.5%', id: 'deutsche-bank-business-loan' },
          { name: 'HDFC Bank Limited', tag: 'Bank', commission: '2.5%', id: 'hdfc-bank-business-loan' },
          { name: 'ICICI Bank Limited', tag: 'Bank', commission: '2.5%', id: 'icici-bank-business-loan' },
          { name: 'IDFC First Bank Limited', tag: 'Bank', commission: '2.5%', id: 'idfc-first-bank-business-loan' },
          { name: 'IndusInd Bank Limited', tag: 'Bank', commission: '2.5%', id: 'indusind-bank-business-loan' },
          { name: 'Kotak Mahindra Bank Limited', tag: 'Bank', commission: '2.5%', id: 'kotak-mahindra-bank-business-loan' },
          { name: 'KVB (Karur Vysya Bank)', tag: 'Bank', commission: '2.5%', id: 'kvb-business-loan' },
          { name: 'Standard Chartered Bank', tag: 'Bank', commission: '2.5%', id: 'standard-chartered-business-loan' },
          { name: 'SBM Bank (India) Ltd', tag: 'Bank', commission: '2.5%', id: 'sbm-bank-business-loan' },
          { name: 'Unity Small Finance Bank', tag: 'SFB', commission: '2.5%', id: 'unity-sfb-business-loan' },
          { name: 'Utkarsh Small Finance Bank', tag: 'SFB', commission: '2.5%', id: 'utkarsh-sfb-business-loan' },
          { name: 'YES Bank Limited', tag: 'Bank', commission: '2.5%', id: 'yes-bank-business-loan' },
        ],
      },
      {
        title: 'NBFCs / Fintech Partners',
        partners: [
          { name: 'Aditya Birla Finance Limited', tag: 'NBFC', commission: '2.5%', id: 'aditya-birla-business-loan' },
          { name: 'Ambit Finvest Private Limited', tag: 'NBFC', commission: '2.5%', id: 'ambit-finvest-business-loan' },
          { name: 'Arka Fincorp Limited', tag: 'NBFC', commission: '2.5%', id: 'arka-fincorp-business-loan' },
          { name: 'Axis Finance Limited', tag: 'NBFC', commission: '2.5%', id: 'axis-finance-business-loan' },
          { name: 'Bajaj Finance Limited', tag: 'NBFC', commission: '2.5%', id: 'bajaj-finance-business-loan' },
          { name: 'Bajaj Finserv Limited', tag: 'NBFC', commission: '2.5%', id: 'bajaj-finserv-business-loan' },
          { name: 'Cholamandalam Investment and Finance Company Limited', tag: 'NBFC', commission: '2.5%', id: 'cholamandalam-business-loan' },
          { name: 'Clix Capital Services Private Limited', tag: 'NBFC', commission: '2.5%', id: 'clix-capital-business-loan' },
          { name: 'Credit Saison India', tag: 'NBFC', commission: '2.5%', id: 'credit-saison-business-loan' },
          { name: 'Dhanvarsha Finvest Limited', tag: 'NBFC', commission: '2.5%', id: 'dhanvarsha-business-loan' },
          { name: 'Edelweiss Financial Services Limited', tag: 'NBFC', commission: '2.5%', id: 'edelweiss-business-loan' },
          { name: 'FT Cash Limited', tag: 'Fintech', commission: '2.5%', id: 'ft-cash-business-loan' },
          { name: 'Fintree Finance Private Limited', tag: 'NBFC', commission: '2.5%', id: 'fintree-business-loan' },
          { name: 'Finplex Finance', tag: 'NBFC', commission: '2.5%', id: 'finplex-business-loan' },
          { name: 'FlexiLoans', tag: 'Fintech', commission: '2.5%', id: 'flexiloans-business-loan' },
          { name: 'Godrej Capital Limited', tag: 'NBFC', commission: '2.5%', id: 'godrej-capital-business-loan' },
          { name: 'Gosree Finance Limited', tag: 'NBFC', commission: '2.5%', id: 'gosree-finance-business-loan' },
          { name: 'Hero FinCorp Limited', tag: 'NBFC', commission: '2.5%', id: 'hero-fincorp-business-loan' },
          { name: 'IIFL Finance Limited', tag: 'NBFC', commission: '2.5%', id: 'iifl-business-loan' },
          { name: 'Indifi Technologies Private Limited', tag: 'Fintech', commission: '2.5%', id: 'indifi-business-loan' },
          { name: 'KrazyBee Services Private Limited', tag: 'Fintech', commission: '2.5%', id: 'krazybee-business-loan' },
          { name: 'L&T Financial Services Limited', tag: 'NBFC', commission: '2.5%', id: 'lt-finance-business-loan' },
          { name: 'Lendingkart Finance Limited', tag: 'Fintech', commission: '2.5%', id: 'lendingkart-business-loan' },
          { name: 'MAS Financial Services Limited', tag: 'NBFC', commission: '2.5%', id: 'mas-financial-business-loan' },
          { name: 'Mahindra & Mahindra Financial Services Limited', tag: 'NBFC', commission: '2.5%', id: 'mahindra-finance-business-loan' },
          { name: 'NeoGrowth Credit Private Limited', tag: 'NBFC', commission: '2.5%', id: 'neogrowth-business-loan' },
          { name: 'Piramal Capital & Housing Finance Limited', tag: 'NBFC', commission: '2.5%', id: 'piramal-business-loan' },
          { name: 'Poonawalla Fincorp Limited', tag: 'NBFC', commission: '2.5%', id: 'poonawalla-business-loan' },
          { name: 'Protium Finance Limited', tag: 'NBFC', commission: '2.5%', id: 'protium-business-loan' },
          { name: 'Shriram Finance Limited', tag: 'NBFC', commission: '2.5%', id: 'shriram-business-loan' },
          { name: 'SMC Finance', tag: 'NBFC', commission: '2.5%', id: 'smc-finance-business-loan' },
          { name: 'SVAKARMA Finance Private Limited', tag: 'NBFC', commission: '2.5%', id: 'svakarma-business-loan' },
          { name: 'Tata Capital Limited', tag: 'NBFC', commission: '2.5%', id: 'tata-capital-business-loan' },
          { name: 'UGRO Capital Limited', tag: 'NBFC', commission: '2.5%', id: 'ugro-capital-business-loan' },
          { name: 'Vivifi India Finance Private Limited', tag: 'NBFC', commission: '2.5%', id: 'vivifi-business-loan' },
          { name: 'Open Capital', tag: 'Fintech', commission: '2.5%', id: 'open-capital-business-loan' },
          { name: 'United Capital', tag: 'NBFC', commission: '2.5%', id: 'united-capital-business-loan' },
        ],
      },
    ],
  },
  'health-insurance': {
    sections: [
      {
        title: 'Health Insurance Partners',
        partners: [
          { name: 'Star Health Insurance', tag: 'Insurance', commission: 'up to 15%', id: 'star-health-insurance' },
          { name: 'Niva Bupa Health Insurance', tag: 'Insurance', commission: 'up to 15%', id: 'niva-bupa-health-insurance' },
          { name: 'HDFC ERGO Health Insurance', tag: 'Insurance', commission: 'up to 15%', id: 'hdfc-ergo-health-insurance' },
          { name: 'ICICI Lombard General Insurance', tag: 'Insurance', commission: 'up to 15%', id: 'icici-lombard-health-insurance' },
          { name: 'Tata AIG Health Insurance', tag: 'Insurance', commission: 'up to 15%', id: 'tata-aig-health-insurance' },
        ],
      },
    ],
  },
  'life-insurance': {
    sections: [
      {
        title: 'Life Insurance Partners',
        partners: [
          { name: 'Life Insurance Corporation of India (LIC)', tag: 'Insurance', commission: 'up to 20%', id: 'lic-life-insurance' },
          { name: 'HDFC Life Insurance', tag: 'Insurance', commission: 'up to 20%', id: 'hdfc-life-insurance' },
          { name: 'SBI Life Insurance', tag: 'Insurance', commission: 'up to 20%', id: 'sbi-life-insurance' },
          { name: 'Tata AIA Life Insurance', tag: 'Insurance', commission: 'up to 20%', id: 'tata-aia-life-insurance' },
          { name: 'ICICI Prudential Life Insurance', tag: 'Insurance', commission: 'up to 20%', id: 'icici-prudential-life-insurance' },
        ],
      },
    ],
  },
  'motor-insurance': {
    sections: [
      {
        title: 'Get Insurance Quote',
        partners: [
          { name: 'Get Vehicle Insurance Quote', tag: 'Platform', commission: 'up to 30%', id: 'get-vehicle-insurance-quote' },
        ],
      },
      {
        title: 'Vehicle Insurance Partners',
        partners: [
          { name: 'Cholamandalam MS General Insurance', tag: 'Insurance', commission: 'up to 30%', id: 'cholamandalam-ms-vehicle-insurance' },
          { name: 'ICICI Lombard General Insurance', tag: 'Insurance', commission: 'up to 30%', id: 'icici-lombard-vehicle-insurance' },
          { name: 'Magma HDI General Insurance', tag: 'Insurance', commission: 'up to 30%', id: 'magma-hdi-vehicle-insurance' },
          { name: 'The New India Assurance Company', tag: 'PSU', commission: 'up to 30%', id: 'new-india-assurance-vehicle-insurance' },
          { name: 'SBI General Insurance', tag: 'Insurance', commission: 'up to 30%', id: 'sbi-general-vehicle-insurance' },
          { name: 'Liberty General Insurance', tag: 'Insurance', commission: 'up to 30%', id: 'liberty-general-vehicle-insurance' },
          { name: 'Digit General Insurance', tag: 'Insurance', commission: 'up to 30%', id: 'digit-vehicle-insurance' },
          { name: 'United India Insurance Company', tag: 'PSU', commission: 'up to 30%', id: 'united-india-vehicle-insurance' },
          { name: 'HDFC ERGO General Insurance', tag: 'Insurance', commission: 'up to 30%', id: 'hdfc-ergo-vehicle-insurance' },
          { name: 'Bajaj Allianz General Insurance', tag: 'Insurance', commission: 'up to 30%', id: 'bajaj-allianz-vehicle-insurance' },
          { name: 'Reliance General Insurance', tag: 'Insurance', commission: 'up to 30%', id: 'reliance-general-vehicle-insurance' },
          { name: 'Royal Sundaram General Insurance', tag: 'Insurance', commission: 'up to 30%', id: 'royal-sundaram-vehicle-insurance' },
          { name: 'IFFCO Tokio General Insurance', tag: 'Insurance', commission: 'up to 30%', id: 'iffco-tokio-vehicle-insurance' },
          { name: 'Universal Sompo General Insurance', tag: 'Insurance', commission: 'up to 30%', id: 'universal-sompo-vehicle-insurance' },
          { name: 'Tata AIG General Insurance', tag: 'Insurance', commission: 'up to 30%', id: 'tata-aig-vehicle-insurance' },
          { name: 'National Insurance Company', tag: 'PSU', commission: 'up to 30%', id: 'national-insurance-vehicle-insurance' },
          { name: 'Shriram General Insurance', tag: 'Insurance', commission: 'up to 30%', id: 'shriram-general-vehicle-insurance' },
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
          { name: 'Oro Money', tag: 'Fintech', commission: '0.7%', id: 'oro-money-gold-loan' },
          { name: 'Rupeek', tag: 'Fintech', commission: '0.7%', id: 'rupeek-gold-loan' },
        ],
      },
    ],
  },
  'real-estate': {
    sections: [
      {
        title: 'Buyer Side',
        partners: [
          { name: 'Open Plots', tag: 'Platform', commission: 'up to 20%', id: 'buyer-open-plots-real-estate' },
          { name: 'Apartment / Flats', tag: 'Platform', commission: 'up to 20%', id: 'buyer-apartment-flats-real-estate' },
          { name: 'Agriculture Land', tag: 'Platform', commission: 'up to 20%', id: 'buyer-agriculture-land-real-estate' },
          { name: 'Independent House', tag: 'Platform', commission: 'up to 20%', id: 'buyer-independent-house-real-estate' },
        ],
      },
      {
        title: 'Seller Side',
        partners: [
          { name: 'Open Plots', tag: 'Platform', commission: 'up to 20%', id: 'seller-open-plots-real-estate' },
          { name: 'Apartment / Flats', tag: 'Platform', commission: 'up to 20%', id: 'seller-apartment-flats-real-estate' },
          { name: 'Agriculture Land', tag: 'Platform', commission: 'up to 20%', id: 'seller-agriculture-land-real-estate' },
          { name: 'Independent House', tag: 'Platform', commission: 'up to 20%', id: 'seller-independent-house-real-estate' },
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
  const goldLoanEnabled = useFeatureFlags((s) => s.gold_loan_enabled);
  const realEstateEnabled = useFeatureFlags((s) => s.real_estate_enabled);
  const [comingSoonModule, setComingSoonModule] = useState<ComingSoonModule | null>(null);

  // Set category from navigation params
  useEffect(() => {
    if (category && CATEGORIES.some(c => c.id === category)) {
      // If navigating to a coming-soon category, show modal instead
      if (category === 'gold-loans' && !goldLoanEnabled) {
        setComingSoonModule('gold-loans');
        return;
      }
      if (category === 'real-estate' && !realEstateEnabled) {
        setComingSoonModule('real-estate');
        return;
      }
      // Business Loans navigates to details screen first
      if (category === 'business-loans') {
        router.push('/business-loans-details');
        return;
      }
      // Personal Loans navigates to eligibility screen first
      if (category === 'personal-loans') {
        router.push('/personal-loans-details');
        return;
      }
      setSelectedCategory(category);
    }
  }, [category]);

  const selectedCategoryInfo = CATEGORIES.find(c => c.id === selectedCategory);

  const handleCategoryPress = (catId: string) => {
    if (catId === 'gold-loans' && !goldLoanEnabled) {
      setComingSoonModule('gold-loans');
      return;
    }
    if (catId === 'real-estate' && !realEstateEnabled) {
      setComingSoonModule('real-estate');
      return;
    }
    // Business Loans requires details capture first
    if (catId === 'business-loans') {
      router.push('/business-loans-details');
      return;
    }
    // Personal Loans requires eligibility capture first
    if (catId === 'personal-loans') {
      router.push('/personal-loans-details');
      return;
    }
    setSelectedCategory(catId);
  };

  // Navigate to share card screen or Open Plots flow or Vehicle Insurance flow
  const handleProductPress = useCallback((partner: Partner, categoryId: string) => {
    // Block access if category is coming soon
    if (categoryId === 'gold-loans' && !goldLoanEnabled) {
      setComingSoonModule('gold-loans');
      return;
    }
    if (categoryId === 'real-estate' && !realEstateEnabled) {
      setComingSoonModule('real-estate');
      return;
    }

    // Special handling for Open Plots in Real Estate
    if (categoryId === 'real-estate' && partner.name === 'Open Plots') {
      router.push('/open-plots');
      return;
    }

    // Special handling for Vehicle Insurance Quote in Motor Insurance
    if (categoryId === 'motor-insurance' && partner.name === 'Get Vehicle Insurance Quote') {
      router.push('/vehicle-insurance');
      return;
    }

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
  }, [router, products, goldLoanEnabled, realEstateEnabled]);

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
                  onPress={() => handleCategoryPress(cat.id)}
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
      <ComingSoonModal
        visible={comingSoonModule !== null}
        module={comingSoonModule}
        onClose={() => setComingSoonModule(null)}
      />
    </View>
  );
}
