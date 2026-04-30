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
import { useReducedMotion } from '../lib/motion';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type HapticKind = 'selection' | 'light' | 'medium' | 'none';

type Props = Omit<PressableProps, 'children' | 'style'> & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: HapticKind;
  children?: ReactNode;
};

const SPRING = { damping: 18, stiffness: 320, mass: 0.6 };

function fireHaptic(kind: HapticKind) {
  if (kind === 'selection') void Haptics.selectionAsync();
  else if (kind === 'light') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  else if (kind === 'medium') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function PressableScale({
  style,
  scaleTo = 0.97,
  haptic = 'selection',
  onPress,
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
      onPressIn={() => {
        scale.value = withSpring(reducedMotion ? 1 : scaleTo, SPRING);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING);
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
