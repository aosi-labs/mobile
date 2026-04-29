import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { catColor, catLabel } from '../lib/constants';
import { formatDistance } from '../lib/geo';
import { locationLabel, qualityLabel, readiness, serviceAgeLabel } from '../lib/readiness';
import { theme } from '../lib/theme';
import type { Service } from '../lib/types';

type Props = {
  service: Service | null;
  distanceMeters?: number | null;
  onClose: () => void;
};

export function ServiceDetail({ service, distanceMeters, onClose }: Props) {
  if (!service) return null;
  const r = readiness(service);
  const color = catColor(service.category);
  const directionsUrl =
    service.latitude && service.longitude
      ? Platform.OS === 'ios'
        ? `https://maps.apple.com/?daddr=${service.latitude},${service.longitude}`
        : `https://www.google.com/maps/dir/?api=1&destination=${service.latitude},${service.longitude}`
      : null;

  const open = (url: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    void Linking.openURL(url);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <View style={styles.handleBar} />
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              onClose();
            }}
            hitSlop={16}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          <View style={[styles.heroIcon, { backgroundColor: color + '1A' }]}>
            <Ionicons name="business-outline" size={28} color={color} />
          </View>
          <Text style={styles.name}>{service.name}</Text>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: color }]}>
              <Text style={styles.badgeText}>{catLabel(service.category)}</Text>
            </View>
            <View style={[styles.readyBadge, readyBg(r.key)]}>
              <View style={[styles.dot, readyDot(r.key)]} />
              <Text style={[styles.readyText, readyColor(r.key)]}>{r.label}</Text>
            </View>
            {distanceMeters != null ? (
              <View style={styles.distChip}>
                <Ionicons name="navigate-outline" size={12} color={theme.colors.primary} />
                <Text style={styles.distText}>{formatDistance(distanceMeters)} away</Text>
              </View>
            ) : null}
          </View>

          {service.description ? <Text style={styles.desc}>{service.description}</Text> : null}

          <View style={styles.actions}>
            {service.phone ? (
              <ActionButton
                icon="call"
                label="Call"
                primary
                onPress={() => open(`tel:${service.phone}`)}
              />
            ) : null}
            {directionsUrl ? (
              <ActionButton icon="navigate" label="Directions" onPress={() => open(directionsUrl)} />
            ) : null}
            {service.website ? (
              <ActionButton icon="globe" label="Website" onPress={() => open(service.website)} />
            ) : null}
            {service.email ? (
              <ActionButton icon="mail" label="Email" onPress={() => open(`mailto:${service.email}`)} />
            ) : null}
          </View>

          <Section title="Location">
            <Field
              icon="location-outline"
              value={
                [service.address, service.suburb, service.state, service.postcode]
                  .filter(Boolean)
                  .join(', ') || 'Location not provided'
              }
            />
          </Section>

          {(service.hours || service.eligibility || service.cost) && (
            <Section title="About this service">
              <Field icon="time-outline" label="Hours" value={service.hours} />
              <Field icon="people-outline" label="Who can use it" value={service.eligibility} />
              <Field icon="cash-outline" label="Cost" value={service.cost} />
            </Section>
          )}

          <Section title="Data quality">
            <Row label="Record" value={qualityLabel(service.quality)} />
            <Row label="Location" value={locationLabel(service)} />
            <Row label="Source age" value={serviceAgeLabel(service)} />
          </Section>

          <View style={styles.verifyNote}>
            <Ionicons name="warning-outline" size={14} color={theme.colors.warning} />
            <Text style={styles.verifyText}>
              Information may be out of date — call ahead before visiting.
            </Text>
          </View>

          <Section title="Source">
            <Text style={styles.sourceOrg}>
              {service.source_organisation || service.source_name || service.source_id}
            </Text>
            {service.source_license ? (
              <Text style={styles.sourceLicense}>License · {service.source_license}</Text>
            ) : null}
          </Section>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  primary,
}: {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        primary ? styles.actionPrimary : styles.actionSecondary,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Ionicons name={icon} size={18} color={primary ? '#fff' : theme.colors.primary} />
      <Text style={[styles.actionLabel, primary ? styles.actionLabelPrimary : styles.actionLabelSecondary]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  label?: string;
  value?: string;
}) {
  if (!value) return null;
  return (
    <View style={styles.field}>
      <Ionicons name={icon} size={16} color={theme.colors.textSecondary} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function readyBg(k: 'ready' | 'verify' | 'low') {
  return {
    backgroundColor:
      k === 'ready' ? theme.colors.successMuted : k === 'verify' ? theme.colors.warningMuted : theme.colors.dangerMuted,
  };
}
function readyColor(k: 'ready' | 'verify' | 'low') {
  return { color: k === 'ready' ? '#065F46' : k === 'verify' ? '#92400E' : '#991B1B' };
}
function readyDot(k: 'ready' | 'verify' | 'low') {
  return {
    backgroundColor: k === 'ready' ? theme.colors.success : k === 'verify' ? theme.colors.warning : theme.colors.danger,
  };
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.surface },
  header: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginBottom: theme.spacing.sm,
  },
  closeBtn: {
    position: 'absolute',
    right: theme.spacing.lg,
    top: theme.spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.xxxl },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  name: { ...theme.type.title2, color: theme.colors.text, marginBottom: theme.spacing.sm },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: theme.spacing.lg },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.radius.pill },
  badgeText: { ...theme.type.caption, color: '#fff', fontWeight: '600' },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  readyText: { ...theme.type.caption, fontWeight: '600' },
  distChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primaryMuted,
  },
  distText: { ...theme.type.caption, fontWeight: '600', color: theme.colors.primary },
  desc: { ...theme.type.body, color: theme.colors.textSecondary, lineHeight: 24, marginBottom: theme.spacing.xl },

  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.xl },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
  },
  actionPrimary: { backgroundColor: theme.colors.primary },
  actionSecondary: { backgroundColor: theme.colors.primaryMuted },
  actionLabel: { ...theme.type.callout, fontWeight: '600' },
  actionLabelPrimary: { color: '#fff' },
  actionLabelSecondary: { color: theme.colors.primary },

  section: { marginBottom: theme.spacing.xl },
  sectionTitle: {
    ...theme.type.caption,
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  field: { flexDirection: 'row', gap: theme.spacing.md, paddingVertical: 6 },
  fieldLabel: { ...theme.type.caption, color: theme.colors.textTertiary, marginBottom: 1 },
  fieldValue: { ...theme.type.callout, color: theme.colors.text, lineHeight: 22 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  rowLabel: { ...theme.type.subhead, color: theme.colors.textSecondary },
  rowValue: { ...theme.type.subhead, color: theme.colors.text, fontWeight: '500' },

  sourceOrg: { ...theme.type.callout, color: theme.colors.text },
  sourceLicense: { ...theme.type.footnote, color: theme.colors.textTertiary, marginTop: 4 },
  verifyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.warningMuted,
    borderRadius: theme.radius.sm,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  verifyText: { ...theme.type.caption, color: '#78350F', flex: 1, fontStyle: 'italic' },
});
