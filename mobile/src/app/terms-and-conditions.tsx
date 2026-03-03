import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

type AccordionSectionProps = {
  title: string;
  children: React.ReactNode;
  index: number;
};

function AccordionSection({ title, children, index }: AccordionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      className="bg-white rounded-xl mb-3 overflow-hidden shadow-sm"
    >
      <Pressable
        onPress={() => setIsExpanded(!isExpanded)}
        className="flex-row items-center justify-between p-4 border-b border-gray-100"
      >
        <Text className="text-gray-800 font-semibold text-base flex-1 pr-2">
          {title}
        </Text>
        {isExpanded ? (
          <ChevronUp size={20} color="#6B7280" />
        ) : (
          <ChevronDown size={20} color="#6B7280" />
        )}
      </Pressable>
      {isExpanded && (
        <View className="p-4 pt-2">
          {children}
        </View>
      )}
    </Animated.View>
  );
}

type SectionItemProps = {
  title: string;
  content: string | string[];
};

function SectionItem({ title, content }: SectionItemProps) {
  return (
    <View className="mb-4">
      <Text className="text-gray-800 font-semibold mb-2">{title}</Text>
      {Array.isArray(content) ? (
        <View className="ml-2">
          {content.map((item, idx) => (
            <View key={idx} className="flex-row mb-1.5">
              <Text className="text-gray-600 mr-2">•</Text>
              <Text className="text-gray-600 flex-1 leading-5">{item}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text className="text-gray-600 leading-5">{content}</Text>
      )}
    </View>
  );
}

export default function TermsAndConditionsScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="bg-white border-b border-gray-100 px-4 py-3">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center -ml-2"
            >
              <ChevronLeft size={24} color="#002561" />
            </Pressable>
            <Text className="text-gray-800 text-lg font-semibold ml-2">
              Terms & Conditions
            </Text>
          </View>
        </View>

        <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
          {/* SECTION 1: LOAN PAYOUT TERMS */}
          <AccordionSection title="LOAN PAYOUT TERMS & CONDITIONS" index={0}>
            <Text className="text-gray-500 text-xs mb-3 italic">
              Applicable for Personal Loan, Business Loan, Home Loan, Vehicle Loan
            </Text>

            <SectionItem
              title="1) Payout Eligibility"
              content={[
                'Loan case is successfully approved',
                'Loan amount is disbursed',
                'Customer KYC is completed and verified',
                'All documents are valid and accepted',
                'Loan account is active'
              ]}
            />

            <SectionItem
              title="2) Payout Cycle"
              content="Payout will be processed on a 45 Days payout cycle from the loan disbursement date."
            />

            <SectionItem
              title="3) Payout Calculation"
              content={[
                'Calculated on disbursed loan amount (sanctioned and disbursed value)',
                'Applicable only on final disbursed amount'
              ]}
            />

            <SectionItem
              title="4) TDS Deduction / Charges"
              content={[
                'TDS will be deducted @ 5% as per Income Tax rules',
                'PAN is mandatory',
                'Wallet Withdrawal Charges: 2% + GST applicable'
              ]}
            />

            <SectionItem
              title="5) Payment Mode"
              content={[
                'NEFT',
                'IMPS',
                'RTGS',
                'Wallet Load',
                '',
                'Payment will be done only to registered bank account.'
              ]}
            />

            <SectionItem
              title="6) Cancellation Policy"
              content="Cancellation is not allowed."
            />
          </AccordionSection>

          {/* SECTION 2: VEHICLE INSURANCE PAYOUT TERMS */}
          <AccordionSection title="VEHICLE INSURANCE PAYOUT TERMS" index={1}>
            <SectionItem
              title="1) Payout Eligibility"
              content={[
                'Policy is successfully issued',
                'Premium is received and realized by insurer',
                'Customer KYC is approved',
                'Policy status is active'
              ]}
            />

            <SectionItem
              title="2) Payout Cycle"
              content="45 Days payout cycle."
            />

            <SectionItem
              title="3) Payout Calculation"
              content="Calculated on Net Premium (excluding GST)."
            />

            <SectionItem
              title="4) TDS / Charges"
              content={[
                'TDS @ 5%',
                'PAN mandatory',
                'Wallet Withdrawal Charges: 2% + GST'
              ]}
            />

            <SectionItem
              title="5) Payment Mode"
              content={[
                'NEFT / IMPS / RTGS / Wallet Load',
                'Paid to registered bank account only.'
              ]}
            />

            <SectionItem
              title="6) Cancellation Policy"
              content="Cancellation is not allowed."
            />
          </AccordionSection>

          {/* SECTION 3: HEALTH & LIFE INSURANCE PAYOUT TERMS */}
          <AccordionSection title="HEALTH & LIFE INSURANCE PAYOUT TERMS" index={2}>
            <SectionItem
              title="1) Eligibility"
              content={[
                'Policy successfully issued',
                'Premium realized',
                'KYC approved',
                'Policy active'
              ]}
            />

            <SectionItem
              title="2) Payout Cycle"
              content="45 Days from issuance / premium realization."
            />

            <SectionItem
              title="3) Payout Calculation"
              content="Net Premium (excluding GST)"
            />

            <SectionItem
              title="4) TDS / Charges"
              content={[
                'TDS @ 5%',
                'PAN mandatory',
                'Wallet withdrawal: 2% + GST'
              ]}
            />

            <SectionItem
              title="5) Payment Mode"
              content={[
                'NEFT / IMPS / RTGS / Wallet Load',
                'Paid to registered account only.'
              ]}
            />

            <SectionItem
              title="6) Cancellation"
              content="Cancellation is not allowed."
            />
          </AccordionSection>

          {/* SECTION 4: GOLD LOAN PAYOUT TERMS */}
          <AccordionSection title="GOLD LOAN PAYOUT TERMS" index={3}>
            <SectionItem
              title="1) Eligibility"
              content={[
                'Gold loan approved',
                'Loan amount disbursed',
                'Customer KYC verified',
                'Gold valuation and pledge completed',
                'Loan account active for minimum 3 months'
              ]}
            />

            <SectionItem
              title="2) Payout Cycle"
              content="4 Months from loan disbursement date."
            />

            <SectionItem
              title="3) Payout Calculation"
              content="Based on final disbursed loan amount."
            />

            <SectionItem
              title="4) TDS / Charges"
              content={[
                'TDS @ 5%',
                'PAN mandatory',
                'Wallet withdrawal 2% + GST'
              ]}
            />

            <SectionItem
              title="5) Payment Mode"
              content={[
                'NEFT / IMPS / RTGS / Wallet Load',
                'Paid to registered bank account only.'
              ]}
            />

            <SectionItem
              title="6) Cancellation"
              content="Cancellation is not allowed."
            />
          </AccordionSection>

          {/* SECTION 5: REAL ESTATE PAYOUT TERMS */}
          <AccordionSection title="REAL ESTATE PAYOUT TERMS" index={4}>
            <SectionItem
              title="1) Eligibility"
              content={[
                'Property sale deed initiated',
                'Deal confirmed by developer/company',
                'Sale deed status active'
              ]}
            />

            <SectionItem
              title="2) Payout Cycle"
              content="45 Days from sale deed confirmation/payment realization."
            />

            <SectionItem
              title="3) Payout Calculation"
              content={[
                'Based on Net Booking Amount / Net Sale Value (excluding GST)',
                'Commission applicable only on received amount'
              ]}
            />

            <SectionItem
              title="4) TDS / Charges"
              content={[
                'TDS @ 5%',
                'PAN mandatory',
                'Wallet withdrawal 2% + GST'
              ]}
            />

            <SectionItem
              title="5) Payment Mode"
              content={[
                'NEFT / IMPS / RTGS / Wallet Load',
                'Paid to registered bank account only.'
              ]}
            />

            <SectionItem
              title="6) Cancellation"
              content="Cancellation is not allowed."
            />
          </AccordionSection>

          {/* Footer Note */}
          <View className="bg-orange-50 border border-orange-200 rounded-xl p-4 mt-2 mb-4">
            <Text className="text-orange-800 text-xs leading-5">
              <Text className="font-semibold">Note: </Text>
              Paisa Mart reserves the right to modify payout terms as per company policy and regulatory requirements.
            </Text>
          </View>

          {/* Last Updated */}
          <View className="items-center mb-6">
            <Text className="text-gray-400 text-xs">
              Last Updated: February 16, 2026
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
