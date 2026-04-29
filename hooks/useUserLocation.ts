import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

export type Coords = { latitude: number; longitude: number };

export type UserLocationState = {
  status: 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';
  coords: Coords | null;
  placeLabel: string | null;
  error: string | null;
  request: () => Promise<void>;
  clear: () => void;
};

export function useUserLocation(): UserLocationState {
  const [status, setStatus] = useState<UserLocationState['status']>('idle');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [placeLabel, setPlaceLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setCoords(c);
      setStatus('granted');
      const label = await reverseGeocode(c.latitude, c.longitude);
      setPlaceLabel(label);
    } catch (e) {
      setStatus('unavailable');
      setError(e instanceof Error ? e.message : 'Location unavailable');
    }
  }, [reverseGeocode]);

  const clear = useCallback(() => {
    setStatus('idle');
    setCoords(null);
    setPlaceLabel(null);
    setError(null);
  }, []);

  useEffect(() => {
    (async () => {
      const { status: perm } = await Location.getForegroundPermissionsAsync();
      if (perm === 'granted') {
        void request();
      }
    })();
  }, [request]);

  return { status, coords, placeLabel, error, request, clear };
}
