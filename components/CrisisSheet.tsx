import { Ionicons } from '@expo/vector-icons';
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
import { CRISIS_LINES, smsUrl, telUrl } from '../lib/needs';
import { theme } from '../lib/theme';
import { SheetHeader } from './SheetHeader';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function CrisisSheet({ visible, onClose }: Props) {
  // Crisis calls get the strongest haptic in the app (the crisisCall
  // intent): a firm, reassuring confirmation that the call is happening.
  const call = (phone: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    openLink(telUrl(phone));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.root}>
        <SheetHeader onClose={onClose} />

        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.title} accessibilityRole="header">
            Someone to talk to, right now
          </Text>
          <Text style={styles.sub}>
            These lines are free and confidential, and answer 24 hours a day.
          </Text>

          <Pressable
            onPress={() => call('000')}
            style={({ pressed }) => [styles.emergencyCard, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="In immediate danger, call triple zero"
          >
            <View style={styles.emergencyIcon}>
              <Ionicons name="call" size={20} color={theme.colors.textOnPrimary} />
            </View>
            <View style={styles.emergencyTextWrap}>
              <Text style={styles.emergencyTitle}>In immediate danger?</Text>
              <Text style={styles.emergencySub}>Police, fire or ambulance</Text>
            </View>
            <Text style={styles.emergencyNumber}>000</Text>
          </Pressable>

          <View style={styles.lines}>
            {CRISIS_LINES.map((line, i) => (
              <View
                key={line.phone}
                style={[styles.lineBlock, i === CRISIS_LINES.length - 1 && styles.lineRowLast]}
              >
                <Pressable
                  onPress={() => call(line.phone)}
                  style={({ pressed }) => [styles.lineRow, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${line.name} on ${line.phone}. ${line.desc}.`}
                >
                  <View style={styles.lineIcon}>
                    <Ionicons name="call-outline" size={18} color={theme.colors.primaryDeep} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lineName}>{line.name}</Text>
                    <Text style={styles.lineDesc}>{line.desc}</Text>
                  </View>
                  <Text style={styles.lineNumber}>{line.phone}</Text>
                </Pressable>
                {line.sms ? (
                  <Pressable
                    onPress={() => {
                      void Haptics.selectionAsync();
                      openLink(smsUrl(line.sms!));
                    }}
                    hitSlop={{ top: 2, bottom: 8, left: 8, right: 8 }}
                    style={({ pressed }) => [styles.altAction, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Text ${line.name} on ${line.sms}`}
                  >
                    <Ionicons name="chatbubble-outline" size={13} color={theme.colors.primaryDeep} />
                    <Text style={styles.altActionText}>Prefer to text? {line.sms}</Text>
                  </Pressable>
                ) : null}
                {line.chatUrl ? (
                  <Pressable
                    onPress={() => {
                      void Haptics.selectionAsync();
                      openLink(line.chatUrl!);
                    }}
                    hitSlop={{ top: 2, bottom: 8, left: 8, right: 8 }}
                    style={({ pressed }) => [styles.altAction, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Chat online with ${line.name}`}
                  >
                    <Ionicons name="globe-outline" size={13} color={theme.colors.primaryDeep} />
                    <Text style={styles.altActionText}>Chat online instead</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>

          <Text style={styles.footer}>
            Tap a line to call, or use text and chat if talking is not safe right now. You don't
            need to be in crisis to reach out.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  body: { paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.xxxl },
  title: { ...theme.type.title1, color: theme.colors.text, marginBottom: theme.spacing.sm },
  sub: {
    ...theme.type.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },

  // The only red surface in the product.
  emergencyCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.dangerMuted,
    borderWidth: 1,
    borderColor: theme.colors.borderDangerSubtle,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.xl,
  },
  emergencyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyTextWrap: { flex: 1, minWidth: 150 },
  emergencyTitle: { ...theme.type.headline, color: theme.colors.dangerText },
  emergencySub: { ...theme.type.footnote, color: theme.colors.dangerText, marginTop: 1 },
  emergencyNumber: { ...theme.type.title2, color: theme.colors.danger, fontVariant: ['tabular-nums'] },

  lines: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
  },
  lineBlock: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.sm,
  },
  lineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  lineRowLast: { borderBottomWidth: 0 },
  altAction: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginLeft: 36 + 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.primaryMuted,
    borderRadius: theme.radius.pill,
    marginBottom: 4,
  },
  altActionText: { ...theme.type.footnote, fontWeight: '600', color: theme.colors.primaryDeep },
  lineIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineName: { ...theme.type.headline, color: theme.colors.text },
  lineDesc: { ...theme.type.footnote, color: theme.colors.textSecondary, marginTop: 1 },
  lineNumber: { ...theme.type.callout, fontWeight: '700', color: theme.colors.primaryDeep, fontVariant: ['tabular-nums'] },

  footer: {
    ...theme.type.footnote,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
  pressed: { opacity: theme.pressedOpacity },
});
