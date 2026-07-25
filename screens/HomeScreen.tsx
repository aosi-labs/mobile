import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  PixelRatio,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { EmuMark } from '../components/EmuMascot';
import { PressableScale } from '../components/PressableScale';
import { cardEntering } from '../lib/motion';
import { NEEDS, type Need } from '../lib/needs';
import { theme, tint } from '../lib/theme';
import type { UserLocationState } from '../hooks/useUserLocation';

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "You're up late";
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good arvo';
  return 'Good evening';
}

type Props = {
  location: UserLocationState;
  isSyncing: boolean;
  syncProgress: number;
  syncTotal: number | null;
  serviceCount: number;
  error: string | null;
  lastSynced: number | null;
  onPickNeed: (need: Need) => void;
  onSomethingElse: () => void;
  onLocationPress: () => void;
  onInfoPress: () => void;
  onCrisisPress: () => void;
  onRetry: () => void;
};

export function HomeScreen({
  location,
  isSyncing,
  syncProgress,
  syncTotal,
  serviceCount,
  error,
  lastSynced,
  onPickNeed,
  onSomethingElse,
  onLocationPress,
  onInfoPress,
  onCrisisPress,
  onRetry,
}: Props) {
  const locationLabel =
    location.placeLabel ??
    (location.postcode ? `Near ${location.postcode}` : null);

  // Low-vision users running large text get a single-column grid with
  // unclamped descriptions; "safety at home" must never truncate.
  const largeType = PixelRatio.getFontScale() > 1.4;

  // Only claim services are "saved" when a completed sync proves SQLite holds
  // them; partially streamed first-run rows live in memory only. Hedged
  // copy: we know the fetch failed, not that the person is offline.
  const offlineLine = error
    ? serviceCount > 0
      ? lastSynced
        ? `Can't reach the service list right now. Using services saved ${new Date(lastSynced).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'short',
          })}.`
        : "Can't reach the service list right now. Showing what loaded so far."
      : "Can't reach the service list right now. Crisis lines below still work."
    : null;

  useEffect(() => {
    if (offlineLine) AccessibilityInfo.announceForAccessibility(offlineLine);
  }, [offlineLine]);

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View style={styles.brandRow}>
            <View style={styles.brandBubble}>
              <EmuMark size={26} />
            </View>
            <Text style={styles.wordmark}>aosi</Text>
          </View>
          {/* The About button never disappears: a wary first-run user must be
              able to reach the privacy copy while the first sync runs. */}
          <View style={styles.topActions}>
            {isSyncing ? (
              <View
                style={styles.syncBadge}
                accessible
                accessibilityLabel={`Saving services to your phone${
                  syncProgress > 0 && syncTotal
                    ? `, ${syncProgress.toLocaleString()} of ${syncTotal.toLocaleString()}`
                    : ''
                }`}
                accessibilityLiveRegion="polite"
              >
                <ActivityIndicator size="small" color={theme.colors.primaryDeep} />
                {syncProgress > 0 ? (
                  <Text style={styles.syncText}>
                    {syncTotal
                      ? `${syncProgress.toLocaleString()} of ${syncTotal.toLocaleString()}`
                      : syncProgress.toLocaleString()}
                  </Text>
                ) : null}
              </View>
            ) : null}
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                onInfoPress();
              }}
              hitSlop={12}
              style={({ pressed }) => [styles.infoBtn, pressed && { opacity: theme.pressedOpacity }]}
              accessibilityRole="button"
              accessibilityLabel="About aosi"
              accessibilityHint="Opens information, privacy details, and source links"
            >
              <Ionicons name="information-circle-outline" size={22} color={theme.colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        <Text style={styles.greeting}>{timeGreeting()}</Text>
        <Text style={styles.title} accessibilityRole="header">
          What do you need{'\n'}help with?
        </Text>

        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            onLocationPress();
          }}
          style={({ pressed }) => [styles.locationRow, pressed && { opacity: theme.pressedOpacity }]}
          accessibilityRole="button"
          accessibilityLabel={locationLabel ? `Location: ${locationLabel}. Change location` : 'Set your location'}
        >
          <Ionicons
            name={locationLabel ? 'location' : 'location-outline'}
            size={15}
            color={theme.colors.primaryDeep}
          />
          <Text style={styles.locationText} numberOfLines={1}>
            {locationLabel ?? 'Set your location'}
          </Text>
          <Ionicons name="chevron-down" size={13} color={theme.colors.primaryDeep} />
        </Pressable>

        {offlineLine ? (
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              onRetry();
            }}
            style={({ pressed }) => [styles.offlineRow, pressed && { opacity: theme.pressedOpacity }]}
            accessibilityRole="button"
            accessibilityLabel={`${offlineLine} Tap to try again.`}
          >
            <Ionicons name="cloud-offline-outline" size={13} color={theme.colors.textSecondary} />
            <Text style={styles.offlineText}>
              {offlineLine} <Text style={styles.offlineRetry}>Tap to try again.</Text>
            </Text>
          </Pressable>
        ) : null}

        <View style={styles.grid}>
          {NEEDS.map((need, i) => (
            <Animated.View
              key={need.key}
              style={largeType ? styles.gridItemFull : styles.gridItem}
              entering={cardEntering(i)}
            >
              <NeedCard need={need} onPress={() => onPickNeed(need)} clampSub={!largeType} />
            </Animated.View>
          ))}
        </View>

        <PressableScale
          onPress={onSomethingElse}
          style={styles.elseCard}
          accessibilityRole="button"
          accessibilityLabel="Something else"
          accessibilityHint="Browse every type of service"
        >
          <View style={styles.elseIcon}>
            <Ionicons name="ellipsis-horizontal" size={18} color={theme.colors.textSecondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.elseLabel}>Something else</Text>
            <Text style={styles.elseSub}>Search and browse all services</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} />
        </PressableScale>
      </ScrollView>

      <View style={styles.crisisWrap}>
        <PressableScale
          onPress={onCrisisPress}
          scaleTo={0.98}
          haptic="light"
          style={styles.crisisBar}
          accessibilityRole="button"
          accessibilityLabel="Need to talk to someone right now? Free crisis lines, 24 hours a day"
        >
          <View style={styles.crisisIcon}>
            <Ionicons name="call" size={16} color={theme.colors.textOnPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.crisisTitle}>Need to talk to someone now?</Text>
            <Text style={styles.crisisSub}>Free crisis lines, 24 hours a day</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.accentDeep} />
        </PressableScale>
      </View>
    </SafeAreaView>
  );
}

