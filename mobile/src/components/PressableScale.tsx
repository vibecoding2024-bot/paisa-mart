import { forwardRef } from "react";
import { Pressable, PressableProps, ViewStyle, StyleProp } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  ReduceMotion,
} from "react-native-reanimated";
import * as Haptics from "@/lib/haptics";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type HapticStyle = "light" | "medium" | "heavy" | "selection" | "none";

interface PressableScaleProps extends PressableProps {
  /** How far the element scales down while pressed. Default 0.98 */
  activeScale?: number;
  /** Haptic feedback fired on press-in. Default 'light' */
  haptic?: HapticStyle;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * A drop-in Pressable that scales + dims slightly while pressed and fires a
 * haptic tap. Gives every button across the app a consistent, buttery feel.
 */
const PressableScale = forwardRef<
  React.ElementRef<typeof Pressable>,
  PressableScaleProps
>(
  (
    {
      activeScale = 0.98,
      haptic = "light",
      onPressIn,
      onPressOut,
      onPress,
      style,
      children,
      disabled,
      ...rest
    },
    ref,
  ) => {
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }));

    const fireHaptic = () => {
      if (haptic === "none") return;
      if (haptic === "selection") {
        Haptics.selectionAsync();
      } else {
        const map = {
          light: Haptics.ImpactFeedbackStyle.Light,
          medium: Haptics.ImpactFeedbackStyle.Medium,
          heavy: Haptics.ImpactFeedbackStyle.Heavy,
        } as const;
        Haptics.impactAsync(map[haptic]);
      }
    };

    return (
      <AnimatedPressable
        {...rest}
        ref={ref}
        accessibilityRole={rest.accessibilityRole ?? "button"}
        disabled={disabled}
        style={[style, animatedStyle]}
        onPressIn={(e) => {
          if (disabled) return;
          scale.value = withSpring(activeScale, {
            damping: 24,
            stiffness: 360,
            mass: 0.6,
            reduceMotion: ReduceMotion.System,
          });
          opacity.value = withTiming(0.94, {
            duration: 80,
            reduceMotion: ReduceMotion.System,
          });
          fireHaptic();
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          scale.value = withSpring(1, {
            damping: 24,
            stiffness: 360,
            mass: 0.6,
            reduceMotion: ReduceMotion.System,
          });
          opacity.value = withTiming(1, {
            duration: 120,
            reduceMotion: ReduceMotion.System,
          });
          onPressOut?.(e);
        }}
        onPress={onPress}
      >
        {children}
      </AnimatedPressable>
    );
  },
);

PressableScale.displayName = "PressableScale";

export default PressableScale;
