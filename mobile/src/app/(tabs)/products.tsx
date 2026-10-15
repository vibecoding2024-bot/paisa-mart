import { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  ScrollView,
  TextInput,
  Linking,
  useWindowDimensions,
} from "react-native";
import {
  Page,
  ScreenHeader,
  Typography as Text,
  Surface,
  IconBadge,
  palette,
} from "@/components/brand";
import { LinearGradient } from "expo-linear-gradient";
import {
  Search,
  ChevronRight,
  CreditCard,
  Landmark,
  Shield,
  Home,
  Car,
  Briefcase,
  Zap,
  Heart,
  UserCheck,
  Gem,
  Building2,
  Umbrella,
  X,
  SearchX,
} from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useProductStore } from "@/lib/product-store";
import { useFeatureFlags } from "@/lib/feature-flags";
import PressableScale from "@/components/PressableScale";
import ComingSoonModal, {
  type ComingSoonModule,
} from "@/components/ComingSoonModal";

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
          { name: 'Kotak 811', tag: 'Bank', commission: 'Earn up to ₹600', id: 'kotak-savings-account' },
          { name: 'IndusInd Bank', tag: 'Bank', commission: 'Earn up to ₹600', id: 'indusind-bank-business-savings-account' },
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
          { name: 'Care Health Insurance', tag: 'Insurance', commission: 'up to 15%', id: 'care-health-insurance' },
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
          { name: 'Bajaj Allianz Life Insurance', tag: 'Insurance', commission: 'up to 20%', id: 'bajaj-allianz-life-insurance' },
          { name: 'Axis Max Life Insurance', tag: 'Insurance', commission: 'up to 20%', id: 'axis-max-life-insurance' },
          { name: 'Bandhan Life Insurance', tag: 'Insurance', commission: 'up to 20%', id: 'bandhan-life-insurance' },
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

const BANK_ACCOUNT_CARD_DETAILS: Record<string, {
  title: string;
  logo: string;
  benefits: string[];
}> = {
  'kotak-savings-account': {
    title: 'Kotak 811',
    logo: 'kotak 811',
    benefits: ['Zero balance account', 'Virtual debit card'],
  },
  'indusind-bank-business-savings-account': {
    title: 'Indus Delite: Zero Balance',
    logo: 'IndusInd Bank',
    benefits: ['Zero Balance Savings Account', 'Up to 5% cashback on debit card spends'],
  },
};

