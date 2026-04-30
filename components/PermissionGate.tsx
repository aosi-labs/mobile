import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Linking, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../lib/theme';
import { EmuMascot } from './EmuMascot';

const PRIVACY_URL = 'https://oa-sa.vercel.app/static/privacy.html';
const TERMS_URL = 'https://oa-sa.vercel.app/static/terms.html';

type Props = {
  onAllow: () => void;
  onPostcode: () => void;
  onSkip: () => void;
  isRequesting?: boolean;
};

export function PermissionGate({ onAllow, onPostcode, onSkip, isRequesting }: Props) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <View style={styles.mascotWrap}>
          <EmuMascot size={140} variant="searching" />
        </View>
        <Text style={styles.title}>G'day. Let's find help nearby.</Text>
        <Text style={styles.body}>
          AOSI shows support services close to you, including food relief, housing, mental health, and more across Australia.
        </Text>
        <Text style={styles.privacy}>
          Your location stays on your device. Nothing is tracked or shared.
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onAllow();
          }}
          disabled={isRequesting}
          accessibilityRole="button"
          accessibilityLabel={isRequesting ? 'Requesting location permission' : 'Use my location'}
          accessibilityState={{ disabled: !!isRequesting, busy: !!isRequesting }}
        >
          <Ionicons name="navigate" size={18} color="#fff" />
          <Text style={styles.primaryText}>{isRequesting ? 'Requesting…' : 'Use my location'}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.altBtn, pressed && styles.pressed]}
          onPress={() => {
            void Haptics.selectionAsync();
            onPostcode();
          }}
          accessibilityRole="button"
          accessibilityLabel="Use my postcode instead"
        >
          <Ionicons name="location-outline" size={18} color={theme.colors.primary} />
          <Text style={styles.altText}>Use my postcode instead</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
          onPress={() => {
            void Haptics.selectionAsync();
            onSkip();
          }}
          accessibilityRole="button"
          accessibilityLabel="Browse without location"
        >
          <Text style={styles.secondaryText}>Browse without location</Text>
        </Pressable>
        <Text style={styles.legalFooter}>
          By continuing, you agree to our{' '}
          <Text style={styles.legalLink} onPress={() => Linking.openURL(TERMS_URL)}>
            Terms
          </Text>{' '}
          and{' '}
          <Text style={styles.legalLink} onPress={() => Linking.openURL(PRIVACY_URL)}>
            Privacy Policy
          </Text>
          .
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.surface, justifyContent: 'space-between' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.spacing.xxl },
  mascotWrap: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#FBF6EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: { ...theme.type.title1, color: theme.colors.text, textAlign: 'center', marginBottom: theme.spacing.md },
  body: {
    ...theme.type.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.lg,
  },
  privacy: { ...theme.type.footnote, color: theme.colors.textTertiary, textAlign: 'center' },
  actions: { padding: theme.spacing.xl, gap: theme.spacing.sm },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
  },
  primaryText: { ...theme.type.headline, color: '#fff' },
  altBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primaryMuted,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
  },
  altText: { ...theme.type.headline, color: theme.colors.primary },
  secondaryBtn: { paddingVertical: 12, alignItems: 'center' },
  secondaryText: { ...theme.type.callout, color: theme.colors.textSecondary },
  pressed: { opacity: 0.7 },
  legalFooter: {
    ...theme.type.caption,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    lineHeight: 18,
  },
  legalLink: { color: theme.colors.primary, fontWeight: '500' },
});
