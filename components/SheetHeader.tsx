import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { haptics } from '../lib/motion';
import { theme } from '../lib/theme';
import { PressableScale } from './PressableScale';

// The one modal-sheet header: grab handle + labelled close button. The
// close button's accessibility props are baked in, not overridable, because
// the copy-paste version of this header once shipped without them.
type Props = {
  onClose: () => void;
  title?: string;
};

export function SheetHeader({ onClose, title }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.handle} />
      {title ? (
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
      ) : null}
      <PressableScale
        onPress={onClose}
        haptic={haptics.navigate}
        accessibilityRole="button"
        accessibilityLabel="Close"
        hitSlop={12}
        style={styles.closeBtn}
      >
        <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xs,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.borderStrong,
  },
  title: {
    ...theme.type.headline,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
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
});
