import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import * as Haptics from 'expo-haptics';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { openLink } from '../lib/links';
import { CRISIS_LINES, telUrl } from '../lib/needs';
import { theme } from '../lib/theme';
import { EmuMascot } from './EmuMascot';
import { SheetHeader } from './SheetHeader';

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
    openLink(url);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.root}>
        <SheetHeader onClose={onClose} />
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.mascotWrap}>
            <EmuMascot size={88} />
          </View>
          <Text style={styles.title} accessibilityRole="header">
            About aosi
          </Text>
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
              aosi pulls together publicly available support service data from official Australian sources:
              food relief, housing, mental health, legal help, and more. The aim is to make help easier to
              find, especially when you're in a hurry or on patchy connectivity.
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
            <Bullet>Your location stays on your device. We never send it anywhere.</Bullet>
          </Section>

          <Section title="Location">
            <Pressable
              onPress={() => {
                void Haptics.selectionAsync();
                onChangeLocation();
              }}
              style={({ pressed }) => [styles.locationRow, pressed && { opacity: theme.pressedOpacity }]}
              accessibilityRole="button"
              accessibilityLabel="Change location"
              accessibilityHint="Switch between GPS, postcode, or no location"
            >
              <Ionicons name="location-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.locationText}>Change location</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textTertiary} />
            </Pressable>
          </Section>

          {/* One source of truth: the same CRISIS_LINES that power the crisis
              sheet, in the same order, with the same plain-language
              descriptions. Never hardcode a crisis number here. */}
          <Section title="Crisis lines">
            <Text style={styles.bodyText}>
              If you're in immediate danger or need urgent help right now:
            </Text>
            <View style={{ height: 8 }} />
            {CRISIS_LINES.map((line) => (
              <CrisisLine key={line.phone} label={line.name} number={line.phone} desc={line.desc} />
            ))}
            <CrisisLine label="Emergency" number="000" desc="Police, fire or ambulance" />
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
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
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

function CrisisLine({ label, number, desc }: { label: string; number: string; desc?: string }) {
  return (
    <Pressable
      onPress={() => {
        // Crisis calls always get the crisisCall haptic (medium impact).
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        openLink(telUrl(number));
      }}
      style={({ pressed }) => [styles.crisisLine, pressed && { opacity: theme.pressedOpacity }]}
      accessibilityRole="button"
      accessibilityLabel={`Call ${label} at ${number}${desc ? `. ${desc}` : ''}`}
    >
      <View style={styles.crisisTextWrap}>
        <Text style={styles.crisisLabel}>{label}</Text>
        {desc ? <Text style={styles.crisisDesc}>{desc}</Text> : null}
      </View>
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
      style={({ pressed }) => [styles.linkBtn, pressed && { opacity: theme.pressedOpacity }]}
      accessibilityRole="link"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={16} color={theme.colors.primary} />
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  body: { paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.xxxl, paddingTop: theme.spacing.md },
  bodyText: { ...theme.type.subhead, color: theme.colors.text },
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
    backgroundColor: theme.colors.surfaceWarm,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
  disclaimerText: { ...theme.type.subhead, color: theme.colors.warningText, flex: 1 },
  disclaimerEmphasis: { fontWeight: '700' },

  section: { marginBottom: theme.spacing.xl },
  sectionTitle: {
    ...theme.type.eyebrow,
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.sm,
  },

  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  bulletDot: { ...theme.type.body, color: theme.colors.textSecondary, marginTop: -2 },
  bulletText: { ...theme.type.subhead, color: theme.colors.text, flex: 1 },

  crisisLine: {
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  crisisTextWrap: { flex: 1 },
  crisisLabel: { ...theme.type.subhead, color: theme.colors.text, fontWeight: '600' },
  crisisDesc: { ...theme.type.footnote, color: theme.colors.textSecondary, marginTop: 1 },
  crisisNumber: {
    ...theme.type.headline,
    color: theme.colors.primary,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },

  linkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  linkBtn: {
    minHeight: 44,
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
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.primaryMuted,
    borderRadius: theme.radius.md,
  },
  locationText: { ...theme.type.headline, color: theme.colors.primary, flex: 1 },
  attributionLine: { ...theme.type.footnote, color: theme.colors.textSecondary, marginBottom: 6 },
  attributionLink: { color: theme.colors.primary, fontWeight: '500' },
});
