import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import * as Haptics from 'expo-haptics';
import {
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { theme } from '../lib/theme';
import { EmuMascot } from './EmuMascot';

const VERSION_LABEL = (() => {
  const v = Application.nativeApplicationVersion ?? '1.0.0';
  const b = Application.nativeBuildVersion;
  return b ? `v${v} (${b})` : `v${v}`;
})();

const PRIVACY_URL = 'https://oa-sa.vercel.app/static/privacy.html';
const TERMS_URL = 'https://oa-sa.vercel.app/static/terms.html';
const SITE_URL = 'https://oa-sa.vercel.app/';
const GITHUB_URL = 'https://github.com/oa-sa/iOS';

type Props = {
  visible: boolean;
  onClose: () => void;
  onChangeLocation: () => void;
};

export function AboutSheet({ visible, onClose, onChangeLocation }: Props) {
  const open = (url: string) => {
    void Haptics.selectionAsync();
    void Linking.openURL(url);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <View style={styles.handle} />
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              onClose();
            }}
            hitSlop={16}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.mascotWrap}>
            <EmuMascot size={88} />
          </View>
          <Text style={styles.title}>About aosi</Text>
          <Text style={styles.tagline}>Find support services across Australia.</Text>

          <View style={styles.openSourceBadge}>
            <Ionicons name="logo-github" size={14} color={theme.colors.text} />
            <Text style={styles.openSourceText}>Open source · MIT License</Text>
          </View>

          <View style={styles.disclaimer}>
            <Ionicons
              name="information-circle"
              size={20}
              color={theme.colors.warning}
              style={{ marginTop: 1 }}
            />
            <Text style={styles.disclaimerText}>
              Data sourced from government registers and OpenStreetMap. This is an open-source research project.{' '}
              <Text style={styles.disclaimerEmphasis}>Always verify information before use.</Text>
            </Text>
          </View>

          <Section title="Why aosi exists">
            <Text style={styles.bodyText}>
              aosi pulls together publicly available support service data — food relief, housing, mental health,
              legal help, and more — from official Australian sources. The aim is to make help easier to find,
              especially when you're in a hurry or on patchy connectivity.
            </Text>
            <View style={{ height: 12 }} />
            <Text style={styles.bodyText}>
              The app's source code is freely available on GitHub. You can read it, fork it, contribute, or
              build your own version.
            </Text>
          </Section>

          <Section title="Important to know">
            <Bullet>Service hours, availability, and eligibility can change at any time.</Bullet>
            <Bullet>Always call ahead before visiting to confirm a service is open and can help.</Bullet>
            <Bullet>aosi does not collect, track, or share your personal data.</Bullet>
            <Bullet>Your location stays on your device — we never send it anywhere.</Bullet>
          </Section>

          <Section title="Location">
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                onChangeLocation();
              }}
              style={({ pressed }) => [styles.locationRow, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel="Change location"
              accessibilityHint="Switch between GPS, postcode, or no location"
            >
              <Ionicons name="location-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.locationText}>Change location</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} />
            </Pressable>
          </Section>

          <Section title="Crisis lines">
            <Text style={styles.bodyText}>
              If you're in immediate danger or need urgent help right now:
            </Text>
            <View style={{ height: 8 }} />
            <CrisisLine label="Lifeline" number="13 11 14" />
            <CrisisLine label="1800RESPECT (DV)" number="1800 737 732" />
            <CrisisLine label="Kids Helpline" number="1800 55 1800" />
            <CrisisLine label="13YARN (Indigenous)" number="13 92 76" />
            <CrisisLine label="Emergency" number="000" />
          </Section>

          <View style={styles.linkRow}>
            <LinkBtn icon="logo-github" label="View on GitHub" onPress={() => open(GITHUB_URL)} />
            <LinkBtn icon="document-text-outline" label="Privacy Policy" onPress={() => open(PRIVACY_URL)} />
            <LinkBtn icon="reader-outline" label="Terms" onPress={() => open(TERMS_URL)} />
            <LinkBtn icon="globe-outline" label="Website" onPress={() => open(SITE_URL)} />
          </View>

          <Section title="Data attribution">
            <Text style={styles.attributionLine}>Service data: Australian government open data registers and OpenStreetMap.</Text>
            <Text style={styles.attributionLine}>
              Australian postcode centroids:{' '}
              <Text
                style={styles.attributionLink}
                onPress={() => open('https://www.matthewproctor.com/full_australian_postcodes')}
              >
                Matthew Proctor
              </Text>
              {' '}(CC-BY 4.0).
            </Text>
          </Section>

          <Text style={styles.footer}>Built on Australian government open data</Text>
          <Text style={styles.versionText}>{VERSION_LABEL}</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

function CrisisLine({ label, number }: { label: string; number: string }) {
  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        void Linking.openURL(`tel:${number.replace(/\s/g, '')}`);
      }}
      style={({ pressed }) => [styles.crisisLine, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityLabel={`Call ${label} at ${number}`}
    >
      <Text style={styles.crisisLabel}>{label}</Text>
      <Text style={styles.crisisNumber}>{number}</Text>
    </Pressable>
  );
}

function LinkBtn({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.linkBtn, pressed && { opacity: 0.7 }]}
      accessibilityRole="link"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={16} color={theme.colors.primary} />
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.surface },
  header: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: theme.colors.border, alignSelf: 'center', marginBottom: theme.spacing.sm },
  closeBtn: {
    position: 'absolute',
    right: theme.spacing.lg,
    top: theme.spacing.sm,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.xxxl },
  bodyText: { ...theme.type.subhead, color: theme.colors.text, lineHeight: 22 },
  openSourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.pill,
    marginBottom: theme.spacing.xl,
  },
  openSourceText: { ...theme.type.caption, color: theme.colors.text, fontWeight: '600' },
  mascotWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FBF6EE',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: { ...theme.type.title1, color: theme.colors.text, textAlign: 'center', marginBottom: 4 },
  tagline: {
    ...theme.type.callout,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },

  disclaimer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.warningMuted,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.xl,
  },
  disclaimerText: { ...theme.type.subhead, color: '#78350F', lineHeight: 20, flex: 1 },
  disclaimerEmphasis: { fontWeight: '700' },

  section: { marginBottom: theme.spacing.xl },
  sectionTitle: {
    ...theme.type.caption,
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },

  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  bulletDot: { ...theme.type.body, color: theme.colors.textSecondary, marginTop: -2 },
  bulletText: { ...theme.type.subhead, color: theme.colors.text, lineHeight: 22, flex: 1 },

  crisisLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  crisisLabel: { ...theme.type.subhead, color: theme.colors.text },
  crisisNumber: { ...theme.type.headline, color: theme.colors.primary, fontWeight: '600' },

  linkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: theme.colors.primaryMuted,
    borderRadius: theme.radius.md,
  },
  linkText: { ...theme.type.subhead, color: theme.colors.primary, fontWeight: '600' },

  footer: {
    ...theme.type.caption,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
  },
  versionText: {
    ...theme.type.caption,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.primaryMuted,
    borderRadius: theme.radius.md,
  },
  locationText: { ...theme.type.headline, color: theme.colors.primary, flex: 1 },
  attributionLine: { ...theme.type.footnote, color: theme.colors.textSecondary, lineHeight: 18, marginBottom: 6 },
  attributionLink: { color: theme.colors.primary, fontWeight: '500' },
});
