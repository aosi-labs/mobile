import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MapView, { Marker, type Region } from 'react-native-maps';
import { AboutSheet } from './components/AboutSheet';
import { EmuMark, EmuMascot } from './components/EmuMascot';
import { IntentStrip, INTENTS } from './components/IntentStrip';
import { LocationBanner } from './components/LocationBanner';
import { PermissionGate } from './components/PermissionGate';
import { ServiceCard } from './components/ServiceCard';
import { ServiceDetail } from './components/ServiceDetail';
import { SkeletonList } from './components/SkeletonList';
import { useServices } from './hooks/useServices';
import { useUserLocation } from './hooks/useUserLocation';
import { catColor } from './lib/constants';
import { distanceMetres } from './lib/geo';
import { theme } from './lib/theme';
import type { Service } from './lib/types';

const INITIAL_REGION: Region = {
  latitude: -28.5,
  longitude: 134,
  latitudeDelta: 40,
  longitudeDelta: 40,
};
const NEAR_REGION_DELTA = 1.0;
const MAX_MARKERS = 400;
const LIST_LIMIT = 200;

type ViewMode = 'list' | 'map';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <AppShell />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

function AppShell() {
  const { services, isLoading, isSyncing, syncProgress, error, refresh } = useServices();
  const location = useUserLocation();

  const [permissionResolved, setPermissionResolved] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIntent, setActiveIntent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [region, setRegion] = useState<Region>(INITIAL_REGION);
  const [selected, setSelected] = useState<Service | null>(null);
  const [selectedDistance, setSelectedDistance] = useState<number | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  const showPermissionGate =
    !permissionResolved && location.status === 'idle' && !isLoading;

  const intentCategory = useMemo(
    () => INTENTS.find((i) => i.key === activeIntent)?.category ?? null,
    [activeIntent]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
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
    if (!location.coords) return filtered.map((s) => ({ service: s, distance: null }));
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
    if (region.latitudeDelta > 8) return [];
    const minLat = region.latitude - region.latitudeDelta / 2;
    const maxLat = region.latitude + region.latitudeDelta / 2;
    const minLng = region.longitude - region.longitudeDelta / 2;
    const maxLng = region.longitude + region.longitudeDelta / 2;
    const inView: Service[] = [];
    for (const s of filtered) {
      if (s.latitude == null || s.longitude == null) continue;
      if (s.latitude < minLat || s.latitude > maxLat) continue;
      if (s.longitude < minLng || s.longitude > maxLng) continue;
      inView.push(s);
      if (inView.length >= MAX_MARKERS) break;
    }
    return inView;
  }, [filtered, region]);

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

  if (showPermissionGate) {
    return (
      <PermissionGate
        isRequesting={location.status === 'requesting'}
        onAllow={async () => {
          await location.request();
          setPermissionResolved(true);
        }}
        onSkip={() => setPermissionResolved(true)}
      />
    );
  }

  const onLocationBannerPress = () => {
    if (location.status === 'granted') {
      Alert.alert('Stop using your location?', 'Switch back to browsing all of Australia.', [
        { text: 'Keep using', style: 'cancel' },
        { text: 'Stop', style: 'destructive', onPress: () => location.clear() },
      ]);
    } else {
      void location.request();
    }
  };

  const headerTitle = location.coords ? 'Near you' : 'All services';
  const subtitle = activeIntent
    ? INTENTS.find((i) => i.key === activeIntent)?.label
    : null;

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />

      <FlatList
        data={viewMode === 'list' ? ranked.slice(0, LIST_LIMIT) : []}
        keyExtractor={(item) => item.service.id}
        renderItem={({ item }) => (
          <ServiceCard
            service={item.service}
            distanceMeters={item.distance}
            onPress={() => {
              setSelected(item.service);
              setSelectedDistance(item.distance);
            }}
          />
        )}
        ListHeaderComponent={
          <Header
            query={query}
            onQuery={setQuery}
            location={location}
            onLocationPress={onLocationBannerPress}
            activeIntent={activeIntent}
            onIntentChange={setActiveIntent}
            count={filtered.length}
            isSyncing={isSyncing}
            syncProgress={syncProgress}
            viewMode={viewMode}
            onViewMode={setViewMode}
            headerTitle={headerTitle}
            subtitle={subtitle ?? null}
            onInfoPress={() => setAboutOpen(true)}
            mapPanel={
              viewMode === 'map' ? (
                <View style={styles.mapWrap}>
                  <MapView
                    style={StyleSheet.absoluteFill}
                    initialRegion={mapRegion}
                    showsUserLocation={location.status === 'granted'}
                    onRegionChangeComplete={setRegion}
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
                                  s.longitude
                                )
                              : null;
                          setSelected(s);
                          setSelectedDistance(dist);
                        }}
                      />
                    ))}
                  </MapView>
                  {region.latitudeDelta > 8 ? (
                    <View style={styles.zoomHint}>
                      <Ionicons name="search" size={14} color="#fff" />
                      <Text style={styles.zoomHintText}>Zoom in to show services</Text>
                    </View>
                  ) : null}
                </View>
              ) : null
            }
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <SkeletonList />
          ) : viewMode === 'map' ? null : (
            <EmptyState
              hasError={!!error}
              hasFilters={!!query || !!activeIntent}
              onClear={() => {
                setQuery('');
                setActiveIntent(null);
              }}
              onRetry={refresh}
            />
          )
        }
        ListFooterComponent={
          viewMode === 'list' && ranked.length > LIST_LIMIT ? (
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Showing first {LIST_LIMIT} of {ranked.length.toLocaleString()} — refine your search
              </Text>
            </View>
          ) : (
            <View style={{ height: 24 }} />
          )
        }
        refreshControl={<RefreshControl refreshing={isSyncing} onRefresh={refresh} tintColor={theme.colors.primary} />}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      />

      <ServiceDetail
        service={selected}
        distanceMeters={selectedDistance}
        onClose={() => {
          setSelected(null);
          setSelectedDistance(null);
        }}
      />

      <AboutSheet visible={aboutOpen} onClose={() => setAboutOpen(false)} />
    </SafeAreaView>
  );
}

