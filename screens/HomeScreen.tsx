import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';
import { EmuMark } from '../components/EmuMascot';
import { PressableScale } from '../components/PressableScale';
import { NEEDS, type Need } from '../lib/needs';
import { theme } from '../lib/theme';
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
}: Props) {
  const locationLabel =
    location.placeLabel ??
    (location.postcode ? `Near ${location.postcode}` : null);

  // Only claim services are "saved" when a completed sync proves SQLite holds
  // them; partially streamed first-run rows live in memory only.
  const offlineLine = error
    ? serviceCount > 0
      ? lastSynced
        ? `Offline. Using services saved ${new Date(lastSynced).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'short',
          })}.`
        : 'Offline. Showing what loaded so far, not yet saved to your phone.'
      : 'Offline. Crisis lines below still work.'
    : null;

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
          {isSyncing ? (
            <View style={styles.syncBadge}>
              <ActivityIndicator size="small" color={theme.colors.primaryDeep} />
              {syncProgress > 0 ? (
                <Text style={styles.syncText}>
                  {syncTotal
                    ? `${syncProgress.toLocaleString()} of ${syncTotal.toLocaleString()}`
                    : syncProgress.toLocaleString()}
                </Text>
              ) : null}
            </View>
          ) : (
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                onInfoPress();
              }}
              hitSlop={12}
              style={styles.infoBtn}
              accessibilityRole="button"
              accessibilityLabel="About aosi"
              accessibilityHint="Opens information, privacy details, and source links"
            >
              <Ionicons name="information-circle-outline" size={22} color={theme.colors.textSecondary} />
            </Pressable>
          )}
        </View>

        <Text style={styles.greeting}>{timeGreeting()}</Text>
        <Text style={styles.title}>What do you need{'\n'}help with?</Text>

        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            onLocationPress();
          }}
          style={({ pressed }) => [styles.locationRow, pressed && { opacity: 0.7 }]}
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
          <View style={styles.offlineRow}>
            <Ionicons name="cloud-offline-outline" size={13} color={theme.colors.textSecondary} />
            <Text style={styles.offlineText}>{offlineLine}</Text>
          </View>
        ) : null}

        <View style={styles.grid}>
          {NEEDS.map((need, i) => (
            <Animated.View
              key={need.key}
              style={styles.gridItem}
              entering={FadeInDown.delay(i * 40)
                .duration(320)
                .reduceMotion(ReduceMotion.System)}
            >
              <NeedCard need={need} onPress={() => onPickNeed(need)} />
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
          style={styles.crisisBar}
          accessibilityRole="button"
          accessibilityLabel="Need to talk to someone right now? Free crisis lines, 24 hours a day"
        >
          <View style={styles.crisisIcon}>
            <Ionicons name="call" size={16} color="#fff" />
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

function NeedCard({ need, onPress }: { need: Need; onPress: () => void }) {
  return (
    <PressableScale
      onPress={onPress}
      style={styles.needCard}
      accessibilityRole="button"
      accessibilityLabel={need.label}
      accessibilityHint={need.sub}
    >
      <View style={[styles.needIcon, { backgroundColor: need.color + '1C' }]}>
        <Ionicons name={need.icon} size={20} color={need.color} />
      </View>
      <Text style={styles.needLabel}>{need.label}</Text>
      <Text style={styles.needSub} numberOfLines={2}>
        {need.sub}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  scroll: {
    paddingHorizontal: theme.spacing.xl,
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
    backgroundColor: theme.colors.cream,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: { ...theme.type.headline, color: theme.colors.text, letterSpacing: 0.5 },
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
    fontSize: 32,
    lineHeight: 38,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },

  locationRow: {
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
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  needLabel: { ...theme.type.headline, color: theme.colors.text, marginBottom: 2 },
  needSub: { ...theme.type.footnote, color: theme.colors.textSecondary, lineHeight: 17 },

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
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  elseLabel: { ...theme.type.headline, color: theme.colors.text },
  elseSub: { ...theme.type.footnote, color: theme.colors.textSecondary, marginTop: 1 },

  offlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: -10,
    marginBottom: theme.spacing.lg,
  },
  offlineText: { ...theme.type.footnote, color: theme.colors.textSecondary },

  crisisWrap: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
  },
  crisisBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.accentMuted,
    borderWidth: 1,
    borderColor: 'rgba(217,119,66,0.30)',
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
  crisisSub: { ...theme.type.caption, fontWeight: '500', color: theme.colors.accentDeep, marginTop: 1, opacity: 0.85 },
});
