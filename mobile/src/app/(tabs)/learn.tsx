import { useState, useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, BookOpen, Award, Clock, ChevronRight, CheckCircle, Lock } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { toast } from '@/lib/toast-store';
import PressableScale from '@/components/PressableScale';

interface Course {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  locked: boolean;
}

const INITIAL_COURSES: Course[] = [
  { id: 'c1', title: 'Introduction to Financial Products', duration: '15 min', completed: true, locked: false },
  { id: 'c2', title: 'How to Sell Credit Cards', duration: '20 min', completed: true, locked: false },
  { id: 'c3', title: 'Understanding Loan Products', duration: '25 min', completed: false, locked: false },
  { id: 'c4', title: 'Insurance Basics', duration: '18 min', completed: false, locked: false },
  { id: 'c5', title: 'Advanced Sales Techniques', duration: '30 min', completed: false, locked: true },
  { id: 'c6', title: 'Customer Handling', duration: '22 min', completed: false, locked: true },
];

export default function LearnScreen() {
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);

  const completedCount = useMemo(() => courses.filter(c => c.completed).length, [courses]);
  const progress = (completedCount / courses.length) * 100;

  const handleCoursePress = (course: Course) => {
    if (course.locked) {
      toast.info('Complete the earlier modules to unlock this');
      return;
    }
    if (course.completed) {
      toast.info(`Revisiting "${course.title}"`);
      return;
    }
    // Mark as completed and unlock the next module
    setCourses(prev => {
      const idx = prev.findIndex(c => c.id === course.id);
      const next = prev.map((c, i) => {
        if (c.id === course.id) return { ...c, completed: true };
        // unlock the first locked course after this one
        if (i === idx + 1 && c.locked) return { ...c, locked: false };
        return c;
      });
      return next;
    });
    toast.success(`Module completed! 🎉`);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <LinearGradient
          colors={['#002561', '#0A3D91']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingBottom: 24, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
        >
          <View className="px-4 pt-2">
            <Text className="text-white text-xl font-bold">Learn & Earn</Text>
            <Text className="text-white/60 text-sm mt-1">Complete training to become certified</Text>

            {/* Progress Card */}
            <LinearGradient
              colors={['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.06)']}
              style={{ borderRadius: 22, padding: 18, marginTop: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}
            >
              <View className="flex-row items-center justify-between mb-3">
                <View>
                  <Text className="text-white/60 text-xs font-medium">Your Progress</Text>
                  <Text className="text-white font-bold text-lg">{completedCount}/{courses.length} Completed</Text>
                </View>
                <LinearGradient
                  colors={['#FF8C00', '#FF6B00']}
                  style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text className="text-white font-extrabold">{Math.round(progress)}%</Text>
                </LinearGradient>
              </View>
              <View className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                <View
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </View>
            </LinearGradient>
          </View>
        </LinearGradient>

        <ScrollView keyboardShouldPersistTaps="handled" className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Certification Banner */}
          <Animated.View entering={FadeInDown.delay(100).springify()} className="px-4 mt-4">
            <LinearGradient
              colors={['#FEF9C3', '#FFEDD5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#FDE68A' }}
            >
              <View className="flex-row items-center">
                <LinearGradient
                  colors={['#FBBF24', '#F59E0B']}
                  style={{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}
                >
                  <Award size={24} color="#fff" />
                </LinearGradient>
                <View className="flex-1">
                  <Text className="text-gray-900 font-bold">Get Certified</Text>
                  <Text className="text-gray-500 text-xs mt-0.5">Complete all courses to earn your certificate</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Courses */}
          <Animated.View entering={FadeInDown.delay(200).springify()} className="px-4 mt-5">
            <Text className="text-gray-900 font-bold text-base mb-3">Training Modules</Text>

            {courses.map((course, index) => (
              <PressableScale
                key={course.id}
                haptic={course.locked ? 'none' : 'light'}
                activeScale={course.locked ? 1 : 0.98}
                onPress={() => handleCoursePress(course)}
                className={`bg-white rounded-2xl p-4 mb-3 flex-row items-center ${course.locked ? 'opacity-60' : ''}`}
                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
              >
                <View
                  className={`w-12 h-12 rounded-2xl items-center justify-center mr-3 ${
                    course.completed ? 'bg-green-100' : course.locked ? 'bg-gray-100' : 'bg-blue-100'
                  }`}
                >
                  {course.completed ? (
                    <CheckCircle size={24} color="#22C55E" />
                  ) : course.locked ? (
                    <Lock size={24} color="#9CA3AF" />
                  ) : (
                    <Play size={24} color="#3B82F6" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 font-semibold">{course.title}</Text>
                  <View className="flex-row items-center mt-1">
                    <Clock size={12} color="#9CA3AF" />
                    <Text className="text-gray-400 text-xs ml-1">{course.duration}</Text>
                    {course.completed && (
                      <Text className="text-green-500 text-xs ml-2 font-medium">✓ Completed</Text>
                    )}
                  </View>
                </View>
                <ChevronRight size={20} color={course.locked ? '#D1D5DB' : '#6B7280'} />
              </PressableScale>
            ))}
          </Animated.View>

          {/* Resources */}
          <Animated.View entering={FadeInDown.delay(300).springify()} className="px-4 mt-2 mb-8">
            <Text className="text-gray-900 font-bold text-base mb-3">Resources</Text>
            <PressableScale
              haptic="light"
              activeScale={0.98}
              onPress={() => toast.info('Product guides will be sent to your email')}
              className="bg-white rounded-2xl p-4 flex-row items-center"
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}
            >
              <View className="w-12 h-12 bg-purple-100 rounded-2xl items-center justify-center mr-3">
                <BookOpen size={24} color="#8B5CF6" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold">Product Guide</Text>
                <Text className="text-gray-400 text-xs mt-0.5">Download PDF guides for all products</Text>
              </View>
              <ChevronRight size={20} color="#6B7280" />
            </PressableScale>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
