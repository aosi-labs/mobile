import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { catColor, catLabel } from '../lib/constants';
import { formatDistance } from '../lib/geo';
import { openLink } from '../lib/links';
import { telUrl } from '../lib/needs';
import { readiness } from '../lib/readiness';
import { theme } from '../lib/theme';
import type { Service } from '../lib/types';
import { PressableScale } from './PressableScale';

const CATEGORY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  food: 'fast-food-outline',
  housing: 'home-outline',
  health: 'medkit-outline',
  mental_health: 'heart-outline',
  legal: 'document-text-outline',
  employment: 'briefcase-outline',
  education: 'school-outline',
  disability: 'accessibility-outline',
  family: 'people-outline',
  community: 'people-circle-outline',
  financial: 'wallet-outline',
  alcohol_drugs: 'flask-outline',
  information: 'information-circle-outline',
  transport: 'bus-outline',
  personal_care: 'hand-left-outline',
  technology: 'laptop-outline',
  other: 'ellipsis-horizontal-circle-outline',
};

type Props = {
  service: Service;
  distanceMeters?: number | null;
  onPress: () => void;
};

export function ServiceCard({ service, distanceMeters, onPress }: Props) {
  const r = readiness(service);
  const color = catColor(service.category);
  const icon = CATEGORY_ICON[service.category] || 'ellipsis-horizontal-circle-outline';
  const location = [service.suburb, service.state].filter(Boolean).join(', ');

  return (
    <PressableScale
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${service.name}, ${catLabel(service.category)}, ${location || 'location unknown'}. ${r.label}`}
      accessibilityHint="Opens the service details"
    >
      <View style={[styles.rail, { backgroundColor: color }]} />
      <View style={[styles.iconWrap, { backgroundColor: color + '1A' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={2}>
            {service.name}
          </Text>
          {distanceMeters != null ? (
            <Text style={styles.distance}>{formatDistance(distanceMeters)}</Text>
          ) : null}
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaText} numberOfLines={1}>
            {catLabel(service.category)}
            {location ? ` · ${location}` : ''}
          </Text>
        </View>
        <View style={styles.tagRow}>
          <ReadyPill kind={r.key} label={r.label} />
        </View>
      </View>
      {service.phone ? (
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            openLink(telUrl(service.phone!));
          }}
          hitSlop={8}
          style={({ pressed }) => [styles.callBtn, pressed && { opacity: 0.75 }]}
          accessibilityRole="button"
          accessibilityLabel={`Call ${service.name}`}
        >
          <Ionicons name="call" size={17} color="#fff" />
        </Pressable>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
      )}
    </PressableScale>
  );
}

function ReadyPill({ kind, label }: { kind: 'ready' | 'verify' | 'low'; label: string }) {
  // Stale data gets caution amber, never danger red; red is reserved for 000.
  const bg = kind === 'ready' ? theme.colors.successMuted : theme.colors.warningMuted;
  const fg = kind === 'ready' ? theme.colors.successText : theme.colors.warningText;
  const dot = kind === 'ready' ? theme.colors.success : theme.colors.warning;
  return (
    <View style={[styles.readyPill, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={[styles.readyLabel, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadow,
  },
  rail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm },
  name: { ...theme.type.headline, color: theme.colors.text, flex: 1 },
  distance: {
    ...theme.type.footnote,
    fontWeight: '700',
    color: theme.colors.accentDeep,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  metaRow: { marginTop: 2 },
  metaText: { ...theme.type.footnote, color: theme.colors.textSecondary },
  tagRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  readyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
  },
  readyLabel: { ...theme.type.caption },
  callBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadow,
  },
});
