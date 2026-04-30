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
          <ReadyDot kind={r.key} />
          <Text style={styles.readyLabel}>{r.label}</Text>
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

function ReadyDot({ kind }: { kind: 'ready' | 'verify' | 'low' }) {
  const color =
    kind === 'ready' ? theme.colors.success : kind === 'verify' ? theme.colors.warning : theme.colors.danger;
  return <View style={[styles.dot, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.md,
    ...theme.shadow,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm },
  name: { ...theme.type.headline, color: theme.colors.text, flex: 1 },
  distance: { ...theme.type.caption, color: theme.colors.primary, marginTop: 2 },
  metaRow: { marginTop: 2 },
  metaText: { ...theme.type.footnote, color: theme.colors.textSecondary },
  tagRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  readyLabel: { ...theme.type.caption, color: theme.colors.textSecondary, marginLeft: -4 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.sm,
  },
  tagText: { ...theme.type.caption, color: theme.colors.textSecondary },
});
