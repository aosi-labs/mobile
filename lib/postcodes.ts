import postcodesRaw from '../data/postcodes.json';

export type PostcodeEntry = {
  postcode: string;
  locality: string;
  state: string;
  latitude: number;
  longitude: number;
};

type RawEntry = { p: string; n: string; s: string; lat: number; lng: number };

const ENTRIES: PostcodeEntry[] = (postcodesRaw as RawEntry[]).map((r) => ({
  postcode: r.p,
  locality: r.n,
  state: r.s,
  latitude: r.lat,
  longitude: r.lng,
}));

const BY_POSTCODE: Map<string, PostcodeEntry> = new Map();
for (const e of ENTRIES) BY_POSTCODE.set(e.postcode, e);

export function lookupPostcode(input: string): PostcodeEntry | null {
  const normalized = input.trim();
  if (!/^\d{3,4}$/.test(normalized)) return null;
  const padded = normalized.padStart(4, '0');
  return BY_POSTCODE.get(padded) ?? null;
}

export function postcodeLabel(entry: PostcodeEntry): string {
  return `${entry.postcode} · ${entry.locality}, ${entry.state}`;
}
