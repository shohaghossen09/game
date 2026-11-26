#!/usr/bin/env node
'use strict';

/** Bakes a real OpenStreetMap tile for Dhanmondi, Dhaka via the Overpass API.
 *  Data: (c) OpenStreetMap contributors, ODbL 1.0.
 *  Writes public/world/dhanmondi.json — fetched by the game at runtime.
 *
 *  Usage: npm run fetch:world   (needs internet, ~30s)
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BBOX = [90.3645, 23.7385, 90.3895, 23.7565]; // Dhanmondi: lon1, lat1, lon2, lat2
const ORIGIN = { lat: 23.7461, lon: 90.3767 };
const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  '..', 'public', 'world', 'dhanmondi.json'
);

const WIDTHS = {
  motorway: 18, trunk: 16, primary: 14, secondary: 12,
  tertiary: 11, residential: 9, unclassified: 9, service: 7
};

const KINDS = {
  motorway: 'major', trunk: 'major', primary: 'major',
  secondary: 'local', tertiary: 'local',
  residential: 'residential', unclassified: 'residential', service: 'residential'
};

const M_PER_DEG_LAT = 111320;
const M_PER_DEG_LON = 111320 * Math.cos((ORIGIN.lat * Math.PI) / 180);

function toMeters(lon: number, lat: number): [number, number] {
  return [(lon - ORIGIN.lon) * M_PER_DEG_LON, (lat - ORIGIN.lat) * M_PER_DEG_LAT];
}

const query = `
[out:json][timeout:60];
(
  way["highway"](${BBOX.join(',')});
  way["building"](${BBOX.join(',')});
  way["natural"="water"](${BBOX.join(',')});
  way["landuse"="reservoir"](${BBOX.join(',')});
);
out body geom;
`;

async function main() {
  console.log('Fetching OSM data for Dhanmondi (Overpass API)...');
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(query)
  });
  if (!res.ok) throw new Error(`Overpass returned ${res.status}`);
  const osm = await res.json();

  const roads = [];
  const buildings = [];
  const water = [];

  for (const el of osm.elements) {
    if (el.type !== 'way' || !el.geometry) continue;
    const pts = el.geometry.map((g) => toMeters(g.lon, g.lat));

    if (el.tags && el.tags.highway && el.tags.highway in WIDTHS) {
      const hw = el.tags.highway;
      for (let i = 0; i < pts.length - 1; i++) {
        roads.push({
          x1: pts[i][0], z1: pts[i][1],
          x2: pts[i + 1][0], z2: pts[i + 1][1],
          width: WIDTHS[hw],
          kind: KINDS[hw]
        });
      }
    } else if (el.tags && el.tags.building) {
      // footprint centroid + bounds
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      for (const [x, z] of pts) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;
      }
      const levels = Number(el.tags['building:levels'] || 0) || (el.tags.building === 'yes' ? 2 : 1);
      buildings.push({
        x: (minX + maxX) / 2,
        z: (minZ + maxZ) / 2,
        w: Math.max(4, maxX - minX),
        d: Math.max(4, maxZ - minZ),
        h: Math.max(6, levels * 3.5),
        style: (Math.abs(Math.round((minX + maxZ) * 10)) % 4)
      });
    } else if (el.tags && (el.tags.natural === 'water' || el.tags.landuse === 'reservoir')) {
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      for (const [x, z] of pts) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;
      }
      water.push({
        cx: (minX + maxX) / 2,
        cz: (minZ + maxZ) / 2,
        r: Math.max(8, Math.min(maxX - minX, maxZ - minZ) / 2)
      });
    }
  }

  const tile = {
    name: 'Dhanmondi, Dhaka (OSM)',
    origin: ORIGIN,
    preview: false,
    roads,
    buildings,
    water
  };

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(tile));
  console.log(`Wrote ${OUT}: ${roads.length} road segments, ${buildings.length} buildings, ${water.length} water areas.`);
  console.log('OSM data (c) OpenStreetMap contributors, ODbL 1.0.');
}

main().catch((e) => {
  console.error('fetch:world failed:', e.message);
  process.exit(1);
});