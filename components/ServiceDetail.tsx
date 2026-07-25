import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { forwardRef, useMemo, useState } from 'react';
import { Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { catColor, catLabel, SOURCE_VINTAGE } from '../lib/constants';
import { formatDistance } from '../lib/geo';
import { openLink } from '../lib/links';
import { telUrl, webUrl } from '../lib/needs';
import { locationLabel, qualityLabel, readiness } from '../lib/readiness';
import { theme } from '../lib/theme';
import type { Service } from '../lib/types';

export type ServiceDetailHandle = BottomSheetModal;

type Props = {
  service: Service | null;
  distanceMeters?: number | null;
  onDismiss: () => void;
};

const SNAP_POINTS = ['42%', '92%'];

export const ServiceDetailSheet = forwardRef<ServiceDetailHandle, Props>(function ServiceDetailSheet(
  { service, distanceMeters, onDismiss },
  ref,
) {
  const snapPoints = useMemo(() => SNAP_POINTS, []);

  const renderBackdrop = useMemo(
    () =>
      function Backdrop(props: BottomSheetBackdropProps) {
        return (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.45}
            pressBehavior="close"
          />
        );
      },
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      onDismiss={onDismiss}
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.sheetBg}
      enableContentPanningGesture
      enableHandlePanningGesture
    >
      {service ? <ServiceDetailContent service={service} distanceMeters={distanceMeters} /> : null}
    </BottomSheetModal>
  );
});

function ServiceDetailContent({ service, distanceMeters }: { service: Service; distanceMeters?: number | null }) {
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
    openLink(url);
  };

  const shareService = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const address = [service.address, service.suburb, service.state, service.postcode]
      .filter(Boolean)
      .join(', ');
    const lines = [
      service.name,
      catLabel(service.category),
      address || null,
      service.phone ? `Phone: ${service.phone}` : null,
      service.website ? service.website : null,
      'Found with aosi, the Australian Open Services Index.',
    ].filter(Boolean);
    void Share.share({ message: lines.join('\n') });
  };

  return (
    <BottomSheetScrollView contentContainerStyle={styles.body}>
      <View style={[styles.heroBand, { backgroundColor: color + '14' }]}>
        <View style={[styles.heroIcon, { backgroundColor: color + '22', borderColor: color + '55' }]}>
          <Ionicons name="business-outline" size={30} color={color} />
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
              <Ionicons name="navigate-outline" size={12} color={theme.colors.accent} />
              <Text style={styles.distText}>{formatDistance(distanceMeters)} away</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        {service.phone ? (
          <ActionButton
            icon="call"
            label={`Call ${service.phone}`}
            primary
            fullWidth
            onPress={() => open(telUrl(service.phone!))}
          />
        ) : null}
        {directionsUrl ? (
          <ActionButton icon="navigate" label="Directions" onPress={() => open(directionsUrl)} />
        ) : null}
        {service.website ? (
          <ActionButton icon="globe" label="Website" onPress={() => open(webUrl(service.website))} />
        ) : null}
        {service.email ? (
          <ActionButton icon="mail" label="Email" onPress={() => open(`mailto:${service.email}`)} />
        ) : null}
        <ActionButton icon="share-outline" label="Share" onPress={shareService} />
      </View>

      {service.description ? <Description text={service.description} /> : null}

      <Section title="Location">
        <Field
          icon="location-outline"
          value={
            [service.address, service.suburb, service.state, service.postcode].filter(Boolean).join(', ') ||
            'Location not provided'
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

      <Section title="About this listing">
        <Text style={styles.trustText}>{trustSummary(service)}</Text>
        <View style={styles.trustRows}>
          <Row label="Record detail" value={qualityLabel(service.quality)} />
          <Row label="Map pin" value={locationLabel(service)} />
        </View>
        {service.source_license ? (
          <Text style={styles.sourceLicense}>License · {service.source_license}</Text>
        ) : null}
      </Section>
    </BottomSheetScrollView>
  );
}

const DESC_CLAMP_LINES = 4;

