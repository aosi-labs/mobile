import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { catColor, catIcon } from '../lib/constants';
import { theme } from '../lib/theme';

// Map pin. A record geocoded only to a postcode centroid renders as a
// dashed ring, not a confident solid pin: the marker itself is honest about
// how precise the location is.
type Props = {
  category: string;
  precision?: string;
};

export function CategoryMarker({ category, precision }: Props) {
  const color = catColor(category);

  if (precision === 'postcode') {
    return (
      <View style={[styles.approxOuter, { borderColor: color }]}>
        <View style={[styles.approxInner, { backgroundColor: color }]} />
      </View>
    );
  }

  return (
    <View style={[styles.solid, { backgroundColor: color }]}>
      <Ionicons name={catIcon(category, 'filled')} size={11} color={theme.colors.textOnPrimary} />
    </View>
  );
}

const styles = StyleSheet.create({
  solid: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    // Warm shadow to match the app's elevation story (not pure black).
    shadowColor: '#5C4A2E',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  approxOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approxInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
