import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CAT, catColor, catColorDeep, catIcon, catLabel } from '../lib/constants';
import { NEEDS } from '../lib/needs';
import { theme, tint } from '../lib/theme';
import { PressableScale } from './PressableScale';

// Category filter chips. The 8 plain-language needs lead, the remaining
// categories follow, and a leading "Everything" chip clears the filter so
// deselect-by-retap is never the only way out. Chips emit CATEGORY keys.
type Chip = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

const NEED_CHIPS: Chip[] = NEEDS.map((n) => ({
  key: n.category,
  label: n.label,
  icon: n.icon,
  color: n.color,
}));
const REST_CHIPS: Chip[] = Object.keys(CAT)
  .filter((c) => !NEED_CHIPS.some((n) => n.key === c))
  .map((c) => ({
    key: c,
    label: catLabel(c),
    icon: catIcon(c, 'filled'),
    color: catColor(c),
  }));
const CHIPS: Chip[] = [...NEED_CHIPS, ...REST_CHIPS];

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
      <PressableScale
        onPress={() => onChange(null)}
        scaleTo={0.94}
        style={[styles.chip, styles.allChip, active === null && styles.allChipActive]}
        accessibilityRole="button"
        accessibilityLabel="Show everything"
        accessibilityState={{ selected: active === null }}
      >
        <Text style={[styles.label, active === null && styles.allLabelActive]}>Everything</Text>
      </PressableScale>
      {CHIPS.map((chip) => {
        const isActive = active === chip.key;
        const deep = catColorDeep(chip.key);
        return (
          <PressableScale
            key={chip.key}
            onPress={() => onChange(isActive ? null : chip.key)}
            scaleTo={0.94}
            style={[
              styles.chip,
              { backgroundColor: tint(chip.color, 'faint'), borderColor: tint(chip.color, 'strong') },
              // Active stays ink-on-tint (like inactive, like every other
              // chip in the app) but saturates: deeper fill, solid border,
              // solid icon bubble. No white-on-raw-colour text.
              isActive && { backgroundColor: tint(chip.color, 'soft'), borderColor: chip.color },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${chip.label} filter`}
            accessibilityState={{ selected: isActive }}
          >
            <View
              style={[
                styles.iconBubble,
                { backgroundColor: isActive ? chip.color : tint(chip.color, 'soft') },
              ]}
            >
              <Ionicons
                name={chip.icon}
                size={14}
                color={isActive ? theme.colors.textOnPrimary : chip.color}
              />
            </View>
            <Text style={[styles.label, isActive && { color: deep, fontWeight: '700' }]}>
              {chip.label}
            </Text>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: theme.layout.gutter,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  chip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
  },
  allChip: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderStrong,
  },
  allChipActive: {
    backgroundColor: theme.colors.primaryMuted,
    borderColor: theme.colors.primary,
  },
  allLabelActive: {
    color: theme.colors.primaryDeep,
    fontWeight: '700',
  },
  iconBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { ...theme.type.footnote, fontWeight: '600', color: theme.colors.text },
});
