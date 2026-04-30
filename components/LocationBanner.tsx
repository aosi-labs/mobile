import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import type { LocationSource } from '../hooks/useUserLocation';
import { theme } from '../lib/theme';
import { PressableScale } from './PressableScale';

type Props = {
  source: LocationSource | null;
  placeLabel: string | null;
  postcode: string | null;
  onPress: () => void;
};

export function LocationBanner({ source, placeLabel, postcode, onPress }: Props) {
  const hasLocation = source !== null;
  const iconName = source === 'gps' ? 'navigate' : source === 'postcode' ? 'location' : 'globe-outline';
  const label =
    source === 'gps' ? 'Near you'
    : source === 'postcode' ? `Near ${postcode}`
    : 'Anywhere in Australia';
  const value =
    source === 'gps' ? (placeLabel || 'Using your location')
    : source === 'postcode' ? (placeLabel || 'Using your postcode')
    : 'Tap to set your location';
  const a11yLabel =
    source === 'gps' ? `Near you, ${placeLabel ?? 'using your location'}`
    : source === 'postcode' ? `Near postcode ${postcode}, ${placeLabel ?? ''}`
    : 'Anywhere in Australia. Tap to set your location.';

  return (
    <PressableScale
      onPress={onPress}
      style={styles.banner}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityHint="Tap to change location settings"
    >
      <View style={[styles.iconWrap, hasLocation ? styles.iconActive : styles.iconIdle]}>
        <Ionicons
          name={iconName}
          size={14}
          color={hasLocation ? '#fff' : theme.colors.textSecondary}
        />
      </View>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value} numberOfLines={1}>
          {value}
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
