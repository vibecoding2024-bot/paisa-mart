import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'english' | 'hindi' | 'telugu';

export interface ProductBenefit {
  english: string;
  hindi: string;
  telugu: string;
}

export interface ProductContent {
  headline: ProductBenefit;
  description: ProductBenefit;
  benefits: ProductBenefit[];
  reasons: ProductBenefit[];
}

export interface PayoutTnC {
  eligibilityTitle: ProductBenefit;
  eligibilityDescription: ProductBenefit;
  conditions: ProductBenefit[];
  ltfTitle?: ProductBenefit;
  ltfDescription?: ProductBenefit;
}

export interface ProductDetails {
  id: string;
  providerName: string;
  productName: string;
  category: string;
  bannerImageUrl: string;
  commission: string;
  tag?: string;
  enabled: boolean;
  content: ProductContent;
  payoutTnC?: PayoutTnC;
}

export interface AdvisorProfile {
  id: string;
  name: string;
  phone: string;
  title: string;
  referralCode: string;
}

// Default advisor profile - will be updated from user profile
const defaultAdvisor: AdvisorProfile = {
  id: 'advisor_001',
  name: 'Krishna',
  phone: '8886472929',
  title: 'Business Consultant',
  referralCode: 'KRISHNA001',
};

// Support phone numbers
export const SUPPORT_PHONES = {
  primary: '8886472929',
  secondary: '+91 7417274072',
};