function NeedCard({
  need,
  onPress,
  clampSub,
}: {
  need: Need;
  onPress: () => void;
  clampSub: boolean;
}) {
  return (
    <PressableScale
      onPress={onPress}
      style={styles.needCard}
      accessibilityRole="button"
      accessibilityLabel={need.label}
      accessibilityHint={need.sub}
    >
      <View style={[styles.needIcon, { backgroundColor: tint(need.color, 'faint') }]}>
        <Ionicons name={need.icon} size={20} color={need.color} />
      </View>
      <Text style={styles.needLabel}>{need.label}</Text>
      <Text style={styles.needSub} numberOfLines={clampSub ? 2 : undefined}>
        {need.sub}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  scroll: {
    paddingHorizontal: theme.layout.gutter,
    paddingBottom: theme.spacing.lg,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  brandBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surfaceWarm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: { ...theme.type.headline, color: theme.colors.text, letterSpacing: 0.5 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  infoBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: theme.colors.primaryMuted,
    borderRadius: theme.radius.pill,
  },
  syncText: { ...theme.type.caption, color: theme.colors.primaryDeep, fontVariant: ['tabular-nums'] },

  greeting: { ...theme.type.subhead, color: theme.colors.textSecondary, marginBottom: 4 },
  title: {
    ...theme.type.largeTitle,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },

  locationRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.primaryMuted,
    borderRadius: theme.radius.pill,
    marginBottom: theme.spacing.xl,
    maxWidth: '100%',
  },
  locationText: { ...theme.type.footnote, fontWeight: '600', color: theme.colors.primaryDeep, flexShrink: 1 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: theme.spacing.md,
  },
  gridItem: { width: '48.2%' },
  gridItemFull: { width: '100%' },
  needCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    minHeight: 122,
    ...theme.shadow,
  },
  needIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.tile,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  needLabel: { ...theme.type.headline, color: theme.colors.text, marginBottom: 2 },
  needSub: { ...theme.type.footnote, color: theme.colors.textSecondary },

  elseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.md,
    ...theme.shadow,
  },
  elseIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.tile,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  elseLabel: { ...theme.type.headline, color: theme.colors.text },
  elseSub: { ...theme.type.footnote, color: theme.colors.textSecondary, marginTop: 1 },

  offlineRow: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: -10,
    marginBottom: theme.spacing.sm,
  },
  offlineText: { ...theme.type.footnote, color: theme.colors.textSecondary, flex: 1 },
  offlineRetry: { fontWeight: '700', color: theme.colors.primaryDeep },

  crisisWrap: {
    paddingHorizontal: theme.layout.gutter,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  crisisBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.accentMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderAccentSubtle,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  crisisIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crisisTitle: { ...theme.type.subhead, fontWeight: '700', color: theme.colors.accentDeep },
  // Full accentDeep, no opacity hack: 5.03:1 on the ochre wash (AA).
  crisisSub: { ...theme.type.caption, fontWeight: '500', color: theme.colors.accentDeep, marginTop: 1 },
});
