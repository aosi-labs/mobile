import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  SafeAreaView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

// NOTE: Dynamic Type is intentionally uncapped. The old Text.defaultProps
// maxFontSizeMultiplier hack silently stopped working on React 19 (function
// components ignore defaultProps), so text scales freely at accessibility
// sizes; layouts must tolerate it.
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  ReduceMotion,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AboutSheet } from './components/AboutSheet';
import { CrisisSheet } from './components/CrisisSheet';
import { PostcodeInput } from './components/PostcodeInput';
import { ServiceDetailSheet, type ServiceDetailHandle } from './components/ServiceDetail';
import { useServices } from './hooks/useServices';
import { useUserLocation } from './hooks/useUserLocation';
import { MOTION } from './lib/motion';
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

const SKIP_STORAGE_KEY = 'aosi.locationSkipped.v1';
const SLIDE_TIMING = { duration: MOTION.screenSlide, reduceMotion: ReduceMotion.System };

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
  const { width: screenWidth } = useWindowDimensions();

  const [stack, setStack] = useState<Screen[]>([{ name: 'home' }]);
  // One "show services from anywhere" choice is remembered across sessions;
  // re-asking on every visit punishes the person who already said no.
  const [locationSkipped, setLocationSkippedState] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(SKIP_STORAGE_KEY)
      .then((v) => {
        if (v === 'true') setLocationSkippedState(true);
      })
      .catch(() => {});
  }, []);
  const setLocationSkipped = useCallback((skipped: boolean) => {
    setLocationSkippedState(skipped);
    AsyncStorage.setItem(SKIP_STORAGE_KEY, skipped ? 'true' : 'false').catch(() => {});
  }, []);

  const [selected, setSelected] = useState<Service | null>(null);
  const [selectedDistance, setSelectedDistance] = useState<number | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [crisisOpen, setCrisisOpen] = useState(false);
  const [postcodeOpen, setPostcodeOpen] = useState(false);
  const detailRef = useRef<ServiceDetailHandle>(null);

  // ---- Transition layer -------------------------------------------------
  // Every stack entry stays MOUNTED. `progress` runs 0..1 where 1 = top
  // screen settled covering the stack, 0 = top parked offscreen right. The
  // screen below slides to -30% and dims as the top arrives (iOS push
  // grammar), and going back reveals it exactly where it was: no remount,
  // no replayed entrance stagger, no re-ranking.
  //
  // IMPORTANT invariant: animated styles are bound ONLY while `transition`
  // is active, and every transition ends at that style's neutral value
  // (top ends at progress=1 -> translateX 0; below ends at progress=0 ->
  // translateX 0, opacity 1). Reanimated does not reset props when a style
  // unbinds, so unbinding anywhere else leaves a screen stuck shifted/dim.
  const progress = useSharedValue(0);
  const [transition, setTransition] = useState<'push' | 'pop' | null>(null);
  // Mirrored on the UI thread so the swipe gesture can refuse to hijack a
  // running transition (a worklet cannot read a React ref).
  const busy = useSharedValue(false);
  // Whether the current drag owns the transition (set once in onStart).
  const owns = useSharedValue(false);
  const transitioningRef = useRef(false);

  // Never leaves the shell frozen: any path out of a transition clears the
  // guard, including an interrupted animation (finished === false).
  const endTransition = useCallback(() => {
    transitioningRef.current = false;
    busy.value = false;
    setTransition(null);
  }, [busy]);

  const commitPop = useCallback(() => {
    transitioningRef.current = false;
    busy.value = false;
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
    setTransition(null);
  }, [busy]);

  // The slide is armed here but STARTED in the layout effect below, after
  // React has committed the new layer. Starting the clock before the commit
  // would burn the animation against a screen that is still rendering (a
  // pushed Browse mounts a filter pass over 24.5k rows), so the screen would
  // pop into place instead of sliding in.
  const pendingAnimRef = useRef<null | 'push' | 'pop'>(null);

  const push = useCallback(
    (next: Screen) => {
      if (transitioningRef.current) return;
      transitioningRef.current = true;
      busy.value = true;
      // Safe to write directly: with no transition running, no animated
      // style is bound to any layer yet.
      progress.value = 0;
      pendingAnimRef.current = 'push';
      setTransition('push');
      setStack((s) => [...s, next]);
    },
    [progress, busy],
  );

  const pop = useCallback(() => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    busy.value = true;
    progress.value = 1;
    pendingAnimRef.current = 'pop';
    setTransition('pop');
  }, [progress, busy]);

  useLayoutEffect(() => {
    const pending = pendingAnimRef.current;
    if (!pending) return;
    pendingAnimRef.current = null;
    if (pending === 'push') {
      progress.value = withTiming(1, SLIDE_TIMING, () => {
        runOnJS(endTransition)();
      });
    } else {
      progress.value = withTiming(0, SLIDE_TIMING, (finished) => {
        if (finished) runOnJS(commitPop)();
        else runOnJS(endTransition)();
      });
    }
  }, [transition, stack.length, progress, commitPop, endTransition]);

  // Swipe-back needs the layers bound before the finger moves far; called
  // from the gesture's onStart via runOnJS.
  const beginSwipePop = useCallback(() => {
    transitioningRef.current = true;
    setTransition('pop');
  }, []);

  // Android hardware back pops the stack instead of exiting the app.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length > 1) {
        pop();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [stack.length, pop]);

  // Left-edge swipe drives the pop interactively (24pt activation band),
  // committing past 40% of the width or a decisive flick.
  const backGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(stack.length > 1)
        .activeOffsetX(10)
        .failOffsetY([-15, 15])
        .hitSlop({ left: 0, width: 24 })
        .onStart(() => {
          // Never hijack a transition already in flight; owning the drag is
          // decided once, here, and honoured by onUpdate/onEnd.
          if (busy.value) return;
          busy.value = true;
          owns.value = true;
          progress.value = 1;
          runOnJS(beginSwipePop)();
        })
        .onUpdate((e) => {
          if (!owns.value) return;
          progress.value = Math.min(1, Math.max(0, 1 - e.translationX / screenWidth));
        })
        .onEnd((e) => {
          if (!owns.value) return;
          owns.value = false;
          const shouldPop = e.translationX > screenWidth * 0.4 || e.velocityX > 800;
          if (shouldPop) {
            progress.value = withTiming(0, SLIDE_TIMING, (finished) => {
              if (finished) runOnJS(commitPop)();
              else runOnJS(endTransition)();
            });
          } else {
            // Cancelled: settle back to covered, then unbind at neutral.
            progress.value = withTiming(1, SLIDE_TIMING, () => {
              runOnJS(endTransition)();
            });
          }
        }),
    [stack.length, screenWidth, progress, busy, owns, commitPop, beginSwipePop, endTransition],
  );

  // Bound only during a transition; both end at neutral (translateX 0,
  // opacity 1), so unbinding can never strand a screen offset or dimmed.
  const topStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: screenWidth * (1 - progress.value) }],
  }));
  const belowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -0.3 * screenWidth * progress.value }],
    opacity: 1 - 0.45 * progress.value,
  }));
  // -----------------------------------------------------------------------

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
        <ActivityIndicator color={theme.colors.primary} accessibilityLabel="Loading aosi" />
      </SafeAreaView>
    );
  }

  const renderScreen = (s: Screen) => {
    if (s.name === 'home') {
      return (
        <HomeScreen
          location={location}
          isSyncing={isSyncing}
          syncProgress={syncProgress}
          syncTotal={syncTotal}
          serviceCount={services.length}
          error={error}
          lastSynced={lastSynced}
          // No haptics here: PressableScale inside the screen already fires
          // exactly one per tap. Doubling them reads as a stutter.
          onPickNeed={(need: Need) => push({ name: 'results', needKey: need.key })}
          onSomethingElse={() => push({ name: 'browse', category: null })}
          onLocationPress={onLocationPress}
          onInfoPress={() => setAboutOpen(true)}
          onCrisisPress={() => setCrisisOpen(true)}
          onRetry={() => void refresh()}
        />
      );
    }
    if (s.name === 'results') {
      return (
        <ResultsScreen
          need={needByKey(s.needKey) ?? fallbackNeed(s.needKey)}
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
          onSeeAll={() => push({ name: 'browse', category: s.needKey })}
          onBrowseAll={() => push({ name: 'browse', category: null })}
          onCrisisPress={() => setCrisisOpen(true)}
          onEnterPostcode={() => setPostcodeOpen(true)}
          onRetry={() => void refresh()}
        />
      );
    }
    return (
      <BrowseScreen
        services={services}
        isLoading={isLoading}
        isSyncing={isSyncing}
        error={error}
        refresh={refresh}
        location={location}
        initialCategory={s.category}
        onBack={pop}
        onOpenDetail={openDetail}
        onLocationPress={onLocationPress}
        onCrisisPress={() => setCrisisOpen(true)}
      />
    );
  };

  const screenKeyFor = (s: Screen, index: number) =>
    s.name === 'results'
      ? `${index}:results:${s.needKey}`
      : s.name === 'browse'
        ? `${index}:browse:${s.category ?? 'all'}`
        : `${index}:home`;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* While the detail sheet is up, the screen stack is hidden from
          VoiceOver. The sheet renders in a portal, so accessibilityViewIsModal
          on the sheet itself cannot silence a different subtree; without
          this, swiping right walks straight out of the sheet onto the cards
          behind it. */}
      <GestureDetector gesture={backGesture}>
        <View
          style={styles.screen}
          accessibilityElementsHidden={selected != null}
          importantForAccessibility={selected != null ? 'no-hide-descendants' : 'auto'}
        >
          {stack.map((s, index) => {
            const isTop = index === stack.length - 1;
            const isBelow = index === stack.length - 2;
            // Animated styles attach ONLY while a transition is running.
            // At rest the top screen carries plain styles, so nothing can
            // hold a stale transform after the animation unbinds.
            const animating = transition !== null;
            return (
              <Animated.View
                key={screenKeyFor(s, index)}
                style={[
                  StyleSheet.absoluteFill,
                  styles.screenLayer,
                  animating && isTop && stack.length > 1 ? topStyle : null,
                  animating && isBelow ? belowStyle : null,
                  !isTop && !isBelow ? styles.screenHidden : null,
                  // A below-layer at rest (transition finished) must not
                  // paint over the screen above it.
                  !animating && !isTop ? styles.screenHidden : null,
                ]}
                pointerEvents={isTop ? 'auto' : 'none'}
                accessibilityElementsHidden={!isTop}
                importantForAccessibility={isTop ? 'auto' : 'no-hide-descendants'}
              >
                {renderScreen(s)}
              </Animated.View>
            );
          })}
        </View>
      </GestureDetector>

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
          setTimeout(() => onLocationPress(), MOTION.sheetHandoff);
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

  // Android: the same option list as an Alert menu. Never destroy the
  // person's location as a side effect of opening a menu, and never strand
  // them without a way back to GPS or to clearing it.
  Alert.alert(
    'Location',
    undefined,
    [
      ...options.map((o) => ({
        text: o.label,
        onPress: o.action,
        style: o.destructive ? ('destructive' as const) : ('default' as const),
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ],
    { cancelable: true },
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  screen: { flex: 1 },
  screenLayer: { backgroundColor: theme.colors.bg },
  screenHidden: { display: 'none' },
});
