import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../lib/theme';
import { Button } from './Button';
import { CrisisLink } from './CrisisLink';
import { EmuMascot } from './EmuMascot';

// The one empty/error state. onCrisisPress is REQUIRED: an empty screen is
// a high-distress moment, so the crisis door renders here structurally
// rather than by each screen remembering to add it.
type Props = {
  variant?: 'default' | 'searching' | 'concerned';
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  onCrisisPress: () => void;
};

export function EmptyState({
  variant = 'default',
  title,
  body,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  onCrisisPress,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.mascotFrame}>
        <EmuMascot size={72} variant={variant === 'default' ? undefined : variant} />
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
      {secondaryLabel && onSecondary ? (
        <Button
          label={secondaryLabel}
          onPress={onSecondary}
          variant="secondary"
          style={styles.secondary}
        />
      ) : null}
      <CrisisLink variant="bar" onPress={onCrisisPress} style={styles.crisis} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.xl,
  },
  mascotFrame: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: theme.colors.surfaceWarm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    ...theme.type.title3,
    color: theme.colors.text,
    textAlign: 'center',
  },
  body: {
    ...theme.type.subhead,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    maxWidth: 300,
  },
  action: {
    marginTop: theme.spacing.xl,
    minWidth: 220,
  },
  secondary: {
    marginTop: theme.spacing.md,
    minWidth: 220,
  },
  crisis: {
    marginTop: theme.spacing.xxl,
    alignSelf: 'stretch',
  },
});
