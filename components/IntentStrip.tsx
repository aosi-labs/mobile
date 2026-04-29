import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../lib/theme';

export type Intent = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  category: string;
};

export const INTENTS: Intent[] = [
  { key: 'food', label: 'Food', icon: 'fast-food', color: '#16a34a', category: 'food' },
  { key: 'housing', label: 'Housing', icon: 'home', color: '#d97706', category: 'housing' },
  { key: 'mental_health', label: 'Talk to someone', icon: 'chatbubbles', color: '#7c3aed', category: 'mental_health' },
  { key: 'financial', label: 'Money help', icon: 'wallet', color: '#ca8a04', category: 'financial' },
  { key: 'health', label: 'Health', icon: 'medkit', color: '#2563eb', category: 'health' },
  { key: 'legal', label: 'Legal', icon: 'document-text', color: '#ea580c', category: 'legal' },
  { key: 'employment', label: 'Jobs', icon: 'briefcase', color: '#059669', category: 'employment' },
  { key: 'family', label: 'Family', icon: 'people', color: '#dc2626', category: 'family' },
];

type Props = {
  active: string | null;
  onChange: (key: string | null) => void;
};

export function IntentStrip({ active, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {INTENTS.map((intent) => {
        const isActive = active === intent.key;
        return (
          <Pressable
            key={intent.key}
            onPress={() => {
              void Haptics.selectionAsync();
              onChange(isActive ? null : intent.key);
            }}
            style={({ pressed }) => [
              styles.chip,
              isActive && { backgroundColor: intent.color, borderColor: intent.color },
              pressed && { opacity: 0.7 },
            ]}
          >
            <View style={[styles.iconBubble, isActive ? styles.iconBubbleActive : { backgroundColor: intent.color + '1A' }]}>
              <Ionicons name={intent.icon} size={14} color={isActive ? '#fff' : intent.color} />
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>{intent.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconBubble: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubbleActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  label: { ...theme.type.footnote, fontWeight: '600', color: theme.colors.text },
  labelActive: { color: '#fff' },
});
