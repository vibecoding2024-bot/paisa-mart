import React, { forwardRef } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text as NativeText,
  TextProps,
  View,
  ViewStyle,
  StyleProp,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cssInterop } from "nativewind";
import { isLoaded } from "expo-font";
import { ArrowRight, ChevronRight, type LucideIcon } from "lucide-react-native";
import Animated, { FadeInDown, ReduceMotion } from "react-native-reanimated";
import PressableScale from "@/components/PressableScale";

export const palette = {
  ink: "#112D46",
  muted: "#63788A",
  blue: "#1261E8",
  navy: "#102F48",
  canvas: "#F4F7FA",
  line: "#E6EDF3",
  mint: "#B9F3D7",
  teal: "#087F72",
};

export const brandFonts = {
  Jakarta: require("./fonts/PlusJakartaSans_400Regular.ttf"),
  JakartaSemiBold: require("./fonts/PlusJakartaSans_600SemiBold.ttf"),
  JakartaBold: require("./fonts/PlusJakartaSans_700Bold.ttf"),
  JakartaExtraBold: require("./fonts/PlusJakartaSans_800ExtraBold.ttf"),
};

/** Resolve static font weights consistently on Android, iOS, and web. */
const TypographyBase = forwardRef<NativeText, TextProps>(
  ({ style, ...props }, ref) => {
    const flattened = StyleSheet.flatten(style);
    const weight = String(flattened?.fontWeight || "400");
    const family = ["800", "900"].includes(weight)
      ? "JakartaExtraBold"
      : ["700", "bold"].includes(weight)
        ? "JakartaBold"
        : ["500", "600"].includes(weight)
          ? "JakartaSemiBold"
          : "Jakarta";
    return (
      <NativeText
        ref={ref}
        {...props}
        style={[
          { color: palette.ink, fontSize: 14 },
          style,
          isLoaded(family)
            ? { fontFamily: family, fontWeight: "normal" }
            : undefined,
        ]}
      />
    );
  },
);
TypographyBase.displayName = "Typography";
export const Typography = cssInterop(TypographyBase, { className: "style" });

export function BrandMark({
  light = false,
  compact = false,
}: {
  light?: boolean;
  compact?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 13,
          backgroundColor: light ? palette.mint : palette.blue,
          alignItems: "center",
          justifyContent: "center",
          transform: [{ rotate: "-6deg" }],
        }}
      >
        <Typography
          style={{
            color: light ? palette.navy : "#fff",
            fontSize: 27,
            fontWeight: "800",
            lineHeight: 32,
            transform: [{ rotate: "6deg" }],
          }}
        >
          p
        </Typography>
        <View
          style={{
            position: "absolute",
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: light ? palette.blue : palette.mint,
            top: 8,
            right: 6,
          }}
        />
      </View>
      {!compact && (
        <Typography
          style={{
            color: light ? "#fff" : palette.ink,
            fontSize: 22,
            fontWeight: "800",
            letterSpacing: -0.8,
          }}
        >
          paisa
          <TextAccent light={light} />
        </Typography>
      )}
    </View>
  );
}
function TextAccent({ light }: { light: boolean }) {
  return (
    <Typography
      style={{
        color: light ? palette.mint : palette.blue,
        fontSize: 22,
        fontWeight: "600",
        letterSpacing: -0.8,
      }}
    >
      mart
    </Typography>
  );
}

export function Page({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: palette.canvas }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 1100,
            alignSelf: "center",
            paddingHorizontal: width < 380 ? 16 : 24,
            paddingTop: 22,
            paddingBottom: 32,
          }}
        >
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function Reveal({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Animated.View
      entering={
        Platform.OS === "web"
          ? undefined
          : FadeInDown.duration(240)
              .delay(Math.min(delay, 180))
              .reduceMotion(ReduceMotion.System)
      }
      style={style}
    >
      {children}
    </Animated.View>
  );
}

export function Surface({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: "#fff",
          borderRadius: 24,
          padding: 20,
          borderWidth: 1,
          borderColor: palette.line,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function IconBadge({
  icon: Icon,
  color = palette.blue,
  background = "#EAF1FF",
  size = 48,
}: {
  icon: LucideIcon;
  color?: string;
  background?: string;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: background,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon size={size * 0.46} strokeWidth={1.8} color={color} />
    </View>
  );
}

export function SectionHeading({
  title,
  detail,
  action,
  onPress,
}: {
  title: string;
  detail?: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
        gap: 8,
      }}
    >
      <View style={{ flex: 1 }}>
        <Typography
          style={{ fontSize: 19, fontWeight: "800", letterSpacing: -0.5 }}
        >
          {title}
        </Typography>
        {detail && (
          <Typography
            style={{ color: palette.muted, fontSize: 12, marginTop: 4 }}
          >
            {detail}
          </Typography>
        )}
      </View>
      {action && onPress && (
        <PressableScale
          onPress={onPress}
          style={{
            flexDirection: "row",
            alignItems: "center",
            minHeight: 44,
            gap: 2,
          }}
        >
          <Typography
            style={{ color: palette.blue, fontSize: 12, fontWeight: "700" }}
          >
            {action}
          </Typography>
          <ChevronRight size={15} color={palette.blue} />
        </PressableScale>
      )}
    </View>
  );
}

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}) {
  return (
    <View
      style={{
        marginBottom: 24,
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
      }}
    >
      <View style={{ flex: 1 }}>
        <Typography
          style={{
            fontSize: 10,
            fontWeight: "700",
            letterSpacing: 2,
            color: palette.teal,
            marginBottom: 8,
          }}
        >
          {eyebrow.toUpperCase()}
        </Typography>
        <Typography
          accessibilityRole="header"
          style={{
            fontSize: 30,
            lineHeight: 38,
            fontWeight: "800",
            letterSpacing: -1,
          }}
        >
          {title}
        </Typography>
        <Typography
          style={{
            color: palette.muted,
            fontSize: 13,
            marginTop: 6,
            lineHeight: 20,
          }}
        >
          {subtitle}
        </Typography>
      </View>
      <IconBadge icon={Icon} background="#E6EEFA" size={52} />
    </View>
  );
}

export function ActionButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  secondary?: boolean;
}) {
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={{
        minHeight: 54,
        borderRadius: 16,
        backgroundColor: disabled
          ? "#E4EBF2"
          : secondary
            ? "#EAF1FF"
            : palette.blue,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
        gap: 10,
      }}
    >
      {loading && <ActivityIndicator color="#fff" size="small" />}
      <Typography
        style={{
          fontWeight: "700",
          fontSize: 14,
          color: disabled ? "#758797" : secondary ? palette.blue : "#fff",
        }}
      >
        {label}
      </Typography>
      {!loading && (
        <ArrowRight
          size={18}
          color={disabled ? "#758797" : secondary ? palette.blue : "#fff"}
        />
      )}
    </PressableScale>
  );
}
