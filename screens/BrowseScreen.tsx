import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import MapView, { Marker, type Region } from 'react-native-maps';
import { Button } from '../components/Button';
import { CategoryMarker } from '../components/CategoryMarker';
import { CrisisLink } from '../components/CrisisLink';
import { EmptyState } from '../components/EmptyState';
import { IntentStrip } from '../components/IntentStrip';
import { ServiceCard } from '../components/ServiceCard';
import { SkeletonList } from '../components/SkeletonList';
import { distanceMetres } from '../lib/geo';
import { cardEntering, MOTION } from '../lib/motion';
import { needByKey } from '../lib/needs';
import { theme } from '../lib/theme';
import type { Service } from '../lib/types';
import type { UserLocationState } from '../hooks/useUserLocation';

const INITIAL_REGION: Region = {
  latitude: -28.5,
  longitude: 134,
  latitudeDelta: 40,
  longitudeDelta: 40,
};
const NEAR_REGION_DELTA = 1.0;
const MAX_MARKERS = 400;
const LIST_PAGE = 200;
const ENTRANCE_COUNT = 12;

type ViewMode = 'list' | 'map';

type Props = {
  services: Service[];
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  location: UserLocationState;
  initialCategory: string | null;
  onBack: () => void;
  onOpenDetail: (service: Service, distance: number | null) => void;
  onLocationPress: () => void;
  onCrisisPress: () => void;
};

