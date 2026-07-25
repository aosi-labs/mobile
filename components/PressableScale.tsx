import * as Haptics from 'expo-haptics';
import { type ReactNode } from 'react';
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { type HapticIntent, useReducedMotion } from '../lib/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'children' | 'style'> & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: HapticIntent;
  children?: ReactNode;
};

const SPRING = { damping: 18, stiffness: 320, mass: 0.6 };

function fireHaptic(kind: HapticIntent) {
  if (kind === 'selection') void Haptics.selectionAsync();
  else if (kind === 'light') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  else if (kind === 'medium') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function PressableScale({
  style,
  scaleTo = 0.97,
  haptic = 'selection',
  onPress,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: Props) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      style={[style, animatedStyle]}
      onPressIn={(e) => {
        scale.value = withSpring(reducedMotion ? 1 : scaleTo, SPRING);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, SPRING);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        fireHaptic(haptic);
        onPress?.(e);
      }}
    >
      {children as never}
    </AnimatedPressable>
  );
}
