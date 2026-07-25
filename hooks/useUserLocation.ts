import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { lookupPostcode, type PostcodeEntry } from '../lib/postcodes';

export type Coords = { latitude: number; longitude: number };

export type LocationSource = 'gps' | 'postcode';

export type UserLocationState = {
  status: 'hydrating' | 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';
  source: LocationSource | null;
  coords: Coords | null;
  placeLabel: string | null;
  postcode: string | null;
  // Two-to-three letter state code (NSW, VIC, ...) when known; drives
  // state-specific crisis lines. null means unknown, never guessed.
  state: string | null;
  error: string | null;
  request: () => Promise<void>;
  setPostcode: (input: string) => PostcodeEntry | null;
  clear: () => Promise<void>;
};

const STORAGE_KEY = 'aosi.location.v1';
const GPS_TIMEOUT_MS = 10000;

const STATE_BY_REGION: Record<string, string> = {
  'new south wales': 'NSW',
  nsw: 'NSW',
  victoria: 'VIC',
  vic: 'VIC',
  queensland: 'QLD',
  qld: 'QLD',
  'south australia': 'SA',
  sa: 'SA',
  'western australia': 'WA',
  wa: 'WA',
  tasmania: 'TAS',
  tas: 'TAS',
  'northern territory': 'NT',
  nt: 'NT',
  'australian capital territory': 'ACT',
  act: 'ACT',
};

type StoredLocation = {
  source: LocationSource;
  coords: Coords;
  placeLabel: string | null;
  postcode: string | null;
  state?: string | null;
};

export function useUserLocation(): UserLocationState {
  const [status, setStatus] = useState<UserLocationState['status']>('hydrating');
  const [source, setSource] = useState<LocationSource | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [placeLabel, setPlaceLabel] = useState<string | null>(null);
  const [postcode, setPostcodeState] = useState<string | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Latest-wins guard: a slow GPS request must never clobber a postcode the
  // user chose (or a clear they performed) while it was pending.
  const opIdRef = useRef(0);

  const persist = useCallback(async (value: StoredLocation | null) => {
    try {
      if (value) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      else await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage failures are non-fatal; in-memory state still drives the session.
    }
  }, []);

  const reverseGeocode = useCallback(
    async (lat: number, lng: number): Promise<{ label: string | null; state: string | null }> => {
      try {
        const places = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        const p = places[0];
        if (!p) return { label: null, state: null };
        const region = p.region || p.subregion || '';
        const city = p.city || p.subregion || p.district || '';
        const label = city && region ? `${city}, ${region}` : city || region || null;
        const mappedState =
          STATE_BY_REGION[region.trim().toLowerCase()] ??
          (p.postalCode ? lookupPostcode(p.postalCode)?.state ?? null : null);
        return { label, state: mappedState };
      } catch {
        return { label: null, state: null };
      }
    },
    [],
  );

  const request = useCallback(async () => {
    const opId = ++opIdRef.current;
    setStatus('requesting');
    setError(null);
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (opIdRef.current !== opId) return;
      if (perm !== 'granted') {
        setStatus('denied');
        return;
      }
      // In GPS blackspots getCurrentPositionAsync can hang indefinitely.
      // Time-box it, then fall back to the last known fix before giving up.
      let pos: Location.LocationObject | null = null;
      try {
        pos = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('GPS timed out')), GPS_TIMEOUT_MS),
          ),
        ]);
      } catch {
        pos = await Location.getLastKnownPositionAsync();
      }
      if (opIdRef.current !== opId) return;
      if (!pos) {
        setStatus('unavailable');
        setError('Could not get a GPS fix');
        return;
      }
      const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setSource('gps');
      setCoords(c);
      setPostcodeState(null);
      setStatus('granted');
      const geo = await reverseGeocode(c.latitude, c.longitude);
      if (opIdRef.current !== opId) return;
      setPlaceLabel(geo.label);
      setState(geo.state);
      void persist({ source: 'gps', coords: c, placeLabel: geo.label, postcode: null, state: geo.state });
    } catch (e) {
      if (opIdRef.current !== opId) return;
      setStatus('unavailable');
      setError(e instanceof Error ? e.message : 'Location unavailable');
    }
  }, [persist, reverseGeocode]);

  const setPostcode = useCallback(
    (input: string): PostcodeEntry | null => {
      const entry = lookupPostcode(input);
      if (!entry) return null;
      opIdRef.current += 1;
      const c = { latitude: entry.latitude, longitude: entry.longitude };
      const label = `${entry.locality}, ${entry.state}`;
      setSource('postcode');
      setCoords(c);
      setPlaceLabel(label);
      setPostcodeState(entry.postcode);
      setState(entry.state);
      setStatus('granted');
      setError(null);
      void persist({
        source: 'postcode',
        coords: c,
        placeLabel: label,
        postcode: entry.postcode,
        state: entry.state,
      });
      return entry;
    },
    [persist],
  );

  const clear = useCallback(async () => {
    opIdRef.current += 1;
    setStatus('idle');
    setSource(null);
    setCoords(null);
    setPlaceLabel(null);
    setPostcodeState(null);
    setState(null);
    setError(null);
    await persist(null);
  }, [persist]);

  // Restore last-used location on mount. GPS gets refreshed if still permitted;
  // postcode just rehydrates from storage.
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as StoredLocation;
          if (parsed.source === 'postcode' && parsed.coords && parsed.postcode) {
            setSource('postcode');
            setCoords(parsed.coords);
            setPlaceLabel(parsed.placeLabel);
            setPostcodeState(parsed.postcode);
            setState(parsed.state ?? lookupPostcode(parsed.postcode)?.state ?? null);
            setStatus('granted');
            return;
          }
          if (parsed.source === 'gps') {
            const { status: perm } = await Location.getForegroundPermissionsAsync();
            if (perm === 'granted') {
              void request();
              return;
            }
            await AsyncStorage.removeItem(STORAGE_KEY);
          }
        } else {
          const { status: perm } = await Location.getForegroundPermissionsAsync();
          if (perm === 'granted') {
            void request();
            return;
          }
        }
        setStatus('idle');
      } catch {
        setStatus('idle');
      }
    })();
  }, [request]);

  return {
    status,
    source,
    coords,
    placeLabel,
    postcode,
    state,
    error,
    request,
    setPostcode,
    clear,
  };
}
