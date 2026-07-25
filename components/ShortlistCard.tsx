import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDistance } from '../lib/geo';
import { openLink } from '../lib/links';
import { telUrl } from '../lib/needs';
import { readiness, type Readiness } from '../lib/readiness';
import { theme } from '../lib/theme';
import type { Service } from '../lib/types';
import { PressableScale } from './PressableScale';

// Stale data gets caution amber, not danger red: the honest message is
// "call first", never "avoid". Red is reserved for the 000 card.
function readinessDot(r: Readiness): string {
  if (r.key === 'ready') return theme.colors.success;
  return theme.colors.warning;
}

type Props = {
  rank: number;
  service: Service;
  distanceMeters: number | null;
  onPress: () => void;
};

export function ShortlistCard({ rank, service, distanceMeters, onPress }: Props) {
  const r = readiness(service);
  const suburb = [service.suburb, service.state].filter(Boolean).join(', ');

  const directionsUrl =
    service.latitude && service.longitude
      ? Platform.OS === 'ios'
        ? `https://maps.apple.com/?daddr=${service.latitude},${service.longitude}`
        : `https://www.google.com/maps/dir/?api=1&destination=${service.latitude},${service.longitude}`
      : null;

  const open = (url: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openLink(url);
  };

  return (
    <PressableScale
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`${rank}. ${service.name}${suburb ? `, ${suburb}` : ''}${
        distanceMeters != null ? `, ${formatDistance(distanceMeters)} away` : ''
      }. ${r.label}`}
      accessibilityHint="Opens the service details"
    >
      <View style={styles.topRow}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{rank}</Text>
        </View>
        <Text style={styles.name} numberOfLines={2}>
          {service.name}
        </Text>
        {distanceMeters != null ? (
          <Text style={styles.distance}>{formatDistance(distanceMeters)}</Text>
        ) : null}
      </View>

      <View style={styles.metaRow}>
        {suburb ? (
          <Text style={styles.metaText} numberOfLines={1}>
            {suburb}
          </Text>
        ) : null}
        <View style={styles.readyRow}>
          <View style={[styles.dot, { backgroundColor: readinessDot(r) }]} />
          <Text style={styles.readyText}>{r.label}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {service.phone ? (
          <Pressable
            onPress={() => open(telUrl(service.phone!))}
            style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.8 }]}
            accessibilityRole="button"
            accessibilityLabel={`Call ${service.name}`}
          >
            <Ionicons name="call" size={16} color="#fff" />
            <Text style={styles.callText}>Call</Text>
          </Pressable>
        ) : null}
        {directionsUrl ? (
          <Pressable
            onPress={() => open(directionsUrl)}
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel={`Directions to ${service.name}`}
          >
            <Ionicons name="navigate-outline" size={15} color={theme.colors.primaryDeep} />
            <Text style={styles.secondaryText}>Directions</Text>
          </Pressable>
        ) : null}
        {!service.phone && !directionsUrl ? (
          <View style={[styles.secondaryBtn, { flex: 1 }]}>
            <Text style={styles.secondaryText}>See details</Text>
          </View>
        ) : null}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadow,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  rankText: { ...theme.type.caption, color: theme.colors.primaryDeep, fontVariant: ['tabular-nums'] },
  name: { ...theme.type.headline, color: theme.colors.text, flex: 1 },
  distance: {
    ...theme.type.subhead,
    fontWeight: '700',
    color: theme.colors.accentDeep,
    fontVariant: ['tabular-nums'],
    marginTop: 1,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: theme.spacing.md,
    rowGap: 2,
    marginTop: 6,
    marginLeft: 26 + 8,
  },
  metaText: { ...theme.type.footnote, color: theme.colors.textSecondary, flexShrink: 1 },
  readyRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  readyText: { ...theme.type.footnote, color: theme.colors.textSecondary },

  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  callBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.radius.pill,
  },
  callText: { ...theme.type.callout, fontWeight: '700', color: '#fff' },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.primaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(47,109,84,0.18)',
    paddingVertical: 12,
    borderRadius: theme.radius.pill,
  },
  secondaryText: { ...theme.type.callout, fontWeight: '600', color: theme.colors.primaryDeep },
});
