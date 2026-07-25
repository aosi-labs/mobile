import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { catColor, catIcon, catLabel } from '../lib/constants';
import { formatDistance } from '../lib/geo';
import { openLink } from '../lib/links';
import { telUrl } from '../lib/needs';
import { readiness } from '../lib/readiness';
import { theme, tint } from '../lib/theme';
import type { Service } from '../lib/types';
import { PressableScale } from './PressableScale';
import { ReadinessPill } from './ReadinessPill';

type Props = {
  service: Service;
  distanceMeters?: number | null;
  onPress: () => void;
};

export function ServiceCard({ service, distanceMeters, onPress }: Props) {
  const r = readiness(service);
  const color = catColor(service.category);
  const location = [service.suburb, service.state].filter(Boolean).join(', ');

  const callService = () => {
    if (!service.phone) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openLink(telUrl(service.phone));
  };

  // The outer button flattens its subtree for VoiceOver, so the nested call
  // button would be unreachable. Custom accessibility actions put Call on
  // the rotor instead.
  const a11yActions = service.phone
    ? [{ name: 'activate' }, { name: 'call', label: `Call ${service.name}` }]
    : [{ name: 'activate' }];

  return (
    <PressableScale
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${service.name}, ${catLabel(service.category)}, ${location || 'location unknown'}. ${r.label}${service.phone ? '. Has a phone number' : ''}`}
      accessibilityHint="Opens the service details. Swipe up or down for more actions."
      accessibilityActions={a11yActions}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'call') callService();
        else onPress();
      }}
    >
      <View style={[styles.rail, { backgroundColor: color }]} />
      <View style={[styles.iconWrap, { backgroundColor: tint(color, 'faint') }]}>
        <Ionicons name={catIcon(service.category, 'outline')} size={22} color={color} />
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={2}>
            {service.name}
          </Text>
          {distanceMeters != null ? (
            <Text style={styles.distance}>{formatDistance(distanceMeters)}</Text>
          ) : null}
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaText} numberOfLines={1}>
            {catLabel(service.category)}
            {location ? ` · ${location}` : ''}
          </Text>
        </View>
        <View style={styles.tagRow}>
          <ReadinessPill service={service} />
        </View>
      </View>
      {service.phone ? (
        <Pressable
          onPress={callService}
          hitSlop={8}
          style={({ pressed }) => [styles.callBtn, pressed && { opacity: theme.pressedOpacity }]}
          accessibilityRole="button"
          accessibilityLabel={`Call ${service.name}`}
        >
          <Ionicons name="call" size={17} color={theme.colors.textOnPrimary} />
        </Pressable>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
      )}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginHorizontal: theme.layout.gutter,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadow,
  },
  rail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.tile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm },
  name: { ...theme.type.headline, color: theme.colors.text, flex: 1 },
  distance: {
    ...theme.type.footnote,
    fontWeight: '700',
    color: theme.colors.accentDeep,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  metaRow: { marginTop: 2 },
  metaText: { ...theme.type.footnote, color: theme.colors.textSecondary },
  tagRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  // No nested shadow: the card carries the elevation, controls inside it
  // stay flat.
  callBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
