import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { haptics } from '../lib/motion';
import { theme } from '../lib/theme';
import { PressableScale } from './PressableScale';

// The one crisis affordance. A person in distress must find the same warm
// ochre door in the same shape on every screen and in every state; its
// placement and 44pt-minimum size ARE the accessibility feature.
//   bar  - for empty and error states and screen footers (full width)
//   pill - for compact headers and inline rows
// Home keeps its larger hero crisis bar; everything else uses this.
type Props = {
  onPress: () => void;
  variant?: 'bar' | 'pill';
  label?: string;
  sublabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function CrisisLink({ onPress, variant = 'pill', label, sublabel, style }: Props) {
  if (variant === 'pill') {
    const pillLabel = label ?? 'Urgent? Free 24/7 crisis lines';
    return (
      <PressableScale
        onPress={onPress}
        haptic={haptics.call}
        scaleTo={0.98}
        accessibilityRole="button"
        accessibilityLabel="Free 24 hour crisis lines"
        accessibilityHint="Opens a list of free crisis phone lines"
        style={[styles.pill, style]}
      >
        <Ionicons name="call" size={14} color={theme.colors.accentDeep} />
        <Text style={styles.pillText}>{pillLabel}</Text>
      </PressableScale>
    );
  }
  const barLabel = label ?? 'Need to talk to someone now?';
  const barSublabel = sublabel ?? 'Free crisis lines, 24 hours a day';
  return (
    <PressableScale
      onPress={onPress}
      haptic={haptics.call}
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={`${barLabel} ${barSublabel}`}
      accessibilityHint="Opens a list of free crisis phone lines"
      style={[styles.bar, style]}
    >
      <View style={styles.barIcon}>
        <Ionicons name="call" size={15} color={theme.colors.textOnPrimary} />
      </View>
      <View style={styles.barTextWrap}>
        <Text style={styles.barTitle}>{barLabel}</Text>
        <Text style={styles.barSub}>{barSublabel}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.accentDeep} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accentMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderAccentSubtle,
  },
  pillText: {
    ...theme.type.footnote,
    fontWeight: '600',
    color: theme.colors.accentDeep,
  },
  bar: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.accentMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderAccentSubtle,
  },
  barIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barTextWrap: {
    flex: 1,
  },
  barTitle: {
    ...theme.type.subhead,
    fontWeight: '700',
    color: theme.colors.accentDeep,
  },
  barSub: {
    ...theme.type.footnote,
    color: theme.colors.accentDeep,
  },
});
