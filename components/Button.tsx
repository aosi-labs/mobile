import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { haptics, type HapticIntent } from '../lib/motion';
import { theme } from '../lib/theme';
import { PressableScale } from './PressableScale';

// The one button. Three variants, one grammar:
//   primary   - solid eucalyptus, the single most important action on a surface
//   secondary - eucalyptus mist fill, supporting actions
//   ghost     - text only, tertiary actions ("Not now", "Clear filters")
// Every variant is at least 44pt tall. Do not restyle buttons at call sites.
type Variant = 'primary' | 'secondary' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  fullWidth?: boolean;
  haptic?: HapticIntent;
  disabled?: boolean;
  busy?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  fullWidth,
  haptic = haptics.navigate,
  disabled,
  busy,
  accessibilityLabel,
  accessibilityHint,
  style,
}: Props) {
  const labelColor =
    variant === 'primary' ? theme.colors.textOnPrimary : theme.colors.primaryDeep;
  return (
    <PressableScale
      onPress={onPress}
      haptic={haptic}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled, busy: !!busy }}
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={labelColor} /> : null}
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: 13,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.pill,
  },
  primary: {
    backgroundColor: theme.colors.primary,
    ...theme.shadow,
  },
  secondary: {
    backgroundColor: theme.colors.primaryMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderPrimarySubtle,
  },
  ghost: {
    paddingHorizontal: theme.spacing.md,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    ...theme.type.callout,
    fontWeight: '600',
  },
});
