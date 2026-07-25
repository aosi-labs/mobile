import { distanceMetres } from './geo';
import { readiness } from './readiness';
import type { Service } from './types';

export type Coords = { latitude: number; longitude: number };

export type RankedService = {
  service: Service;
  distance: number | null;
  score: number;
};

// Scoring is expressed in "kilometre equivalents": a service that needs
// verification effectively sits a few km further away than a ready one, so
// the shortlist favours places a stressed person can actually reach and call.
const READINESS_PENALTY_KM: Record<'ready' | 'verify' | 'low', number> = {
  ready: 0,
  verify: 4,
  low: 12,
};
const NO_PHONE_PENALTY_KM = 6;
// Services without coordinates are often phone-first (helplines, statewide
// programs). Rank them as if moderately far rather than excluding them.
const UNKNOWN_DISTANCE_KM = 30;
// With no location set, a 1800/1300/13 number is the only honest answer: it
// costs little and answers from anywhere. A street address the user cannot
// judge the distance to is a worse blind pick.
const NATIONAL_LINE_BONUS_KM = 8;
const BLIND_ADDRESS_PENALTY_KM = 3;
const NATIONAL_PHONE_RE = /^(1800|1300|13\d{4})/;

export function rankServices(
  services: Service[],
  opts: { category?: string | null; coords?: Coords | null },
): RankedService[] {
  const { category = null, coords = null } = opts;

  const out: RankedService[] = [];
  for (const s of services) {
    if (category && s.category !== category) continue;

    let distance: number | null = null;
    if (coords && s.latitude != null && s.longitude != null) {
      const d = distanceMetres(coords.latitude, coords.longitude, s.latitude, s.longitude);
      distance = Number.isFinite(d) ? d : null;
    }

    const r = readiness(s);
    let score = coords ? (distance != null ? distance / 1000 : UNKNOWN_DISTANCE_KM) : 0;
    score += READINESS_PENALTY_KM[r.key];
    if (!s.phone) score += NO_PHONE_PENALTY_KM;
    if (!coords) {
      if (s.phone && NATIONAL_PHONE_RE.test(s.phone.replace(/\s/g, ''))) {
        score -= NATIONAL_LINE_BONUS_KM;
      }
      if (s.latitude != null && s.longitude != null) score += BLIND_ADDRESS_PENALTY_KM;
    }

    out.push({ service: s, distance, score });
  }

  out.sort((a, b) => a.score - b.score || (a.service.name || '').localeCompare(b.service.name || ''));
  return out;
}

export function shortlist(ranked: RankedService[], n = 5): RankedService[] {
  return ranked.slice(0, n);
}
