#!/usr/bin/env node
'use strict';

/** Bake real OpenStreetMap tiles for ANY district: node scripts/fetch-district.mjs <district-id> [sizeKm]
 *  Data: (c) OpenStreetMap contributors, ODbL 1.0.
 *  Writes public/world/<district-id>.json — loaded by the streaming manager
 *  when the player travels there. */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DISTRICTS = {
  dhaka: { name: 'Dhaka', lat: 23.8103, lon: 90.4125 },
  gazipur: { name: 'Gazipur', lat: 23.9999, lon: 90.4203 },
  narayanganj: { name: 'Narayanganj', lat: 23.6238, lon: 90.4997 },
  chattogram: { name: 'Chattogram', lat: 22.3569, lon: 91.7832 },
  sylhet: { name: 'Sylhet', lat: 24.8949, lon: 91.8687 },
  rajshahi: { name: 'Rajshahi', lat: 24.3745, lon: 88.6042 },
  khulna: { name: 'Khulna', lat: 22.8456, lon: 89.5403 },
  barishal: { name: 'Barishal', lat: 22.7010, lon: 90.3535 },
  rangpur: { name: 'Rangpur', lat: 25.7439, lon: 89.2752 },
  mymensingh: { name: 'Mymensingh', lat: 24.7471, lon: 90.4203 },
  coxsbazar: { name: "Cox's Bazar", lat: 21.4272, lon: 92.0058 },
  cumilla: { name: 'Cumilla', lat: 23.4607, lon: 91.1809 },
  bogura: { name: 'Bogura', lat: 24.8481, lon: 89.3730 },
  faridpur: { name: 'Faridpur', lat: 23.6070, lon: 89.8429 },
  jashore: { name: 'Jashore', lat: 23.1664, lon: 89.2081 },
  tangail: { name: 'Tangail', lat: 24.2513, lon: 89.9166 }
};

const id = process.argv[2];
const sizeKm = Number(process.argv[3] ?? 2.4);
if (!id || !DISTRICTS[id]) {
  console.error('Usage: node scripts/fetch-district.mjs <district-id> [sizeKm]');
  console.error('Available:', Object.keys(DISTRICTS).join(', '));
  process.exit(1);
}

const d = DISTRICTS[id];
const halfDeg = sizeKm / 222; // approx degrees for half-size
const BBOX = [
  (d.lon - halfDeg * Math.cos((d.lat * Math.PI) / 180)).toFixed(5),
  (d.lat - halfDeg).toFixed(5),
  (d.lon + halfDeg * Math.cos((d.lat * Math.PI) / 180)).toFixed(5),
  (d.lat + halfDeg).toFixed(5)
];

const ORIGIN = { lat: d.lat, lon: d.lon };
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'world', `${id}.json`);

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
const toMeters = (lon, lat) => [
  (lon - ORIGIN.lon) * M_PER_DEG_LON,
  (lat - ORIGIN.lat) * M_PER_DEG_LAT
];

const query = `
[out:json][timeout:60];
(
  way["highway"](${BBOX.join(',')});
  way["building"](${BBOX.join(',')});
  way["natural"="water"](${BBOX.join(',')});
);
out body geom;
`;

async function main() {
  console.log(`Fetching OSM data for ${d.name} (${id})...`);
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
          width: WIDTHS[hw], kind: KINDS[hw]
        });
      }
    } else if (el.tags && el.tags.building) {
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      for (const [x, z] of pts) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;
      }
      const levels = Number(el.tags['building:levels'] || 0) || 2;
      buildings.push({
        x: (minX + maxX) / 2, z: (minZ + maxZ) / 2,
        w: Math.max(4, maxX - minX), d: Math.max(4, maxZ - minZ),
        h: Math.max(6, levels * 3.5),
        style: Math.abs(Math.round((minX + maxZ) * 10)) % 4
      });
    } else if (el.tags && el.tags.natural === 'water') {
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      for (const [x, z] of pts) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;
      }
      water.push({
        cx: (minX + maxX) / 2, cz: (minZ + maxZ) / 2,
        r: Math.max(8, Math.min(maxX - minX, maxZ - minZ) / 2)
      });
    }
  }

  const tile = {
    name: `${d.name} (OSM)`,
    origin: ORIGIN,
    preview: false,
    roads, buildings, water
  };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(tile));
  console.log(`Wrote ${OUT}: ${roads.length} roads, ${buildings.length} buildings, ${water.length} water.`);
  console.log('OSM data (c) OpenStreetMap contributors, ODbL 1.0.');
}

main().catch((e) => {
  console.error('fetch-district failed:', e.message);
  process.exit(1);
});
