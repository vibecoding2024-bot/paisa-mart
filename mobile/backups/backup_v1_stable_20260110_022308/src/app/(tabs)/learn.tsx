import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, BookOpen, Award, Clock, ChevronRight, CheckCircle, Lock } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const COURSES = [
  { title: 'Introduction to Financial Products', duration: '15 min', completed: true, locked: false },
  { title: 'How to Sell Credit Cards', duration: '20 min', completed: true, locked: false },
  { title: 'Understanding Loan Products', duration: '25 min', completed: false, locked: false },
  { title: 'Insurance Basics', duration: '18 min', completed: false, locked: false },
  { title: 'Advanced Sales Techniques', duration: '30 min', completed: false, locked: true },
  { title: 'Customer Handling', duration: '22 min', completed: false, locked: true },
];

export default function LearnScreen() {
  const completedCount = COURSES.filter(c => c.completed).length;
  const progress = (completedCount / COURSES.length) * 100;

  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <LinearGradient
          colors={['#002561', '#003380']}
          style={{ paddingBottom: 20 }}
        >
          <View className="px-4 pt-2">
            <Text className="text-white text-xl font-semibold">Learn & Earn</Text>
            <Text className="text-white/70 text-sm mt-1">Complete training to become certified</Text>

            {/* Progress Card */}
            <View className="bg-white/10 rounded-2xl p-4 mt-4">
              <View className="flex-row items-center justify-between mb-3">
                <View>
                  <Text className="text-white/70 text-xs">Your Progress</Text>
                  <Text className="text-white font-bold text-lg">{completedCount}/{COURSES.length} Completed</Text>
                </View>
                <View className="w-14 h-14 bg-orange-500 rounded-full items-center justify-center">
                  <Text className="text-white font-bold">{Math.round(progress)}%</Text>
                </View>
              </View>
              <View className="h-2 bg-white/20 rounded-full overflow-hidden">
                <View
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </View>
            </View>
          </View>
        </LinearGradient>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Certification Banner */}
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            className="px-4 mt-4"
          >
            <View className="bg-gradient-to-r from-yellow-50 to-orange-50 bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-yellow-400 rounded-xl items-center justify-center mr-3">
                  <Award size={24} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-semibold">Get Certified</Text>
                  <Text className="text-gray-500 text-xs mt-0.5">Complete all courses to earn your certificate</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Courses */}
          <Animated.View
            entering={FadeInDown.delay(200).springify()}
            className="px-4 mt-4"
          >
            <Text className="text-gray-800 font-semibold mb-3">Training Modules</Text>

            {COURSES.map((course, index) => (
              <Pressable
                key={index}
                className={`bg-white rounded-xl p-4 mb-3 flex-row items-center ${course.locked ? 'opacity-60' : ''}`}
                disabled={course.locked}
              >
                <View
                  className={`w-12 h-12 rounded-xl items-center justify-center mr-3 ${
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
                  <Text className="text-gray-800 font-medium">{course.title}</Text>
                  <View className="flex-row items-center mt-1">
                    <Clock size={12} color="#9CA3AF" />
                    <Text className="text-gray-400 text-xs ml-1">{course.duration}</Text>
                    {course.completed && (
                      <Text className="text-green-500 text-xs ml-2">✓ Completed</Text>
                    )}
                  </View>
                </View>
                <ChevronRight size={20} color={course.locked ? '#D1D5DB' : '#6B7280'} />
              </Pressable>
            ))}
          </Animated.View>

          {/* Resources */}
          <Animated.View
            entering={FadeInDown.delay(300).springify()}
            className="px-4 mt-2 mb-6"
          >
            <Text className="text-gray-800 font-semibold mb-3">Resources</Text>
            <Pressable className="bg-white rounded-xl p-4 flex-row items-center">
              <View className="w-12 h-12 bg-purple-100 rounded-xl items-center justify-center mr-3">
                <BookOpen size={24} color="#8B5CF6" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 font-medium">Product Guide</Text>
                <Text className="text-gray-400 text-xs mt-0.5">Download PDF guides for all products</Text>
              </View>
              <ChevronRight size={20} color="#6B7280" />
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
