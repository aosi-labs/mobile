import { Alert, Linking, Platform } from 'react-native';

// A failed deep link must never be a silent dead tap. The alert shows the
// target so the person can still act on it manually, e.g. dial the number
// themselves. Used for every tel:/sms:/https: tap in the app.
export function openLink(url: string): void {
  Linking.openURL(url).catch(() => {
    Alert.alert('Could not open this', url);
  });
}

// Native turn-by-turn directions to a service. Apple Maps on iOS,
// Google Maps on Android. One implementation for every card and sheet.
export function directionsUrl(lat: number, lng: number): string {
  return Platform.OS === 'ios'
    ? `https://maps.apple.com/?daddr=${lat},${lng}`
    : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}