export default function ProductsScreen() {
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  const router = useRouter();
  const { category } = useLocalSearchParams<{ category?: string }>();
  const [selectedCategory, setSelectedCategory] = useState("credit-cards");
  const [searchQuery, setSearchQuery] = useState("");
  const categoryData = CATEGORY_DATA[selectedCategory];
  const products = useProductStore((s) => s.products);
  const goldLoanEnabled = useFeatureFlags((s) => s.gold_loan_enabled);
  const realEstateEnabled = useFeatureFlags((s) => s.real_estate_enabled);
  const [comingSoonModule, setComingSoonModule] =
    useState<ComingSoonModule | null>(null);

  // Set category from navigation params
  useEffect(() => {
    if (category && CATEGORIES.some((c) => c.id === category)) {
      // If navigating to a coming-soon category, show modal instead
      if (category === "gold-loans" && !goldLoanEnabled) {
        setComingSoonModule("gold-loans");
        return;
      }
      if (category === "real-estate" && !realEstateEnabled) {
        setComingSoonModule("real-estate");
        return;
      }
      // Home Loans navigates to details screen first
      if (category === "home-loans") {
        router.push("/home-loans-details");
        return;
      }
      // Business Loans navigates to details screen first
      if (category === "business-loans") {
        router.push("/business-loans-details");
        return;
      }
      // Personal Loans navigates to eligibility screen first
      if (category === "personal-loans") {
        router.push("/personal-loans-details");
        return;
      }
      if (category === "vehicle-loans") {
        router.push("/vehicle-loans-details");
        return;
      }
      // Health Insurance shows the partner list — partner card press starts the flow
      setSelectedCategory(category);
    }
  }, [category]);

  const selectedCategoryInfo = CATEGORIES.find(
    (c) => c.id === selectedCategory,
  );

  // Filter the current category's partners by the search query
  const filteredSections = useMemo(() => {
    if (!categoryData) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categoryData.sections;
    return categoryData.sections
      .map((section) => ({
        ...section,
        partners: section.partners.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.tag ? p.tag.toLowerCase().includes(q) : false),
        ),
      }))
      .filter((section) => section.partners.length > 0);
  }, [categoryData, searchQuery]);

  const hasResults = filteredSections.length > 0;
  const visibleBankAccountPartners = useMemo(
    () => filteredSections.flatMap((section) => section.partners),
    [filteredSections],
  );

  const handleCategoryPress = (catId: string) => {
    if (catId === "gold-loans" && !goldLoanEnabled) {
      setComingSoonModule("gold-loans");
      return;
    }
    if (catId === "real-estate" && !realEstateEnabled) {
      setComingSoonModule("real-estate");
      return;
    }
    // Home Loans requires details capture first
    if (catId === "home-loans") {
      router.push("/home-loans-details");
      return;
    }
    // Business Loans requires details capture first
    if (catId === "business-loans") {
      router.push("/business-loans-details");
      return;
    }
    // Personal Loans requires eligibility capture first
    if (catId === "personal-loans") {
      router.push("/personal-loans-details");
      return;
    }
    if (catId === "vehicle-loans") {
      router.push("/vehicle-loans-details");
      return;
    }
    // Health Insurance shows the partner list — partner card press starts the flow
    setSelectedCategory(catId);
  };

  // Navigate to share card screen or Open Plots flow or Vehicle Insurance flow
  const handleProductPress = useCallback(
    (partner: Partner, categoryId: string) => {
      // Block access if category is coming soon
      if (categoryId === "gold-loans" && !goldLoanEnabled) {
        setComingSoonModule("gold-loans");
        return;
      }
      if (categoryId === "real-estate" && !realEstateEnabled) {
        setComingSoonModule("real-estate");
        return;
      }

      // Special handling for Open Plots in Real Estate
      if (categoryId === "real-estate" && partner.name === "Open Plots") {
        router.push("/open-plots");
        return;
      }

      // Special handling for Vehicle Insurance Quote button in Motor Insurance
      if (
        categoryId === "motor-insurance" &&
        partner.name === "Get Vehicle Insurance Quote"
      ) {
        router.push("/vehicle-insurance");
        return;
      }

      // All other Motor Insurance partner cards open the details form
      if (categoryId === "motor-insurance") {
        router.push({
          pathname: "/motor-insurance-details",
          params: { insurer: partner.name },
        });
        return;
      }

      // Health Insurance partners always open the 2-step flow with the chosen insurer
      if (categoryId === "health-insurance") {
        router.push({
          pathname: "/health-insurance-members",
          params: { insurer: partner.name },
        });
        return;
      }

      // Life Insurance partners open the life insurance details form
      if (categoryId === "life-insurance") {
        router.push({
          pathname: "/life-insurance-details",
          params: { insurer: partner.name },
        });
        return;
      }

      // Check if product exists in store, otherwise create a temporary product ID
      const productId = partner.id || getProductId(partner.name, categoryId);

      // Check if the product exists in the store
      const existingProduct = products.find((p) => p.id === productId);

      if (existingProduct) {
        router.push({ pathname: "/share-card", params: { productId } });
      } else {
        // For products not in the store, create a dynamic ID based on name and category
        // This will show a fallback in the share card screen
        router.push({
          pathname: "/share-card",
          params: {
            productId,
            partnerName: partner.name,
            category: categoryId,
            commission: partner.commission,
            tag: partner.tag,
          },
        });
      }
    },
    [router, products, goldLoanEnabled, realEstateEnabled],
  );

  const handleApplyPress = useCallback(
    (partner: Partner, categoryId: string) => {
      const productId = partner.id || getProductId(partner.name, categoryId);
      const existingProduct = products.find((p) => p.id === productId);

      if (categoryId === "bank-accounts" && existingProduct?.applicationUrl) {
        Linking.openURL(existingProduct.applicationUrl);
        return;
      }

      handleProductPress(partner, categoryId);
    },
    [handleProductPress, products],
  );

  return (
    <>
      <Page>
        <ScreenHeader
          eyebrow="Discover your next opportunity"
          title="Made for every ambition."
          subtitle="Find the right financial product for your customer."
          icon={Landmark}
        />
        <View
          style={{
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: palette.line,
            borderRadius: 17,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <Search size={20} color={palette.muted} />
          <TextInput
            accessibilityLabel="Search products"
            style={{
              flex: 1,
              minWidth: 0,
              paddingHorizontal: 12,
              height: 54,
              fontSize: 14,
              fontFamily: "Jakarta",
              color: palette.ink,
            }}
            placeholder="Search banks, lenders, insurers…"
            placeholderTextColor={palette.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {!!searchQuery && (
            <PressableScale
              accessibilityLabel="Clear search"
              onPress={() => setSearchQuery("")}
              style={{
                width: 44,
                height: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} color={palette.muted} />
            </PressableScale>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, marginBottom: 25 }}
          contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
        >
          {CATEGORIES.map((cat) => (
            <PressableScale
              key={cat.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedCategory === cat.id }}
              onPress={() => handleCategoryPress(cat.id)}
              style={{
                minHeight: 45,
                paddingHorizontal: 17,
                borderRadius: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor:
                  selectedCategory === cat.id ? palette.navy : "#fff",
                borderWidth: 1,
                borderColor:
                  selectedCategory === cat.id ? palette.navy : palette.line,
              }}
            >
              <cat.icon
                size={16}
                color={
                  selectedCategory === cat.id ? palette.mint : palette.muted
                }
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: selectedCategory === cat.id ? "#fff" : palette.muted,
                }}
              >
                {cat.label}
              </Text>
            </PressableScale>
          ))}
        </ScrollView>
        {!hasResults && (
          <Surface style={{ alignItems: "center", paddingVertical: 44 }}>
            <IconBadge icon={SearchX} size={60} />
            <Text style={{ fontSize: 19, fontWeight: "700", marginTop: 20 }}>
              No matches yet
            </Text>
            <Text
              style={{
                color: palette.muted,
                textAlign: "center",
                fontSize: 13,
                lineHeight: 21,
                marginTop: 9,
              }}
            >
              Try a different name, or explore another category.
            </Text>
            <PressableScale
              onPress={() => setSearchQuery("")}
              style={{ minHeight: 44, justifyContent: "center", marginTop: 14 }}
            >
              <Text style={{ color: palette.blue, fontWeight: "700" }}>
                Clear search
              </Text>
            </PressableScale>
          </Surface>
        )}
        {selectedCategory === "bank-accounts" && hasResults ? (
          <>
            <Text style={{ fontSize: 18, fontWeight: "800", marginBottom: 17 }}>
              Savings accounts{" "}
              <Text style={{ color: palette.muted, fontSize: 12 }}>
                · {visibleBankAccountPartners.length} options
              </Text>
            </Text>
            <View
              style={{
                flexDirection: wide ? "row" : "column",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              {visibleBankAccountPartners.map((partner, i) => {
                const card = BANK_ACCOUNT_CARD_DETAILS[partner.id || ""];
                if (!card) return null;
                return (
                  <Surface
                    key={partner.id}
                    style={{ width: wide ? "48.8%" : "100%", padding: 23 }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 22,
                      }}
                    >
                      <IconBadge
                        icon={Landmark}
                        background={i % 2 ? "#ECF6F1" : "#EAF1FF"}
                        color={i % 2 ? palette.teal : palette.blue}
                      />
                      <Text
                        style={{
                          color: palette.muted,
                          fontSize: 12,
                          fontWeight: "700",
                        }}
                      >
                        {card.logo}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 21,
                        lineHeight: 29,
                        fontWeight: "800",
                        letterSpacing: -0.6,
                      }}
                    >
                      {card.title}
                    </Text>
                    <Text
                      style={{
                        color: palette.muted,
                        fontSize: 12,
                        marginTop: 5,
                        marginBottom: 19,
                      }}
                    >
                      {partner.name}
                    </Text>
                    {card.benefits.map((benefit, j) => (
                      <View
                        key={j}
                        style={{
                          flexDirection: "row",
                          gap: 9,
                          marginBottom: 11,
                          alignItems: "flex-start",
                        }}
                      >
                        <Text
                          style={{ color: palette.teal, fontWeight: "700" }}
                        >
                          ✓
                        </Text>
                        <Text style={{ fontSize: 13, lineHeight: 20, flex: 1 }}>
                          {benefit}
                        </Text>
                      </View>
                    ))}
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 12,
                        marginTop: 16,
                        paddingTop: 17,
                        borderTopWidth: 1,
                        borderColor: palette.line,
                      }}
                    >
                      <PressableScale
                        onPress={() =>
                          handleProductPress(partner, selectedCategory)
                        }
                        style={{
                          flex: 1,
                          minHeight: 48,
                          borderRadius: 13,
                          justifyContent: "center",
                          alignItems: "center",
                          backgroundColor: "#F1F5FA",
                        }}
                      >
                        <Text
                          style={{
                            color: palette.blue,
                            fontSize: 12,
                            fontWeight: "700",
                          }}
                        >
                          View benefits
                        </Text>
                      </PressableScale>
                      <PressableScale
                        onPress={() =>
                          handleApplyPress(partner, selectedCategory)
                        }
                        style={{
                          flex: 1,
                          minHeight: 48,
                          borderRadius: 13,
                          justifyContent: "center",
                          alignItems: "center",
                          backgroundColor: palette.blue,
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: "700",
                          }}
                        >
                          Apply now
                        </Text>
                      </PressableScale>
                    </View>
                  </Surface>
                );
              })}
            </View>
          </>
        ) : (
          filteredSections.map((section) => (
            <View key={section.title} style={{ marginBottom: 26 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 9,
                  marginBottom: 15,
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    fontSize: 17,
                    fontWeight: "800",
                    letterSpacing: -0.3,
                  }}
                >
                  {section.title}
                </Text>
                <Text style={{ color: palette.muted, fontSize: 11 }}>
                  {section.partners.length} options
                </Text>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
                {section.partners.map((partner, i) => (
                  <PressableScale
                    key={partner.id || partner.name}
                    onPress={() =>
                      handleProductPress(partner, selectedCategory)
                    }
                    style={{
                      width: wide ? "48.8%" : "100%",
                      backgroundColor: "#fff",
                      padding: 18,
                      borderWidth: 1,
                      borderColor: palette.line,
                      borderRadius: 20,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 13,
                      }}
                    >
                      <View
                        style={{
                          width: 43,
                          height: 43,
                          borderRadius: 14,
                          backgroundColor: i % 2 ? "#EAF5EF" : "#EDF2FC",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: "800",
                            fontSize: 18,
                            color: i % 2 ? palette.teal : palette.blue,
                          }}
                        >
                          {partner.name.charAt(0)}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontWeight: "700",
                            fontSize: 13,
                            lineHeight: 20,
                          }}
                        >
                          {partner.name}
                        </Text>
                        {partner.tag && (
                          <Text
                            style={{
                              color: palette.muted,
                              fontSize: 11,
                              marginTop: 3,
                            }}
                          >
                            {partner.tag}
                          </Text>
                        )}
                      </View>
                      <ChevronRight size={17} color={palette.muted} />
                    </View>
                    {partner.commission && (
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderTopWidth: 1,
                          borderColor: palette.line,
                          marginTop: 16,
                          paddingTop: 13,
                        }}
                      >
                        <Text style={{ color: palette.muted, fontSize: 11 }}>
                          Potential commission
                        </Text>
                        <Text
                          style={{
                            color: palette.teal,
                            fontWeight: "700",
                            fontSize: 12,
                          }}
                        >
                          {partner.commission}
                        </Text>
                      </View>
                    )}
                  </PressableScale>
                ))}
              </View>
            </View>
          ))
        )}
      </Page>
      <ComingSoonModal
        visible={comingSoonModule !== null}
        module={comingSoonModule}
        onClose={() => setComingSoonModule(null)}
      />
    </>
  );
}
