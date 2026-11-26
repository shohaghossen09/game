#!/usr/bin/env node
'use strict';

/** Bake real OpenStreetMap tiles for ALL 64 districts or a named subset.
 *  Usage:
 *    node scripts/fetch-all.mjs                 # all 64 districts (sequential, ~15-25 min)
 *    node scripts/fetch-all.mjs chattogram 3   # one district, custom size km
 *  Data: (c) OpenStreetMap contributors, ODbL 1.0.
 *  Writes public/world/<district-id>.json per district.
 *  Overpass is rate-limited: this script batches politely with pauses. */

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Mirrors src/game/geography/districts.ts (all 64 districts, by division).
const DISTRICTS = {
  // Dhaka (13)
  dhaka: { lat: 23.8103, lon: 90.4125 }, faridpur: { lat: 23.6070, lon: 89.8429 },
  gazipur: { lat: 23.9999, lon: 90.4203 }, gopalganj: { lat: 23.0050, lon: 89.8266 },
  kishoreganj: { lat: 24.4449, lon: 90.7766 }, madaripur: { lat: 23.1641, lon: 90.1897 },
  manikganj: { lat: 23.8644, lon: 90.0287 }, munshiganj: { lat: 23.5422, lon: 90.5305 },
  narayanganj: { lat: 23.6238, lon: 90.4997 }, narsingdi: { lat: 23.9322, lon: 90.7151 },
  rajbari: { lat: 23.7574, lon: 89.6444 }, shariatpur: { lat: 23.2423, lon: 90.4348 },
  tangail: { lat: 24.2513, lon: 89.9166 },
  // Chattogram (11)
  bandarban: { lat: 22.1953, lon: 92.2184 }, brahmanbaria: { lat: 23.9571, lon: 91.1119 },
  chandpur: { lat: 23.2333, lon: 90.6712 }, chattogram: { lat: 22.3569, lon: 91.7832 },
  cumilla: { lat: 23.4607, lon: 91.1809 }, coxsbazar: { lat: 21.4272, lon: 92.0058 },
  feni: { lat: 23.0159, lon: 91.3976 }, khagrachhari: { lat: 23.1193, lon: 91.9847 },
  lakshmipur: { lat: 22.9447, lon: 90.8282 }, noakhali: { lat: 22.8696, lon: 91.0995 },
  rangamati: { lat: 22.6533, lon: 92.1735 },
  // Barishal (6)
  barishal: { lat: 22.7010, lon: 90.3535 }, barguna: { lat: 22.0953, lon: 90.1121 },
  bhola: { lat: 22.6859, lon: 90.6482 }, jhalokati: { lat: 22.6406, lon: 90.1997 },
  patuakhali: { lat: 22.3596, lon: 90.3298 }, pirojpur: { lat: 22.5841, lon: 89.9720 },
  // Khulna (10)
  bagerhat: { lat: 22.6516, lon: 89.7859 }, chuadanga: { lat: 23.6402, lon: 88.8418 },
  jashore: { lat: 23.1664, lon: 89.2081 }, jhenaidah: { lat: 23.5450, lon: 88.9243 },
  khulna: { lat: 22.8456, lon: 89.5403 }, kushtia: { lat: 23.9013, lon: 89.1206 },
  magura: { lat: 23.4855, lon: 89.4198 }, meherpur: { lat: 23.7622, lon: 88.6318 },
  narail: { lat: 23.1725, lon: 89.5126 }, satkhira: { lat: 22.7185, lon: 89.0705 },
  // Rajshahi (8)
  bogura: { lat: 24.8481, lon: 89.3730 }, chapainawabganj: { lat: 24.5965, lon: 88.2775 },
  joypurhat: { lat: 25.0947, lon: 89.0227 }, naogaon: { lat: 24.9137, lon: 88.7530 },
  natore: { lat: 24.4206, lon: 89.0004 }, pabna: { lat: 24.0064, lon: 89.2372 },
  rajshahi: { lat: 24.3745, lon: 88.6042 }, sirajganj: { lat: 24.4534, lon: 89.7007 },
  // Rangpur (8)
  dinajpur: { lat: 25.6217, lon: 88.6354 }, gaibandha: { lat: 25.3288, lon: 89.5281 },
  kurigram: { lat: 25.8054, lon: 89.6362 }, lalmonirhat: { lat: 25.9923, lon: 89.2847 },
  nilphamari: { lat: 25.9317, lon: 88.8560 }, panchagarh: { lat: 26.3411, lon: 88.5542 },
  rangpur: { lat: 25.7439, lon: 89.2752 }, thakurgaon: { lat: 26.0337, lon: 88.4616 },
  // Mymensingh (4)
  jamalpur: { lat: 24.9375, lon: 89.9372 }, mymensingh: { lat: 24.7471, lon: 90.4203 },
  netrokona: { lat: 24.8821, lon: 90.7271 }, sherpur: { lat: 25.0205, lon: 90.0153 },
  // Sylhet (4)
  habiganj: { lat: 24.3745, lon: 91.4155 }, moulvibazar: { lat: 24.4829, lon: 91.7774 },
  sunamganj: { lat: 25.0658, lon: 91.3950 }, sylhet: { lat: 24.8949, lon: 91.8687 }
};

