import * as THREE from 'three';
import { facadeMats, Materials } from './materials';
import type { BuildingSpec, DhakaTile } from './dhakaTile';

/** Modular building generator — Phase D (audit A5, A6).
 *  Replaces the flat box buildings with composed facades:
 *  - textured facade body (style by OSM/preview data)
 *  - window grids (instanced per building, merged across the tile)
 *  - balcony slabs on upper floors
 *  - doors + commercial storefronts on the road-facing side
 *  - roof caps with parapets
 *  - boundary walls on non-road sides (Dhanmondi signature)
 *
 *  Draw-call discipline: windows/balconies/trims are collected into
 *  per-element InstancedMeshes across ALL buildings — 4 element types
 *  total regardless of building count. Facade bodies share 4 materials. */

export interface BuildingResult {
  group: THREE.Group;
  dispose(): void;
}

interface WindowInstance {
  x: number; y: number; z: number; ry: number; sx: number; sy: number;
}

export function buildBuildings(tile: DhakaTile): BuildingResult {
  const group = new THREE.Group();
  const disposers: (() => void)[] = [];
  const windowInstances: WindowInstance[] = [];
  const balconyInstances: WindowInstance[] = [];
  const trimInstances: WindowInstance[] = [];

  // ---------- facade bodies ----------
  for (const b of tile.buildings) {
    const mat = facadeMats[b.style % facadeMats.length];
    const body = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), mat);
    body.position.set(b.x, b.h / 2, b.z);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // floors derived from height
    const floors = Math.max(1, Math.floor(b.h / 3.2));
    const floorH = b.h / floors;

    // ---------- windows on all 4 faces ----------
    const cols = Math.max(1, Math.floor(b.w / 2.6));
    const rows = Math.max(1, Math.floor(b.d / 2.6));
    for (let f = 0; f < floors; f++) {
      const y = f * floorH + floorH * 0.62;
      for (let c = 0; c < cols; c++) {
        const t = (c + 0.5) / cols;
        const wx = b.x - b.w / 2 + t * b.w;
        // +z and -z faces
        windowInstances.push({ x: wx, y, z: b.z + b.d / 2, ry: 0, sx: 1, sy: 1 });
        windowInstances.push({ x: wx, y, z: b.z - b.d / 2, ry: Math.PI, sx: 1, sy: 1 });
        // +x and -x faces (staggered on odd floors for variety)
        if (f % 2 === 0) {
          for (let r = 0; r < rows; r++) {
            const tz = (r + 0.5) / rows;
            const wz = b.z - b.d / 2 + tz * b.d;
            windowInstances.push({ x: b.x + b.w / 2, y, z: wz, ry: Math.PI / 2, sx: 1, sy: 1 });
            windowInstances.push({ x: b.x - b.w / 2, y, z: wz, ry: -Math.PI / 2, sx: 1, sy: 1 });
          }
        }
        // balcony on the front face every other floor (Dhanmondi style)
        if (f > 0 && f % 2 === 1) {
          balconyInstances.push({ x: wx, y: y - floorH * 0.25, z: b.z + b.d / 2 + 0.5, ry: 0, sx: 1, sy: 1 });
        }
      }
    }

    // ---------- ground floor: storefront + door on the avenue side ----------
    // storefront glass band across the road-facing face (assume +z faces a
    // road in the preview layout; real data gets a roadAdj field later)
    const storeH = Math.min(2.6, floorH);
    const store = new THREE.Mesh(
      new THREE.BoxGeometry(b.w * 0.86, storeH, 0.12),
      Materials.window
    );
    store.position.set(b.x, storeH / 2 + 0.1, b.z + b.d / 2 + 0.07);
    group.add(store);

    // door beside the storefront
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 2.1, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.6 })
    );
    door.position.set(b.x - b.w / 4, 1.05, b.z + b.d / 2 + 0.08);
    group.add(door);
    disposers.push(() => (door.material as THREE.Material).dispose());

    // roof parapet (trim band around the top)
    trimInstances.push({ x: b.x, y: b.h + 0.15, z: b.z + b.d / 2, ry: 0, sx: b.w, sy: 1 });
    trimInstances.push({ x: b.x, y: b.h + 0.15, z: b.z - b.d / 2, ry: 0, sx: b.w, sy: 1 });
    trimInstances.push({ x: b.x + b.w / 2, y: b.h + 0.15, z: b.z, ry: Math.PI / 2, sx: b.d, sy: 1 });
    trimInstances.push({ x: b.x - b.w / 2, y: b.h + 0.15, z: b.z, ry: Math.PI / 2, sx: b.d, sy: 1 });

    // boundary wall on the sides away from the road (preview: -z back side)
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(b.w + 1.6, 1.8, 0.18),
      Materials.boundary
    );
    wall.position.set(b.x, 0.9, b.z - b.d / 2 - 0.9);
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);
  }

  // ---------- merged element instances ----------
  const windowGeo = new THREE.BoxGeometry(1.15, 1.35, 0.08);
  const windows = new THREE.InstancedMesh(windowGeo, Materials.window, windowInstances.length);
  const balconyGeo = new THREE.BoxGeometry(1.6, 0.12, 0.9);
  const balconies = new THREE.InstancedMesh(balconyGeo, Materials.trim, balconyInstances.length);
  const trimGeo = new THREE.BoxGeometry(1, 0.3, 1);
  const trims = new THREE.InstancedMesh(trimGeo, Materials.trim, trimInstances.length);

  const mx = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  windowInstances.forEach((w, i) => {
    q.setFromAxisAngle(up, w.ry);
    pos.set(w.x, w.y, w.z);
    scl.set(w.sx, w.sy, 1);
    mx.compose(pos, q, scl);
    windows.setMatrixAt(i, mx);
  });
  balconyInstances.forEach((w, i) => {
    q.setFromAxisAngle(up, w.ry);
    pos.set(w.x, w.y, w.z);
    scl.set(w.sx, w.sy, 1);
    mx.compose(pos, q, scl);
    balconies.setMatrixAt(i, mx);
  });
  trimInstances.forEach((t, i) => {
    q.setFromAxisAngle(up, t.ry);
    pos.set(t.x, t.y, t.z);
    // trims stretch along their face (sx carries face length)
    scl.set(t.sx, 1, 0.25);
    mx.compose(pos, q, scl);
    trims.setMatrixAt(i, mx);
  });

  windows.castShadow = true;
  balconies.castShadow = true;
  group.add(windows, balconies, trims);

  disposers.push(() => {
    windowGeo.dispose();
    balconyGeo.dispose();
    trimGeo.dispose();
    windows.dispose();
    balconies.dispose();
    trims.dispose();
  });

  return {
    group,
    dispose() {
      disposers.forEach((d) => d());
      group.traverse((o) => {
        if (o instanceof THREE.Mesh && o.geometry !== undefined) {
          o.geometry.dispose();
        }
      });
    }
  };
}
