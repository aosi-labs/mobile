import { StyleSheet, Text, View } from 'react-native';
import { readiness } from '../lib/readiness';
import { theme } from '../lib/theme';
import type { Service } from '../lib/types';

// The one readiness treatment. Readiness is the app's core honesty signal;
// it must look identical on every surface so people can learn it once, and
// it must never rely on colour alone (fill + dot + label, for colour-blind
// users). Stale data gets caution amber, never danger red: the honest
// message is "call first", never "avoid". Red is reserved for the 000 card.
type Props = {
  service: Service;
  compact?: boolean;
};

export function ReadinessPill({ service, compact }: Props) {
  const r = readiness(service);
  const ready = r.key === 'ready';
  return (
    <View
      style={[
        styles.pill,
        compact && styles.pillCompact,
        { backgroundColor: ready ? theme.colors.successMuted : theme.colors.warningMuted },
      ]}
      accessible
      accessibilityLabel={r.label}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: ready ? theme.colors.success : theme.colors.warning },
        ]}
      />
      <Text
        style={[
          styles.label,
          { color: ready ? theme.colors.successText : theme.colors.warningText },
        ]}
        numberOfLines={1}
      >
        {r.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
  },
  pillCompact: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    ...theme.type.caption,
  },
});
