import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMemo } from 'react';
import {
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';
import { EmuMascot } from '../components/EmuMascot';
import { ShortlistCard } from '../components/ShortlistCard';
import { SkeletonList } from '../components/SkeletonList';
import { openLink } from '../lib/links';
import { getCrisisNote, telUrl, type CrisisNote, type Need } from '../lib/needs';
import { lookupPostcode } from '../lib/postcodes';
import { rankServices, shortlist } from '../lib/rank';
import { theme } from '../lib/theme';
import type { Service } from '../lib/types';
import type { UserLocationState } from '../hooks/useUserLocation';

const SHORTLIST_SIZE = 5;

type Props = {
  need: Need;
  services: Service[];
  isLoading: boolean;
  isSyncing: boolean;
  syncProgress: number;
  syncTotal: number | null;
  error: string | null;
  location: UserLocationState;
  skipped: boolean;
  onSkipChange: (skipped: boolean) => void;
  onBack: () => void;
  onOpenDetail: (service: Service, distance: number | null) => void;
  onSeeAll: () => void;
  onBrowseAll: () => void;
  onCrisisPress: () => void;
  onEnterPostcode: () => void;
  onRetry: () => void;
};

export function ResultsScreen({
  need,
  services,
  isLoading,
  isSyncing,
  syncProgress,
  syncTotal,
  error,
  location,
  skipped,
  onSkipChange,
  onBack,
  onOpenDetail,
  onSeeAll,
  onBrowseAll,
  onCrisisPress,
  onEnterPostcode,
  onRetry,
}: Props) {
  const ranked = useMemo(
    () => rankServices(services, { category: need.category, coords: location.coords }),
    [services, need.category, location.coords],
  );
  const top = useMemo(() => shortlist(ranked, SHORTLIST_SIZE), [ranked]);
  const total = ranked.length;

  // Housing crisis lines are state-specific. The hook resolves the state for
  // both GPS (reverse geocode) and postcode users; the postcode lookup covers
  // storage hydrated before `state` existed. No banner beats a wrong number.
  const userState =
    location.state ??
    (location.postcode ? lookupPostcode(location.postcode)?.state ?? null : null);
  const crisisNote = getCrisisNote(need, userState);

  const needsLocationStep = !location.coords && !skipped;
  const showLoading = isLoading || (services.length === 0 && isSyncing);

  const placeLabel =
    location.placeLabel ?? (location.postcode ? `near ${location.postcode}` : null);
  const subtitle = location.coords
    ? `The best ${Math.min(SHORTLIST_SIZE, total)} of ${total.toLocaleString()} services near you`
    : `${total.toLocaleString()} services from across Australia, phone lines first`;

  const loadingLine =
    isSyncing && syncProgress > 0
      ? syncTotal
        ? `Loading services, ${syncProgress.toLocaleString()} of ${syncTotal.toLocaleString()} so far`
        : `Loading services, ${syncProgress.toLocaleString()} so far`
      : `Finding ${need.label.toLowerCase()} services…`;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            onBack();
          }}
          hitSlop={10}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {need.label}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {location.coords && placeLabel ? `Near ${placeLabel.replace(/^near /i, '')}` : need.sub}
          </Text>
        </View>
        <View style={[styles.needBubble, { backgroundColor: need.color + '1C' }]}>
          <Ionicons name={need.icon} size={18} color={need.color} />
        </View>
      </View>

      {/* The crisis note renders in EVERY state, including the location step
          and errors. The one moment we know someone may be in crisis must
          never hide the lifeline behind a gate. */}
      {crisisNote ? <CrisisNoteBanner note={crisisNote} /> : null}

      {needsLocationStep ? (
        <LocationStep
          isRequesting={location.status === 'requesting'}
          wasDenied={location.status === 'denied'}
          wasUnavailable={location.status === 'unavailable'}
          onUseGps={() => void location.request()}
          onEnterPostcode={onEnterPostcode}
          onSkip={() => onSkipChange(true)}
        />
      ) : showLoading ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>{loadingLine}</Text>
          <SkeletonList count={SHORTLIST_SIZE} />
        </View>
      ) : total === 0 ? (
        <EmptyResults
          hasError={!!error && services.length === 0}
          needLabel={need.label}
          onBrowseAll={onBrowseAll}
          onRetry={onRetry}
          onCrisisPress={onCrisisPress}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={styles.countLine}>{subtitle}</Text>

          {!location.coords ? (
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                onSkipChange(false);
              }}
              style={({ pressed }) => [styles.setLocationTop, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel="Set a location to see services near you"
            >
              <Ionicons name="location-outline" size={15} color={theme.colors.primaryDeep} />
              <Text style={styles.setLocationTopText}>Set a location to see services near you</Text>
              <Ionicons name="chevron-forward" size={13} color={theme.colors.primaryDeep} />
            </Pressable>
          ) : null}

          {top.map((item, i) => (
            <Animated.View
              key={item.service.id}
              entering={FadeInDown.delay(i * 55)
                .duration(320)
                .reduceMotion(ReduceMotion.System)}
            >
              <ShortlistCard
                rank={i + 1}
                service={item.service}
                distanceMeters={item.distance}
                onPress={() => onOpenDetail(item.service, item.distance)}
              />
            </Animated.View>
          ))}

          {total > SHORTLIST_SIZE ? (
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                onSeeAll();
              }}
              style={({ pressed }) => [styles.seeAllBtn, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel={`See all ${total.toLocaleString()} ${need.label} services`}
            >
              <Text style={styles.seeAllText}>
                See all {total.toLocaleString()} services
              </Text>
              <Ionicons name="arrow-forward" size={15} color={theme.colors.primaryDeep} />
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              onCrisisPress();
            }}
            style={({ pressed }) => [styles.crisisLink, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Urgent? Free 24/7 crisis lines"
          >
            <Text style={styles.crisisLinkText}>Urgent? Free 24/7 crisis lines</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function CrisisNoteBanner({ note }: { note: CrisisNote }) {
  return (
    <View style={styles.crisisNoteWrap}>
      <Pressable
        onPress={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          openLink(telUrl(note.phone));
        }}
        style={({ pressed }) => [styles.crisisNote, pressed && { opacity: 0.8 }]}
        accessibilityRole="button"
        accessibilityLabel={`${note.text} Call ${note.label} on ${note.phone}`}
      >
        <View style={styles.crisisNoteIcon}>
          <Ionicons name="call" size={14} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.crisisNoteText}>{note.text}</Text>
          <Text style={styles.crisisNotePhone}>
            {note.label} · {note.phone}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

function LocationStep({
  isRequesting,
  wasDenied,
  wasUnavailable,
  onUseGps,
  onEnterPostcode,
  onSkip,
}: {
  isRequesting: boolean;
  wasDenied: boolean;
  wasUnavailable: boolean;
  onUseGps: () => void;
  onEnterPostcode: () => void;
  onSkip: () => void;
}) {
  // After a GPS failure the postcode path gets the primary emphasis; GPS
  // stays available as a retry but stops being the suggested next step.
  const postcodeFirst = wasUnavailable;

  const gpsButton = (
    <Pressable
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onUseGps();
      }}
      disabled={isRequesting}
      style={({ pressed }) => [
        postcodeFirst ? styles.locAlt : styles.locPrimary,
        pressed && { opacity: 0.8 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={isRequesting ? 'Requesting your location' : 'Use my location'}
      accessibilityState={{ disabled: isRequesting, busy: isRequesting }}
    >
      <Ionicons
        name="navigate"
        size={17}
        color={postcodeFirst ? theme.colors.primaryDeep : '#fff'}
      />
      <Text style={postcodeFirst ? styles.locAltText : styles.locPrimaryText}>
        {isRequesting ? 'Finding you…' : postcodeFirst ? 'Try my location again' : 'Use my location'}
      </Text>
    </Pressable>
  );

  const postcodeButton = (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onEnterPostcode();
      }}
      style={({ pressed }) => [
        postcodeFirst ? styles.locPrimary : styles.locAlt,
        pressed && { opacity: 0.8 },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Enter a postcode"
    >
      <Ionicons
        name="location-outline"
        size={17}
        color={postcodeFirst ? '#fff' : theme.colors.primaryDeep}
      />
      <Text style={postcodeFirst ? styles.locPrimaryText : styles.locAltText}>
        Enter a postcode
      </Text>
    </Pressable>
  );

  return (
    <ScrollView
      contentContainerStyle={styles.locStep}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.locMascot}>
        <EmuMascot size={110} variant="searching" />
      </View>
      <Text style={styles.locTitle}>Where should we look?</Text>
      <Text style={styles.locBody}>
        We use this once, to sort services by distance. It stays on your phone and is never shared.
      </Text>
      {wasDenied ? (
        <>
          <Text style={styles.locNotice}>
            Location is switched off for aosi. No worries, a postcode works just as well.
          </Text>
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              void Linking.openSettings();
            }}
            style={({ pressed }) => [styles.locSettings, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel="Open Settings to allow location"
          >
            <Text style={styles.locSettingsText}>Open Settings</Text>
          </Pressable>
        </>
      ) : null}
      {wasUnavailable ? (
        <Text style={styles.locNotice}>
          We could not get a GPS fix here. A postcode works just as well.
        </Text>
      ) : null}
      <View style={styles.locActions}>
        {postcodeFirst ? postcodeButton : gpsButton}
        {postcodeFirst ? gpsButton : postcodeButton}
        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            onSkip();
          }}
          style={({ pressed }) => [styles.locSkip, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Show services from anywhere"
        >
          <Text style={styles.locSkipText}>Show services from anywhere</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function EmptyResults({
  hasError,
  needLabel,
  onBrowseAll,
  onRetry,
  onCrisisPress,
}: {
  hasError: boolean;
  needLabel: string;
  onBrowseAll: () => void;
  onRetry: () => void;
  onCrisisPress: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.empty} showsVerticalScrollIndicator={false}>
      <View style={styles.emptyMascot}>
        <EmuMascot size={120} variant="concerned" />
      </View>
      <Text style={styles.emptyTitle}>
        {hasError ? "Couldn't load services" : `No ${needLabel.toLowerCase()} services found`}
      </Text>
      <Text style={styles.emptyBody}>
        {hasError
          ? 'You might be offline. Crisis lines still work, and any services already saved to your phone are still here.'
          : 'Try browsing all services instead, or check a nearby postcode.'}
      </Text>
      <Pressable
        onPress={hasError ? onRetry : onBrowseAll}
        style={({ pressed }) => [styles.emptyBtn, pressed && { opacity: 0.8 }]}
        accessibilityRole="button"
        accessibilityLabel={hasError ? 'Retry' : 'Browse all services'}
      >
        <Text style={styles.emptyBtnText}>{hasError ? 'Retry' : 'Browse all services'}</Text>
      </Pressable>
      <Pressable
        onPress={() => {
          void Haptics.selectionAsync();
          onCrisisPress();
        }}
        style={({ pressed }) => [styles.crisisLink, pressed && { opacity: 0.7 }]}
        accessibilityRole="button"
        accessibilityLabel="Urgent? Free 24/7 crisis lines"
      >
        <Text style={styles.crisisLinkText}>Urgent? Free 24/7 crisis lines</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...theme.type.title2, color: theme.colors.text },
  subtitle: { ...theme.type.footnote, color: theme.colors.textSecondary, marginTop: 1 },
  needBubble: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxxl },
  countLine: {
    ...theme.type.footnote,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    marginLeft: 2,
  },

  crisisNoteWrap: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  crisisNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.accentMuted,
    borderWidth: 1,
    borderColor: 'rgba(217,119,66,0.30)',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
  },
  crisisNoteIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crisisNoteText: { ...theme.type.subhead, color: theme.colors.accentDeep, lineHeight: 20 },
  crisisNotePhone: { ...theme.type.subhead, fontWeight: '700', color: theme.colors.accentDeep, marginTop: 3 },

  setLocationTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: theme.colors.primaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(47,109,84,0.18)',
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 13,
    marginBottom: theme.spacing.md,
  },
  setLocationTopText: {
    ...theme.type.footnote,
    fontWeight: '600',
    color: theme.colors.primaryDeep,
    flex: 1,
  },

  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: theme.colors.primaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(47,109,84,0.18)',
    paddingVertical: 14,
    borderRadius: theme.radius.pill,
    marginTop: theme.spacing.xs,
  },
  seeAllText: { ...theme.type.callout, fontWeight: '600', color: theme.colors.primaryDeep },

  crisisLink: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    marginTop: theme.spacing.xs,
  },
  crisisLinkText: { ...theme.type.footnote, fontWeight: '600', color: theme.colors.accentDeep },

  loadingWrap: { flex: 1, paddingTop: theme.spacing.sm },
  loadingText: {
    ...theme.type.footnote,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.lg + 2,
    marginBottom: 2,
  },

  locStep: { flex: 1, alignItems: 'center', paddingHorizontal: theme.spacing.xxl, paddingTop: theme.spacing.xl },
  locMascot: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: theme.colors.cream,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  locTitle: { ...theme.type.title2, color: theme.colors.text, textAlign: 'center', marginBottom: theme.spacing.sm },
  locBody: {
    ...theme.type.subhead,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: theme.spacing.md,
  },
  locNotice: {
    ...theme.type.footnote,
    color: theme.colors.warningText,
    backgroundColor: theme.colors.warningMuted,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    textAlign: 'center',
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  locSettings: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  locSettingsText: { ...theme.type.footnote, fontWeight: '700', color: theme.colors.primaryDeep },
  locActions: { alignSelf: 'stretch', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  locPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    borderRadius: theme.radius.pill,
    ...theme.shadowLifted,
  },
  locPrimaryText: { ...theme.type.headline, color: '#fff' },
  locAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    paddingVertical: 15,
    borderRadius: theme.radius.pill,
  },
  locAltText: { ...theme.type.headline, color: theme.colors.primaryDeep },
  locSkip: { alignItems: 'center', paddingVertical: theme.spacing.md },
  locSkipText: { ...theme.type.callout, color: theme.colors.textSecondary },

  empty: { flex: 1, alignItems: 'center', paddingHorizontal: theme.spacing.xxl, paddingTop: theme.spacing.xxl },
  emptyMascot: {
    width: 156,
    height: 156,
    borderRadius: 78,
    backgroundColor: theme.colors.cream,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: { ...theme.type.title3, color: theme.colors.text, textAlign: 'center', marginBottom: 4 },
  emptyBody: {
    ...theme.type.subhead,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: theme.spacing.lg,
  },
  emptyBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.radius.pill,
  },
  emptyBtnText: { ...theme.type.callout, color: '#fff', fontWeight: '600' },
});
