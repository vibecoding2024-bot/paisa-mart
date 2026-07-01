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
  applicationUrl?: string;
  supportPhones?: {
    primary: string;
    secondary: string;
  };
  messageFooter?: {
    name: string;
    title: string;
  };
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
    providerName: 'Kotak 811',
    productName: 'Savings Account',
    category: 'bank-accounts',
    bannerImageUrl: 'bank-account:kotak-811-banner',
    commission: 'Earn up to ₹600',
    tag: 'Bank',
    enabled: true,
    applicationUrl: 'https://wee.bnking.in/c/ZjBmOWYyM',
    supportPhones: {
      primary: '9908234067',
      secondary: '+91 7417274072',
    },
    messageFooter: {
      name: 'PAISA MART PRIVATE LIMITED',
      title: 'Business Consultant',
    },
    content: {
      headline: {
        english: 'Looking for a new zero-balance account? Choose Kotak 811 and save while enjoying benefits!',
        hindi: 'जीरो बैलेंस सेविंग्स अकाउंट!',
        telugu: 'జీరో బ్యాలెన్స్ సేవింగ్స్ అకౌంట్!',
      },
      description: {
        english: 'Why choose Kotak 811 Savings Account?',
        hindi: 'जीरो बैलेंस के साथ कोटक 811 अकाउंट खोलें और डिजिटल बैंकिंग लाभ उठाएं।',
        telugu: 'జీరో బ్యాలెన్స్‌తో కోటక్ 811 అకౌంట్ ఓపెన్ చేసి డిజిటల్ బ్యాంకింగ్ ప్రయోజనాలు పొందండి.',
      },
      benefits: [
        {
          english: '0️⃣ Zero balance account',
          hindi: 'जीरो बैलेंस आवश्यकता',
          telugu: 'జీరో బ్యాలెన్స్ అవసరం',
        },
        {
          english: '📈 Up to 7% interest p.a.',
          hindi: '6% ब्याज दर',
          telugu: '6% వడ్డీ రేటు',
        },
        {
          english: '💳 Free virtual debit card',
          hindi: 'फ्री वर्चुअल डेबिट कार्ड',
          telugu: 'ఉచిత వర్చువల్ డెబిట్ కార్డ్',
        },
        {
          english: '💰 Up to ₹6,000 cashback with 811 Super',
          hindi: '811 सुपर के साथ ₹6,000 तक कैशबैक',
          telugu: '811 సూపర్‌తో ₹6,000 వరకు క్యాష్‌బ్యాక్',
        },
      ],
      reasons: [
        {
          english: 'Simple and convenient',
          hindi: 'तुरंत खाता खोलना',
          telugu: 'తక్షణ ఖాతా ఓపెనింగ్',
        },
        {
          english: 'Fast, accessible, secure and paperless',
          hindi: 'वीडियो KYC उपलब्ध',
          telugu: 'వీడియో KYC అందుబాటులో',
        },
      ],
    },
  },
  // INDUSIND BANK BUSINESS SAVINGS ACCOUNT
  {
    id: 'indusind-bank-business-savings-account',
    providerName: 'IndusInd Bank',
    productName: 'Indus Delite Savings Account',
    category: 'bank-accounts',
    bannerImageUrl: 'bank-account:indus-delite-banner',
    commission: 'Earn up to ₹600',
    tag: 'Bank',
    enabled: true,
    applicationUrl: 'https://wee.bnking.in/c/MDczOTI3Y',
    supportPhones: {
      primary: '9908234067',
      secondary: '+91 7417274072',
    },
    messageFooter: {
      name: 'PAISA MART PRIVATE LIMITED',
      title: 'Business Consultant',
    },
    content: {
      headline: {
        english: 'Start saving big with the Indus Delite Savings Account!',
        hindi: 'व्यापार के लिए डिज़ाइन की गई बैंकिंग!',
        telugu: 'వ్యాపారం కోసం రూపొందించిన బ్యాంకింగ్!',
      },
      description: {
        english: 'Top benefits of Indus Delite Zero Balance Savings Account:',
        hindi: 'उद्यमियों के लिए प्रीमियम सुविधाओं के साथ इंडसइंड बैंक बिजनेस सेविंग्स अकाउंट।',
        telugu: 'వ్యవస్థాపకులకు ప్రీమియం ఫీచర్లతో ఇండస్‌ఇండ్ బ్యాంక్ బిజినెస్ సేవింగ్స్ అకౌంట్.',
      },
      benefits: [
        { english: '0️⃣ Zero balance savings account', hindi: 'जीरो बैलेंस सेविंग्स अकाउंट', telugu: 'జీరో బ్యాలెన్స్ సేవింగ్స్ అకౌంట్' },
        { english: '💸 Up to 5% cashback on debit card spends', hindi: 'डेबिट कार्ड खर्च पर 5% तक कैशबैक', telugu: 'డెబిట్ కార్డ్ ఖర్చులపై 5% వరకు క్యాష్‌బ్యాక్' },
        { english: '🎬 Buy one get one on movie tickets', hindi: 'मूवी टिकट पर बाय वन गेट वन', telugu: 'మూవీ టికెట్లపై బై వన్ గెట్ వన్' },
      ],
      reasons: [
        { english: 'Simple and convenient', hindi: 'सरल और सुविधाजनक', telugu: 'సులభం మరియు సౌకర్యవంతం' },
        { english: 'Fast, accessible, secure and paperless', hindi: 'तेज़, सुलभ, सुरक्षित और पेपरलेस', telugu: 'వేగవంతం, అందుబాటులో, సురక్షితం మరియు పేపర్‌లెస్' },
      ],
    },
  },
  // TIDE BUSINESS SAVINGS ACCOUNT
  {
    id: 'tide-business-savings-account',
    providerName: 'Tide Business',
    productName: 'Business Savings Account',
    category: 'bank-accounts',
    bannerImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800',
    commission: 'Earn up to ₹600',
    tag: 'Bank',
    enabled: false,
    content: {
      headline: {
        english: 'Modern banking for modern businesses!',
        hindi: 'आधुनिक व्यापार के लिए आधुनिक बैंकिंग!',
        telugu: 'ఆధునిక వ్యాపారాలకు ఆధునిక బ్యాంకింగ్!',
      },
      description: {
        english: 'Tide Business Account with smart invoicing and expense management.',
        hindi: 'स्मार्ट इनवॉइसिंग और खर्च प्रबंधन के साथ टाइड बिजनेस अकाउंट।',
        telugu: 'స్మార్ట్ ఇన్‌వాయిసింగ్ మరియు ఖర్చు నిర్వహణతో టైడ్ బిజినెస్ అకౌంట్.',
      },
      benefits: [
        { english: 'Free invoicing tools', hindi: 'मुफ्त इनवॉइसिंग टूल्स', telugu: 'ఉచిత ఇన్‌వాయిసింగ్ టూల్స్' },
        { english: 'Automated expense tracking', hindi: 'स्वचालित खर्च ट्रैकिंग', telugu: 'ఆటోమేటెడ్ ఖర్చు ట్రాకింగ్' },
        { english: 'Instant account setup', hindi: 'तुरंत अकाउंट सेटअप', telugu: 'తక్షణ అకౌంట్ సెటప్' },
      ],
      reasons: [
        { english: 'Digital-first approach', hindi: 'डिजिटल-फर्स्ट दृष्टिकोण', telugu: 'డిజిటల్-ఫస్ట్ అప్రోచ్' },
        { english: 'Built for SMEs', hindi: 'SME के लिए बनाया गया', telugu: 'SMEల కోసం నిర్మించబడింది' },
      ],
    },
  },
  // ============================================
  // HOME LOANS - BANKS
  // ============================================

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
  // BANDHAN BANK HOME LOAN
  {
    id: 'bandhan-bank-home-loan',
    providerName: 'Bandhan Bank',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'Bank',
    enabled: true,
    content: {
      headline: {
        english: 'Your home ownership journey starts here!',
        hindi: 'आपकी घर की मालिकी यात्रा यहाँ शुरू होती है!',
        telugu: 'మీ ఇంటి యాజమాన్య ప్రయాణం ఇక్కడ మొదలవుతుంది!',
      },
      description: {
        english: 'Bandhan Bank Home Loans with competitive rates and easy processing.',
        hindi: 'प्रतिस्पर्धी दरों और आसान प्रोसेसिंग के साथ बंधन बैंक होम लोन।',
        telugu: 'పోటీ రేట్లు మరియు సులభ ప్రాసెసింగ్‌తో బంధన్ బ్యాంక్ హోమ్ లోన్.',
      },
      benefits: [
        { english: 'Competitive interest rates', hindi: 'प्रतिस्पर्धी ब्याज दरें', telugu: 'పోటీ వడ్డీ రేట్లు' },
        { english: 'Flexible tenure options', hindi: 'लचीले टेन्योर विकल्प', telugu: 'ఫ్లెక్సిబుల్ టెన్యూర్ ఆప్షన్లు' },
        { english: 'Quick approval process', hindi: 'त्वरित अप्रूवल प्रक्रिया', telugu: 'త్వరిత ఆమోద ప్రక్రియ' },
      ],
      reasons: [
        { english: 'Minimal documentation', hindi: 'न्यूनतम दस्तावेज़', telugu: 'కనిష్ట డాక్యుమెంటేషన్' },
        { english: 'Dedicated support', hindi: 'समर्पित सहायता', telugu: 'అంకితమైన సపోర్ట్' },
      ],
    },
  },
  // HDFC LTD HOME LOAN
  {
    id: 'hdfc-ltd-home-loan',
    providerName: 'HDFC Ltd',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'Bank',
    enabled: true,
    content: {
      headline: {
        english: "India's most trusted home loan provider!",
        hindi: 'भारत का सबसे भरोसेमंद होम लोन प्रदाता!',
        telugu: 'భారతదేశంలో అత్యంత విశ్వసనీయ హోమ్ లోన్ ప్రొవైడర్!',
      },
      description: {
        english: 'HDFC Home Loans with over 4 decades of trust and expertise.',
        hindi: '4 दशकों से अधिक विश्वास और विशेषज्ञता के साथ HDFC होम लोन।',
        telugu: '4 దశాబ్దాలకు పైగా విశ్వాసం మరియు నైపుణ్యంతో HDFC హోమ్ లోన్.',
      },
      benefits: [
        { english: 'Attractive interest rates', hindi: 'आकर्षक ब्याज दरें', telugu: 'ఆకర్షణీయ వడ్డీ రేట్లు' },
        { english: 'Up to 30 years tenure', hindi: '30 साल तक की अवधि', telugu: '30 సంవత్సరాల వరకు టెన్యూర్' },
        { english: 'Balance transfer facility', hindi: 'बैलेंस ट्रांसफर सुविधा', telugu: 'బ్యాలెన్స్ ట్రాన్స్‌ఫర్ సౌకర్యం' },
      ],
      reasons: [
        { english: 'Trusted brand', hindi: 'भरोसेमंद ब्रांड', telugu: 'విశ్వసనీయ బ్రాండ్' },
        { english: 'Pan India presence', hindi: 'पूरे भारत में उपस्थिति', telugu: 'పాన్ ఇండియా ప్రెజెన్స్' },
      ],
    },
  },
  // ICICI BANK HOME LOAN
  {
    id: 'icici-bank-home-loan',
    providerName: 'ICICI Bank',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'Bank',
    enabled: true,
    content: {
      headline: {
        english: 'Turn your dream home into reality!',
        hindi: 'अपने सपनों के घर को हकीकत में बदलें!',
        telugu: 'మీ కలల ఇంటిని వాస్తవంగా మార్చుకోండి!',
      },
      description: {
        english: 'ICICI Bank Home Loans with instant approval and doorstep service.',
        hindi: 'तुरंत अप्रूवल और डोरस्टेप सेवा के साथ ICICI बैंक होम लोन।',
        telugu: 'తక్షణ ఆమోదం మరియు డోర్‌స్టెప్ సర్వీస్‌తో ICICI బ్యాంక్ హోమ్ లోన్.',
      },
      benefits: [
        { english: 'Interest rates from 8.4%', hindi: '8.4% से ब्याज दरें', telugu: '8.4% నుండి వడ్డీ రేట్లు' },
        { english: 'Loan up to ₹10 Crore', hindi: '₹10 करोड़ तक लोन', telugu: '₹10 కోట్ల వరకు లోన్' },
        { english: 'Instant in-principle approval', hindi: 'तुरंत इन-प्रिंसिपल अप्रूवल', telugu: 'తక్షణ ఇన్-ప్రిన్సిపల్ ఆమోదం' },
      ],
      reasons: [
        { english: 'Digital process', hindi: 'डिजिटल प्रक्रिया', telugu: 'డిజిటల్ ప్రక్రియ' },
        { english: 'Flexible EMI options', hindi: 'लचीले EMI विकल्प', telugu: 'ఫ్లెక్సిబుల్ EMI ఆప్షన్లు' },
      ],
    },
  },
  // IDFC FIRST BANK HOME LOAN
  {
    id: 'idfc-first-bank-home-loan',
    providerName: 'IDFC First Bank',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'Bank',
    enabled: true,
    content: {
      headline: {
        english: 'Home loans made simple!',
        hindi: 'होम लोन हुआ आसान!',
        telugu: 'హోమ్ లోన్ సులభం అయింది!',
      },
      description: {
        english: 'IDFC First Bank Home Loans with transparent pricing and no hidden charges.',
        hindi: 'पारदर्शी मूल्य निर्धारण और कोई छिपे शुल्क नहीं के साथ IDFC फर्स्ट बैंक होम लोन।',
        telugu: 'పారదర్శక ధరలు మరియు దాచిన ఛార్జీలు లేకుండా IDFC ఫస్ట్ బ్యాంక్ హోమ్ లోన్.',
      },
      benefits: [
        { english: 'Zero prepayment charges', hindi: 'शून्य प्रीपेमेंट चार्ज', telugu: 'జీరో ప్రీపేమెంట్ ఛార్జీలు' },
        { english: 'Attractive interest rates', hindi: 'आकर्षक ब्याज दरें', telugu: 'ఆకర్షణీయ వడ్డీ రేట్లు' },
        { english: 'Quick disbursement', hindi: 'त्वरित वितरण', telugu: 'త్వరిత డిస్బర్స్‌మెంట్' },
      ],
      reasons: [
        { english: 'Customer first approach', hindi: 'ग्राहक पहले दृष्टिकोण', telugu: 'కస్టమర్ ఫస్ట్ అప్రోచ్' },
        { english: 'Hassle-free process', hindi: 'परेशानी मुक्त प्रक्रिया', telugu: 'హస్సిల్-ఫ్రీ ప్రాసెస్' },
      ],
    },
  },
  // KOTAK MAHINDRA BANK HOME LOAN
  {
    id: 'kotak-mahindra-bank-home-loan',
    providerName: 'Kotak Mahindra Bank',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'Bank',
    enabled: true,
    content: {
      headline: {
        english: 'Your perfect home awaits!',
        hindi: 'आपका परफेक्ट घर आपका इंतज़ार कर रहा है!',
        telugu: 'మీ పర్ఫెక్ట్ ఇల్లు మీ కోసం ఎదురుచూస్తోంది!',
      },
      description: {
        english: 'Kotak Mahindra Bank Home Loans with personalized solutions.',
        hindi: 'व्यक्तिगत समाधान के साथ कोटक महिंद्रा बैंक होम लोन।',
        telugu: 'వ్యక్తిగత పరిష్కారాలతో కోటక్ మహీంద్రా బ్యాంక్ హోమ్ లోన్.',
      },
      benefits: [
        { english: 'Customized loan solutions', hindi: 'अनुकूलित लोन समाधान', telugu: 'కస్టమైజ్డ్ లోన్ సొల్యూషన్లు' },
        { english: 'Doorstep service', hindi: 'डोरस्टेप सेवा', telugu: 'డోర్‌స్టెప్ సర్వీస్' },
        { english: 'Online account management', hindi: 'ऑनलाइन अकाउंट मैनेजमेंट', telugu: 'ఆన్‌లైన్ అకౌంట్ మేనేజ్‌మెంట్' },
      ],
      reasons: [
        { english: 'Expert guidance', hindi: 'विशेषज्ञ मार्गदर्शन', telugu: 'నిపుణుల మార్గదర్శకత్వం' },
        { english: 'Quick processing', hindi: 'त्वरित प्रोसेसिंग', telugu: 'త్వరిత ప్రాసెసింగ్' },
      ],
    },
  },
  // PUNJAB NATIONAL BANK HOME LOAN
  {
    id: 'pnb-home-loan',
    providerName: 'Punjab National Bank (PNB)',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'Bank',
    enabled: true,
    content: {
      headline: {
        english: 'Trusted banking for your home!',
        hindi: 'आपके घर के लिए भरोसेमंद बैंकिंग!',
        telugu: 'మీ ఇంటి కోసం విశ్వసనీయ బ్యాంకింగ్!',
      },
      description: {
        english: 'PNB Home Loans with government bank reliability and competitive rates.',
        hindi: 'सरकारी बैंक विश्वसनीयता और प्रतिस्पर्धी दरों के साथ PNB होम लोन।',
        telugu: 'ప్రభుత్వ బ్యాంక్ విశ్వసనీయత మరియు పోటీ రేట్లతో PNB హోమ్ లోన్.',
      },
      benefits: [
        { english: 'Low interest rates', hindi: 'कम ब्याज दरें', telugu: 'తక్కువ వడ్డీ రేట్లు' },
        { english: 'Long repayment tenure', hindi: 'लंबी पुनर्भुगतान अवधि', telugu: 'సుదీర్ఘ రీపేమెంట్ టెన్యూర్' },
        { english: 'Special rates for women', hindi: 'महिलाओं के लिए विशेष दरें', telugu: 'మహిళలకు ప్రత్యేక రేట్లు' },
      ],
      reasons: [
        { english: 'Government bank trust', hindi: 'सरकारी बैंक भरोसा', telugu: 'ప్రభుత్వ బ్యాంక్ నమ్మకం' },
        { english: 'Wide branch network', hindi: 'व्यापक शाखा नेटवर्क', telugu: 'విస్తృత బ్రాంచ్ నెట్‌వర్క్' },
      ],
    },
  },
  // RBL BANK HOME LOAN
  {
    id: 'rbl-bank-home-loan',
    providerName: 'RBL Bank',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'Bank',
    enabled: true,
    content: {
      headline: {
        english: 'Banking that helps you grow!',
        hindi: 'बैंकिंग जो आपको बढ़ने में मदद करे!',
        telugu: 'మీ వృద్ధికి సహాయపడే బ్యాంకింగ్!',
      },
      description: {
        english: 'RBL Bank Home Loans designed for your convenience.',
        hindi: 'आपकी सुविधा के लिए डिज़ाइन किए गए RBL बैंक होम लोन।',
        telugu: 'మీ సౌకర్యం కోసం రూపొందించిన RBL బ్యాంక్ హోమ్ లోన్.',
      },
      benefits: [
        { english: 'Flexible loan amounts', hindi: 'लचीली लोन राशि', telugu: 'ఫ్లెక్సిబుల్ లోన్ అమౌంట్స్' },
        { english: 'Quick approval', hindi: 'त्वरित अप्रूवल', telugu: 'త్వరిత ఆమోదం' },
        { english: 'Easy documentation', hindi: 'आसान दस्तावेज़', telugu: 'సులభ డాక్యుమెంటేషన్' },
      ],
      reasons: [
        { english: 'Personalized service', hindi: 'व्यक्तिगत सेवा', telugu: 'వ్యక్తిగత సేవ' },
        { english: 'Transparent process', hindi: 'पारदर्शी प्रक्रिया', telugu: 'పారదర్శక ప్రక్రియ' },
      ],
    },
  },
  // YES BANK HOME LOAN
  {
    id: 'yes-bank-home-loan',
    providerName: 'Yes Bank',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'Bank',
    enabled: true,
    content: {
      headline: {
        english: 'Say YES to your dream home!',
        hindi: 'अपने सपनों के घर को YES कहें!',
        telugu: 'మీ కలల ఇంటికి YES చెప్పండి!',
      },
      description: {
        english: 'Yes Bank Home Loans with attractive features and quick processing.',
        hindi: 'आकर्षक सुविधाओं और त्वरित प्रोसेसिंग के साथ Yes बैंक होम लोन।',
        telugu: 'ఆకర్షణీయ ఫీచర్లు మరియు త్వరిత ప్రాసెసింగ్‌తో Yes బ్యాంక్ హోమ్ లోన్.',
      },
      benefits: [
        { english: 'Competitive rates', hindi: 'प्रतिस्पर्धी दरें', telugu: 'పోటీ రేట్లు' },
        { english: 'Top-up loan facility', hindi: 'टॉप-अप लोन सुविधा', telugu: 'టాప్-అప్ లోన్ సౌకర్యం' },
        { english: 'Easy balance transfer', hindi: 'आसान बैलेंस ट्रांसफर', telugu: 'సులభ బ్యాలెన్స్ ట్రాన్స్‌ఫర్' },
      ],
      reasons: [
        { english: 'Quick sanction', hindi: 'त्वरित मंजूरी', telugu: 'త్వరిత మంజూరు' },
        { english: 'Online tracking', hindi: 'ऑनलाइन ट्रैकिंग', telugu: 'ఆన్‌లైన్ ట్రాకింగ్' },
      ],
    },
  },

  // ============================================
  // HOME LOANS - NBFCs / HOUSING FINANCE COMPANIES
  // ============================================

  // TATA CAPITAL HOUSING FINANCE
  {
    id: 'tata-capital-home-loan',
    providerName: 'Tata Capital Housing Finance',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'NBFC',
    enabled: true,
    content: {
      headline: {
        english: 'Tata trust for your home!',
        hindi: 'आपके घर के लिए टाटा का भरोसा!',
        telugu: 'మీ ఇంటి కోసం టాటా నమ్మకం!',
      },
      description: {
        english: 'Tata Capital Housing Finance with the legacy of Tata Group.',
        hindi: 'टाटा समूह की विरासत के साथ टाटा कैपिटल हाउसिंग फाइनेंस।',
        telugu: 'టాటా గ్రూప్ వారసత్వంతో టాటా క్యాపిటల్ హౌసింగ్ ఫైనాన్స్.',
      },
      benefits: [
        { english: 'Attractive interest rates', hindi: 'आकर्षक ब्याज दरें', telugu: 'ఆకర్షణీయ వడ్డీ రేట్లు' },
        { english: 'Flexible repayment', hindi: 'लचीला पुनर्भुगतान', telugu: 'ఫ్లెక్సిబుల్ రీపేమెంట్' },
        { english: 'Quick processing', hindi: 'त्वरित प्रोसेसिंग', telugu: 'త్వరిత ప్రాసెసింగ్' },
      ],
      reasons: [
        { english: 'Tata Group backing', hindi: 'टाटा समूह का समर्थन', telugu: 'టాటా గ్రూప్ సపోర్ట్' },
        { english: 'Customer-centric approach', hindi: 'ग्राहक-केंद्रित दृष्टिकोण', telugu: 'కస్టమర్-సెంట్రిక్ అప్రోచ్' },
      ],
    },
  },
  // SUNDARAM HOME FINANCE
  {
    id: 'sundaram-home-finance-loan',
    providerName: 'Sundaram Home Finance',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'NBFC',
    enabled: true,
    content: {
      headline: {
        english: 'Your trusted home finance partner!',
        hindi: 'आपका भरोसेमंद होम फाइनेंस पार्टनर!',
        telugu: 'మీ విశ్వసనీయ హోమ్ ఫైనాన్స్ పార్టనర్!',
      },
      description: {
        english: 'Sundaram Home Finance with decades of expertise in housing loans.',
        hindi: 'हाउसिंग लोन में दशकों की विशेषज्ञता के साथ सुंदरम होम फाइनेंस।',
        telugu: 'హౌసింగ్ లోన్‌లో దశాబ్దాల నైపుణ్యంతో సుందరం హోమ్ ఫైనాన్స్.',
      },
      benefits: [
        { english: 'Competitive rates', hindi: 'प्रतिस्पर्धी दरें', telugu: 'పోటీ రేట్లు' },
        { english: 'Doorstep service', hindi: 'डोरस्टेप सेवा', telugu: 'డోర్‌స్టెప్ సర్వీస్' },
        { english: 'Easy documentation', hindi: 'आसान दस्तावेज़', telugu: 'సులభ డాక్యుమెంటేషన్' },
      ],
      reasons: [
        { english: 'TVS Group company', hindi: 'TVS समूह कंपनी', telugu: 'TVS గ్రూప్ కంపెనీ' },
        { english: 'Transparent dealings', hindi: 'पारदर्शी व्यवहार', telugu: 'పారదర్శక వ్యవహారాలు' },
      ],
    },
  },
  // BAJAJ HOUSING FINANCE LIMITED (BHFL)
  {
    id: 'bajaj-housing-finance-loan',
    providerName: 'Bajaj Housing Finance Limited (BHFL)',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'NBFC',
    enabled: true,
    content: {
      headline: {
        english: 'Finance your dream home with ease!',
        hindi: 'आसानी से अपने सपनों के घर को फाइनेंस करें!',
        telugu: 'మీ కలల ఇంటిని సులభంగా ఫైనాన్స్ చేయండి!',
      },
      description: {
        english: 'Bajaj Housing Finance with quick approvals and flexible options.',
        hindi: 'त्वरित अप्रूवल और लचीले विकल्पों के साथ बजाज हाउसिंग फाइनेंस।',
        telugu: 'త్వరిత ఆమోదాలు మరియు ఫ్లెక్సిబుల్ ఆప్షన్లతో బజాజ్ హౌసింగ్ ఫైనాన్స్.',
      },
      benefits: [
        { english: 'Instant approval', hindi: 'तुरंत अप्रूवल', telugu: 'తక్షణ ఆమోదం' },
        { english: 'Flexible EMIs', hindi: 'लचीली EMI', telugu: 'ఫ్లెక్సిబుల్ EMIలు' },
        { english: 'Part prepayment facility', hindi: 'आंशिक प्रीपेमेंट सुविधा', telugu: 'పార్ట్ ప్రీపేమెంట్ సౌకర్యం' },
      ],
      reasons: [
        { english: 'Bajaj Group trust', hindi: 'बजाज समूह का भरोसा', telugu: 'బజాజ్ గ్రూప్ నమ్మకం' },
        { english: 'Digital experience', hindi: 'डिजिटल अनुभव', telugu: 'డిజిటల్ అనుభవం' },
      ],
    },
  },
  // AXIS FINANCE
  {
    id: 'axis-finance-home-loan',
    providerName: 'Axis Finance',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'NBFC',
    enabled: true,
    content: {
      headline: {
        english: 'Axis Finance for your home needs!',
        hindi: 'आपकी घर की जरूरतों के लिए एक्सिस फाइनेंस!',
        telugu: 'మీ ఇంటి అవసరాలకు ఆక్సిస్ ఫైనాన్స్!',
      },
      description: {
        english: 'Axis Finance Home Loans with flexible solutions for all.',
        hindi: 'सभी के लिए लचीले समाधान के साथ एक्सिस फाइनेंस होम लोन।',
        telugu: 'అందరికీ ఫ్లెక్సిబుల్ సొల్యూషన్లతో ఆక్సిస్ ఫైనాన్స్ హోమ్ లోన్.',
      },
      benefits: [
        { english: 'Quick processing', hindi: 'त्वरित प्रोसेसिंग', telugu: 'త్వరిత ప్రాసెసింగ్' },
        { english: 'Competitive interest rates', hindi: 'प्रतिस्पर्धी ब्याज दरें', telugu: 'పోటీ వడ్డీ రేట్లు' },
        { english: 'Flexible tenure', hindi: 'लचीला टेन्योर', telugu: 'ఫ్లెక్సిబుల్ టెన్యూర్' },
      ],
      reasons: [
        { english: 'Axis Group backing', hindi: 'एक्सिस समूह का समर्थन', telugu: 'ఆక్సిస్ గ్రూప్ సపోర్ట్' },
        { english: 'Hassle-free service', hindi: 'परेशानी मुक्त सेवा', telugu: 'హస్సిల్-ఫ్రీ సర్వీస్' },
      ],
    },
  },
  // UGRO CAPITAL
  {
    id: 'ugro-capital-home-loan',
    providerName: 'UGRO Capital',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'NBFC',
    enabled: true,
    content: {
      headline: {
        english: 'Smart financing for your home!',
        hindi: 'आपके घर के लिए स्मार्ट फाइनेंसिंग!',
        telugu: 'మీ ఇంటి కోసం స్మార్ట్ ఫైనాన్సింగ్!',
      },
      description: {
        english: 'UGRO Capital with innovative home loan solutions.',
        hindi: 'नवीन होम लोन समाधान के साथ UGRO कैपिटल।',
        telugu: 'వినూత్న హోమ్ లోన్ సొల్యూషన్లతో UGRO క్యాపిటల్.',
      },
      benefits: [
        { english: 'Quick turnaround', hindi: 'त्वरित प्रक्रिया', telugu: 'త్వరిత ప్రక్రియ' },
        { english: 'Flexible terms', hindi: 'लचीली शर्तें', telugu: 'ఫ్లెక్సిబుల్ టర్మ్స్' },
        { english: 'Digital process', hindi: 'डिजिटल प्रक्रिया', telugu: 'డిజిటల్ ప్రక్రియ' },
      ],
      reasons: [
        { english: 'Tech-driven approach', hindi: 'टेक-संचालित दृष्टिकोण', telugu: 'టెక్-డ్రివెన్ అప్రోచ్' },
        { english: 'Customer focus', hindi: 'ग्राहक फोकस', telugu: 'కస్టమర్ ఫోకస్' },
      ],
    },
  },
  // FULLERTON INDIA (MICRO LAP)
  {
    id: 'fullerton-india-home-loan',
    providerName: 'Fullerton India (Micro LAP)',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'NBFC',
    enabled: true,
    content: {
      headline: {
        english: 'Loans against property made easy!',
        hindi: 'प्रॉपर्टी पर लोन हुआ आसान!',
        telugu: 'ప్రాపర్టీపై లోన్ సులభం అయింది!',
      },
      description: {
        english: 'Fullerton India Micro LAP with quick processing.',
        hindi: 'त्वरित प्रोसेसिंग के साथ फुलर्टन इंडिया माइक्रो LAP।',
        telugu: 'త్వరిత ప్రాసెసింగ్‌తో ఫుల్లర్టన్ ఇండియా మైక్రో LAP.',
      },
      benefits: [
        { english: 'Quick approval', hindi: 'त्वरित अप्रूवल', telugu: 'త్వరిత ఆమోదం' },
        { english: 'Minimal documentation', hindi: 'न्यूनतम दस्तावेज़', telugu: 'కనిష్ట డాక్యుమెంటేషన్' },
        { english: 'Flexible usage', hindi: 'लचीला उपयोग', telugu: 'ఫ్లెక్సిబుల్ వినియోగం' },
      ],
      reasons: [
        { english: 'Wide reach', hindi: 'व्यापक पहुंच', telugu: 'విస్తృత రీచ్' },
        { english: 'Dedicated support', hindi: 'समर्पित सहायता', telugu: 'అంకితమైన సపోర్ట్' },
      ],
    },
  },
  // PROTIUM FINANCE
  {
    id: 'protium-finance-home-loan',
    providerName: 'Protium Finance',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'NBFC',
    enabled: true,
    content: {
      headline: {
        english: 'Financing your aspirations!',
        hindi: 'आपकी आकांक्षाओं को फाइनेंस करें!',
        telugu: 'మీ ఆకాంక్షలను ఫైనాన్స్ చేయడం!',
      },
      description: {
        english: 'Protium Finance Home Loans with personalized solutions.',
        hindi: 'व्यक्तिगत समाधान के साथ प्रोटियम फाइनेंस होम लोन।',
        telugu: 'వ్యక్తిగత పరిష్కారాలతో ప్రోటియం ఫైనాన్స్ హోమ్ లోన్.',
      },
      benefits: [
        { english: 'Fast processing', hindi: 'तेज प्रोसेसिंग', telugu: 'వేగవంతమైన ప్రాసెసింగ్' },
        { english: 'Flexible options', hindi: 'लचीले विकल्प', telugu: 'ఫ్లెక్సిబుల్ ఆప్షన్లు' },
        { english: 'Competitive rates', hindi: 'प्रतिस्पर्धी दरें', telugu: 'పోటీ రేట్లు' },
      ],
      reasons: [
        { english: 'Customer-centric', hindi: 'ग्राहक-केंद्रित', telugu: 'కస్టమర్-సెంట్రిక్' },
        { english: 'Transparent process', hindi: 'पारदर्शी प्रक्रिया', telugu: 'పారదర్శక ప్రక్రియ' },
      ],
    },
  },
  // REPCO HOME FINANCE
  {
    id: 'repco-home-finance-loan',
    providerName: 'Repco Home Finance',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'NBFC',
    enabled: true,
    content: {
      headline: {
        english: 'Your home finance specialist!',
        hindi: 'आपका होम फाइनेंस स्पेशलिस्ट!',
        telugu: 'మీ హోమ్ ఫైనాన్స్ స్పెషలిస్ట్!',
      },
      description: {
        english: 'Repco Home Finance with South India expertise.',
        hindi: 'दक्षिण भारत विशेषज्ञता के साथ रेपको होम फाइनेंस।',
        telugu: 'దక్షిణ భారత నైపుణ్యంతో రెప్కో హోమ్ ఫైనాన్స్.',
      },
      benefits: [
        { english: 'Affordable rates', hindi: 'किफायती दरें', telugu: 'అందుబాటు రేట్లు' },
        { english: 'Simple process', hindi: 'सरल प्रक्रिया', telugu: 'సింపుల్ ప్రాసెస్' },
        { english: 'Flexible repayment', hindi: 'लचीला पुनर्भुगतान', telugu: 'ఫ్లెక్సిబుల్ రీపేమెంట్' },
      ],
      reasons: [
        { english: 'Regional expertise', hindi: 'क्षेत्रीय विशेषज्ञता', telugu: 'ప్రాంతీయ నైపుణ్యం' },
        { english: 'Personal touch', hindi: 'व्यक्तिगत स्पर्श', telugu: 'వ్యక్తిగత టచ్' },
      ],
    },
  },
  // ICICI HOME FINANCE COMPANY (ICICI HFC)
  {
    id: 'icici-hfc-home-loan',
    providerName: 'ICICI Home Finance Company (ICICI HFC)',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'NBFC',
    enabled: true,
    content: {
      headline: {
        english: 'ICICI expertise for your home!',
        hindi: 'आपके घर के लिए ICICI विशेषज्ञता!',
        telugu: 'మీ ఇంటి కోసం ICICI నైపుణ్యం!',
      },
      description: {
        english: 'ICICI Home Finance with the trust of ICICI Group.',
        hindi: 'ICICI समूह के भरोसे के साथ ICICI होम फाइनेंस।',
        telugu: 'ICICI గ్రూప్ విశ్వాసంతో ICICI హోమ్ ఫైనాన్స్.',
      },
      benefits: [
        { english: 'Competitive rates', hindi: 'प्रतिस्पर्धी दरें', telugu: 'పోటీ రేట్లు' },
        { english: 'Quick disbursement', hindi: 'त्वरित वितरण', telugu: 'త్వరిత డిస్బర్స్‌మెంట్' },
        { english: 'Online tracking', hindi: 'ऑनलाइन ट्रैकिंग', telugu: 'ఆన్‌లైన్ ట్రాకింగ్' },
      ],
      reasons: [
        { english: 'ICICI Group trust', hindi: 'ICICI समूह भरोसा', telugu: 'ICICI గ్రూప్ నమ్మకం' },
        { english: 'Wide network', hindi: 'व्यापक नेटवर्क', telugu: 'విస్తృత నెట్‌వర్క్' },
      ],
    },
  },
  // PIRAMAL HOUSING FINANCE
  {
    id: 'piramal-housing-finance-loan',
    providerName: 'Piramal Housing Finance',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'NBFC',
    enabled: true,
    content: {
      headline: {
        english: 'Piramal trust for your home!',
        hindi: 'आपके घर के लिए पिरामल का भरोसा!',
        telugu: 'మీ ఇంటి కోసం పిరామల్ నమ్మకం!',
      },
      description: {
        english: 'Piramal Housing Finance with innovative home loan solutions.',
        hindi: 'नवीन होम लोन समाधान के साथ पिरामल हाउसिंग फाइनेंस।',
        telugu: 'వినూత్న హోమ్ లోన్ సొల్యూషన్లతో పిరామల్ హౌసింగ్ ఫైనాన్స్.',
      },
      benefits: [
        { english: 'Flexible terms', hindi: 'लचीली शर्तें', telugu: 'ఫ్లెక్సిబుల్ టర్మ్స్' },
        { english: 'Fast approval', hindi: 'तेज अप्रूवल', telugu: 'వేగవంతమైన ఆమోదం' },
        { english: 'Dedicated support', hindi: 'समर्पित सहायता', telugu: 'అంకితమైన సపోర్ట్' },
      ],
      reasons: [
        { english: 'Piramal Group backing', hindi: 'पिरामल समूह का समर्थन', telugu: 'పిరామల్ గ్రూప్ సపోర్ట్' },
        { english: 'Customer focus', hindi: 'ग्राहक फोकस', telugu: 'కస్టమర్ ఫోకస్' },
      ],
    },
  },
  // AADHAR HOUSING FINANCE
  {
    id: 'aadhar-housing-finance-loan',
    providerName: 'Aadhar Housing Finance',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'NBFC',
    enabled: true,
    content: {
      headline: {
        english: 'Affordable housing for all!',
        hindi: 'सभी के लिए किफायती आवास!',
        telugu: 'అందరికీ అందుబాటులో గృహనిర్మాణం!',
      },
      description: {
        english: 'Aadhar Housing Finance focused on affordable housing segment.',
        hindi: 'किफायती आवास खंड पर केंद्रित आधार हाउसिंग फाइनेंस।',
        telugu: 'అందుబాటు గృహనిర్మాణ విభాగంపై దృష్టి సారించిన ఆధార్ హౌసింగ్ ఫైనాన్స్.',
      },
      benefits: [
        { english: 'Low-income friendly', hindi: 'कम आय वालों के अनुकूल', telugu: 'తక్కువ ఆదాయం అనుకూలం' },
        { english: 'Simple process', hindi: 'सरल प्रक्रिया', telugu: 'సింపుల్ ప్రాసెస్' },
        { english: 'Affordable EMIs', hindi: 'किफायती EMI', telugu: 'అందుబాటు EMIలు' },
      ],
      reasons: [
        { english: 'Financial inclusion focus', hindi: 'वित्तीय समावेशन फोकस', telugu: 'ఆర్థిక సమ్మిళితం ఫోకస్' },
        { english: 'Wide reach', hindi: 'व्यापक पहुंच', telugu: 'విస్తృత రీచ్' },
      ],
    },
  },
  // IIFL HOME FINANCE
  {
    id: 'iifl-home-finance-loan',
    providerName: 'IIFL Home Finance',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'NBFC',
    enabled: true,
    content: {
      headline: {
        english: 'Your home finance partner!',
        hindi: 'आपका होम फाइनेंस पार्टनर!',
        telugu: 'మీ హోమ్ ఫైనాన్స్ పార్టనర్!',
      },
      description: {
        english: 'IIFL Home Finance with pan-India presence and expertise.',
        hindi: 'पूरे भारत में उपस्थिति और विशेषज्ञता के साथ IIFL होम फाइनेंस।',
        telugu: 'పాన్-ఇండియా ప్రెజెన్స్ మరియు నైపుణ్యంతో IIFL హోమ్ ఫైనాన్స్.',
      },
      benefits: [
        { english: 'Quick processing', hindi: 'त्वरित प्रोसेसिंग', telugu: 'త్వరిత ప్రాసెసింగ్' },
        { english: 'Flexible options', hindi: 'लचीले विकल्प', telugu: 'ఫ్లెక్సిబుల్ ఆప్షన్లు' },
        { english: 'Competitive rates', hindi: 'प्रतिस्पर्धी दरें', telugu: 'పోటీ రేట్లు' },
      ],
      reasons: [
        { english: 'IIFL Group expertise', hindi: 'IIFL समूह विशेषज्ञता', telugu: 'IIFL గ్రూప్ నైపుణ్యం' },
        { english: 'Pan-India presence', hindi: 'पूरे भारत में उपस्थिति', telugu: 'పాన్-ఇండియా ప్రెజెన్స్' },
      ],
    },
  },
  // ADITYA BIRLA HOUSING FINANCE LIMITED (ABHFL)
  {
    id: 'aditya-birla-housing-finance-loan',
    providerName: 'Aditya Birla Housing Finance Limited (ABHFL)',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'NBFC',
    enabled: true,
    content: {
      headline: {
        english: 'Aditya Birla trust for your home!',
        hindi: 'आपके घर के लिए आदित्य बिड़ला का भरोसा!',
        telugu: 'మీ ఇంటి కోసం ఆదిత్య బిర్లా నమ్మకం!',
      },
      description: {
        english: 'Aditya Birla Housing Finance with world-class service.',
        hindi: 'विश्व स्तरीय सेवा के साथ आदित्य बिड़ला हाउसिंग फाइनेंस।',
        telugu: 'ప్రపంచ స్థాయి సేవతో ఆదిత్య బిర్లా హౌసింగ్ ఫైనాన్స్.',
      },
      benefits: [
        { english: 'Premium service', hindi: 'प्रीमियम सेवा', telugu: 'ప్రీమియం సేవ' },
        { english: 'Competitive rates', hindi: 'प्रतिस्पर्धी दरें', telugu: 'పోటీ రేట్లు' },
        { english: 'Flexible tenure', hindi: 'लचीला टेन्योर', telugu: 'ఫ్లెక్సిబుల్ టెన్యూర్' },
      ],
      reasons: [
        { english: 'Aditya Birla Group backing', hindi: 'आदित्य बिड़ला समूह का समर्थन', telugu: 'ఆదిత్య బిర్లా గ్రూప్ సపోర్ట్' },
        { english: 'Customer excellence', hindi: 'ग्राहक उत्कृष्टता', telugu: 'కస్టమర్ ఎక్సలెన్స్' },
      ],
    },
  },
  // L&T FINANCE
  {
    id: 'lt-finance-home-loan',
    providerName: 'L&T Finance',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'NBFC',
    enabled: true,
    content: {
      headline: {
        english: 'Build your future with L&T!',
        hindi: 'L&T के साथ अपना भविष्य बनाएं!',
        telugu: 'L&Tతో మీ భవిష్యత్తును నిర్మించుకోండి!',
      },
      description: {
        english: 'L&T Finance Home Loans backed by L&T Group legacy.',
        hindi: 'L&T समूह की विरासत से समर्थित L&T फाइनेंस होम लोन।',
        telugu: 'L&T గ్రూప్ వారసత్వంతో మద్దతు ఉన్న L&T ఫైనాన్స్ హోమ్ లోన్.',
      },
      benefits: [
        { english: 'Attractive rates', hindi: 'आकर्षक दरें', telugu: 'ఆకర్షణీయ రేట్లు' },
        { english: 'Quick disbursement', hindi: 'त्वरित वितरण', telugu: 'త్వరిత డిస్బర్స్‌మెంట్' },
        { english: 'Flexible repayment', hindi: 'लचीला पुनर्भुगतान', telugu: 'ఫ్లెక్సిబుల్ రీపేమెంట్' },
      ],
      reasons: [
        { english: 'L&T Group trust', hindi: 'L&T समूह भरोसा', telugu: 'L&T గ్రూప్ నమ్మకం' },
        { english: 'Engineering excellence', hindi: 'इंजीनियरिंग उत्कृष्टता', telugu: 'ఇంజినీరింగ్ ఎక్సలెన్స్' },
      ],
    },
  },
  // INDIA SHELTER FINANCE CORPORATION
  {
    id: 'india-shelter-finance-home-loan',
    providerName: 'India Shelter Finance Corporation',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'NBFC',
    enabled: true,
    content: {
      headline: {
        english: 'Shelter for every Indian!',
        hindi: 'हर भारतीय के लिए आश्रय!',
        telugu: 'ప్రతి భారతీయుడికి ఆశ్రయం!',
      },
      description: {
        english: 'India Shelter Finance focused on affordable housing.',
        hindi: 'किफायती आवास पर केंद्रित इंडिया शेल्टर फाइनेंस।',
        telugu: 'అందుబాటు గృహనిర్మాణంపై దృష్టి సారించిన ఇండియా షెల్టర్ ఫైనాన్స్.',
      },
      benefits: [
        { english: 'Affordable EMIs', hindi: 'किफायती EMI', telugu: 'అందుబాటు EMIలు' },
        { english: 'Simple documentation', hindi: 'सरल दस्तावेज़', telugu: 'సింపుల్ డాక్యుమెంటేషన్' },
        { english: 'Quick approval', hindi: 'त्वरित अप्रूवल', telugu: 'త్వరిత ఆమోదం' },
      ],
      reasons: [
        { english: 'Affordable housing focus', hindi: 'किफायती आवास फोकस', telugu: 'అందుబాటు గృహనిర్మాణ ఫోకస్' },
        { english: 'Local expertise', hindi: 'स्थानीय विशेषज्ञता', telugu: 'స్థానిక నైపుణ్యం' },
      ],
    },
  },
  // SMFG GRIHASHAKTI
  {
    id: 'smfg-grihashakti-home-loan',
    providerName: 'SMFG Grihashakti',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'NBFC',
    enabled: true,
    content: {
      headline: {
        english: 'Power to own your home!',
        hindi: 'अपना घर पाने की शक्ति!',
        telugu: 'మీ ఇంటిని సొంతం చేసుకునే శక్తి!',
      },
      description: {
        english: 'SMFG Grihashakti with Japanese service standards.',
        hindi: 'जापानी सेवा मानकों के साथ SMFG गृहशक्ति।',
        telugu: 'జపనీస్ సర్వీస్ స్టాండర్డ్స్‌తో SMFG గృహశక్తి.',
      },
      benefits: [
        { english: 'Competitive rates', hindi: 'प्रतिस्पर्धी दरें', telugu: 'పోటీ రేట్లు' },
        { english: 'Transparent process', hindi: 'पारदर्शी प्रक्रिया', telugu: 'పారదర్శక ప్రక్రియ' },
        { english: 'Quality service', hindi: 'गुणवत्ता सेवा', telugu: 'నాణ్యమైన సేవ' },
      ],
      reasons: [
        { english: 'Japanese quality', hindi: 'जापानी गुणवत्ता', telugu: 'జపనీస్ క్వాలిటీ' },
        { english: 'Customer focus', hindi: 'ग्राहक फोकस', telugu: 'కస్టమర్ ఫోకస్' },
      ],
    },
  },
  // MAHINDRA RURAL HOUSING FINANCE
  {
    id: 'mahindra-rural-housing-finance-loan',
    providerName: 'Mahindra Rural Housing Finance',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'NBFC',
    enabled: true,
    content: {
      headline: {
        english: 'Rise with Mahindra!',
        hindi: 'महिंद्रा के साथ उठो!',
        telugu: 'మహీంద్రాతో పైకి రండి!',
      },
      description: {
        english: 'Mahindra Rural Housing Finance for rural and semi-urban areas.',
        hindi: 'ग्रामीण और अर्ध-शहरी क्षेत्रों के लिए महिंद्रा रूरल हाउसिंग फाइनेंस।',
        telugu: 'గ్రామీణ మరియు సెమీ-అర్బన్ ప్రాంతాలకు మహీంద్రా రూరల్ హౌసింగ్ ఫైనాన్స్.',
      },
      benefits: [
        { english: 'Rural focused', hindi: 'ग्रामीण केंद्रित', telugu: 'గ్రామీణ కేంద్రీకృతం' },
        { english: 'Easy process', hindi: 'आसान प्रक्रिया', telugu: 'సులభ ప్రక్రియ' },
        { english: 'Local support', hindi: 'स्थानीय सहायता', telugu: 'స్థానిక సపోర్ట్' },
      ],
      reasons: [
        { english: 'Mahindra Group trust', hindi: 'महिंद्रा समूह भरोसा', telugu: 'మహీంద్రా గ్రూప్ నమ్మకం' },
        { english: 'Rural expertise', hindi: 'ग्रामीण विशेषज्ञता', telugu: 'గ్రామీణ నైపుణ్యం' },
      ],
    },
  },
  // GIC HOUSING FINANCE
  {
    id: 'gic-housing-finance-loan',
    providerName: 'GIC Housing Finance',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'NBFC',
    enabled: true,
    content: {
      headline: {
        english: 'GIC backing for your home!',
        hindi: 'आपके घर के लिए GIC का समर्थन!',
        telugu: 'మీ ఇంటి కోసం GIC సపోర్ట్!',
      },
      description: {
        english: 'GIC Housing Finance with government company backing.',
        hindi: 'सरकारी कंपनी के समर्थन के साथ GIC हाउसिंग फाइनेंस।',
        telugu: 'ప్రభుత్వ కంపెనీ సపోర్ట్‌తో GIC హౌసింగ్ ఫైనాన్స్.',
      },
      benefits: [
        { english: 'Competitive rates', hindi: 'प्रतिस्पर्धी दरें', telugu: 'పోటీ రేట్లు' },
        { english: 'Reliable service', hindi: 'विश्वसनीय सेवा', telugu: 'నమ్మదగిన సేవ' },
        { english: 'Long tenure', hindi: 'लंबी अवधि', telugu: 'సుదీర్ఘ టెన్యూర్' },
      ],
      reasons: [
        { english: 'Government backing', hindi: 'सरकारी समर्थन', telugu: 'ప్రభుత్వ సపోర్ట్' },
        { english: 'Established presence', hindi: 'स्थापित उपस्थिति', telugu: 'స్థాపిత ప్రెజెన్స్' },
      ],
    },
  },
  // HERO HOUSING FINANCE
  {
    id: 'hero-housing-finance-loan',
    providerName: 'Hero Housing Finance',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'NBFC',
    enabled: true,
    content: {
      headline: {
        english: 'Hero for your home!',
        hindi: 'आपके घर का हीरो!',
        telugu: 'మీ ఇంటికి హీరో!',
      },
      description: {
        english: 'Hero Housing Finance backed by Hero Group.',
        hindi: 'हीरो समूह द्वारा समर्थित हीरो हाउसिंग फाइनेंस।',
        telugu: 'హీరో గ్రూప్ సపోర్ట్‌తో హీరో హౌసింగ్ ఫైనాన్స్.',
      },
      benefits: [
        { english: 'Quick processing', hindi: 'त्वरित प्रोसेसिंग', telugu: 'త్వరిత ప్రాసెసింగ్' },
        { english: 'Flexible options', hindi: 'लचीले विकल्प', telugu: 'ఫ్లెక్సిబుల్ ఆప్షన్లు' },
        { english: 'Competitive rates', hindi: 'प्रतिस्पर्धी दरें', telugu: 'పోటీ రేట్లు' },
      ],
      reasons: [
        { english: 'Hero Group backing', hindi: 'हीरो समूह का समर्थन', telugu: 'హీరో గ్రూప్ సపోర్ట్' },
        { english: 'Customer focus', hindi: 'ग्राहक फोकस', telugu: 'కస్టమర్ ఫోకస్' },
      ],
    },
  },
  // SHUBHAM HOUSING DEVELOPMENT FINANCE
  {
    id: 'shubham-housing-finance-loan',
    providerName: 'Shubham Housing Development Finance',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'NBFC',
    enabled: true,
    content: {
      headline: {
        english: 'Auspicious beginning for your home!',
        hindi: 'आपके घर की शुभ शुरुआत!',
        telugu: 'మీ ఇంటికి శుభారంభం!',
      },
      description: {
        english: 'Shubham Housing Finance for affordable home loans.',
        hindi: 'किफायती होम लोन के लिए शुभम हाउसिंग फाइनेंस।',
        telugu: 'అందుబాటు హోమ్ లోన్ల కోసం శుభం హౌసింగ్ ఫైనాన్స్.',
      },
      benefits: [
        { english: 'Affordable rates', hindi: 'किफायती दरें', telugu: 'అందుబాటు రేట్లు' },
        { english: 'Simple process', hindi: 'सरल प्रक्रिया', telugu: 'సింపుల్ ప్రాసెస్' },
        { english: 'Quick approval', hindi: 'त्वरित अप्रूवल', telugu: 'త్వరిత ఆమోదం' },
      ],
      reasons: [
        { english: 'Affordable focus', hindi: 'किफायती फोकस', telugu: 'అందుబాటు ఫోకస్' },
        { english: 'Customer-centric', hindi: 'ग्राहक-केंद्रित', telugu: 'కస్టమర్-సెంట్రిక్' },
      ],
    },
  },
  // SLICE HOUSING FINANCE
  {
    id: 'slice-housing-finance-loan',
    providerName: 'Slice Housing Finance',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'NBFC',
    enabled: true,
    content: {
      headline: {
        english: 'Modern financing for your home!',
        hindi: 'आपके घर के लिए आधुनिक फाइनेंसिंग!',
        telugu: 'మీ ఇంటి కోసం ఆధునిక ఫైనాన్సింగ్!',
      },
      description: {
        english: 'Slice Housing Finance with digital-first approach.',
        hindi: 'डिजिटल-फर्स्ट दृष्टिकोण के साथ स्लाइस हाउसिंग फाइनेंस।',
        telugu: 'డిజిటల్-ఫస్ట్ అప్రోచ్‌తో స్లైస్ హౌసింగ్ ఫైనాన్స్.',
      },
      benefits: [
        { english: 'Digital process', hindi: 'डिजिटल प्रक्रिया', telugu: 'డిజిటల్ ప్రక్రియ' },
        { english: 'Quick approval', hindi: 'त्वरित अप्रूवल', telugu: 'త్వరిత ఆమోదం' },
        { english: 'Transparent pricing', hindi: 'पारदर्शी मूल्य', telugu: 'పారదర్శక ధరలు' },
      ],
      reasons: [
        { english: 'Tech-driven', hindi: 'टेक-संचालित', telugu: 'టెక్-డ్రివెన్' },
        { english: 'Modern approach', hindi: 'आधुनिक दृष्टिकोण', telugu: 'ఆధునిక అప్రోచ్' },
      ],
    },
  },
  // VASTU HOUSING FINANCE
  {
    id: 'vastu-housing-finance-loan',
    providerName: 'Vastu Housing Finance',
    productName: 'Home Loan',
    category: 'home-loans',
    bannerImageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    commission: 'up to 1.5%',
    tag: 'NBFC',
    enabled: true,
    content: {
      headline: {
        english: 'Build your Vastu-perfect home!',
        hindi: 'अपना वास्तु-परफेक्ट घर बनाएं!',
        telugu: 'మీ వాస్తు-పర్ఫెక్ట్ ఇల్లు నిర్మించుకోండి!',
      },
      description: {
        english: 'Vastu Housing Finance focused on self-employed segment.',
        hindi: 'स्व-रोज़गार खंड पर केंद्रित वास्तु हाउसिंग फाइनेंस।',
        telugu: 'స్వయం ఉపాధి విభాగంపై దృష్టి సారించిన వాస్తు హౌసింగ్ ఫైనాన్స్.',
      },
      benefits: [
        { english: 'Self-employed friendly', hindi: 'स्व-रोज़गार अनुकूल', telugu: 'స్వయం ఉపాధి అనుకూలం' },
        { english: 'Flexible documentation', hindi: 'लचीला दस्तावेज़', telugu: 'ఫ్లెక్సిబుల్ డాక్యుమెంటేషన్' },
        { english: 'Quick processing', hindi: 'त्वरित प्रोसेसिंग', telugu: 'త్వరిత ప్రాసెసింగ్' },
      ],
      reasons: [
        { english: 'Niche focus', hindi: 'विशेष फोकस', telugu: 'నిచ్ ఫోకస్' },
        { english: 'Customized solutions', hindi: 'अनुकूलित समाधान', telugu: 'కస్టమైజ్డ్ సొల్యూషన్లు' },
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

const REQUIRED_BANK_ACCOUNT_PRODUCT_IDS = new Set([
  'kotak-savings-account',
  'indusind-bank-business-savings-account',
]);

const applyRequiredBankAccountProducts = (products: ProductDetails[]): ProductDetails[] => {
  const productsOutsideBankAccounts = products.filter((product) => product.category !== 'bank-accounts');
  const requiredBankAccountProducts = PRODUCT_TEMPLATES.filter((product) =>
    REQUIRED_BANK_ACCOUNT_PRODUCT_IDS.has(product.id)
  );

  return [...productsOutsideBankAccounts, ...requiredBankAccountProducts];
};

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
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<ProductState> | undefined;

        return {
          ...currentState,
          ...persisted,
          products: applyRequiredBankAccountProducts(persisted?.products || currentState.products),
        };
      },
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
  const referralLink = product.applicationUrl || `https://apply.paisamart.in/${product.id}?ref=${advisor.referralCode}`;
  const supportPhones = product.supportPhones || SUPPORT_PHONES;
  const messageFooter = product.messageFooter || {
    name: advisor.name,
    title: advisor.title,
  };

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
    english: product.applicationUrl ? 'Now open a savings account from the comfort of your home -' : 'Apply now to get your',
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

  let message = product.applicationUrl ? '' : `${greeting[language]}\n\n`;
  message += product.applicationUrl
    ? `${content.headline[language]}\n\n`
    : `*${content.headline[language]}*\n`;
  message += `${content.description[language]}\n\n`;
  if (!product.applicationUrl) {
    message += `${youWillGet[language]}\n`;
  }
  content.benefits.forEach((benefit) => {
    message += product.applicationUrl ? `${benefit[language]}\n` : `✅ ${benefit[language]}\n`;
  });
  message += `\n${whyApply[language]}\n`;
  content.reasons.forEach((reason) => {
    message += `✓ ${reason[language]}\n`;
  });
  if (product.applicationUrl) {
    message += `\n${applyNow[language]} ${referralLink}\n\n`;
  } else {
    message += `\n${applyNow[language]} ${product.providerName} ${product.productName} -\n`;
  }
  message += `${forDoubts[language]} ${supportPhones.primary}\n\n`;
  message += `${ifUnavailable[language]} ${supportPhones.secondary} ${forQuickResponse[language]}\n\n`;
  message += `${messageFooter.name}\n`;
  message += `${messageFooter.title}`;

  return message;
};
