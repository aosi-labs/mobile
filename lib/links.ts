import { Alert, Linking } from 'react-native';

// A failed deep link must never be a silent dead tap. The alert shows the
// target so the person can still act on it manually, e.g. dial the number
// themselves. Used for every tel:/sms:/https: tap in the app.
export function openLink(url: string): void {
  Linking.openURL(url).catch(() => {
    Alert.alert('Could not open this', url);
  });
}
