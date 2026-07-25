import type { Ionicons } from '@expo/vector-icons';

import { catColor } from './constants';

// A "need" is a plain-language door into the dataset. Labels are written for a
// stressed person, not a database: "Talk to someone", not "Mental Health".
// Colors come from catColor() so needs and categories can never drift apart.

export type CrisisNote = {
  text: string;
  label: string;
  phone: string;
};

export type Need = {
  key: string;
  label: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  category: string;
  crisisNote?: CrisisNote;
};

export const NEEDS: Need[] = [
  {
    key: 'food',
    label: 'Food',
    sub: 'Meals and food relief',
    icon: 'fast-food',
    color: catColor('food'),
    category: 'food',
  },
  {
    key: 'housing',
    label: 'Housing',
    sub: 'Somewhere safe to stay',
    icon: 'home',
    color: catColor('housing'),
    category: 'housing',
  },
  {
    key: 'mental_health',
    label: 'Talk to someone',
    sub: 'Support for tough times',
    icon: 'chatbubbles',
    color: catColor('mental_health'),
    category: 'mental_health',
    crisisNote: {
      text: "If this can't wait, Lifeline is free, confidential, and answers 24 hours a day.",
      label: 'Lifeline',
      phone: '13 11 14',
    },
  },
  {
    key: 'financial',
    label: 'Money help',
    sub: 'Bills, debt and emergencies',
    icon: 'wallet',
    color: catColor('financial'),
    category: 'financial',
    crisisNote: {
      text: 'If money worries are getting on top of you, the National Debt Helpline gives free financial counselling. It is not a lender.',
      label: 'National Debt Helpline',
      phone: '1800 007 007',
    },
  },
  {
    key: 'health',
    label: 'Health',
    sub: 'Doctors and clinics',
    icon: 'medkit',
    color: catColor('health'),
    category: 'health',
  },
  {
    key: 'legal',
    label: 'Legal',
    sub: 'Advice and your rights',
    icon: 'document-text',
    color: catColor('legal'),
    category: 'legal',
  },
  {
    key: 'family',
    label: 'Family',
    sub: 'Parents, kids and safety at home',
    icon: 'people',
    color: catColor('family'),
    category: 'family',
    crisisNote: {
      text: 'If home is not safe right now, 1800RESPECT is free and confidential, any time of day.',
      label: '1800RESPECT',
      phone: '1800 737 732',
    },
  },
  {
    key: 'employment',
    label: 'Work',
    sub: 'Jobs and training',
    icon: 'briefcase',
    color: catColor('employment'),
    category: 'employment',
  },
];

export function needByKey(key: string): Need | null {
  return NEEDS.find((n) => n.key === key) ?? null;
}

// State-specific 24/7 homelessness intake lines. There is no single national
// line, and giving a NSW number to a WA user in crisis would be worse than no
// banner, so unknown states get null.
// VERIFY these numbers against each operator's own website before release.
export const HOUSING_CRISIS_BY_STATE: Record<string, CrisisNote> = {
  NSW: {
    text: 'If you have nowhere safe to sleep tonight, Link2home is free and answers 24 hours a day.',
    label: 'Link2home',
    phone: '1800 152 152',
  },
  VIC: {
    text: 'If you have nowhere safe to sleep tonight, this line is free and answers 24 hours a day.',
    label: 'Statewide homelessness line',
    phone: '1800 825 955',
  },
  QLD: {
    text: 'If you have nowhere safe to sleep tonight, the Homeless Hotline is free and answers 24 hours a day.',
    label: 'Homeless Hotline',
    phone: '1800 474 753',
  },
};

// The housing need's crisis note depends on which state the person is in;
// every other need uses its own static note.
export function getCrisisNote(need: Need, state: string | null): CrisisNote | null {
  if (need.key === 'housing') {
    return state ? HOUSING_CRISIS_BY_STATE[state.toUpperCase()] ?? null : null;
  }
  return need.crisisNote ?? null;
}

export type CrisisLineDef = {
  name: string;
  desc: string;
  phone: string;
  sms?: string;
  chatUrl?: string;
};

// All lines below are free, confidential, and answer 24/7.
// VERIFY sms numbers and chat URLs against each operator's own website before release.
export const CRISIS_LINES: CrisisLineDef[] = [
  { name: 'Lifeline', desc: 'Crisis support for anyone', phone: '13 11 14', sms: '0477 13 11 14' },
  { name: '13YARN', desc: 'Aboriginal and Torres Strait Islander crisis support', phone: '13 92 76' },
  {
    name: '1800RESPECT',
    desc: 'Family violence and sexual assault support',
    phone: '1800 737 732',
    chatUrl: 'https://www.1800respect.org.au',
  },
  {
    name: 'Kids Helpline',
    desc: 'For young people aged 5 to 25',
    phone: '1800 55 1800',
    chatUrl: 'https://kidshelpline.com.au',
  },
];

export function telUrl(phone: string): string {
  return `tel:${phone.replace(/\s/g, '')}`;
}

export function smsUrl(phone: string): string {
  return `sms:${phone.replace(/\s/g, '')}`;
}

// Dataset website values often lack a scheme ('www.example.org'), which makes
// Linking.openURL reject silently. Normalise before opening.
export function webUrl(raw: string): string {
  const trimmed = raw.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}
