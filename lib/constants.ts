import type { Ionicons } from '@expo/vector-icons';

export const CAT: Record<string, string> = {
  food: 'Food Relief',
  housing: 'Housing',
  health: 'Health',
  mental_health: 'Mental Health',
  legal: 'Legal',
  employment: 'Employment',
  education: 'Education',
  disability: 'Disability',
  family: 'Family',
  community: 'Community',
  financial: 'Financial',
  alcohol_drugs: 'Alcohol & Drugs',
  information: 'Information',
  transport: 'Transport',
  personal_care: 'Personal Care',
  technology: 'Technology',
  other: 'Other',
};

// ============================================================
// Category palette: warm, desaturated hues harmonised with the
// paper canvas (#FAF5EC). Rules, enforced by scripts/contrast:
//   - No red. Red rescues; it belongs to the 000 card alone.
//     family and alcohol_drugs, the doors a person fleeing
//     violence or in addiction crisis taps, must never wear it.
//   - No two categories share a hex.
//   - Every hue >= 3:1 on paper (icons, rails, map pins).
//   - Every DEEP variant >= 4.5:1 on white and on its own
//     faint-tint chip surface (badge and chip text).
// Raw category colour is for icons, rails, dots, and markers
// only; text on tinted chips always uses the DEEP variant
// (BRAND.md rule 3).
// ============================================================
export const CAT_COLOR: Record<string, string> = {
  food: '#4C8A4C', // moss
  housing: '#B37B2D', // amber
  health: '#3D6FA8', // blue
  mental_health: '#7A5BAB', // violet
  legal: '#8A5C3A', // umber (kept well clear of danger red)
  employment: '#2F8A6B', // sea green
  education: '#3596AD', // teal-cyan
  disability: '#A34E92', // magenta
  family: '#7C3D74', // plum
  community: '#7A8C3E', // olive
  financial: '#8F751F', // bronze
  alcohol_drugs: '#275C66', // deep teal
  information: '#5A66BE', // periwinkle
  transport: '#6E7B8A', // cool slate
  personal_care: '#A8705F', // dusty rose
  technology: '#454099', // indigo
  other: '#837A6B', // warm grey
};

// Text-safe darkened variants of each hue.
export const CAT_COLOR_DEEP: Record<string, string> = {
  food: '#326032',
  housing: '#7D5220',
  health: '#2C5178',
  mental_health: '#55407D',
  legal: '#63402A',
  employment: '#1F5F49',
  education: '#266E7E',
  disability: '#7A386C',
  family: '#5E2E58',
  community: '#55622A',
  financial: '#6B5717',
  alcohol_drugs: '#1F4A52',
  information: '#414D91',
  transport: '#4C5866',
  personal_care: '#7C4C41',
  technology: '#37326F',
  other: '#5F5749',
};

// One icon per category. `filled` for solid surfaces (map markers),
// `outline` for tinted tiles (cards, hero). One map, two variants, so a
// new category touches one file.
const CAT_ICON: Record<string, string> = {
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

export const SOURCE_VINTAGE: Record<string, { label: string; year: number }> = {
  fed_emergency_relief: { label: 'Oct 2016', year: 2016 },
  fed_employment_services: { label: 'May 2016', year: 2016 },
  sa_community_directory: { label: '2021', year: 2021 },
  qld_breastscreen: { label: 'Jul 2023', year: 2023 },
  sa_child_family_health: { label: '2015', year: 2015 },
  vic_neighbourhood_houses: { label: 'May 2013', year: 2013 },
};

export const catColor = (cat: string): string => CAT_COLOR[cat] || CAT_COLOR.other;
export const catColorDeep = (cat: string): string => CAT_COLOR_DEEP[cat] || CAT_COLOR_DEEP.other;
export const catLabel = (cat: string): string => CAT[cat] || 'Other';

export function catIcon(
  cat: string,
  variant: 'filled' | 'outline'
): keyof typeof Ionicons.glyphMap {
  const base = CAT_ICON[cat] || CAT_ICON.other;
  return (variant === 'outline' ? `${base}-outline` : base) as keyof typeof Ionicons.glyphMap;
}
