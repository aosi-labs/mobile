import { Image, type ImageStyle, type StyleProp } from 'react-native';

const SOURCE = require('../assets/mascot.png');

type Variant = 'default' | 'searching' | 'concerned';

type Props = {
  size?: number;
  variant?: Variant;
  style?: StyleProp<ImageStyle>;
};

export function EmuMascot({ size = 120, style }: Props) {
  return (
    <Image
      source={SOURCE}
      style={[{ width: size, height: size, resizeMode: 'contain' }, style]}
      accessibilityLabel="AOSI emu mascot"
    />
  );
}

export function EmuMark({ size = 28, style }: { size?: number; style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      source={SOURCE}
      style={[{ width: size, height: size, resizeMode: 'contain' }, style]}
      accessibilityLabel="AOSI"
    />
  );
}
