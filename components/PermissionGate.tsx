import * as Haptics from 'expo-haptics';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../lib/theme';
import { EmuMascot } from './EmuMascot';

type Props = {
  onAllow: () => void;
  onSkip: () => void;
  isRequesting?: boolean;
};

export function PermissionGate({ onAllow, onSkip, isRequesting }: Props) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.content}>
        <View style={styles.mascotWrap}>
          <EmuMascot size={140} variant="searching" />
        </View>
        <Text style={styles.title}>G'day. Let's find help nearby.</Text>
        <Text style={styles.body}>
          AOSI shows support services close to you — food relief, housing, mental health, and more across Australia.
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
        >
          <Text style={styles.primaryText}>{isRequesting ? 'Requesting…' : 'Use my location'}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}
          onPress={() => {
            void Haptics.selectionAsync();
            onSkip();
          }}
        >
          <Text style={styles.secondaryText}>Browse without location</Text>
        </Pressable>
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
  actions: { padding: theme.spacing.xl, gap: theme.spacing.md },
  primaryBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  primaryText: { ...theme.type.headline, color: '#fff' },
  secondaryBtn: { paddingVertical: 14, alignItems: 'center' },
  secondaryText: { ...theme.type.headline, color: theme.colors.primary },
  pressed: { opacity: 0.7 },
});
