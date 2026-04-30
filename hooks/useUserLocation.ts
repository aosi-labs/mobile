import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { lookupPostcode, type PostcodeEntry } from '../lib/postcodes';

export type Coords = { latitude: number; longitude: number };

export type LocationSource = 'gps' | 'postcode';

export type UserLocationState = {
  status: 'hydrating' | 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';
  source: LocationSource | null;
  coords: Coords | null;
  placeLabel: string | null;
  postcode: string | null;
  error: string | null;
  request: () => Promise<void>;
  setPostcode: (input: string) => PostcodeEntry | null;
  clear: () => Promise<void>;
};

const STORAGE_KEY = 'aosi.location.v1';

type StoredLocation = {
  source: LocationSource;
  coords: Coords;
  placeLabel: string | null;
  postcode: string | null;
};

export function useUserLocation(): UserLocationState {
  const [status, setStatus] = useState<UserLocationState['status']>('hydrating');
  const [source, setSource] = useState<LocationSource | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [placeLabel, setPlaceLabel] = useState<string | null>(null);
  const [postcode, setPostcodeState] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const persist = useCallback(async (value: StoredLocation | null) => {
    try {
      if (value) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      else await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage failures are non-fatal; in-memory state still drives the session.
    }
  }, []);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const places = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const p = places[0];
      if (!p) return null;
      const region = p.region || p.subregion || '';
      const city = p.city || p.subregion || p.district || '';
      if (city && region) return `${city}, ${region}`;
      return city || region || null;
    } catch {
      return null;
    }
  }, []);

  const request = useCallback(async () => {
    setStatus('requesting');
    setError(null);
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') {
        setStatus('denied');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const c = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setSource('gps');
      setCoords(c);
      setPostcodeState(null);
      setStatus('granted');
      const label = await reverseGeocode(c.latitude, c.longitude);
      setPlaceLabel(label);
      void persist({ source: 'gps', coords: c, placeLabel: label, postcode: null });
    } catch (e) {
      setStatus('unavailable');
      setError(e instanceof Error ? e.message : 'Location unavailable');
    }
  }, [persist, reverseGeocode]);

  const setPostcode = useCallback(
    (input: string): PostcodeEntry | null => {
      const entry = lookupPostcode(input);
      if (!entry) return null;
      const c = { latitude: entry.latitude, longitude: entry.longitude };
      const label = `${entry.locality}, ${entry.state}`;
      setSource('postcode');
      setCoords(c);
      setPlaceLabel(label);
      setPostcodeState(entry.postcode);
      setStatus('granted');
      setError(null);
      void persist({ source: 'postcode', coords: c, placeLabel: label, postcode: entry.postcode });
      return entry;
    },
    [persist],
  );

  const clear = useCallback(async () => {
    setStatus('idle');
    setSource(null);
    setCoords(null);
    setPlaceLabel(null);
    setPostcodeState(null);
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
    error,
    request,
    setPostcode,
    clear,
  };
}
