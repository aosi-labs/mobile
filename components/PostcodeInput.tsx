import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { lookupPostcode, type PostcodeEntry } from '../lib/postcodes';
import { theme } from '../lib/theme';

type Props = {
  visible: boolean;
  initialValue?: string;
  onCancel: () => void;
  onConfirm: (entry: PostcodeEntry) => void;
};

export function PostcodeInput({ visible, initialValue, onCancel, onConfirm }: Props) {
  const [value, setValue] = useState(initialValue ?? '');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setValue(initialValue ?? '');
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [visible, initialValue]);

  const match = lookupPostcode(value);
  const ready = !!match;
  const showError = value.length === 4 && !match;

  const submit = () => {
    if (!match) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onConfirm(match);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <SafeAreaView style={styles.root}>
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              void Haptics.selectionAsync();
              onCancel();
            }}
            hitSlop={12}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Enter postcode</Text>
          <Pressable
            onPress={submit}
            disabled={!ready}
            hitSlop={12}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel="Use this postcode"
            accessibilityState={{ disabled: !ready }}
          >
            <Text style={[styles.doneText, !ready && styles.doneDisabled]}>Use</Text>
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.label}>Australian postcode</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="location-outline" size={18} color={theme.colors.textTertiary} />
            <TextInput
              ref={inputRef}
              value={value}
              onChangeText={(v) => setValue(v.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="3000"
              placeholderTextColor={theme.colors.textTertiary}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={submit}
              accessibilityLabel="Postcode"
            />
          </View>

          {match ? (
            <View style={styles.matchCard}>
              <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
              <View style={{ flex: 1 }}>
                <Text style={styles.matchLocality}>{match.locality}, {match.state}</Text>
                <Text style={styles.matchHint}>We'll show services near {match.locality}.</Text>
              </View>
            </View>
          ) : showError ? (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle" size={18} color={theme.colors.warning} />
              <Text style={styles.errorText}>That postcode isn't recognised. Check the digits and try again.</Text>
            </View>
          ) : (
            <Text style={styles.hint}>
              Enter your 4-digit Australian postcode. We'll find services near that area without using GPS.
            </Text>
          )}

          <Text style={styles.privacy}>
            Your postcode stays on your device. Nothing is tracked or shared.
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  headerBtn: { paddingVertical: 4, minWidth: 60 },
  headerTitle: { ...theme.type.headline, color: theme.colors.text, textAlign: 'center', flex: 1 },
  cancelText: { ...theme.type.callout, color: theme.colors.primary },
  doneText: { ...theme.type.callout, color: theme.colors.primary, fontWeight: '600', textAlign: 'right' },
  doneDisabled: { color: theme.colors.textTertiary, fontWeight: '500' },

  body: { padding: theme.spacing.xl, gap: theme.spacing.lg },
  label: {
    ...theme.type.caption,
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderStrong,
    borderRadius: theme.radius.lg,
    ...theme.shadow,
  },
  input: {
    flex: 1,
    ...theme.type.title2,
    color: theme.colors.text,
    padding: 0,
    fontVariant: ['tabular-nums'],
    letterSpacing: 4,
  },

  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.successMuted,
    borderRadius: theme.radius.lg,
  },
  matchLocality: { ...theme.type.headline, color: theme.colors.successText },
  matchHint: { ...theme.type.footnote, color: theme.colors.successText, marginTop: 2 },

  // A typo is a caution moment, not a danger one; red stays reserved for 000.
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.warningMuted,
    borderRadius: theme.radius.lg,
  },
  errorText: { ...theme.type.subhead, color: theme.colors.warningText, flex: 1, lineHeight: 20 },

  hint: { ...theme.type.subhead, color: theme.colors.textSecondary, lineHeight: 20 },
  privacy: { ...theme.type.footnote, color: theme.colors.textTertiary },
});
