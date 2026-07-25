import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { FadeInDown, ReduceMotion } from 'react-native-reanimated';

// One motion vocabulary for the whole app. Durations in ms.
// Screens and components must use these instead of magic numbers so the
// app moves as one calm thing.
export const MOTION = {
  screenSlide: 240,
  entrance: 320,
  stagger: 45,
  sheetHandoff: 250,
  crossfade: 150,
} as const;

// Named haptic intents. The grammar:
//   navigate   - ordinary taps, toggles, chips
//   call       - placing a call, opening directions or an external link
//   crisisCall - dialing a crisis line (the strongest feedback in the app)
// Pass these to PressableScale/Button's `haptic` prop instead of raw values
// so the meaning of a vibration stays consistent app-wide.
export const haptics = {
  navigate: 'selection',
  call: 'light',
  crisisCall: 'medium',
  none: 'none',
} as const;
export type HapticIntent = (typeof haptics)[keyof typeof haptics];

// Entrance choreography for list cards: one factory, one stagger, one
// duration, reduce-motion respected. `index` is the card's position.
export function cardEntering(index: number) {
  return FadeInDown.delay(index * MOTION.stagger)
    .duration(MOTION.entrance)
    .reduceMotion(ReduceMotion.System);
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduced(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => {
      setReduced(v);
    });
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduced;
}
