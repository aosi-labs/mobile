import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { Button } from '../components/Button';
import { CrisisLink } from '../components/CrisisLink';
import { EmptyState } from '../components/EmptyState';
import { ShortlistCard } from '../components/ShortlistCard';
import { SkeletonList } from '../components/SkeletonList';
import { openLink } from '../lib/links';
import { cardEntering } from '../lib/motion';
import { getCrisisNote, telUrl, type CrisisNote, type Need } from '../lib/needs';
import { lookupPostcode } from '../lib/postcodes';
import { rankServices, shortlist } from '../lib/rank';
import { theme, tint } from '../lib/theme';
import type { Service } from '../lib/types';
import type { UserLocationState } from '../hooks/useUserLocation';

const SHORTLIST_SIZE = 5;
const RANK_DEBOUNCE_MS = 2000;

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
  // While the first sync streams batches in, re-rank at most every 2s so the
  // top 5 doesn't reshuffle under the person's finger.
  const [stableServices, setStableServices] = useState(services);
  const lastRankAtRef = useRef(0);
  useEffect(() => {
    if (!isSyncing) {
      lastRankAtRef.current = Date.now();
      setStableServices(services);
      return;
    }
    const since = Date.now() - lastRankAtRef.current;
    if (since >= RANK_DEBOUNCE_MS) {
      lastRankAtRef.current = Date.now();
      setStableServices(services);
    } else {
      const t = setTimeout(() => {
        lastRankAtRef.current = Date.now();
        setStableServices(services);
      }, RANK_DEBOUNCE_MS - since);
      return () => clearTimeout(t);
    }
  }, [services, isSyncing]);

  const ranked = useMemo(
    () => rankServices(stableServices, { category: need.category, coords: location.coords }),
    [stableServices, need.category, location.coords],
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

  // Gate the skeleton on the SAME data the list renders from. Reading live
  // `services` here while the list reads debounced `stableServices` would
  // flash "No services found" for up to 2s on a first run: the first batch
  // lands, loading ends, but the debounce still holds an empty list. Telling
  // a distressed person nothing exists is the worst possible lie.
  const showLoading =
    isLoading || (stableServices.length === 0 && (isSyncing || services.length > 0));

  const placeLabel =
    location.placeLabel ?? (location.postcode ? `near ${location.postcode}` : null);
  // Honest, not salesy: "good options", never "best" on 2016-vintage data.
  const subtitle = location.coords
    ? `${Math.min(SHORTLIST_SIZE, total)} good options out of ${total.toLocaleString()} near you`
    : `${total.toLocaleString()} services from across Australia, phone lines first`;

  const loadingLine =
    isSyncing && syncProgress > 0
      ? syncTotal
        ? `Loading services, ${syncProgress.toLocaleString()} of ${syncTotal.toLocaleString()} so far`
        : `Loading services, ${syncProgress.toLocaleString()} so far`
      : `Finding ${need.label.toLowerCase()} services…`;

  // Announce arrival for screen-reader users; the cards appearing is silent.
  const announcedRef = useRef(false);
  useEffect(() => {
    if (!showLoading && top.length > 0 && !announcedRef.current) {
      announcedRef.current = true;
      AccessibilityInfo.announceForAccessibility(
        `${Math.min(SHORTLIST_SIZE, total)} services found`
      );
    }
  }, [showLoading, top.length, total]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            onBack();
          }}
          hitSlop={10}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: theme.pressedOpacity }]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={2} accessibilityRole="header">
            {need.label}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {location.coords && placeLabel ? `Near ${placeLabel.replace(/^near /i, '')}` : need.sub}
          </Text>
        </View>
        <View style={[styles.needBubble, { backgroundColor: tint(need.color, 'faint') }]}>
          <Ionicons name={need.icon} size={18} color={need.color} />
        </View>
      </View>

      {/* The need's own crisis line, where one exists, renders in EVERY
          state including loading and errors. The one moment we know someone
          may be in crisis must never hide the lifeline behind a gate.
          Needs without a state-specific note still get the crisis pill
          below, so every state on this screen has a door to a human. */}
      {crisisNote ? <CrisisNoteBanner note={crisisNote} /> : null}

      {showLoading ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>{loadingLine}</Text>
          <View style={styles.loadingList}>
            <SkeletonList count={SHORTLIST_SIZE} variant="shortlist" />
          </View>
          {!crisisNote ? (
            <CrisisLink variant="pill" onPress={onCrisisPress} style={styles.crisisFooter} />
          ) : null}
        </View>
      ) : total === 0 ? (
        <ScrollView contentContainerStyle={styles.emptyScroll} showsVerticalScrollIndicator={false}>
          <EmptyState
            variant="concerned"
            title={
              error && services.length === 0
                ? "Couldn't load services"
                : `No ${need.label.toLowerCase()} services found`
            }
            body={
              error && services.length === 0
                ? "Can't reach the service list right now. Crisis lines still work, and any services already saved to your phone are still here."
                : 'Try browsing all services instead, or check a nearby postcode.'
            }
            actionLabel={error && services.length === 0 ? 'Try again' : 'Browse all services'}
            onAction={error && services.length === 0 ? onRetry : onBrowseAll}
            secondaryLabel={error && services.length === 0 ? undefined : 'Change postcode'}
            onSecondary={error && services.length === 0 ? undefined : onEnterPostcode}
            onCrisisPress={onCrisisPress}
          />
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* The honesty line is the anti-overwhelm pitch; it reads like a
              statement, not a footnote. */}
          <Text style={styles.countLine}>{subtitle}</Text>
          {/* Say what the ranking actually did. Without coordinates there is
              no distance term at all, so claiming one would be a lie. */}
          <Text style={styles.rankExplainer}>
            {location.coords
              ? 'Sorted by distance and how sure we are the details still work.'
              : 'Phone lines you can call from anywhere first, then how sure we are the details still work.'}
          </Text>
          {isSyncing && top.length > 0 ? (
            <Text style={styles.stillLoading}>Still loading more services</Text>
          ) : null}

          {/* Help first, location second: the shortlist always renders. With
              no location it's phone-lines-first, and this card offers the
              upgrade without gating anything. */}
          {!location.coords && !skipped ? (
            <LocationUpgradeCard
              isRequesting={location.status === 'requesting'}
              wasDenied={location.status === 'denied'}
              wasUnavailable={location.status === 'unavailable'}
              onUseGps={() => void location.request()}
              onOpenSettings={() => void Linking.openSettings()}
              onEnterPostcode={onEnterPostcode}
              onNotNow={() => onSkipChange(true)}
            />
          ) : null}
          {!location.coords && skipped ? (
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                onSkipChange(false);
              }}
              style={({ pressed }) => [
                styles.setLocationTop,
                pressed && { opacity: theme.pressedOpacity },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Set a location to see services near you"
            >
              <Ionicons name="location-outline" size={15} color={theme.colors.primaryDeep} />
              <Text style={styles.setLocationTopText}>Set a location to see services near you</Text>
              <Ionicons name="chevron-forward" size={13} color={theme.colors.primaryDeep} />
            </Pressable>
          ) : null}

          {top.map((item, i) => (
            <Animated.View key={item.service.id} entering={cardEntering(i)}>
              <ShortlistCard
                rank={i + 1}
                service={item.service}
                distanceMeters={item.distance}
                onPress={() => onOpenDetail(item.service, item.distance)}
              />
            </Animated.View>
          ))}

          {total > SHORTLIST_SIZE ? (
            <Button
              label={`See all ${total.toLocaleString()} services`}
              icon="arrow-forward"
              variant="secondary"
              onPress={onSeeAll}
              accessibilityLabel={`See all ${total.toLocaleString()} ${need.label} services`}
              style={styles.seeAllBtn}
            />
          ) : null}

          <CrisisLink variant="pill" onPress={onCrisisPress} style={styles.crisisFooter} />
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
          <Ionicons name="call" size={14} color={theme.colors.textOnPrimary} />
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