// Product templates with multilingual content
const PRODUCT_TEMPLATES: ProductDetails[] = [
  // AXIS BANK CREDIT CARD
  {
    id: 'axis-bank-credit-card',
    providerName: 'Axis Bank',
    productName: 'Credit Card',
    category: 'credit-cards',
    bannerImageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
    commission: 'Earn up to ₹2,000',
    tag: 'Bank',
    enabled: true,
    content: {
      headline: {
        english: 'Experience a world of rewards & offers!',
        hindi: 'रिवॉर्ड्स और ऑफ़र्स की दुनिया का अनुभव करें!',
        telugu: 'రివార్డ్స్ మరియు ఆఫర్ల ప్రపంచాన్ని అనుభవించండి!',
      },
      description: {
        english: 'Choose from a variety of Axis Bank Credit Cards to suit your own needs.',
        hindi: 'अपनी जरूरतों के अनुसार विभिन्न एक्सिस बैंक क्रेडिट कार्ड में से चुनें।',
        telugu: 'మీ అవసరాలకు తగిన వివిధ ఆక్సిస్ బ్యాంక్ క్రెడిట్ కార్డ్స్ నుండి ఎంచుకోండి.',
      },
      benefits: [
        {
          english: 'Welcoming offers',
          hindi: 'स्वागत ऑफ़र्स',
          telugu: 'స్వాగత ఆఫర్లు',
        },
        {
          english: 'Amazon vouchers',
          hindi: 'अमेज़न वाउचर',
          telugu: 'అమెజాన్ వోచర్లు',
        },
        {
          english: 'Huge rewards',
          hindi: 'बड़े रिवॉर्ड्स',
          telugu: 'భారీ రివార్డ్స్',
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
    payoutTnC: {
      eligibilityTitle: {
        english: 'Payout Eligibility:',
        hindi: 'पेआउट पात्रता:',
        telugu: 'పేఅవుట్ అర్హత:',
      },
      eligibilityDescription: {
        english: 'The following conditions are not eligible for payout:',
        hindi: 'निम्नलिखित शर्तें पेआउट के लिए पात्र नहीं हैं:',
        telugu: 'కింది షరతులు పేఅవుట్‌కు అర్హత లేవు:',
      },
      conditions: [
        {
          english: 'Applications for Axis Neo Credit Card.',
          hindi: 'एक्सिस नियो क्रेडिट कार्ड के लिए आवेदन।',
          telugu: 'ఆక్సిస్ నియో క్రెడిట్ కార్డ్ కోసం దరఖాస్తులు.',
        },
        {
          english: 'Customers who already hold an existing Axis Bank Credit Card.',
          hindi: 'जिन ग्राहकों के पास पहले से एक्सिस बैंक क्रेडिट कार्ड है।',
          telugu: 'ఇప్పటికే ఆక్సిస్ బ్యాంక్ క్రెడిట్ కార్డ్ ఉన్న కస్టమర్లు.',
        },
      ],
      ltfTitle: {
        english: 'LTF Payout:',
        hindi: 'LTF पेआउट:',
        telugu: 'LTF పేఅవుట్:',
      },
      ltfDescription: {
        english: 'For LTF (Life Time Free) cards, a flat payout of ₹800/- will be applicable.',
        hindi: 'LTF (लाइफ टाइम फ्री) कार्ड के लिए, ₹800/- का फ्लैट पेआउट लागू होगा।',
        telugu: 'LTF (లైఫ్ టైమ్ ఫ్రీ) కార్డ్స్ కోసం, ₹800/- ఫ్లాట్ పేఅవుట్ వర్తిస్తుంది.',
      },
    },
  },
  // IDFC FIRST BANK CREDIT CARD
  {
    id: 'idfc-first-bank-credit-card',
    providerName: 'IDFC First Bank',
    productName: 'Credit Card',
    category: 'credit-cards',
    bannerImageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800',
    commission: 'Earn up to ₹2,000',
    tag: 'Bank',
    enabled: true,
    content: {
      headline: {
        english: "It's lifetime free!",
        hindi: 'यह लाइफटाइम फ्री है!',
        telugu: 'ఇది లైఫ్‌టైమ్ ఫ్రీ!',
      },
      description: {
        english: 'IDFC FIRST Bank Credit Cards are loaded with amazing benefits, offers & features.',
        hindi: 'IDFC FIRST बैंक क्रेडिट कार्ड अद्भुत लाभ, ऑफ़र और फीचर्स से भरे हैं।',
        telugu: 'IDFC FIRST బ్యాంక్ క్రెడిట్ కార్డ్స్ అద్భుతమైన ప్రయోజనాలు, ఆఫర్లు & ఫీచర్లతో నిండి ఉన్నాయి.',
      },
      benefits: [
        {
          english: '10X Rewards that never expire',
          hindi: '10X रिवॉर्ड्स जो कभी एक्सपायर नहीं होते',
          telugu: '10X రివార్డ్స్ ఎప్పటికీ ఎక్స్‌పైర్ కావు',
        },
        {
          english: 'Interest free ATM withdrawal (for 48 Days)',
          hindi: 'ब्याज मुक्त ATM निकासी (48 दिनों के लिए)',
          telugu: 'వడ్డీ రహిత ATM విత్‌డ్రాయల్ (48 రోజులు)',
        },
        {
          english: 'Discounts on shopping, dining, movies',
          hindi: 'शॉपिंग, डाइनिंग, मूवीज पर छूट',
          telugu: 'షాపింగ్, డైనింగ్, మూవీస్‌పై డిస్కౌంట్లు',
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
    payoutTnC: {
      eligibilityTitle: {
        english: 'Payout Eligibility:',
        hindi: 'पेआउट पात्रता:',
        telugu: 'పేఅవుట్ అర్హత:',
      },
      eligibilityDescription: {
        english: 'The following conditions are not eligible for payout:',
        hindi: 'निम्नलिखित शर्तें पेआउट के लिए पात्र नहीं हैं:',
        telugu: 'కింది షరతులు పేఅవుట్‌కు అర్హత లేవు:',
      },
      conditions: [
        {
          english: 'Customers who already hold an existing IDFC First Bank Credit Card.',
          hindi: 'जिन ग्राहकों के पास पहले से IDFC फर्स्ट बैंक क्रेडिट कार्ड है।',
          telugu: 'ఇప్పటికే IDFC ఫస్ట్ బ్యాంక్ క్రెడిట్ కార్డ్ ఉన్న కస్టమర్లు.',
        },
      ],
      ltfTitle: {
        english: 'LTF Payout:',
        hindi: 'LTF पेआउट:',
        telugu: 'LTF పేఅవుట్:',
      },
      ltfDescription: {
        english: 'For LTF (Life Time Free) cards, a flat payout of ₹800/- will be applicable.',
        hindi: 'LTF (लाइफ टाइम फ्री) कार्ड के लिए, ₹800/- का फ्लैट पेआउट लागू होगा।',
        telugu: 'LTF (లైఫ్ టైమ్ ఫ్రీ) కార్డ్స్ కోసం, ₹800/- ఫ్లాట్ పేఅవుట్ వర్తిస్తుంది.',
      },
    },
  },
  // HDFC BANK CREDIT CARD
  {
    id: 'hdfc-bank-credit-card',
    providerName: 'HDFC Bank',
    productName: 'Credit Card',
    category: 'credit-cards',
    bannerImageUrl: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800',
    commission: 'Earn up to ₹3,000',
    tag: 'Bank',
    enabled: true,
    content: {
      headline: {
        english: "India's most trusted credit card!",
        hindi: 'भारत का सबसे भरोसेमंद क्रेडिट कार्ड!',
        telugu: 'భారతదేశంలో అత్యంత విశ్వసనీయ క్రెడిట్ కార్డ్!',
      },
      description: {
        english: 'HDFC Bank Credit Cards offer unmatched benefits, cashback & reward points.',
        hindi: 'HDFC बैंक क्रेडिट कार्ड बेजोड़ लाभ, कैशबैक और रिवॉर्ड पॉइंट्स प्रदान करते हैं।',
        telugu: 'HDFC బ్యాంక్ క్రెడిట్ కార్డ్స్ అసమానమైన ప్రయోజనాలు, క్యాష్‌బ్యాక్ & రివార్డ్ పాయింట్లు అందిస్తాయి.',
      },
      benefits: [
        {
          english: 'Up to 5% cashback on spends',
          hindi: 'खर्च पर 5% तक कैशबैक',
          telugu: 'ఖర్చులపై 5% వరకు క్యాష్‌బ్యాక్',
        },
        {
          english: 'Complimentary airport lounge access',
          hindi: 'मुफ्त एयरपोर्ट लाउंज एक्सेस',
          telugu: 'ఉచిత ఎయిర్‌పోర్ట్ లాంజ్ యాక్సెస్',
        },
        {
          english: 'Fuel surcharge waiver',
          hindi: 'फ्यूल सरचार्ज माफी',
          telugu: 'ఫ్యూయల్ సర్‌ఛార్జ్ మినహాయింపు',
        },
      ],
      reasons: [
        {
          english: 'Instant approval',
          hindi: 'तुरंत अप्रूवल',
          telugu: 'తక్షణ ఆమోదం',
        },
        {
          english: 'Paperless process',
          hindi: 'पेपरलेस प्रक्रिया',
          telugu: 'పేపర్‌లెస్ ప్రక్రియ',
        },
      ],
    },
  },
  // FEDERAL BANK CREDIT CARD
  {
    id: 'federal-bank-credit-card',
    providerName: 'Federal Bank',
    productName: 'Credit Card',
    category: 'credit-cards',
    bannerImageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
    commission: 'Earn up to ₹2,000',
    tag: 'Bank',
    enabled: true,
    content: {
      headline: {
        english: 'Experience premium banking!',
        hindi: 'प्रीमियम बैंकिंग का अनुभव करें!',
        telugu: 'ప్రీమియం బ్యాంకింగ్ అనుభవించండి!',
      },
      description: {
        english: 'Federal Bank Credit Cards come with exclusive rewards and lifestyle benefits.',
        hindi: 'फेडरल बैंक क्रेडिट कार्ड एक्सक्लूसिव रिवॉर्ड्स और लाइफस्टाइल बेनिफिट्स के साथ आते हैं।',
        telugu: 'ఫెడరల్ బ్యాంక్ క్రెడిట్ కార్డ్స్ ఎక్స్‌క్లూసివ్ రివార్డ్స్ మరియు లైఫ్‌స్టైల్ బెనిఫిట్స్‌తో వస్తాయి.',
      },
      benefits: [
        {
          english: 'Zero joining fee',
          hindi: 'शून्य जॉइनिंग फीस',
          telugu: 'సున్నా జాయినింగ్ ఫీజు',
        },
        {
          english: 'Reward points on every purchase',
          hindi: 'हर खरीद पर रिवॉर्ड पॉइंट्स',
          telugu: 'ప్రతి కొనుగోలుపై రివార్డ్ పాయింట్లు',
        },
        {
          english: 'EMI conversion facility',
          hindi: 'EMI कन्वर्जन सुविधा',
          telugu: 'EMI మార్పిడి సౌకర్యం',
        },
      ],
      reasons: [
        {
          english: 'Quick approval',
          hindi: 'त्वरित अप्रूवल',
          telugu: 'త్వరిత ఆమోదం',
        },
        {
          english: 'Easy documentation',
          hindi: 'आसान दस्तावेज़',
          telugu: 'సులభ డాక్యుమెంటేషన్',
        },
      ],
    },
  },
  // YES BANK CREDIT CARD
  {
    id: 'yes-bank-credit-card',
    providerName: 'Yes Bank',
    productName: 'Credit Card',
    category: 'credit-cards',
    bannerImageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
    commission: 'Earn up to ₹2,000',
    tag: 'Bank',
    enabled: true,
    content: {
      headline: {
        english: 'Say YES to rewards!',
        hindi: 'रिवॉर्ड्स को YES कहें!',
        telugu: 'రివార్డ్స్‌కు YES చెప్పండి!',
      },
      description: {
        english: 'Yes Bank Credit Cards offer amazing cashback and travel benefits.',
        hindi: 'Yes बैंक क्रेडिट कार्ड अद्भुत कैशबैक और ट्रैवल बेनिफिट्स प्रदान करते हैं।',
        telugu: 'Yes బ్యాంక్ క్రెడిట్ కార్డ్స్ అద్భుతమైన క్యాష్‌బ్యాక్ మరియు ట్రావెల్ బెనిఫిట్స్ అందిస్తాయి.',
      },
      benefits: [
        {
          english: 'Accelerated reward points',
          hindi: 'तेज़ रिवॉर्ड पॉइंट्स',
          telugu: 'వేగవంతమైన రివార్డ్ పాయింట్లు',
        },
        {
          english: 'Dining discounts',
          hindi: 'डाइनिंग छूट',
          telugu: 'డైనింగ్ డిస్కౌంట్లు',
        },
        {
          english: 'Movie ticket offers',
          hindi: 'मूवी टिकट ऑफ़र्स',
          telugu: 'మూవీ టికెట్ ఆఫర్లు',
        },
      ],
      reasons: [
        {
          english: 'Simple application',
          hindi: 'सरल आवेदन',
          telugu: 'సింపుల్ అప్లికేషన్',
        },
        {
          english: 'Quick processing',
          hindi: 'त्वरित प्रोसेसिंग',
          telugu: 'త్వరిత ప్రాసెసింగ్',
        },
      ],
    },
  },
  // SBI CREDIT CARD
  {
    id: 'sbi-credit-card',
    providerName: 'SBI',
    productName: 'Credit Card',
    category: 'credit-cards',
    bannerImageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
    commission: 'Earn up to ₹3,000',
    tag: 'Bank',
    enabled: true,
    content: {
      headline: {
        english: "Nation's most preferred card!",
        hindi: 'देश का सबसे पसंदीदा कार्ड!',
        telugu: 'దేశంలో అత్యంత ఇష్టపడే కార్డ్!',
      },
      description: {
        english: 'SBI Credit Cards backed by the trust of India\'s largest bank.',
        hindi: 'भारत के सबसे बड़े बैंक के भरोसे से समर्थित SBI क्रेडिट कार्ड।',
        telugu: 'భారతదేశంలోని అతిపెద్ద బ్యాంక్ విశ్వాసంతో SBI క్రెడిట్ కార్డ్స్.',
      },
      benefits: [
        {
          english: 'Exclusive SBI rewards',
          hindi: 'एक्सक्लूसिव SBI रिवॉर्ड्स',
          telugu: 'ఎక్స్‌క్లూసివ్ SBI రివార్డ్స్',
        },
        {
          english: 'Milestone benefits',
          hindi: 'माइलस्टोन बेनिफिट्स',
          telugu: 'మైల్‌స్టోన్ బెనిఫిట్స్',
        },
        {
          english: 'Low interest rates',
          hindi: 'कम ब्याज दरें',
          telugu: 'తక్కువ వడ్డీ రేట్లు',
        },
      ],
      reasons: [
        {
          english: 'Trusted brand',
          hindi: 'भरोसेमंद ब्रांड',
          telugu: 'విశ్వసనీయ బ్రాండ్',
        },
        {
          english: 'Wide acceptance',
          hindi: 'व्यापक स्वीकृति',
          telugu: 'విస్తృత అంగీకారం',
        },
      ],
    },
  },
  // KOTAK BANK SAVINGS ACCOUNT
  {
    id: 'kotak-savings-account',
    providerName: 'Kotak Mahindra Bank',
    productName: 'Savings Account',
    category: 'bank-accounts',
    bannerImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800',
    commission: 'Earn up to ₹600',
    tag: 'Bank',
    enabled: true,
    content: {
      headline: {
        english: 'Zero balance savings account!',
        hindi: 'जीरो बैलेंस सेविंग्स अकाउंट!',
        telugu: 'జీరో బ్యాలెన్స్ సేవింగ్స్ అకౌంట్!',
      },
      description: {
        english: 'Open a Kotak 811 account with zero balance and enjoy digital banking benefits.',
        hindi: 'जीरो बैलेंस के साथ कोटक 811 अकाउंट खोलें और डिजिटल बैंकिंग लाभ उठाएं।',
        telugu: 'జీరో బ్యాలెన్స్‌తో కోటక్ 811 అకౌంట్ ఓపెన్ చేసి డిజిటల్ బ్యాంకింగ్ ప్రయోజనాలు పొందండి.',
      },
      benefits: [
        {
          english: 'Zero balance requirement',
          hindi: 'जीरो बैलेंस आवश्यकता',
          telugu: 'జీరో బ్యాలెన్స్ అవసరం',
        },
        {
          english: '6% interest rate',
          hindi: '6% ब्याज दर',
          telugu: '6% వడ్డీ రేటు',
        },
        {
          english: 'Free virtual debit card',
          hindi: 'फ्री वर्चुअल डेबिट कार्ड',
          telugu: 'ఉచిత వర్చువల్ డెబిట్ కార్డ్',
        },
      ],
      reasons: [
        {
          english: 'Instant account opening',
          hindi: 'तुरंत खाता खोलना',
          telugu: 'తక్షణ ఖాతా ఓపెనింగ్',
        },
        {
          english: 'Video KYC available',
          hindi: 'वीडियो KYC उपलब्ध',
          telugu: 'వీడియో KYC అందుబాటులో',
        },
      ],
    },
  },
  // AXIS BANK HOME LOAN
  {
    id: 'axis-bank-home-loan',
    providerName: 'Axis Bank',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'Bank',
    enabled: true,
    content: {
      headline: {
        english: 'Make your dream home a reality!',
        hindi: 'अपने सपनों का घर साकार करें!',
        telugu: 'మీ కలల ఇంటిని సాకారం చేసుకోండి!',
      },
      description: {
        english: 'Axis Bank Home Loans with attractive interest rates and flexible repayment options.',
        hindi: 'आकर्षक ब्याज दरों और लचीले पुनर्भुगतान विकल्पों के साथ एक्सिस बैंक होम लोन।',
        telugu: 'ఆకర్షణీయమైన వడ్డీ రేట్లు మరియు ఫ్లెక్సిబుల్ రీపేమెంట్ ఆప్షన్లతో ఆక్సిస్ బ్యాంక్ హోమ్ లోన్.',
      },
      benefits: [
        {
          english: 'Interest rates starting 8.5%',
          hindi: 'ब्याज दरें 8.5% से शुरू',
          telugu: '8.5% నుండి వడ్డీ రేట్లు',
        },
        {
          english: 'Loan up to ₹5 Crore',
          hindi: '₹5 करोड़ तक लोन',
          telugu: '₹5 కోట్ల వరకు లోన్',
        },
        {
          english: 'Up to 30 years tenure',
          hindi: '30 साल तक की अवधि',
          telugu: '30 సంవత్సరాల వరకు టెన్యూర్',
        },
      ],
      reasons: [
        {
          english: 'Quick disbursement',
          hindi: 'त्वरित वितरण',
          telugu: 'త్వరిత డిస్బర్స్‌మెంట్',
        },
        {
          english: 'Doorstep service',
          hindi: 'घर पर सेवा',
          telugu: 'డోర్‌స్టెప్ సర్వీస్',
        },
      ],
    },
  },
  // BAJAJ PERSONAL LOAN
  {
    id: 'bajaj-personal-loan',
    providerName: 'Bajaj Finance',
    productName: 'Personal Loan',
    category: 'personal-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800',
    commission: 'up to 2.5%',
    tag: 'NBFC',
    enabled: true,
    content: {
      headline: {
        english: 'Get instant personal loan!',
        hindi: 'तुरंत पर्सनल लोन पाएं!',
        telugu: 'తక్షణ పర్సనల్ లోన్ పొందండి!',
      },
      description: {
        english: 'Bajaj Finserv Personal Loans with minimal documentation and quick approval.',
        hindi: 'न्यूनतम दस्तावेज़ और त्वरित अप्रूवल के साथ बजाज फिनसर्व पर्सनल लोन।',
        telugu: 'కనిష్ట డాక్యుమెంటేషన్ మరియు త్వరిత ఆమోదంతో బజాజ్ ఫిన్‌సర్వ్ పర్సనల్ లోన్.',
      },
      benefits: [
        {
          english: 'Loan up to ₹25 Lakh',
          hindi: '₹25 लाख तक लोन',
          telugu: '₹25 లక్షల వరకు లోన్',
        },
        {
          english: 'No collateral required',
          hindi: 'कोई कोलैटरल नहीं',
          telugu: 'కొలాటరల్ అవసరం లేదు',
        },
        {
          english: 'Flexible EMI options',
          hindi: 'लचीले EMI विकल्प',
          telugu: 'ఫ్లెక్సిబుల్ EMI ఆప్షన్లు',
        },
      ],
      reasons: [
        {
          english: 'Instant approval',
          hindi: 'तुरंत अप्रूवल',
          telugu: 'తక్షణ ఆమోదం',
        },
        {
          english: '5-minute disbursement',
          hindi: '5 मिनट में वितरण',
          telugu: '5 నిమిషాల్లో డిస్బర్స్‌మెంట్',
        },
      ],
    },
  },
  // MONEYVIEW INSTA LOAN
  {
    id: 'moneyview-insta-loan',
    providerName: 'Moneyview',
    productName: 'Insta Loan',
    category: 'insta-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800',
    commission: 'up to 3.5%',
    tag: 'App-Based',
    enabled: true,
    content: {
      headline: {
        english: 'Get loan in 5 minutes!',
        hindi: '5 मिनट में लोन पाएं!',
        telugu: '5 నిమిషాల్లో లోన్ పొందండి!',
      },
      description: {
        english: 'Moneyview offers instant personal loans with just your PAN and Aadhaar.',
        hindi: 'मनीव्यू सिर्फ आपके PAN और आधार के साथ तुरंत पर्सनल लोन प्रदान करता है।',
        telugu: 'మనీవ్యూ మీ PAN మరియు ఆధార్‌తో తక్షణ పర్సనల్ లోన్ అందిస్తుంది.',
      },
      benefits: [
        {
          english: '100% digital process',
          hindi: '100% डिजिटल प्रक्रिया',
          telugu: '100% డిజిటల్ ప్రక్రియ',
        },
        {
          english: 'No income proof needed',
          hindi: 'कोई इनकम प्रूफ नहीं',
          telugu: 'ఇన్‌కమ్ ప్రూఫ్ అవసరం లేదు',
        },
        {
          english: 'Instant money transfer',
          hindi: 'तुरंत पैसे ट्रांसफर',
          telugu: 'తక్షణ మనీ ట్రాన్స్‌ఫర్',
        },
      ],
      reasons: [
        {
          english: 'App-based approval',
          hindi: 'ऐप-आधारित अप्रूवल',
          telugu: 'యాప్-ఆధారిత ఆమోదం',
        },
        {
          english: 'No paperwork',
          hindi: 'कोई पेपरवर्क नहीं',
          telugu: 'పేపర్‌వర్క్ లేదు',
        },
      ],
    },
  },
  // STAR HEALTH INSURANCE
  {
    id: 'star-health-insurance',
    providerName: 'Star Health Assure',
    productName: 'Health Insurance',
    category: 'health-insurance',
    bannerImageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800',
    commission: 'up to 15%',
    tag: 'Insurance',
    enabled: true,
    content: {
      headline: {
        english: 'Protect your family health!',
        hindi: 'अपने परिवार की सेहत की रक्षा करें!',
        telugu: 'మీ కుటుంబ ఆరోగ్యాన్ని రక్షించండి!',
      },
      description: {
        english: 'Star Health Insurance provides comprehensive health coverage for you and your family.',
        hindi: 'स्टार हेल्थ इंश्योरेंस आपके और आपके परिवार के लिए व्यापक स्वास्थ्य कवरेज प्रदान करता है।',
        telugu: 'స్టార్ హెల్త్ ఇన్సూరెన్స్ మీకు మరియు మీ కుటుంబానికి సమగ్ర ఆరోగ్య కవరేజ్ అందిస్తుంది.',
      },
      benefits: [
        {
          english: 'Cashless hospitalization',
          hindi: 'कैशलेस अस्पताल भर्ती',
          telugu: 'క్యాష్‌లెస్ హాస్పిటలైజేషన్',
        },
        {
          english: 'No claim bonus',
          hindi: 'नो क्लेम बोनस',
          telugu: 'నో క్లెయిమ్ బోనస్',
        },
        {
          english: 'Pre & post hospitalization',
          hindi: 'प्री और पोस्ट अस्पताल भर्ती',
          telugu: 'ప్రీ & పోస్ట్ హాస్పిటలైజేషన్',
        },
      ],
      reasons: [
        {
          english: 'Wide network of hospitals',
          hindi: 'अस्पतालों का व्यापक नेटवर्क',
          telugu: 'విస్తృత ఆసుపత్రుల నెట్‌వర్క్',
        },
        {
          english: 'Quick claim settlement',
          hindi: 'त्वरित क्लेम सेटलमेंट',
          telugu: 'త్వరిత క్లెయిమ్ సెటిల్‌మెంట్',
        },
      ],
    },
  },
  // DIGIT MOTOR INSURANCE
  {
    id: 'digit-motor-insurance',
    providerName: 'Digit Insurance',
    productName: 'Motor Insurance',
    category: 'motor-insurance',
    bannerImageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800',
    commission: 'up to 30%',
    tag: 'Insurance',
    enabled: true,
    content: {
      headline: {
        english: 'Insure your vehicle smartly!',
        hindi: 'अपने वाहन का स्मार्ट इंश्योरेंस करें!',
        telugu: 'మీ వాహనాన్ని స్మార్ట్‌గా బీమా చేయండి!',
      },
      description: {
        english: 'Digit Motor Insurance offers comprehensive coverage with instant claim settlement.',
        hindi: 'डिजिट मोटर इंश्योरेंस तुरंत क्लेम सेटलमेंट के साथ व्यापक कवरेज प्रदान करता है।',
        telugu: 'డిజిట్ మోటార్ ఇన్సూరెన్స్ తక్షణ క్లెయిమ్ సెటిల్‌మెంట్‌తో సమగ్ర కవరేజ్ అందిస్తుంది.',
      },
      benefits: [
        {
          english: 'Instant policy issuance',
          hindi: 'तुरंत पॉलिसी जारी',
          telugu: 'తక్షణ పాలసీ జారీ',
        },
        {
          english: 'Cashless repairs',
          hindi: 'कैशलेस मरम्मत',
          telugu: 'క్యాష్‌లెస్ మరమ్మతులు',
        },
        {
          english: 'Personal accident cover',
          hindi: 'व्यक्तिगत दुर्घटना कवर',
          telugu: 'వ్యక్తిగత ప్రమాద కవర్',
        },
      ],
      reasons: [
        {
          english: 'Paperless claims',
          hindi: 'पेपरलेस क्लेम',
          telugu: 'పేపర్‌లెస్ క్లెయిమ్స్',
        },
        {
          english: '24/7 support',
          hindi: '24/7 सहायता',
          telugu: '24/7 సపోర్ట్',
        },
      ],
    },
  },
];

interface ProductState {
  products: ProductDetails[];
  advisor: AdvisorProfile;
  selectedLanguage: Language;
  setSelectedLanguage: (lang: Language) => void;
  setAdvisor: (advisor: AdvisorProfile) => void;
  getProductById: (id: string) => ProductDetails | undefined;
  getProductsByCategory: (category: string) => ProductDetails[];
  updateProduct: (id: string, updates: Partial<ProductDetails>) => void;
  addProduct: (product: ProductDetails) => void;
  deleteProduct: (id: string) => void;
}

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: PRODUCT_TEMPLATES,
      advisor: defaultAdvisor,
      selectedLanguage: 'english',

      setSelectedLanguage: (lang) => set({ selectedLanguage: lang }),

      setAdvisor: (advisor) => set({ advisor }),

      getProductById: (id) => {
        return get().products.find((p) => p.id === id);
      },

      getProductsByCategory: (category) => {
        return get().products.filter((p) => p.category === category && p.enabled);
      },

      updateProduct: (id, updates) => {
        set((state) => ({
          products: state.products.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      addProduct: (product) => {
        set((state) => ({
          products: [...state.products, product],
        }));
      },

      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        }));
      },
    }),
    {
      name: 'product-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        products: state.products,
        advisor: state.advisor,
        selectedLanguage: state.selectedLanguage,
      }),
    }
  )
);

