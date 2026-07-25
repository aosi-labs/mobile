import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDistance } from '../lib/geo';
import { directionsUrl, openLink } from '../lib/links';
import { telUrl } from '../lib/needs';
import { readiness } from '../lib/readiness';
import { theme } from '../lib/theme';
import type { Service } from '../lib/types';
import { PressableScale } from './PressableScale';
import { ReadinessPill } from './ReadinessPill';

type Props = {
  rank: number;
  service: Service;
  distanceMeters: number | null;
  onPress: () => void;
};

export function ShortlistCard({ rank, service, distanceMeters, onPress }: Props) {
  const r = readiness(service);
  const suburb = [service.suburb, service.state].filter(Boolean).join(', ');

  const directions =
    service.latitude != null && service.longitude != null
      ? directionsUrl(service.latitude, service.longitude)
      : null;

  const open = (url: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openLink(url);
  };

  // A shortlist row that explains itself: a service with no coordinates is a
  // phone-first service, so say that instead of looking broken. Keyed on the
  // service's own geodata, NOT on a missing distance, which is also null for
  // every row when the person has set no location.
  const phoneOnly = !directions && !!service.phone;

  // The outer button flattens its subtree for VoiceOver; expose Call and
  // Directions as custom accessibility actions so they stay one gesture away.
  const a11yActions = [
    { name: 'activate' },
    ...(service.phone ? [{ name: 'call', label: `Call ${service.name}` }] : []),
    ...(directions ? [{ name: 'directions', label: 'Get directions' }] : []),
  ];

  return (
    <PressableScale
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`${rank}. ${service.name}${suburb ? `, ${suburb}` : ''}${
        distanceMeters != null ? `, ${formatDistance(distanceMeters)} away` : ''
      }${phoneOnly ? ', phone service' : ''}. ${r.label}${service.phone ? '. Has a phone number' : ''}`}
      accessibilityHint="Opens the service details. Swipe up or down for more actions."
      accessibilityActions={a11yActions}
      onAccessibilityAction={(e) => {
        const action = e.nativeEvent.actionName;
        if (action === 'call' && service.phone) open(telUrl(service.phone));
        else if (action === 'directions' && directions) open(directions);
        else onPress();
      }}
    >
      <View style={styles.topRow}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText} maxFontSizeMultiplier={1.4}>
            {rank}
          </Text>
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
        {phoneOnly ? (
          <View style={styles.phoneChip}>
            <Ionicons name="call-outline" size={11} color={theme.colors.textSecondary} />
            <Text style={styles.phoneChipText}>Phone service</Text>
          </View>
        ) : null}
        <ReadinessPill service={service} compact />
      </View>

      <View style={styles.actions}>
        {service.phone ? (
          <Pressable
            onPress={() => open(telUrl(service.phone!))}
            style={({ pressed }) => [styles.callBtn, pressed && { opacity: theme.pressedOpacity }]}
            accessibilityRole="button"
            accessibilityLabel={`Call ${service.name}`}
          >
            <Ionicons name="call" size={16} color={theme.colors.textOnPrimary} />
            <Text style={styles.callText}>Call</Text>
          </Pressable>
        ) : null}
        {directions ? (
          <Pressable
            onPress={() => open(directions)}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && { opacity: theme.pressedOpacity },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Directions to ${service.name}`}
          >
            <Ionicons name="navigate-outline" size={15} color={theme.colors.primaryDeep} />
            <Text style={styles.secondaryText}>Directions</Text>
          </Pressable>
        ) : null}
        {!service.phone && !directions ? (
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
  // minWidth/minHeight + pill radius so large Dynamic Type grows the badge
  // instead of clipping the numeral.
  rankBadge: {
    minWidth: 26,
    minHeight: 26,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 6,
    backgroundColor: theme.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  rankText: { ...theme.type.caption, color: theme.colors.primaryDeep, fontVariant: ['tabular-nums'] },
  name: { ...theme.type.headline, color: theme.colors.text, flex: 1 },
  // Footnote weight: the service name is the decision datum, distance
  // supports it. Ochre deep is the one text use of accent (key data).
  distance: {
    ...theme.type.footnote,
    fontWeight: '600',
    color: theme.colors.accentDeep,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: theme.spacing.md,
    rowGap: 4,
    marginTop: 6,
    marginLeft: 26 + 8,
  },
  metaText: { ...theme.type.footnote, color: theme.colors.textSecondary, flexShrink: 1 },
  phoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceMuted,
  },
  phoneChipText: { ...theme.type.caption, fontWeight: '500', color: theme.colors.textSecondary },

  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  // Flat inside the shadowed card (the card carries the elevation).
  callBtn: {
    flex: 1.2,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.radius.pill,
  },
  callText: { ...theme.type.callout, fontWeight: '700', color: theme.colors.textOnPrimary },
  secondaryBtn: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.primaryMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderPrimarySubtle,
    paddingVertical: 12,
    borderRadius: theme.radius.pill,
  },
  secondaryText: { ...theme.type.callout, fontWeight: '600', color: theme.colors.primaryDeep },
});
