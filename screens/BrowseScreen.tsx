import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';
import MapView, { Marker, type Region } from 'react-native-maps';
import { EmuMascot } from '../components/EmuMascot';
import { IntentStrip } from '../components/IntentStrip';
import { ServiceCard } from '../components/ServiceCard';
import { SkeletonList } from '../components/SkeletonList';
import { catColor } from '../lib/constants';
import { distanceMetres } from '../lib/geo';
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
const LIST_LIMIT = 200;
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
  const [activeIntent, setActiveIntent] = useState<string | null>(initialCategory);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    const t = setTimeout(() => setQuery(searchInput.trim()), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const intentCategory = useMemo(
    () => (activeIntent ? needByKey(activeIntent)?.category ?? null : null),
    [activeIntent],
  );

  const filtered = useMemo(() => {
    const needle = query.toLowerCase();
    return services.filter((s) => {
      if (intentCategory && s.category !== intentCategory) return false;
      if (!needle) return true;
      return (
        (s.name || '').toLowerCase().includes(needle) ||
        (s.description || '').toLowerCase().includes(needle) ||
        (s.suburb || '').toLowerCase().includes(needle) ||
        (s.address || '').toLowerCase().includes(needle) ||
        (s.postcode || '').toLowerCase().includes(needle)
      );
    });
  }, [services, query, intentCategory]);

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

  const mapMarkers = useMemo(() => {
    const out: Service[] = [];
    for (const { service: s } of ranked) {
      if (s.latitude == null || s.longitude == null) continue;
      out.push(s);
      if (out.length >= MAX_MARKERS) break;
    }
    return out;
  }, [ranked]);

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
            style={styles.backBtn}
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

        <IntentStrip active={activeIntent} onChange={setActiveIntent} />

        <View style={styles.metaRow}>
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              onLocationPress();
            }}
            style={({ pressed }) => [styles.locationChip, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel={`Location: ${locationLabel}. Change location`}
          >
            <Ionicons name="location" size={12} color={theme.colors.primaryDeep} />
            <Text style={styles.locationChipText} numberOfLines={1}>
              {locationLabel}
            </Text>
            <Ionicons name="chevron-down" size={11} color={theme.colors.primaryDeep} />
          </Pressable>
          <Text style={styles.countText}>
            {filtered.length.toLocaleString()} {filtered.length === 1 ? 'service' : 'services'}
          </Text>
          <View style={styles.viewToggle}>
            <ToggleBtn
              icon="list"
              label="List"
              active={viewMode === 'list'}
              onPress={() => {
                void Haptics.selectionAsync();
                setViewMode('list');
              }}
            />
            <ToggleBtn
              icon="map"
              label="Map"
              active={viewMode === 'map'}
              onPress={() => {
                void Haptics.selectionAsync();
                setViewMode('map');
              }}
            />
          </View>
        </View>

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
      </View>

      {viewMode === 'map' ? (
        <View style={styles.mapBody}>
          <MapView
            style={StyleSheet.absoluteFill}
            initialRegion={mapRegion}
            showsUserLocation={location.status === 'granted' && location.source === 'gps'}
          >
            {mapMarkers.map((s) => (
              <Marker
                key={s.id}
                coordinate={{ latitude: s.latitude!, longitude: s.longitude! }}
                pinColor={catColor(s.category)}
                title={s.name}
                description={s.suburb}
                onPress={() => {
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
                }}
              />
            ))}
          </MapView>
          {filtered.length > MAX_MARKERS ? (
            <View style={styles.zoomHint}>
              <Ionicons name="information-circle" size={14} color="#fff" />
              <Text style={styles.zoomHintText}>
                Showing the {location.coords ? 'closest' : 'first'} {MAX_MARKERS} of{' '}
                {filtered.length.toLocaleString()}, refine your search
              </Text>
            </View>
          ) : null}
        </View>
      ) : (
        <FlatList
          style={styles.listBody}
          data={ranked.slice(0, LIST_LIMIT)}
          keyExtractor={(item) => item.service.id}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={
                index < ENTRANCE_COUNT
                  ? FadeInDown.delay(index * 45).reduceMotion(ReduceMotion.System)
                  : undefined
              }
            >
              <ServiceCard
                service={item.service}
                distanceMeters={item.distance}
                onPress={() => onOpenDetail(item.service, item.distance)}
              />
            </Animated.View>
          )}
          ListEmptyComponent={
            isLoading || (services.length === 0 && isSyncing) ? (
              <SkeletonList />
            ) : (
              <EmptyState
                hasError={!!error && services.length === 0}
                hasFilters={!!searchInput || !!activeIntent}
                onClear={() => {
                  setSearchInput('');
                  setActiveIntent(null);
                }}
                onRetry={() => void refresh()}
                onCrisisPress={onCrisisPress}
              />
            )
          }
          ListFooterComponent={
            ranked.length > LIST_LIMIT ? (
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Showing the {location.coords ? 'closest' : 'first'} {LIST_LIMIT} of{' '}
                  {ranked.length.toLocaleString()}, refine your search.
                </Text>
              </View>
            ) : (
              <View style={{ height: 24 }} />
            )
          }
          refreshControl={
            <RefreshControl refreshing={isSyncing} onRefresh={() => void refresh()} tintColor={theme.colors.primary} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      )}
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
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.toggleBtn, active && styles.toggleBtnActive, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityLabel={`${label} view`}
      accessibilityState={{ selected: active }}
    >
      <Ionicons name={icon} size={14} color={active ? '#fff' : theme.colors.textSecondary} />
      <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function EmptyState({
  hasError,
  hasFilters,
  onClear,
  onRetry,
  onCrisisPress,
}: {
  hasError: boolean;
  hasFilters: boolean;
  onClear: () => void;
  onRetry: () => void;
  onCrisisPress: () => void;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyMascot}>
        <EmuMascot size={130} variant={hasError ? 'concerned' : 'searching'} />
      </View>
      <Text style={styles.emptyTitle}>
        {hasError ? "Couldn't load services" : hasFilters ? 'Nothing here yet' : 'No services'}
      </Text>
      <Text style={styles.emptyBody}>
        {hasError
          ? 'You might be offline. Crisis lines still work, and any services already saved to your phone are still here.'
          : hasFilters
          ? 'No worries. Try a different word, or clear the filters and start fresh.'
          : 'Pull down to refresh.'}
      </Text>
      {hasError ? (
        <Pressable style={styles.emptyBtn} onPress={onRetry}>
          <Text style={styles.emptyBtnText}>Retry</Text>
        </Pressable>
      ) : hasFilters ? (
        <Pressable style={styles.emptyBtn} onPress={onClear}>
          <Text style={styles.emptyBtnText}>Clear filters</Text>
        </Pressable>
      ) : null}
      {hasError ? (
        <Pressable
          onPress={() => {
            void Haptics.selectionAsync();
            onCrisisPress();
          }}
          style={({ pressed }) => [styles.emptyCrisisLink, pressed && { opacity: 0.7 }]}
          accessibilityRole="button"
          accessibilityLabel="Urgent? Free 24/7 crisis lines"
        >
          <Text style={styles.crisisLinkText}>Urgent? Free 24/7 crisis lines</Text>
        </Pressable>
      ) : null}
    </View>
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
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flex: 1,
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
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: theme.colors.primaryMuted,
    borderRadius: theme.radius.pill,
    flexShrink: 1,
  },
  locationChipText: { ...theme.type.caption, color: theme.colors.primaryDeep, flexShrink: 1 },
  countText: { ...theme.type.footnote, color: theme.colors.textSecondary, flex: 1 },
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
  },
  toggleBtnActive: { backgroundColor: theme.colors.primary },
  toggleLabel: { ...theme.type.caption, color: theme.colors.textSecondary },
  toggleLabelActive: { color: '#fff' },

  mapBody: { flex: 1, position: 'relative' },
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
    backgroundColor: 'rgba(43,38,32,0.88)',
    borderRadius: theme.radius.pill,
    maxWidth: '86%',
  },
  zoomHintText: { ...theme.type.caption, color: '#fff', flexShrink: 1 },

  empty: { padding: theme.spacing.xxxl, alignItems: 'center' },
  emptyMascot: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: theme.colors.cream,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: { ...theme.type.title3, color: theme.colors.text, marginBottom: 4 },
  emptyBody: {
    ...theme.type.subhead,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.radius.pill,
  },
  emptyBtnText: { ...theme.type.callout, color: '#fff', fontWeight: '600' },

  footer: { padding: theme.spacing.lg, alignItems: 'center' },
  footerText: { ...theme.type.footnote, color: theme.colors.textSecondary, textAlign: 'center' },

  crisisLink: { alignItems: 'center', justifyContent: 'center', minHeight: 40, paddingBottom: 2 },
  emptyCrisisLink: { alignItems: 'center', justifyContent: 'center', minHeight: 44, marginTop: theme.spacing.xs },
  crisisLinkText: { ...theme.type.footnote, fontWeight: '600', color: theme.colors.accentDeep },
});
