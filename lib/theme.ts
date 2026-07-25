import { Platform } from 'react-native';

// ============================================================
// AOSI BRAND: "Eucalyptus + Ochre on Paper"
// The official colour system for aosi (app, web, and collateral).
// See BRAND.md at the repo root for usage rules.
//
//   Eucalyptus green  - primary. Trust, calm, action. All primary
//                       buttons, active states, links.
//   Ochre terracotta  - warmth and urgency. Crisis surfaces and
//                       key data (distance) ONLY. Never decoration.
//   Paper neutrals    - warm cream canvas, white cards, taupe text.
//   Danger red        - reserved for 000/emergency only.
//
// Every text/background pair here meets WCAG AA on its intended
// surface (textTertiary 5.1:1 on bg, accentDeep 5.4:1 on bg,
// white 6.1:1 on primary).
// ============================================================

// Tinted fills are always derived through tint() so alpha levels stay
// consistent app-wide. Never concatenate hex-alpha suffixes at call sites.
//   faint  - chip and tile fills behind deep text
//   soft   - icon bubbles, selected fills
//   strong - emphasised borders on tinted surfaces
export type TintLevel = 'faint' | 'soft' | 'strong';
const TINT_ALPHA: Record<TintLevel, string> = { faint: '14', soft: '26', strong: '55' };
export function tint(hex: string, level: TintLevel): string {
  return `${hex}${TINT_ALPHA[level]}`;
}

export const theme = {
  colors: {
    bg: '#FAF5EC',
    surface: '#FFFFFF',
    surfaceWarm: '#FFFDF8',
    surfaceMuted: '#F4EDE0',
    border: '#EBE2D2',
    borderStrong: '#D9CDB8',
    text: '#2B2620',
    textSecondary: '#6B5F4F',
    textTertiary: '#75664F',
    primary: '#2F6D54',
    primaryDeep: '#24543F',
    primaryMuted: '#E4EFE8',
    accent: '#D97742',
    accentDeep: '#A34A22',
    accentMuted: '#FBEADD',
    success: '#2E8B57',
    successMuted: '#E0F2E7',
    successText: '#1F5C3D',
    warning: '#C77B1E',
    warningMuted: '#FCEFD9',
    warningText: '#7A4A0E',
    danger: '#C2452D',
    dangerMuted: '#FAE3DD',
    dangerText: '#8A2F1E',
    // Text on solid primary/accent/danger fills. Named so a future
    // palette change re-audits one token, not 23 literals.
    textOnPrimary: '#FFFFFF',
    // Subtle alpha borders derived from brand colours. Derived HERE so
    // they cannot silently keep stale colours if the brand shifts.
    borderPrimarySubtle: 'rgba(47, 109, 84, 0.18)',
    borderAccentSubtle: 'rgba(217, 119, 66, 0.30)',
    borderDangerSubtle: 'rgba(194, 69, 45, 0.25)',
    scrim: 'rgba(43, 38, 32, 0.88)',
  },
  radius: {
    sm: 10,
    // Squircle icon tiles (need grid, card icons, sheet hero).
    tile: 13,
    md: 14,
    lg: 18,
    xl: 24,
    pill: 999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  layout: {
    // One horizontal gutter for every screen's scroll column, so screen
    // transitions never jog the content edge.
    gutter: 20,
  },
  // Pressed-state opacity for bare link Pressables that don't use
  // PressableScale's spring feedback.
  pressedOpacity: 0.7,
  type: {
    // lineHeight lives in the ramp so vertical rhythm is decided once.
    // RN scales lineHeight with Dynamic Type alongside fontSize.
    largeTitle: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -0.5, lineHeight: 38 },
    title1: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.4, lineHeight: 34 },
    title2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3, lineHeight: 28 },
    title3: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.2, lineHeight: 26 },
    headline: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
    body: { fontSize: 17, fontWeight: '400' as const, lineHeight: 24 },
    callout: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
    subhead: { fontSize: 15, fontWeight: '400' as const, lineHeight: 20 },
    footnote: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
    caption: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
    // Uppercase section micro-label ("AUSTRALIAN POSTCODE", "ABOUT THIS
    // LISTING"). One definition; the three prior copies had drifted.
    eyebrow: {
      fontSize: 12,
      fontWeight: '700' as const,
      letterSpacing: 0.6,
      lineHeight: 16,
      textTransform: 'uppercase' as const,
    },
  },
  // Elevation rule: cards get shadow, floating/overlay controls get
  // shadowLifted, controls INSIDE a shadowed card get none.
  shadow: Platform.select({
    ios: {
      shadowColor: '#5C4A2E',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 10,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }) as object,
  shadowLifted: Platform.select({
    ios: {
      shadowColor: '#5C4A2E',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 18,
    },
    android: {
      elevation: 6,
    },
    default: {},
  }) as object,
};