const DEFAULT_KM = 2.4;
const PAUSE_MS = 3000; // polite spacing between Overpass calls

const args = process.argv.slice(2);
const only = args[0] && args[0] in DISTRICTS ? args[0] : null;
const customKm = args[1] ? Number(args[1]) : null;

if (args[0] && !only) {
  console.error(`Unknown district "${args[0]}". Available: ${Object.keys(DISTRICTS).join(', ')}`);
  process.exit(1);
}

const list = only ? [only] : Object.keys(DISTRICTS);
const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'world');
mkdirSync(outDir, { recursive: true });

const WIDTHS = {
  motorway: 18, trunk: 16, primary: 14, secondary: 12,
  tertiary: 11, residential: 9, unclassified: 9, service: 7
};
const KINDS = {
  motorway: 'major', trunk: 'major', primary: 'major',
  secondary: 'local', tertiary: 'local',
  residential: 'residential', unclassified: 'residential', service: 'residential'
};

function toMetersFactory(lat, lon) {
  const M_LAT = 111320;
  const M_LON = 111320 * Math.cos((lat * Math.PI) / 180);
  return (lon2, lat2) => [(lon2 - lon) * M_LON, (lat2 - lat) * M_LAT];
}

function overpassQuery(bbox) {
  return `[out:json][timeout:60];(way["highway"](${bbox});way["building"](${bbox});way["natural"="water"](${bbox}););out body geom;`;
}

async function bake(id) {
  const d = DISTRICTS[id];
  const sizeKm = customKm ?? DEFAULT_KM;
  const halfDeg = sizeKm / 222;
  const bbox = [
    (d.lon - halfDeg * Math.cos((d.lat * Math.PI) / 180)).toFixed(5),
    (d.lat - halfDeg).toFixed(5),
    (d.lon + halfDeg * Math.cos((d.lat * Math.PI) / 180)).toFixed(5),
    (d.lat + halfDeg).toFixed(5)
  ].join(',');

  const out = join(outDir, `${id}.json`);
  if (existsSync(out) && !customKm) {
    console.log(`  [skip] ${id} (already baked)`);
    return true;
  }

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(overpassQuery(bbox))
  });
  if (!res.ok) {
    console.error(`  [fail] ${id}: Overpass ${res.status}`);
    return false;
  }
  const osm = await res.json();
  const toMeters = toMetersFactory(d.lat, d.lon);

  const roads = [];
  const buildings = [];
  const water = [];
  for (const el of osm.elements) {
    if (el.type !== 'way' || !el.geometry) continue;
    const pts = el.geometry.map((g) => toMeters(g.lon, g.lat));
    if (el.tags?.highway && el.tags.highway in WIDTHS) {
      const hw = el.tags.highway;
      for (let i = 0; i < pts.length - 1; i++) {
        roads.push({
          x1: pts[i][0], z1: pts[i][1],
          x2: pts[i + 1][0], z2: pts[i + 1][1],
          width: WIDTHS[hw], kind: KINDS[hw]
        });
      }
    } else if (el.tags?.building) {
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
    } else if (el.tags?.natural === 'water') {
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

  writeFileSync(out, JSON.stringify({
    name: `${id} (OSM)`,
    origin: { lat: d.lat, lon: d.lon },
    preview: false,
    roads, buildings, water
  }));
  console.log(`  [ok] ${id}: ${roads.length} roads, ${buildings.length} buildings, ${water.length} water`);
  return true;
}

async function main() {
  console.log(`Baking ${list.length} district(s) from OpenStreetMap…`);
  let ok = 0, fail = 0;
  for (let i = 0; i < list.length; i++) {
    process.stdout.write(`(${i + 1}/${list.length}) ${list[i]}…\n`);
    try {
      if (await bake(list[i])) ok++;
      else fail++;
    } catch (e) {
      console.error(`  [fail] ${list[i]}: ${e.message}`);
      fail++;
    }
    if (i < list.length - 1) {
      await new Promise((r) => setTimeout(r, PAUSE_MS));
    }
  }
  console.log(`Done: ${ok} baked, ${fail} failed. Data (c) OpenStreetMap contributors, ODbL 1.0.`);
  if (fail > 0) process.exit(2);
}

main().catch((e) => {
  console.error('fetch-all failed:', e.message);
  process.exit(1);
});
