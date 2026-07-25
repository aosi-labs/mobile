import { SOURCE_VINTAGE } from './constants';
import type { Service } from './types';

export function ageYears(year: number): number {
  return new Date().getFullYear() - year;
}

export function sourceAgeYears(s: Service): number | null {
  const vintage = SOURCE_VINTAGE[s.source_id];
  return vintage ? ageYears(vintage.year) : null;
}

export function isOsm(s: Service): boolean {
  return (
    (!!s.source_name && s.source_name.toLowerCase().includes('openstreetmap')) ||
    (!!s.source_id && s.source_id.toLowerCase().includes('osm'))
  );
}

export function qualityLabel(q: string): string {
  if (q === 'complete') return 'Complete';
  if (q === 'partial') return 'Partial';
  return 'Minimal';
}

export type Readiness = { key: 'ready' | 'verify' | 'low'; label: string };

// Labels are plain language shown verbatim on every surface. The green
// 'ready' state exists only when a known source vintage under 5 years backs
// it; an unknown vintage gets amber and "call to check", never "up to date".
export function readiness(s: Service): Readiness {
  const hasContact = !!(s.phone || s.website || s.email);
  const hasLocation = !!(s.address || (s.latitude && s.longitude));
  const age = sourceAgeYears(s);
  if (
    s.quality === 'complete' &&
    hasContact &&
    hasLocation &&
    s.location_precision !== 'none' &&
    age != null &&
    age < 5
  ) {
    return { key: 'ready', label: `Updated ${SOURCE_VINTAGE[s.source_id].label}` };
  }
  if (!hasContact || !hasLocation || s.quality === 'minimal' || (age != null && age >= 10)) {
    return { key: 'low', label: 'Details may be old' };
  }
  return { key: 'verify', label: 'Call to check details' };
}

export function locationLabel(s: Service): string {
  if (s.location_precision === 'address') return 'exact pin';
  if (s.location_precision === 'postcode') return 'postcode pin';
  return 'no pin';
}
