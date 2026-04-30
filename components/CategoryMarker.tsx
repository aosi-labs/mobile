import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { catColor } from '../lib/constants';

const CATEGORY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  food: 'fast-food',
  housing: 'home',
  health: 'medkit',
  mental_health: 'heart',
  legal: 'document-text',
  employment: 'briefcase',
  education: 'school',
  disability: 'accessibility',
  family: 'people',
  community: 'people-circle',
  financial: 'wallet',
  alcohol_drugs: 'flask',
  information: 'information-circle',
  transport: 'bus',
  personal_care: 'hand-left',
  technology: 'laptop',
  other: 'ellipsis-horizontal',
};

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

  const iconName = CATEGORY_ICON[category] ?? 'ellipsis-horizontal';

  return (
    <View style={[styles.solid, { backgroundColor: color }]}>
      <Ionicons name={iconName} size={11} color="#fff" />
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
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
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
