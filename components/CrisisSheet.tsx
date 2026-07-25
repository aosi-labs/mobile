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

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function CrisisSheet({ visible, onClose }: Props) {
  const call = (phone: string) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    openLink(telUrl(phone));
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
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.title}>Someone to talk to, right now</Text>
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
              <Ionicons name="call" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
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
  header: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    alignSelf: 'center',
    marginBottom: theme.spacing.sm,
  },
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
  body: { paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.xl, paddingBottom: theme.spacing.xxxl },
  title: { ...theme.type.title1, color: theme.colors.text, marginBottom: theme.spacing.sm },
  sub: {
    ...theme.type.body,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },

  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.dangerMuted,
    borderWidth: 1,
    borderColor: 'rgba(194,69,45,0.25)',
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
    lineHeight: 19,
  },
  pressed: { opacity: 0.65 },
});
