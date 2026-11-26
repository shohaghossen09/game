/** Geographic coordinate transforms + tile indexing — Phase G (Task 5).
 *  Local meters are measured from a per-tile origin (the district center the
 *  baker used), so every tile is self-consistent and tiles never need to be
 *  re-projected against each other. Sub-tile grid indexing is groundwork
 *  for future spatial partitioning inside large districts. */

export interface GeoOrigin {
  lat: number;
  lon: number;
}

const M_PER_DEG_LAT = 111320;

export function metersPerDegLon(lat: number): number {
  return 111320 * Math.cos((lat * Math.PI) / 180);
}

/** WGS84 lat/lon -> local tile meters (x east, z north). */
export function geoToLocal(
  lat: number,
  lon: number,
  origin: GeoOrigin
): { x: number; z: number } {
  return {
    x: (lon - origin.lon) * metersPerDegLon(origin.lat),
    z: (lat - origin.lat) * M_PER_DEG_LAT
  };
}

/** Local tile meters -> WGS84 lat/lon. */
export function localToGeo(x: number, z: number, origin: GeoOrigin): GeoOrigin {
  return {
    lat: origin.lat + z / M_PER_DEG_LAT,
    lon: origin.lon + x / metersPerDegLon(origin.lat)
  };
}

/** Sub-tile grid for future partitioning inside a district tile. */
export const SUBTILE_SIZE = 500; // meters

export function subtileIndex(x: number, z: number): { ix: number; iz: number } {
  return { ix: Math.floor(x / SUBTILE_SIZE), iz: Math.floor(z / SUBTILE_SIZE) };
}

export function subtileKey(ix: number, iz: number): string {
  return `${ix}:${iz}`;
}

/** Fast equirectangular distance in km — accurate enough at Bangladesh's
 *  scale for neighbor preloading (never for survey use). */
export function geoDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const x = ((lon2 - lon1) * metersPerDegLon((lat1 + lat2) / 2)) / 1000;
  const y = ((lat2 - lat1) * M_PER_DEG_LAT) / 1000;
  return Math.hypot(x, y);
}
