import { useState, useMemo } from "react";
import { View } from "react-native";
import {
  Page,
  ScreenHeader,
  Surface,
  Typography as Text,
  SectionHeading,
  IconBadge,
  palette,
} from "@/components/brand";
import { LinearGradient } from "expo-linear-gradient";
import {
  Play,
  BookOpen,
  Award,
  Clock,
  ChevronRight,
  CheckCircle,
  Lock,
} from "lucide-react-native";

import { toast } from "@/lib/toast-store";
import PressableScale from "@/components/PressableScale";

interface Course {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  locked: boolean;
}

const INITIAL_COURSES: Course[] = [
  {
    id: "c1",
    title: "Introduction to Financial Products",
    duration: "15 min",
    completed: true,
    locked: false,
  },
  {
    id: "c2",
    title: "How to Sell Credit Cards",
    duration: "20 min",
    completed: true,
    locked: false,
  },
  {
    id: "c3",
    title: "Understanding Loan Products",
    duration: "25 min",
    completed: false,
    locked: false,
  },
  {
    id: "c4",
    title: "Insurance Basics",
    duration: "18 min",
    completed: false,
    locked: false,
  },
  {
    id: "c5",
    title: "Advanced Sales Techniques",
    duration: "30 min",
    completed: false,
    locked: true,
  },
  {
    id: "c6",
    title: "Customer Handling",
    duration: "22 min",
    completed: false,
    locked: true,
  },
];

export default function LearnScreen() {
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);

  const completedCount = useMemo(
    () => courses.filter((c) => c.completed).length,
    [courses],
  );
  const progress = (completedCount / courses.length) * 100;

  const handleCoursePress = (course: Course) => {
    if (course.locked) {
      toast.info("Complete the earlier modules to unlock this");
      return;
    }
    if (course.completed) {
      toast.info(`Revisiting "${course.title}"`);
      return;
    }
    // Mark as completed and unlock the next module
    setCourses((prev) => {
      const idx = prev.findIndex((c) => c.id === course.id);
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

  const nextCourse = courses.find(
    (course) => !course.completed && !course.locked,
  );
  return (
    <Page>
      <ScreenHeader
        eyebrow="The Paisa Mart academy"
        title="A little learning. A lot of growth."
        subtitle="Build confidence, one financial conversation at a time."
        icon={BookOpen}
      />
      <LinearGradient
        colors={["#102F48", "#194D69"]}
        style={{ borderRadius: 26, padding: 25, marginBottom: 25 }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 15,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#BAD3E3", fontSize: 12 }}>
              Your learning journey
            </Text>
            <Text
              style={{
                color: "#fff",
                fontWeight: "800",
                fontSize: 27,
                marginTop: 8,
              }}
            >
              {completedCount} of {courses.length}
              <Text
                style={{ color: "#BAD3E3", fontSize: 14, fontWeight: "400" }}
              >
                {" "}
                complete
              </Text>
            </Text>
          </View>
          <View
            style={{
              width: 66,
              height: 66,
              borderRadius: 24,
              backgroundColor: "#ffffff14",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "#ffffff20",
            }}
          >
            <Text
              style={{ color: palette.mint, fontSize: 23, fontWeight: "800" }}
            >
              {Math.round(progress)}%
            </Text>
          </View>
        </View>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: courses.length,
            now: completedCount,
          }}
          style={{
            backgroundColor: "#ffffff20",
            height: 6,
            borderRadius: 4,
            marginTop: 24,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${progress}%`,
              height: "100%",
              borderRadius: 4,
              backgroundColor: palette.mint,
            }}
          />
        </View>
        {nextCourse && (
          <PressableScale
            onPress={() => handleCoursePress(nextCourse)}
            style={{
              marginTop: 21,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              minHeight: 44,
            }}
          >
            <View
              style={{
                backgroundColor: palette.mint,
                width: 35,
                height: 35,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Play size={15} color={palette.navy} fill={palette.navy} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>
                Continue learning
              </Text>
              <Text style={{ color: "#BAD3E3", fontSize: 11, marginTop: 4 }}>
                {nextCourse.title}
              </Text>
            </View>
            <ChevronRight size={18} color="#fff" />
          </PressableScale>
        )}
      </LinearGradient>
      <SectionHeading
        title="Your learning path"
        detail="Small steps. Stronger skills."
      />
      <Surface style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}>
        {courses.map((course, index) => (
          <PressableScale
            key={course.id}
            haptic={course.locked ? "none" : "light"}
            onPress={() => handleCoursePress(course)}
            accessibilityLabel={`${course.title}, ${course.locked ? "locked" : course.completed ? "completed" : "available"}`}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              padding: 20,
              minHeight: 94,
              borderBottomWidth: index < courses.length - 1 ? 1 : 0,
              borderColor: palette.line,
            }}
          >
            <IconBadge
              icon={
                course.completed ? CheckCircle : course.locked ? Lock : Play
              }
              background={
                course.completed
                  ? "#EAF5EF"
                  : course.locked
                    ? "#F0F3F6"
                    : "#EAF1FF"
              }
              color={
                course.completed
                  ? palette.teal
                  : course.locked
                    ? "#7F909D"
                    : palette.blue
              }
              size={44}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: palette.muted,
                  fontSize: 9,
                  letterSpacing: 1.3,
                  fontWeight: "600",
                  marginBottom: 5,
                }}
              >
                MODULE {String(index + 1).padStart(2, "0")}
              </Text>
              <Text
                style={{
                  color: course.locked ? palette.muted : palette.ink,
                  fontSize: 13,
                  fontWeight: "700",
                  lineHeight: 20,
                }}
              >
                {course.title}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 7,
                }}
              >
                <Clock size={11} color={palette.muted} />
                <Text style={{ color: palette.muted, fontSize: 10 }}>
                  {course.duration}
                </Text>
                {course.completed && (
                  <Text
                    style={{
                      color: palette.teal,
                      fontSize: 10,
                      fontWeight: "600",
                    }}
                  >
                    {" "}
                    · Completed
                  </Text>
                )}
              </View>
            </View>
            <ChevronRight
              size={17}
              color={course.locked ? "#B2C0CC" : palette.blue}
            />
          </PressableScale>
        ))}
      </Surface>
      <View
        style={{
          backgroundColor: "#FCF3E6",
          padding: 21,
          borderRadius: 22,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          borderWidth: 1,
          borderColor: "#F0E3CE",
          marginBottom: 25,
        }}
      >
        <IconBadge icon={Award} background="#F5E5CA" color="#906229" />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "700", fontSize: 14 }}>
            Make your knowledge count
          </Text>
          <Text
            style={{
              color: "#8A7456",
              fontSize: 12,
              lineHeight: 19,
              marginTop: 5,
            }}
          >
            Complete the learning path to earn your certificate.
          </Text>
        </View>
      </View>
      <SectionHeading title="Keep exploring" />
      <PressableScale
        onPress={() => toast.info("Product guides will be sent to your email")}
      >
        <Surface
          style={{ flexDirection: "row", alignItems: "center", gap: 13 }}
        >
          <IconBadge icon={BookOpen} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "700" }}>
              Product guides
            </Text>
            <Text style={{ color: palette.muted, fontSize: 12, marginTop: 5 }}>
              Your handy product reference library
            </Text>
          </View>
          <ChevronRight size={18} color={palette.blue} />
        </Surface>
      </PressableScale>
    </Page>
  );
}
