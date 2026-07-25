import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { forwardRef, useMemo, useState } from 'react';
import { Pressable, Share, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { catColor, catColorDeep, catLabel, SOURCE_VINTAGE } from '../lib/constants';
import { formatDistance } from '../lib/geo';
import { directionsUrl, openLink } from '../lib/links';
import { haptics } from '../lib/motion';
import { telUrl, webUrl } from '../lib/needs';
import { locationLabel, qualityLabel } from '../lib/readiness';
import { theme, tint } from '../lib/theme';
import type { Service } from '../lib/types';
import { Button } from './Button';
import { ReadinessPill } from './ReadinessPill';

export type ServiceDetailHandle = BottomSheetModal;

type Props = {
  service: Service | null;
  distanceMeters?: number | null;
  onDismiss: () => void;
};

export const ServiceDetailSheet = forwardRef<ServiceDetailHandle, Props>(function ServiceDetailSheet(
  { service, distanceMeters, onDismiss },
  ref,
) {
  // The first detent must keep the Call button above the fold. At large
  // Dynamic Type sizes 42% is not enough, so the detent grows with the font
  // scale (42% at scale 1, capped at 62%). useWindowDimensions re-renders
  // when iOS delivers a font-scale change, so this tracks Dynamic Type
  // changed mid-session rather than freezing at whatever it was on mount.
  const { fontScale } = useWindowDimensions();
  const snapPoints = useMemo(() => {
    const first = Math.min(42 + Math.max(0, fontScale - 1) * 35, 62);
    return [`${Math.round(first)}%`, '92%'];
  }, [fontScale]);

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
            accessible
            accessibilityRole="button"
            accessibilityLabel="Close details"
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

// VoiceOver containment for this sheet is handled in App.tsx by hiding the
// screen stack while a service is selected: the sheet renders in the
// bottom-sheet portal, so accessibilityViewIsModal here could not silence
// the screens behind it (the prop only affects sibling views).
function ServiceDetailContent({ service, distanceMeters }: { service: Service; distanceMeters?: number | null }) {
  const color = catColor(service.category);
  const deep = catColorDeep(service.category);
  const directions =
    service.latitude != null && service.longitude != null
      ? directionsUrl(service.latitude, service.longitude)
      : null;

  const shareService = () => {
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
      <View style={[styles.heroBand, { backgroundColor: tint(color, 'faint') }]}>
        <View
          style={[
            styles.heroIcon,
            { backgroundColor: tint(color, 'soft'), borderColor: tint(color, 'strong') },
          ]}
        >
          <Ionicons name="business-outline" size={30} color={color} />
        </View>
        <Text style={styles.name} accessibilityRole="header">
          {service.name}
        </Text>
        {/* One pill grammar in the hero: identical height and type,
            differentiated by fill only. Category text is deep-on-tint, never
            white on raw colour. */}
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: tint(color, 'soft') }]}>
            <Text style={[styles.badgeText, { color: deep }]}>{catLabel(service.category)}</Text>
          </View>
          <ReadinessPill service={service} />
          {distanceMeters != null ? (
            <View style={styles.distChip}>
              <Ionicons name="navigate-outline" size={11} color={theme.colors.accentDeep} />
              <Text style={styles.distText}>{formatDistance(distanceMeters)} away</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Call is the hero action, full width. Everything else is a tidy
          two-per-row grid instead of a ragged flex wrap. */}
      <View style={styles.actions}>
        {service.phone ? (
          <Button
            icon="call"
            label={`Call ${service.phone}`}
            haptic={haptics.call}
            fullWidth
            onPress={() => openLink(telUrl(service.phone!))}
          />
        ) : null}
        <View style={styles.actionGrid}>
          {directions ? (
            <Button
              icon="navigate"
              label="Directions"
              variant="secondary"
              haptic={haptics.call}
              style={styles.gridBtn}
              onPress={() => openLink(directions)}
            />
          ) : null}
          {service.website ? (
            <Button
              icon="globe"
              label="Website"
              variant="secondary"
              haptic={haptics.call}
              style={styles.gridBtn}
              onPress={() => openLink(webUrl(service.website))}
            />
          ) : null}
          {service.email ? (
            <Button
              icon="mail"
              label="Email"
              variant="secondary"
              haptic={haptics.call}
              style={styles.gridBtn}
              onPress={() => openLink(`mailto:${service.email}`)}
            />
          ) : null}
          <Button
            icon="share-outline"
            label="Share"
            variant="secondary"
            haptic={haptics.navigate}
            style={styles.gridBtn}
            onPress={shareService}
          />
        </View>
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
          hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
          style={styles.descToggleRow}
          accessibilityRole="button"
          accessibilityLabel={expanded ? 'Show less of the description' : 'Read the full description'}
        >
          <Text style={styles.descToggle}>{expanded ? 'Show less' : 'Read more'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
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
    borderBottomLeftRadius: theme.radius.xl,
    borderBottomRightRadius: theme.radius.xl,
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
  badges: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.radius.pill },
  badgeText: { ...theme.type.caption },
  distChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
  },
  distText: { ...theme.type.caption, color: theme.colors.accentDeep },

  descWrap: { marginBottom: theme.spacing.xl },
  desc: { ...theme.type.body, color: theme.colors.textSecondary },
  descMeasure: { position: 'absolute', left: 0, right: 0, opacity: 0, zIndex: -1 },
  descToggleRow: { minHeight: 32, justifyContent: 'center' },
  descToggle: { ...theme.type.callout, fontWeight: '600', color: theme.colors.primaryDeep, marginTop: 6 },

  actions: { gap: theme.spacing.sm, marginBottom: theme.spacing.xl },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  gridBtn: {
    flexBasis: '48%',
    flexGrow: 1,
    paddingHorizontal: theme.spacing.md,
  },

  section: {
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.type.eyebrow,
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.sm,
  },
  field: { flexDirection: 'row', gap: theme.spacing.md, paddingVertical: 6 },
  fieldLabel: { ...theme.type.caption, color: theme.colors.textSecondary, marginBottom: 1 },
  fieldValue: { ...theme.type.callout, color: theme.colors.text },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  rowLabel: { ...theme.type.subhead, color: theme.colors.textSecondary },
  rowValue: { ...theme.type.subhead, color: theme.colors.text, fontWeight: '500' },

  trustText: { ...theme.type.subhead, color: theme.colors.text },
  trustRows: { marginTop: theme.spacing.sm },
  sourceLicense: { ...theme.type.footnote, color: theme.colors.textTertiary, marginTop: theme.spacing.sm },
});
