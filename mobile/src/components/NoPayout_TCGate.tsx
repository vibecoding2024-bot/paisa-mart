import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldOff, CheckSquare, Square, ArrowLeft, FileText } from 'lucide-react-native';
import * as Haptics from '@/lib/haptics';

export type NoPayout_Module = 'cash-cards' | 'recharge-bills' | 'travel-tickets';

const MODULE_LABELS: Record<NoPayout_Module, string> = {
  'cash-cards': 'Cash on Credit Card',
  'recharge-bills': 'Recharge & Pay Bills',
  'travel-tickets': 'Travel & Tickets',
};

const TC_CLAUSES = [
  'This service is provided for user convenience only.',
  'No commission or payout is applicable for transactions under this category.',
  'Cashback or offers, if any, are subject to partner terms.',
  'The platform is not responsible for third-party service delays or failures.',
  'Transaction disputes must be resolved directly with the service provider.',
];

interface NoPayout_TCGateProps {
  visible: boolean;
  module: NoPayout_Module;
  onAccept: () => void;
  onDecline: () => void;
}

export default function NoPayout_TCGate({
  visible,
  module,
  onAccept,
  onDecline,
}: NoPayout_TCGateProps) {
  const [agreed, setAgreed] = useState(false);

  const handleAccept = () => {
    if (!agreed) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAccept();
    setAgreed(false);
  };

  const handleDecline = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAgreed(false);
    onDecline();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleDecline}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          justifyContent: 'flex-end',
        }}
        onPress={handleDecline}
      >
        <Pressable onPress={() => {}} style={{ width: '100%' }}>
          <Animated.View
            entering={FadeInUp.springify().damping(18).stiffness(120)}
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingBottom: Platform.OS === 'ios' ? 40 : 28,
              overflow: 'hidden',
              maxHeight: '90%',
            }}
          >
            {/* Top navy strip */}
            <LinearGradient
              colors={['#002561', '#003380']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 4, width: '100%' }}
            />

            {/* Handle */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <View style={{ width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2 }} />
            </View>

            {/* Header */}
            <View
              style={{
                paddingHorizontal: 20,
                paddingTop: 8,
                paddingBottom: 16,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: '#FEF2F2',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldOff size={22} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: '#111827',
                    marginBottom: 3,
                  }}
                >
                  Terms & Conditions
                </Text>
                <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 18 }}>
                  {MODULE_LABELS[module]} — No Payout Category
                </Text>
              </View>
            </View>

            {/* No-payout badge */}
            <View
              style={{
                marginHorizontal: 20,
                marginBottom: 14,
                backgroundColor: '#FFF7ED',
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#FED7AA',
                gap: 10,
              }}
            >
              <ShieldOff size={16} color="#EA580C" />
              <Text style={{ color: '#9A3412', fontSize: 13, fontWeight: '600', flex: 1 }}>
                Commission: 0% · Fixed Payout: ₹0 · Not eligible for earnings
              </Text>
            </View>

            {/* T&C clauses */}
            <ScrollView
              style={{ maxHeight: 240 }}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <FileText size={15} color="#374151" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151' }}>
                  Standard Terms
                </Text>
              </View>
              {TC_CLAUSES.map((clause, idx) => (
                <View
                  key={idx}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: 10,
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: '#EFF6FF',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 1,
                      flexShrink: 0,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#1D4ED8' }}>
                      {idx + 1}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, color: '#374151', lineHeight: 20, flex: 1 }}>
                    {clause}
                  </Text>
                </View>
              ))}
            </ScrollView>

            {/* Divider */}
            <View
              style={{
                height: 1,
                backgroundColor: '#F3F4F6',
                marginHorizontal: 20,
                marginVertical: 14,
              }}
            />

            {/* I Agree checkbox */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAgreed(!agreed);
              }}
              style={{
                marginHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
              }}
            >
              {agreed ? (
                <CheckSquare size={22} color="#002561" />
              ) : (
                <Square size={22} color="#9CA3AF" />
              )}
              <Text style={{ fontSize: 14, color: '#111827', fontWeight: '500', flex: 1 }}>
                I have read and agree to the Terms & Conditions above.
              </Text>
            </Pressable>

            {/* Buttons */}
            <View
              style={{
                paddingHorizontal: 20,
                flexDirection: 'row',
                gap: 12,
              }}
            >
              <Pressable
                onPress={handleDecline}
                style={{
                  flex: 1,
                  backgroundColor: '#F3F4F6',
                  borderRadius: 14,
                  paddingVertical: 15,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <ArrowLeft size={16} color="#374151" />
                <Text style={{ color: '#374151', fontWeight: '600', fontSize: 15 }}>Back</Text>
              </Pressable>

              <Pressable
                onPress={handleAccept}
                disabled={!agreed}
                style={{ flex: 2, borderRadius: 14, overflow: 'hidden', opacity: agreed ? 1 : 0.4 }}
              >
                <LinearGradient
                  colors={['#002561', '#003380']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 15,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                    I Agree — Continue
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