export function BrowseScreen({
  services,
  isLoading,
  isSyncing,
  error,
  refresh,
  location,
  initialCategory,
  onBack,
  onOpenDetail,
  onLocationPress,
  onCrisisPress,
}: Props) {
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  // Chips emit category keys; a need key from Results maps through its need.
  const [activeCategory, setActiveCategory] = useState<string | null>(
    initialCategory ? needByKey(initialCategory)?.category ?? initialCategory : null,
  );
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [listLimit, setListLimit] = useState(LIST_PAGE);
  // Pull-to-refresh spinner tracks the user's own pull, never the automatic
  // background sync.
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  // The map mounts on first use, then stays mounted so toggling never
  // cold-starts MapView again (region and scroll position both survive).
  const [mapMounted, setMapMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQuery(searchInput.trim()), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setListLimit(LIST_PAGE);
  }, [query, activeCategory]);

  // The list owns keyboardDismissMode, so once it is faded out the keyboard
  // would sit over the bottom half of the map with no way to dismiss it.
  const mapProgress = useSharedValue(0);
  useEffect(() => {
    if (viewMode === 'map') {
      setMapMounted(true);
      Keyboard.dismiss();
    }
    mapProgress.value = withTiming(viewMode === 'map' ? 1 : 0, {
      duration: MOTION.crossfade,
      reduceMotion: ReduceMotion.System,
    });
  }, [viewMode, mapProgress]);

  // Entrance choreography belongs to the first load only. renderItem re-runs
  // on every cell mount, so without this the top rows re-stagger whenever
  // they scroll back into the virtualization window or a filter changes.
  const entranceDone = useRef(false);
  useEffect(() => {
    const t = setTimeout(
      () => {
        entranceDone.current = true;
      },
      (ENTRANCE_COUNT - 1) * MOTION.stagger + MOTION.entrance,
    );
    return () => clearTimeout(t);
  }, []);
  const listLayerStyle = useAnimatedStyle(() => ({ opacity: 1 - mapProgress.value }));
  const mapLayerStyle = useAnimatedStyle(() => ({ opacity: mapProgress.value }));

  // One lowercase haystack per service, built once per dataset, so typing
  // doesn't re-lowercase five fields across 24.5k records per keystroke.
  const haystacks = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of services) {
      m.set(
        s.id,
        `${s.name || ''} ${s.description || ''} ${s.suburb || ''} ${s.address || ''} ${s.postcode || ''}`.toLowerCase(),
      );
    }
    return m;
  }, [services]);

  // Tokenised AND search: "food bank sydney" matches records containing all
  // three words anywhere, not the exact phrase.
  const filtered = useMemo(() => {
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    return services.filter((s) => {
      if (activeCategory && s.category !== activeCategory) return false;
      if (tokens.length === 0) return true;
      const hay = haystacks.get(s.id) ?? '';
      return tokens.every((t) => hay.includes(t));
    });
  }, [services, query, activeCategory, haystacks]);

  const ranked = useMemo(() => {
    if (!location.coords) return filtered.map((s) => ({ service: s, distance: null as number | null }));
    const { latitude, longitude } = location.coords;
    return filtered
      .map((s) => {
        const d =
          s.latitude != null && s.longitude != null
            ? distanceMetres(latitude, longitude, s.latitude, s.longitude)
            : Number.POSITIVE_INFINITY;
        return { service: s, distance: Number.isFinite(d) ? d : null };
      })
      .sort((a, b) => {
        const da = a.distance ?? Number.POSITIVE_INFINITY;
        const db = b.distance ?? Number.POSITIVE_INFINITY;
        return da - db;
      });
  }, [filtered, location.coords]);

  const geocoded = useMemo(
    () => ranked.filter(({ service: s }) => s.latitude != null && s.longitude != null),
    [ranked],
  );
  const mapMarkers = useMemo(() => geocoded.slice(0, MAX_MARKERS), [geocoded]);
  const pinless = filtered.length - geocoded.length;

  const mapRegion = useMemo<Region>(() => {
    if (location.coords) {
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: NEAR_REGION_DELTA,
        longitudeDelta: NEAR_REGION_DELTA,
      };
    }
    return INITIAL_REGION;
  }, [location.coords]);

  const locationLabel =
    location.placeLabel ?? (location.postcode ? `Near ${location.postcode}` : 'Set location');

  const onPullRefresh = async () => {
    setIsPullRefreshing(true);
    try {
      await refresh();
    } finally {
      setIsPullRefreshing(false);
    }
  };

  const showSkeleton = isLoading || (services.length === 0 && isSyncing);

  const openMarker = (s: Service) => {
    void Haptics.selectionAsync();
    const dist =
      location.coords && s.latitude != null && s.longitude != null
        ? distanceMetres(
            location.coords.latitude,
            location.coords.longitude,
            s.latitude,
            s.longitude,
          )
        : null;
    onOpenDetail(s, dist);
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <View style={styles.searchRow}>
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
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={17} color={theme.colors.textTertiary} />
            <TextInput
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder="Search services, suburb, postcode"
              placeholderTextColor={theme.colors.textTertiary}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
              accessibilityLabel="Search services, suburb or postcode"
            />
          </View>
        </View>

        <IntentStrip active={activeCategory} onChange={setActiveCategory} />

        <View style={styles.metaRow}>
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              onLocationPress();
            }}
            style={({ pressed }) => [styles.locationChip, pressed && { opacity: theme.pressedOpacity }]}
            accessibilityRole="button"
            accessibilityLabel={`Location: ${locationLabel}. Change location`}
          >
            <Ionicons name="location" size={12} color={theme.colors.primaryDeep} />
            <Text style={styles.locationChipText} numberOfLines={1}>
              {locationLabel}
            </Text>
            <Ionicons name="chevron-down" size={11} color={theme.colors.primaryDeep} />
          </Pressable>
          <CrisisLink variant="pill" label="Crisis lines" onPress={onCrisisPress} style={styles.crisisPill} />
          <View style={styles.viewToggle}>
            <ToggleBtn
              icon="list"
              label="List view"
              active={viewMode === 'list'}
              onPress={() => setViewMode('list')}
            />
            <ToggleBtn
              icon="map"
              label="Map view"
              active={viewMode === 'map'}
              onPress={() => setViewMode('map')}
            />
          </View>
        </View>
      </View>

      <View style={styles.bodyWrap}>
        <Animated.View
          style={[styles.listLayer, listLayerStyle]}
          pointerEvents={viewMode === 'list' ? 'auto' : 'none'}
          accessibilityElementsHidden={viewMode !== 'list'}
          importantForAccessibility={viewMode === 'list' ? 'auto' : 'no-hide-descendants'}
        >
          <FlatList
            style={styles.listBody}
            data={ranked.slice(0, listLimit)}
            keyExtractor={(item) => item.service.id}
            renderItem={({ item, index }) => (
              <Animated.View
                entering={
                  !entranceDone.current && index < ENTRANCE_COUNT ? cardEntering(index) : undefined
                }
              >
                <ServiceCard
                  service={item.service}
                  distanceMeters={item.distance}
                  onPress={() => onOpenDetail(item.service, item.distance)}
                />
              </Animated.View>
            )}
            // No "0 services" headline above pulsing skeletons: while we are
            // still finding services, saying zero reads as "nothing exists".
            ListHeaderComponent={
              showSkeleton ? null : (
                <Text style={styles.countText} accessibilityLiveRegion="polite">
                  {filtered.length.toLocaleString()} {filtered.length === 1 ? 'service' : 'services'}
                </Text>
              )
            }
            ListEmptyComponent={
              showSkeleton ? (
                <SkeletonList />
              ) : (
                <EmptyState
                  variant={error && services.length === 0 ? 'concerned' : 'searching'}
                  title={
                    error && services.length === 0
                      ? "Couldn't load services"
                      : query || activeCategory
                        ? 'No matches'
                        : 'No services'
                  }
                  body={
                    error && services.length === 0
                      ? "Can't reach the service list right now. Crisis lines still work, and any services already saved to your phone are still here."
                      : query || activeCategory
                        ? 'No worries. Try a different word, or clear the filters and start fresh.'
                        : 'Pull down to refresh.'
                  }
                  actionLabel={
                    error && services.length === 0
                      ? 'Try again'
                      : query || activeCategory
                        ? 'Clear filters'
                        : undefined
                  }
                  onAction={
                    error && services.length === 0
                      ? () => void refresh()
                      : query || activeCategory
                        ? () => {
                            setSearchInput('');
                            setActiveCategory(null);
                          }
                        : undefined
                  }
                  onCrisisPress={onCrisisPress}
                />
              )
            }
            ListFooterComponent={
              ranked.length > listLimit ? (
                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    Showing the {location.coords ? 'closest' : 'first'} {listLimit.toLocaleString()} of{' '}
                    {ranked.length.toLocaleString()}.{' '}
                    {query
                      ? 'Try a more specific search.'
                      : 'Set a location or search to narrow this down.'}
                  </Text>
                  <Button
                    label={`Show ${LIST_PAGE} more`}
                    variant="secondary"
                    onPress={() => setListLimit((n) => n + LIST_PAGE)}
                    style={styles.showMoreBtn}
                  />
                </View>
              ) : (
                <View style={{ height: 24 }} />
              )
            }
            refreshControl={
              <RefreshControl
                refreshing={isPullRefreshing}
                onRefresh={() => void onPullRefresh()}
                tintColor={theme.colors.primary}
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          />
        </Animated.View>

        {mapMounted ? (
          <Animated.View
            style={[StyleSheet.absoluteFill, mapLayerStyle]}
            pointerEvents={viewMode === 'map' ? 'auto' : 'none'}
            accessibilityElementsHidden={viewMode !== 'map'}
            importantForAccessibility={viewMode === 'map' ? 'auto' : 'no-hide-descendants'}
          >
            <MapView
              style={StyleSheet.absoluteFill}
              initialRegion={mapRegion}
              showsUserLocation={location.status === 'granted' && location.source === 'gps'}
            >
              {mapMarkers.map(({ service: s }) => (
                <Marker
                  key={s.id}
                  coordinate={{ latitude: s.latitude!, longitude: s.longitude! }}
                  tracksViewChanges={false}
                  anchor={{ x: 0.5, y: 0.5 }}
                  onPress={() => openMarker(s)}
                >
                  {/* Honest pins: postcode-centroid guesses render as dashed
                      rings, not confident dots. */}
                  <CategoryMarker category={s.category} precision={s.location_precision} />
                </Marker>
              ))}
            </MapView>
            {geocoded.length > MAX_MARKERS || pinless > 0 ? (
              <View style={styles.zoomHint}>
                <Ionicons name="information-circle" size={14} color={theme.colors.textOnPrimary} />
                <Text style={styles.zoomHintText}>
                  {geocoded.length > MAX_MARKERS
                    ? `Showing the ${location.coords ? 'closest' : 'first'} ${MAX_MARKERS} of ${geocoded.length.toLocaleString()} pins. `
                    : ''}
                  {pinless > 0
                    ? `${pinless.toLocaleString()} ${pinless === 1 ? 'service has' : 'services have'} no map pin. See the list.`
                    : ''}
                </Text>
              </View>
            ) : null}
          </Animated.View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function ToggleBtn({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        styles.toggleBtn,
        active && styles.toggleBtnActive,
        pressed && { opacity: theme.pressedOpacity },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
    >
      <Ionicons
        name={icon}
        size={16}
        color={active ? theme.colors.textOnPrimary : theme.colors.textSecondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },

  header: {
    backgroundColor: theme.colors.bg,
    paddingBottom: theme.spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.borderStrong,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.layout.gutter,
    paddingTop: theme.spacing.sm,
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
  searchWrap: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 11,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: { flex: 1, ...theme.type.callout, color: theme.colors.text, padding: 0 },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.layout.gutter,
    paddingBottom: theme.spacing.sm,
  },
  locationChip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: theme.colors.primaryMuted,
    borderRadius: theme.radius.pill,
    flex: 1,
  },
  locationChipText: { ...theme.type.caption, color: theme.colors.primaryDeep, flexShrink: 1 },
  // The crisis pill keeps its intrinsic width; the location chip (which
  // truncates) absorbs the slack. Reversed, the pill's label overflows into
  // its neighbours on a 375pt screen.
  crisisPill: { flexShrink: 0, paddingHorizontal: 10 },
  countText: {
    ...theme.type.footnote,
    color: theme.colors.textSecondary,
    paddingHorizontal: theme.layout.gutter,
    paddingBottom: theme.spacing.sm,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    minWidth: 44,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
  },
  toggleBtnActive: { backgroundColor: theme.colors.primary },

  bodyWrap: { flex: 1 },
  listLayer: { flex: 1 },
  listBody: { flex: 1 },
  listContent: { paddingTop: theme.spacing.sm, paddingBottom: 32 },
  zoomHint: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: theme.colors.scrim,
    borderRadius: theme.radius.pill,
    maxWidth: '86%',
  },
  zoomHintText: { ...theme.type.caption, color: theme.colors.textOnPrimary, flexShrink: 1 },

  footer: { padding: theme.spacing.lg, alignItems: 'center' },
  footerText: {
    ...theme.type.footnote,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  showMoreBtn: { minWidth: 200 },
});