type HeaderProps = {
  query: string;
  onQuery: (q: string) => void;
  location: ReturnType<typeof useUserLocation>;
  onLocationPress: () => void;
  activeIntent: string | null;
  onIntentChange: (k: string | null) => void;
  count: number;
  isSyncing: boolean;
  syncProgress: number;
  viewMode: ViewMode;
  onViewMode: (m: ViewMode) => void;
  headerTitle: string;
  subtitle: string | null;
  mapPanel: React.ReactNode;
  onInfoPress: () => void;
};

function Header({
  query,
  onQuery,
  location,
  onLocationPress,
  activeIntent,
  onIntentChange,
  count,
  isSyncing,
  syncProgress,
  viewMode,
  onViewMode,
  headerTitle,
  subtitle,
  mapPanel,
  onInfoPress,
}: HeaderProps) {
  return (
    <View>
      <View style={styles.topBar}>
        <EmuMark size={44} />
        {isSyncing ? (
          <View style={styles.syncBadge}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.syncText}>{syncProgress.toLocaleString()}</Text>
          </View>
        ) : (
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              onInfoPress();
            }}
            hitSlop={12}
            style={styles.infoBtn}
          >
            <Ionicons name="information-circle-outline" size={26} color={theme.colors.textSecondary} />
          </Pressable>
        )}
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={theme.colors.textTertiary} />
        <TextInput
          value={query}
          onChangeText={onQuery}
          placeholder="Search services, suburb, postcode"
          placeholderTextColor={theme.colors.textTertiary}
          style={styles.searchInput}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
      </View>

      <LocationBanner
        hasLocation={location.status === 'granted'}
        placeLabel={location.placeLabel}
        onPress={onLocationPress}
      />

      <IntentStrip active={activeIntent} onChange={onIntentChange} />

      <View style={styles.sectionHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{headerTitle}</Text>
          <Text style={styles.sectionSub}>
            {count.toLocaleString()} {count === 1 ? 'service' : 'services'}
            {subtitle ? ` · ${subtitle}` : ''}
          </Text>
        </View>
        <View style={styles.viewToggle}>
          <ToggleBtn
            icon="list"
            active={viewMode === 'list'}
            onPress={() => {
              void Haptics.selectionAsync();
              onViewMode('list');
            }}
          />
          <ToggleBtn
            icon="map"
            active={viewMode === 'map'}
            onPress={() => {
              void Haptics.selectionAsync();
              onViewMode('map');
            }}
          />
        </View>
      </View>

      {mapPanel}
    </View>
  );
}

function ToggleBtn({
  icon,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.toggleBtn, active && styles.toggleBtnActive, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={icon} size={16} color={active ? '#fff' : theme.colors.textSecondary} />
    </Pressable>
  );
}

function EmptyState({
  hasError,
  hasFilters,
  onClear,
  onRetry,
}: {
  hasError: boolean;
  hasFilters: boolean;
  onClear: () => void;
  onRetry: () => void;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyMascot}>
        <EmuMascot size={140} variant={hasError ? 'concerned' : 'searching'} />
      </View>
      <Text style={styles.emptyTitle}>
        {hasError ? "Couldn't load services" : hasFilters ? 'No matches' : 'No services'}
      </Text>
      <Text style={styles.emptyBody}>
        {hasError
          ? 'Check your connection and try again.'
          : hasFilters
          ? 'Try a different search or clear filters.'
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },

  topBar: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncBadge: {
    position: 'absolute',
    right: theme.spacing.lg,
    top: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: theme.colors.primaryMuted,
    borderRadius: theme.radius.pill,
  },
  infoBtn: {
    position: 'absolute',
    right: theme.spacing.lg,
    top: theme.spacing.md,
    padding: 4,
  },
  syncText: { ...theme.type.caption, color: theme.colors.primary, fontWeight: '600' },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    ...theme.shadow,
  },
  searchInput: { flex: 1, ...theme.type.callout, color: theme.colors.text, padding: 0 },

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  sectionTitle: { ...theme.type.title3, color: theme.colors.text },
  sectionSub: { ...theme.type.footnote, color: theme.colors.textSecondary, marginTop: 2 },

  viewToggle: {
    flexDirection: 'row',
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    padding: 2,
    gap: 2,
  },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.radius.sm - 2 },
  toggleBtnActive: { backgroundColor: theme.colors.primary },

  mapWrap: {
    height: 360,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    ...theme.shadow,
  },
  zoomHint: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(15,23,42,0.85)',
    borderRadius: theme.radius.pill,
  },
  zoomHintText: { ...theme.type.caption, color: '#fff', fontWeight: '600' },

  empty: { padding: theme.spacing.xxxl, alignItems: 'center' },
  emptyMascot: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FBF6EE',
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
  },
  emptyBtnText: { ...theme.type.callout, color: '#fff', fontWeight: '600' },

  footer: { padding: theme.spacing.lg, alignItems: 'center' },
  footerText: { ...theme.type.footnote, color: theme.colors.textSecondary, textAlign: 'center' },
});