function LocationUpgradeCard({
  isRequesting,
  wasDenied,
  wasUnavailable,
  onUseGps,
  onOpenSettings,
  onEnterPostcode,
  onNotNow,
}: {
  isRequesting: boolean;
  wasDenied: boolean;
  wasUnavailable: boolean;
  onUseGps: () => void;
  onOpenSettings: () => void;
  onEnterPostcode: () => void;
  onNotNow: () => void;
}) {
  // After a GPS failure the postcode path gets the primary emphasis. A
  // denied permission is a dead end for re-requesting (iOS won't re-prompt),
  // so the GPS button honestly becomes a Settings link, never a fake retry.
  const postcodeFirst = wasUnavailable || wasDenied;

  const gpsButton = wasDenied ? (
    <Button
      icon="settings-outline"
      label="Turn on location in Settings"
      variant={postcodeFirst ? 'secondary' : 'primary'}
      onPress={onOpenSettings}
      accessibilityHint="Opens the iOS Settings app"
    />
  ) : (
    <Button
      icon="navigate"
      label={
        isRequesting ? 'Finding you…' : wasUnavailable ? 'Try my location again' : 'Use my location'
      }
      variant={postcodeFirst ? 'secondary' : 'primary'}
      haptic="medium"
      onPress={onUseGps}
      disabled={isRequesting}
      busy={isRequesting}
      accessibilityLabel={isRequesting ? 'Requesting your location' : undefined}
    />
  );

  const postcodeButton = (
    <Button
      icon="location-outline"
      label="Enter a postcode"
      variant={postcodeFirst ? 'primary' : 'secondary'}
      onPress={onEnterPostcode}
    />
  );

  return (
    <View style={styles.upgradeCard}>
      <View style={styles.upgradeHeader}>
        <View style={styles.upgradeIcon}>
          <Ionicons name="location" size={16} color={theme.colors.primaryDeep} />
        </View>
        <Text style={styles.upgradeTitle}>See what's near you</Text>
      </View>
      {wasDenied ? (
        <Text style={styles.upgradeNotice}>
          Location is switched off for aosi. No worries, a postcode works just as well.
        </Text>
      ) : null}
      {wasUnavailable ? (
        <Text style={styles.upgradeNotice}>
          We could not get a GPS fix here. A postcode works just as well.
        </Text>
      ) : null}
      <View style={styles.upgradeActions}>
        {postcodeFirst ? postcodeButton : gpsButton}
        {postcodeFirst ? gpsButton : postcodeButton}
        <Button label="Not now" variant="ghost" onPress={onNotNow} />
      </View>
      <Text style={styles.upgradePrivacy}>
        Used once to sort by distance. Your location stays on your phone and is never shared.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.layout.gutter,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    borderRadius: theme.radius.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { paddingHorizontal: theme.layout.gutter, paddingBottom: theme.spacing.xxxl },
  countLine: {
    ...theme.type.subhead,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 2,
  },
  rankExplainer: {
    ...theme.type.footnote,
    color: theme.colors.textSecondary,
    marginTop: 2,
    marginLeft: 2,
    marginBottom: theme.spacing.md,
  },
  stillLoading: {
    ...theme.type.footnote,
    color: theme.colors.textTertiary,
    marginLeft: 2,
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },

  crisisNoteWrap: {
    paddingHorizontal: theme.layout.gutter,
    paddingBottom: theme.spacing.md,
  },
  crisisNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.accentMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderAccentSubtle,
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
  crisisNoteText: { ...theme.type.subhead, color: theme.colors.accentDeep },
  crisisNotePhone: { ...theme.type.subhead, fontWeight: '700', color: theme.colors.accentDeep, marginTop: 3 },

  upgradeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadow,
  },
  upgradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  upgradeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeTitle: { ...theme.type.headline, color: theme.colors.text },
  upgradeNotice: {
    ...theme.type.footnote,
    color: theme.colors.warningText,
    backgroundColor: theme.colors.warningMuted,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  upgradeActions: { gap: theme.spacing.sm },
  upgradePrivacy: {
    ...theme.type.footnote,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.md,
  },

  setLocationTop: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: theme.colors.primaryMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderPrimarySubtle,
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

  seeAllBtn: { marginTop: theme.spacing.xs },
  crisisFooter: { marginTop: theme.spacing.md, alignSelf: 'center' },

  loadingWrap: { flex: 1, paddingTop: theme.spacing.sm },
  loadingText: {
    ...theme.type.footnote,
    color: theme.colors.textSecondary,
    marginLeft: theme.layout.gutter + 2,
    marginBottom: 2,
  },
  loadingList: { paddingHorizontal: theme.layout.gutter },

  emptyScroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: theme.layout.gutter },
});
