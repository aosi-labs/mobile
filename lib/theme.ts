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
    cream: '#FBF6EE',
  },
  radius: {
    sm: 10,
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
  type: {
    largeTitle: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -0.5 },
    title1: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.4 },
    title2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
    title3: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.2 },
    headline: { fontSize: 17, fontWeight: '600' as const },
    body: { fontSize: 17, fontWeight: '400' as const },
    callout: { fontSize: 16, fontWeight: '400' as const },
    subhead: { fontSize: 15, fontWeight: '400' as const },
    footnote: { fontSize: 13, fontWeight: '400' as const },
    caption: { fontSize: 12, fontWeight: '600' as const },
  },
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