// Helper function to generate share message
export const generateShareMessage = (
  product: ProductDetails,
  advisor: AdvisorProfile,
  language: Language
): string => {
  const content = product.content;
  const referralLink = `https://apply.retirerich.in/${product.id}?ref=${advisor.referralCode}`;

  const greeting = {
    english: 'Namaste 🙏,',
    hindi: 'नमस्ते 🙏,',
    telugu: 'నమస్తే 🙏,',
  };

  const youWillGet = {
    english: 'You will get:',
    hindi: 'आपको मिलेगा:',
    telugu: 'మీకు లభిస్తుంది:',
  };

  const whyApply = {
    english: 'Why you should apply from here:',
    hindi: 'यहाँ से क्यों आवेदन करें:',
    telugu: 'ఇక్కడ నుండి ఎందుకు అప్లై చేయాలి:',
  };

  const applyNow = {
    english: 'Apply now to get your',
    hindi: 'अभी आवेदन करें',
    telugu: 'ఇప్పుడే అప్లై చేయండి',
  };

  const forDoubts = {
    english: 'For any doubts, please call on',
    hindi: 'किसी भी संदेह के लिए कॉल करें',
    telugu: 'ఏవైనా సందేహాలకు కాల్ చేయండి',
  };

  const ifUnavailable = {
    english: 'If the above number is unavailable, you can call',
    hindi: 'अगर उपरोक्त नंबर उपलब्ध नहीं है, तो कॉल करें',
    telugu: 'పై నంబర్ అందుబాటులో లేకపోతే, కాల్ చేయండి',
  };

  const forQuickResponse = {
    english: 'for a quick response.',
    hindi: 'त्वरित प्रतिक्रिया के लिए।',
    telugu: 'త్వరిత స్పందన కోసం.',
  };

  let message = `${greeting[language]}\n\n`;
  message += `*${content.headline[language]}*\n`;
  message += `${content.description[language]}\n\n`;
  message += `${youWillGet[language]}\n`;
  content.benefits.forEach((benefit) => {
    message += `✅ ${benefit[language]}\n`;
  });
  message += `\n${whyApply[language]}\n`;
  content.reasons.forEach((reason) => {
    message += `✓ ${reason[language]}\n`;
  });
  message += `\n${applyNow[language]} ${product.providerName} ${product.productName} -\n`;
  message += `${forDoubts[language]} ${SUPPORT_PHONES.primary}\n\n`;
  message += `${ifUnavailable[language]} ${SUPPORT_PHONES.secondary} ${forQuickResponse[language]}\n\n`;
  message += `${advisor.name}\n`;
  message += `${advisor.title}`;

  return message;
};
