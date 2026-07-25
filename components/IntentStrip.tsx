import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NEEDS } from '../lib/needs';
import { theme } from '../lib/theme';
import { PressableScale } from './PressableScale';

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
      {NEEDS.map((need) => {
        const isActive = active === need.key;
        return (
          <PressableScale
            key={need.key}
            onPress={() => onChange(isActive ? null : need.key)}
            scaleTo={0.94}
            style={[
              styles.chip,
              { backgroundColor: need.color + '14', borderColor: need.color + '33' },
              isActive && { backgroundColor: need.color, borderColor: need.color },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${need.label} filter`}
            accessibilityState={{ selected: isActive }}
          >
            <View style={[styles.iconBubble, isActive ? styles.iconBubbleActive : { backgroundColor: need.color + '26' }]}>
              <Ionicons name={need.icon} size={14} color={isActive ? '#fff' : need.color} />
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>{need.label}</Text>
          </PressableScale>
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
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
  },
  iconBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubbleActive: { backgroundColor: 'rgba(255,255,255,0.28)' },
  label: { ...theme.type.footnote, fontWeight: '600', color: theme.colors.text },
  labelActive: { color: '#fff' },
});
