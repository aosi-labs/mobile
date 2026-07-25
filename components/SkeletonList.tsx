import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useReducedMotion } from '../lib/motion';
import { theme } from '../lib/theme';

// Loading placeholders. One accessible element ("Finding services"), the
// decorative cards hidden from screen readers. Pulse respects reduce motion.
// variant='shortlist' mirrors ShortlistCard geometry (rank circle, action
// row) so the swap to real content doesn't jump.
type Props = {
  count?: number;
  variant?: 'list' | 'shortlist';
};

export function SkeletonList({ count = 6, variant = 'list' }: Props) {
  const reducedMotion = useReducedMotion();
  const pulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (reducedMotion) {
      pulse.setValue(0.6);
      return;
    }
    pulse.setValue(0.4);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reducedMotion]);

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel="Finding services"
      accessibilityElementsHidden={false}
      importantForAccessibility="yes"
    >
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {Array.from({ length: count }).map((_, i) =>
          variant === 'shortlist' ? (
            <Animated.View key={i} style={[styles.shortlistCard, { opacity: pulse }]}>
              <View style={styles.shortlistTop}>
                <View style={styles.rankCircle} />
                <View style={styles.shortlistLines}>
                  <View style={[styles.line, { width: '75%' }]} />
                  <View style={[styles.line, { width: '40%', marginTop: 8, height: 10 }]} />
                </View>
              </View>
              <View style={styles.actionRow}>
                <View style={styles.actionPill} />
                <View style={styles.actionPill} />
              </View>
            </Animated.View>
          ) : (
            <Animated.View key={i} style={[styles.card, { opacity: pulse }]}>
              <View style={styles.icon} />
              <View style={styles.body}>
                <View style={[styles.line, { width: '70%' }]} />
                <View style={[styles.line, { width: '45%', marginTop: 8 }]} />
                <View style={[styles.line, { width: '30%', marginTop: 8, height: 10 }]} />
              </View>
            </Animated.View>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: theme.spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    marginHorizontal: theme.layout.gutter,
    marginBottom: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.tile,
    backgroundColor: theme.colors.surfaceMuted,
  },
  body: { flex: 1 },
  line: { height: 12, borderRadius: 6, backgroundColor: theme.colors.surfaceMuted },

  shortlistCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadow,
  },
  shortlistTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  rankCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.surfaceMuted,
  },
  shortlistLines: { flex: 1 },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  actionPill: {
    flex: 1,
    height: 44,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surfaceMuted,
  },
});
