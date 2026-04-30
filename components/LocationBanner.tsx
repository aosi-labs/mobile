import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../lib/theme';
import { PressableScale } from './PressableScale';

type Props = {
  hasLocation: boolean;
  placeLabel: string | null;
  onPress: () => void;
};

export function LocationBanner({ hasLocation, placeLabel, onPress }: Props) {
  return (
    <PressableScale
      onPress={onPress}
      style={styles.banner}
      accessibilityRole="button"
      accessibilityLabel={hasLocation ? `Near you, ${placeLabel ?? 'using your location'}` : 'Anywhere in Australia. Tap to use your location.'}
      accessibilityHint={hasLocation ? 'Tap to stop using your location' : 'Tap to grant location access'}
    >
      <View style={[styles.iconWrap, hasLocation ? styles.iconActive : styles.iconIdle]}>
        <Ionicons
          name={hasLocation ? 'navigate' : 'globe-outline'}
          size={14}
          color={hasLocation ? '#fff' : theme.colors.textSecondary}
        />
      </View>
      <View style={styles.text}>
        <Text style={styles.label}>{hasLocation ? 'Near you' : 'Anywhere in Australia'}</Text>
        <Text style={styles.value} numberOfLines={1}>
          {hasLocation ? placeLabel || 'Using your location' : 'Tap to use your location'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
    ...theme.shadow,
  },
  iconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconActive: { backgroundColor: theme.colors.primary },
  iconIdle: { backgroundColor: theme.colors.surfaceMuted },
  text: { flex: 1 },
  label: { ...theme.type.caption, color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { ...theme.type.headline, color: theme.colors.text, marginTop: 2 },
});
