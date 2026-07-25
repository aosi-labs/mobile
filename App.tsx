import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useCallback, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';

// NOTE: Dynamic Type is intentionally uncapped. The old Text.defaultProps
// maxFontSizeMultiplier hack silently stopped working on React 19 (function
// components ignore defaultProps), so text scales freely at accessibility
// sizes; layouts must tolerate it.
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { AboutSheet } from './components/AboutSheet';
import { CrisisSheet } from './components/CrisisSheet';
import { PostcodeInput } from './components/PostcodeInput';
import { ServiceDetailSheet, type ServiceDetailHandle } from './components/ServiceDetail';
import { useServices } from './hooks/useServices';
import { useUserLocation } from './hooks/useUserLocation';
import { needByKey, type Need } from './lib/needs';
import { theme } from './lib/theme';
import type { Service } from './lib/types';
import { BrowseScreen } from './screens/BrowseScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ResultsScreen } from './screens/ResultsScreen';

type Screen =
  | { name: 'home' }
  | { name: 'results'; needKey: string }
  | { name: 'browse'; category: string | null };

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
  const { services, isLoading, isSyncing, syncProgress, syncTotal, lastSynced, error, refresh } =
    useServices();
  const location = useUserLocation();

  const [stack, setStack] = useState<Screen[]>([{ name: 'home' }]);
  const screen = stack[stack.length - 1];
  // One "show services from anywhere" choice holds for the whole session;
  // re-asking on every need tap punishes the person who already said no.
  const [locationSkipped, setLocationSkipped] = useState(false);

  const [selected, setSelected] = useState<Service | null>(null);
  const [selectedDistance, setSelectedDistance] = useState<number | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [postcodeOpen, setPostcodeOpen] = useState(false);
  const detailRef = useRef<ServiceDetailHandle>(null);

  const push = useCallback((next: Screen) => {
    setStack((s) => [...s, next]);
  }, []);

  const pop = useCallback(() => {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
  }, []);

  const openDetail = useCallback((service: Service, distance: number | null) => {
    setSelected(service);
    setSelectedDistance(distance);
    detailRef.current?.present();
  }, []);

  const handleDetailDismiss = useCallback(() => {
    setSelected(null);
    setSelectedDistance(null);
  }, []);

  const onLocationPress = useCallback(() => {
    showLocationActionSheet({
      source: location.source,
      onUseGps: () => {
        void location.request();
      },
      onUsePostcode: () => setPostcodeOpen(true),
      onClear: () => {
        void location.clear();
      },
    });
  }, [location]);

  if (location.status === 'hydrating') {
    return (
      <SafeAreaView style={[styles.root, styles.center]}>
        <StatusBar style="dark" />
        <ActivityIndicator color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  const screenKey =
    screen.name === 'results'
      ? `results:${screen.needKey}`
      : screen.name === 'browse'
      ? `browse:${screen.category ?? 'all'}`
      : 'home';

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <Animated.View
        key={screenKey}
        style={styles.screen}
        entering={FadeIn.duration(180).reduceMotion(ReduceMotion.System)}
      >
        {screen.name === 'home' ? (
          <HomeScreen
            location={location}
            isSyncing={isSyncing}
            syncProgress={syncProgress}
            syncTotal={syncTotal}
            serviceCount={services.length}
            error={error}
            lastSynced={lastSynced}
            onPickNeed={(need: Need) => {
              void Haptics.selectionAsync();
              push({ name: 'results', needKey: need.key });
            }}
            onSomethingElse={() => push({ name: 'browse', category: null })}
            onLocationPress={onLocationPress}
            onInfoPress={() => setAboutOpen(true)}
            onCrisisPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCrisisOpen(true);
            }}
          />
        ) : screen.name === 'results' ? (
          <ResultsScreen
            need={needByKey(screen.needKey) ?? fallbackNeed(screen.needKey)}
            services={services}
            isLoading={isLoading}
            isSyncing={isSyncing}
            syncProgress={syncProgress}
            syncTotal={syncTotal}
            error={error}
            location={location}
            skipped={locationSkipped}
            onSkipChange={setLocationSkipped}
            onBack={pop}
            onOpenDetail={openDetail}
            onSeeAll={() => push({ name: 'browse', category: screen.needKey })}
            onBrowseAll={() => push({ name: 'browse', category: null })}
            onCrisisPress={() => setCrisisOpen(true)}
            onEnterPostcode={() => setPostcodeOpen(true)}
            onRetry={() => void refresh()}
          />
        ) : (
          <BrowseScreen
            services={services}
            isLoading={isLoading}
            isSyncing={isSyncing}
            error={error}
            refresh={refresh}
            location={location}
            initialCategory={screen.category}
            onBack={pop}
            onOpenDetail={openDetail}
            onLocationPress={onLocationPress}
            onCrisisPress={() => setCrisisOpen(true)}
          />
        )}
      </Animated.View>

      <ServiceDetailSheet
        ref={detailRef}
        service={selected}
        distanceMeters={selectedDistance}
        onDismiss={handleDetailDismiss}
      />

      <CrisisSheet visible={crisisOpen} onClose={() => setCrisisOpen(false)} />

      <AboutSheet
        visible={aboutOpen}
        onClose={() => setAboutOpen(false)}
        onChangeLocation={() => {
          setAboutOpen(false);
          // Defer until the about sheet finishes dismissing so the next
          // surface slides in cleanly on top.
          setTimeout(() => onLocationPress(), 250);
        }}
      />

      <PostcodeInput
        visible={postcodeOpen}
        initialValue={location.postcode ?? ''}
        onCancel={() => setPostcodeOpen(false)}
        onConfirm={(entry) => {
          location.setPostcode(entry.postcode);
          setPostcodeOpen(false);
        }}
      />
    </View>
  );
}

// Safety net: the stack should only ever contain known need keys, but a bad
// key must not crash the results screen.
function fallbackNeed(key: string): Need {
  return {
    key,
    label: 'Services',
    sub: 'Support services',
    icon: 'help-circle',
    color: theme.colors.primary,
    category: key,
  };
}

function showLocationActionSheet(opts: {
  source: 'gps' | 'postcode' | null;
  onUseGps: () => void;
  onUsePostcode: () => void;
  onClear: () => void;
}) {
  const { source, onUseGps, onUsePostcode, onClear } = opts;

  // Build the option list dynamically based on what's currently active.
  const options: { label: string; action: () => void; destructive?: boolean }[] = [];
  if (source !== 'gps') options.push({ label: 'Use my location (GPS)', action: onUseGps });
  if (source !== 'postcode') options.push({ label: source ? 'Use a postcode instead' : 'Use my postcode', action: onUsePostcode });
  if (source === 'postcode') options.push({ label: 'Change postcode', action: onUsePostcode });
  if (source) options.push({ label: 'Clear location', action: onClear, destructive: true });

  const labels = [...options.map((o) => o.label), 'Cancel'];
  const cancelButtonIndex = labels.length - 1;
  const destructiveButtonIndex = options.findIndex((o) => o.destructive);

  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: labels,
        cancelButtonIndex,
        destructiveButtonIndex: destructiveButtonIndex === -1 ? undefined : destructiveButtonIndex,
        title: 'Location',
      },
      (index) => {
        if (index === cancelButtonIndex || index === undefined) return;
        options[index]?.action();
      },
    );
    return;
  }

  // Android fallback: just trigger the most relevant action directly.
  if (source === null) onUsePostcode();
  else onClear();
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  screen: { flex: 1 },
});
