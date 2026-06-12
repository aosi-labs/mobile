import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { catColor, catLabel } from '../lib/constants';
import { formatDistance } from '../lib/geo';
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
      accessibilityLabel={`${service.name}, ${catLabel(service.category)}, ${location || 'location unknown'}`}
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
          {service.phone ? (
            <View style={styles.tag}>
              <Ionicons name="call-outline" size={11} color={theme.colors.textSecondary} />
              <Text style={styles.tagText}>Phone</Text>
            </View>
          ) : null}
          {service.website ? (
            <View style={styles.tag}>
              <Ionicons name="globe-outline" size={11} color={theme.colors.textSecondary} />
              <Text style={styles.tagText}>Web</Text>
            </View>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
    </PressableScale>
  );
}

function ReadyPill({ kind, label }: { kind: 'ready' | 'verify' | 'low'; label: string }) {
  const bg =
    kind === 'ready' ? theme.colors.successMuted : kind === 'verify' ? theme.colors.warningMuted : theme.colors.dangerMuted;
  const fg =
    kind === 'ready' ? theme.colors.successText : kind === 'verify' ? theme.colors.warningText : theme.colors.dangerText;
  const dot =
    kind === 'ready' ? theme.colors.success : kind === 'verify' ? theme.colors.warning : theme.colors.danger;
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
  distance: { ...theme.type.caption, color: theme.colors.accent, marginTop: 2 },
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
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.pill,
  },
  tagText: { ...theme.type.caption, color: theme.colors.textSecondary },
});
