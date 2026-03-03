import { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Check, Users, User, Heart, Baby, Home } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { InsuranceMember } from '@/lib/health-insurance-store';

interface MemberOption {
  id: InsuranceMember;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

const MEMBER_OPTIONS: MemberOption[] = [
  {
    id: 'myself',
    label: 'Myself',
    subtitle: 'Primary policyholder',
    icon: <User size={26} color="#22C55E" />,
    color: '#22C55E',
    bg: '#F0FDF4',
  },
  {
    id: 'spouse',
    label: 'Spouse',
    subtitle: 'Partner coverage',
    icon: <Heart size={26} color="#EC4899" />,
    color: '#EC4899',
    bg: '#FDF2F8',
  },
  {
    id: 'children',
    label: 'Children',
    subtitle: 'Dependent children',
    icon: <Baby size={26} color="#3B82F6" />,
    color: '#3B82F6',
    bg: '#EFF6FF',
  },
  {
    id: 'parents',
    label: 'Parents / In-laws',
    subtitle: 'Extended family care',
    icon: <Home size={26} color="#8B5CF6" />,
    color: '#8B5CF6',
    bg: '#F5F3FF',
  },
];

export default function HealthInsuranceMembersScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<InsuranceMember[]>([]);
  const [error, setError] = useState('');

  const toggleMember = (id: InsuranceMember) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError('');
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleFindPlans = () => {
    if (selected.length === 0) {
      setError('Please select at least one member.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    router.push({
      pathname: '/health-insurance-details',
      params: { members: selected.join(',') },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header gradient */}
      <LinearGradient colors={['#002561', '#003380']} style={{ paddingBottom: 0 }}>
        <SafeAreaView edges={['top']}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: 24,
            }}
          >
            <Pressable
              onPress={() => router.back()}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}
            >
              <ChevronLeft size={22} color="#fff" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500' }}>
                Health Insurance
              </Text>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 2 }}>
                Insurance made simple!
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon + subtitle */}
        <Animated.View entering={FadeInDown.delay(100).springify()} style={{ alignItems: 'center', marginBottom: 32 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: '#F0FDF4',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              shadowColor: '#22C55E',
              shadowOpacity: 0.2,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 4,
            }}
          >
            <Users size={36} color="#22C55E" />
          </View>
          <Text
            style={{
              fontSize: 17,
              fontWeight: '600',
              color: '#111827',
              textAlign: 'center',
              marginBottom: 6,
            }}
          >
            Pick the family members you want to insure
          </Text>
          <Text style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 18 }}>
            You can select one or more members below
          </Text>
        </Animated.View>

        {/* Member options */}
        <View style={{ gap: 14 }}>
          {MEMBER_OPTIONS.map((option, index) => {
            const isSelected = selected.includes(option.id);
            return (
              <Animated.View key={option.id} entering={FadeInDown.delay(150 + index * 60).springify()}>
                <Pressable
                  onPress={() => toggleMember(option.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 18,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: isSelected ? option.color : '#E5E7EB',
                    backgroundColor: isSelected ? option.bg : '#FAFAFA',
                    shadowColor: isSelected ? option.color : '#000',
                    shadowOpacity: isSelected ? 0.12 : 0.04,
                    shadowRadius: isSelected ? 8 : 4,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: isSelected ? 4 : 1,
                  }}
                >
                  {/* Icon bubble */}
                  <View
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      backgroundColor: isSelected ? option.color + '22' : '#F3F4F6',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 16,
                    }}
                  >
                    {option.icon}
                  </View>

                  {/* Labels */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '700',
                        color: isSelected ? option.color : '#111827',
                      }}
                    >
                      {option.label}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                      {option.subtitle}
                    </Text>
                  </View>

                  {/* Tick */}
                  {isSelected ? (
                    <Animated.View entering={ZoomIn.duration(200)}>
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: option.color,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check size={16} color="#fff" strokeWidth={3} />
                      </View>
                    </Animated.View>
                  ) : (
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        borderWidth: 2,
                        borderColor: '#D1D5DB',
                      }}
                    />
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Error message */}
        {error ? (
          <Animated.View entering={FadeInUp.duration(200)} style={{ marginTop: 16 }}>
            <Text style={{ color: '#EF4444', fontSize: 13, textAlign: 'center', fontWeight: '500' }}>
              {error}
            </Text>
          </Animated.View>
        ) : null}

        {/* Selected count badge */}
        {selected.length > 0 && (
          <Animated.View
            entering={FadeInUp.duration(200)}
            style={{
              marginTop: 20,
              paddingVertical: 10,
              paddingHorizontal: 16,
              backgroundColor: '#F0FDF4',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#BBF7D0',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#15803D', fontSize: 13, fontWeight: '600' }}>
              {selected.length} member{selected.length > 1 ? 's' : ''} selected
            </Text>
          </Animated.View>
        )}
      </ScrollView>

      {/* CTA Button */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          paddingTop: 16,
          paddingHorizontal: 20,
          paddingBottom: 34,
          borderTopWidth: 1,
          borderTopColor: '#F3F4F6',
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
          elevation: 8,
        }}
      >
        <Pressable
          onPress={handleFindPlans}
          style={{ borderRadius: 14, overflow: 'hidden' }}
        >
          <LinearGradient
            colors={selected.length > 0 ? ['#002561', '#003380'] : ['#9CA3AF', '#9CA3AF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 }}>
              Find Plans
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}
