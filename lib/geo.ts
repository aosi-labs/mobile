export function distanceMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function formatDistance(m: number): string {
  if (!isFinite(m)) return '';
  if (m < 950) return Math.round(m / 10) * 10 + ' m';
  const km = m / 1000;
  if (km < 10) return km.toFixed(1) + ' km';
  if (km < 100) return Math.round(km) + ' km';
  if (km < 1000) return Math.round(km / 10) * 10 + ' km';
  return Math.round(km / 100) * 100 + ' km';
}
