import { Image, type ImageStyle, type StyleProp } from 'react-native';

const SOURCE = require('../assets/mascot.png');

// The emu is decorative. It stays silent for screen readers unless a label
// is explicitly passed, so VoiceOver users hear the empty-state message,
// not "AOSI emu mascot" before it.
// `variant` is reserved for the commissioned artwork set (searching,
// concerned poses); the placeholder renders one image for all variants.
type Variant = 'default' | 'searching' | 'concerned';

type Props = {
  size?: number;
  variant?: Variant;
  label?: string;
  style?: StyleProp<ImageStyle>;
};

export function EmuMascot({ size = 120, label, style }: Props) {
  return (
    <Image
      source={SOURCE}
      style={[{ width: size, height: size, resizeMode: 'contain' }, style]}
      accessible={!!label}
      accessibilityLabel={label}
      accessibilityElementsHidden={!label}
      importantForAccessibility={label ? 'auto' : 'no-hide-descendants'}
    />
  );
}

export function EmuMark({ size = 28, style }: { size?: number; style?: StyleProp<ImageStyle> }) {
  // Sits beside the "aosi" wordmark, which already carries the name.
  return (
    <Image
      source={SOURCE}
      style={[{ width: size, height: size, resizeMode: 'contain' }, style]}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