// Long government descriptions must not push the actions or hours below the
// fold; clamp and let the reader opt in. Clampability comes from the real
// rendered line count via an invisible unclamped copy, not a character guess.
function Description({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [clampable, setClampable] = useState(false);
  return (
    <View style={styles.descWrap}>
      <Text
        style={[styles.desc, styles.descMeasure]}
        onTextLayout={(e) => setClampable(e.nativeEvent.lines.length > DESC_CLAMP_LINES)}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {text}
      </Text>
      <Text style={styles.desc} numberOfLines={expanded ? undefined : DESC_CLAMP_LINES}>
        {text}
      </Text>
      {clampable ? (
        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            setExpanded((e) => !e);
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Show less of the description' : 'Read the full description'}
        >
          <Text style={styles.descToggle}>{expanded ? 'Show less' : 'Read more'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  primary,
  fullWidth,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  primary?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        primary ? styles.actionPrimary : styles.actionSecondary,
        fullWidth && styles.actionFullWidth,
        pressed && { opacity: 0.7 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={18} color={primary ? '#fff' : theme.colors.primaryDeep} />
      <Text
        style={[styles.actionLabel, primary ? styles.actionLabelPrimary : styles.actionLabelSecondary]}
        numberOfLines={1}
      >
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
  icon: keyof typeof Ionicons.glyphMap;
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

// One honest paragraph instead of a metadata table: where the record came
// from, how old it is, and what to do about it.
function trustSummary(s: Service): string {
  const org = s.source_organisation || s.source_name || s.source_id || 'an open government dataset';
  const vintage = SOURCE_VINTAGE[s.source_id];
  const agePart = vintage
    ? ` The data was last updated in ${vintage.label}, so details may have changed.`
    : ' Details may have changed since it was published.';
  return `This listing comes from ${org}.${agePart} Call ahead to check before visiting.`;
}

// Stale data gets caution amber, never danger red; red is reserved for 000.
function readyBg(k: 'ready' | 'verify' | 'low') {
  return {
    backgroundColor: k === 'ready' ? theme.colors.successMuted : theme.colors.warningMuted,
  };
}
function readyColor(k: 'ready' | 'verify' | 'low') {
  return {
    color: k === 'ready' ? theme.colors.successText : theme.colors.warningText,
  };
}
function readyDot(k: 'ready' | 'verify' | 'low') {
  return {
    backgroundColor: k === 'ready' ? theme.colors.success : theme.colors.warning,
  };
}

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: theme.colors.surfaceWarm,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
  },
  handleIndicator: { backgroundColor: theme.colors.borderStrong, width: 40, height: 5 },

  body: { paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.xxxl },
  heroBand: {
    marginHorizontal: -theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: theme.spacing.lg,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  name: { ...theme.type.title2, color: theme.colors.text, marginBottom: theme.spacing.sm },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: theme.radius.pill },
  badgeText: { ...theme.type.caption, color: '#fff' },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  readyText: { ...theme.type.caption },
  distChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
  },
  distText: { ...theme.type.caption, color: theme.colors.accentDeep },
  descWrap: { marginBottom: theme.spacing.xl },
  desc: { ...theme.type.body, color: theme.colors.textSecondary, lineHeight: 25 },
  descMeasure: { position: 'absolute', left: 0, right: 0, opacity: 0, zIndex: -1 },
  descToggle: { ...theme.type.callout, fontWeight: '600', color: theme.colors.primaryDeep, marginTop: 6 },

  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.xl },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: theme.radius.pill,
  },
  actionPrimary: { backgroundColor: theme.colors.primary, ...theme.shadow },
  actionSecondary: {
    backgroundColor: theme.colors.primaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(47,109,84,0.18)',
    flexGrow: 1,
    justifyContent: 'center',
  },
  actionFullWidth: { flexBasis: '100%', justifyContent: 'center' },
  actionLabel: { ...theme.type.callout, fontWeight: '600' },
  actionLabelPrimary: { color: '#fff' },
  actionLabelSecondary: { color: theme.colors.primaryDeep },

  section: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.type.caption,
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: theme.spacing.sm,
  },
  field: { flexDirection: 'row', gap: theme.spacing.md, paddingVertical: 6 },
  fieldLabel: { ...theme.type.caption, color: theme.colors.textSecondary, marginBottom: 1 },
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

  trustText: { ...theme.type.subhead, color: theme.colors.text, lineHeight: 21 },
  trustRows: { marginTop: theme.spacing.sm },
  sourceLicense: { ...theme.type.footnote, color: theme.colors.textTertiary, marginTop: theme.spacing.sm },
});
