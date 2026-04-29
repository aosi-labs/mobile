import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { theme } from '../lib/theme';

export function SkeletonList({ count = 6 }: { count?: number }) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <Animated.View key={i} style={[styles.card, { opacity: pulse }]}>
          <View style={styles.icon} />
          <View style={styles.body}>
            <View style={[styles.line, { width: '70%' }]} />
            <View style={[styles.line, { width: '45%', marginTop: 8 }]} />
            <View style={[styles.line, { width: '30%', marginTop: 8, height: 10 }]} />
          </View>
        </Animated.View>
      ))}
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
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.radius.md,
  },
  icon: { width: 44, height: 44, borderRadius: theme.radius.md, backgroundColor: theme.colors.border },
  body: { flex: 1 },
  line: { height: 12, borderRadius: 6, backgroundColor: theme.colors.border },
});
