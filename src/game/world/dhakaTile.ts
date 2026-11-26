/** Tile schema + deterministic PREVIEW layout.
 *  Real tiles come from scripts/fetch-dhaka.mjs (OpenStreetMap, ODbL 1.0). */

export type RoadKind = 'major' | 'local' | 'residential';

export interface RoadSegment {
  x1: number; z1: number; x2: number; z2: number;
  width: number;
  kind: RoadKind;
}

export interface BuildingSpec {
  x: number; z: number;
  w: number; d: number;
  h: number;
  style: number;
}

export interface WaterArea {
  cx: number; cz: number; r: number;
}

export interface DhakaTile {
  name: string;
  origin: { lat: number; lon: number };
  preview: boolean;
  roads: RoadSegment[];
  buildings: BuildingSpec[];
  water: WaterArea[];
}

const DHANMONDI_ORIGIN = { lat: 23.7461, lon: 90.3767 };

/** Loads a baked real-OSM tile if present; deterministic PREVIEW layout otherwise. */
export async function loadDhakaTile(): Promise<DhakaTile> {
  try {
    const res = await fetch('/world/dhanmondi.json');
    if (res.ok) {
      const json = (await res.json()) as DhakaTile;
      if (json && Array.isArray(json.roads) && Array.isArray(json.buildings)) {
        return json;
      }
    }
  } catch {
    /* fall through to preview */
  }
  return previewTile();
}

/** Deterministic Dhanmondi-INSPIRED preview layout. NOT real map data. */
export function previewTile(): DhakaTile {
  const roads: RoadSegment[] = [];
  const buildings: BuildingSpec[] = [];

  roads.push({ x1: 0, z1: -280, x2: 0, z2: 280, width: 14, kind: 'major' });
  for (let z = -140; z <= 140; z += 70) {
    roads.push({ x1: -240, z1: z, x2: 240, z2: z, width: 11, kind: 'local' });
  }
  for (const x of [-160, 160]) {
    roads.push({ x1: x, z1: -210, x2: x, z2: 210, width: 11, kind: 'local' });
  }

  for (let z = -250; z <= 250; z += 34) {
    const h = 12 + (((z + 250) / 34) % 3) * 4;
    buildings.push({ x: -23, z, w: 12, d: 12, h, style: 0 });
    buildings.push({ x: 23, z, w: 12, d: 12, h, style: 1 });
  }
  for (let x = -240; x <= 240; x += 40) {
    const h = 14 + (((x + 240) / 40) % 3) * 4;
    buildings.push({ x, z: -27, w: 14, d: 12, h, style: 2 });
    buildings.push({ x, z: 27, w: 14, d: 12, h, style: 3 });
  }

  return {
    name: 'Dhanmondi (PREVIEW)',
    origin: DHANMONDI_ORIGIN,
    preview: true,
    roads,
    buildings,
    water: [{ cx: -96, cz: -64, r: 34 }]
  };
}
