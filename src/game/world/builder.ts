import * as THREE from 'three';
import type { CollisionWorld } from '../physics/collision';
import { Materials } from './materials';
import { buildBuildings } from './buildings';
import type { DhakaTile } from './dhakaTile';

export interface BuiltWorld {
  group: THREE.Group;
  waterZones: { x: number; z: number; r: number }[];
  /** detail layer group (balconies/trims) for LOD culling */
  buildingDetailGroup: THREE.Group;
  /** coarse layer group (windows) for LOD culling */
  buildingCoarseGroup: THREE.Group;
  dispose(): void;
}

export function buildWorld(
  scene: THREE.Scene,
  physics: CollisionWorld,
  tile: DhakaTile,
  treeCount: number
): BuiltWorld {
  const group = new THREE.Group();
  scene.add(group);
  const waterZones: { x: number; z: number; r: number }[] = [];
  const disposers: (() => void)[] = [];

  // ---------- ground ----------
  const g = new THREE.Mesh(new THREE.PlaneGeometry(760, 760), Materials.grass);
  g.rotation.x = -Math.PI / 2;
  g.receiveShadow = true;
  group.add(g);

  // ---------- roads + sidewalks (with curbs) ----------
  for (const r of tile.roads) {
    const len = Math.hypot(r.x2 - r.x1, r.z2 - r.z1);
    const cx = (r.x1 + r.x2) / 2;
    const cz = (r.z1 + r.z2) / 2;
    const horizontal = Math.abs(r.x2 - r.x1) > Math.abs(r.z2 - r.z1);

    const road = new THREE.Mesh(
      new THREE.BoxGeometry(horizontal ? len : r.width, 0.04, horizontal ? r.width : len),
      Materials.road
    );
    road.position.set(cx, 0.02, cz);
    road.receiveShadow = true;
    group.add(road);

    const sides = horizontal
      ? [{ x: cx, z: cz - r.width / 2 - 0.9 }, { x: cx, z: cz + r.width / 2 + 0.9 }]
      : [{ x: cx - r.width / 2 - 0.9, z: cz }, { x: cx + r.width / 2 + 0.9, z: cz }];
    for (const s of sides) {
      const walk = new THREE.Mesh(
        horizontal
          ? new THREE.BoxGeometry(len, 0.22, 1.8)
          : new THREE.BoxGeometry(1.8, 0.22, len),
        Materials.sidewalk
      );
      walk.position.set(s.x, 0.11, s.z);
      walk.receiveShadow = true;
      group.add(walk);
      const curb = new THREE.Mesh(
        horizontal
          ? new THREE.BoxGeometry(len, 0.24, 0.14)
          : new THREE.BoxGeometry(0.14, 0.24, len),
        Materials.trim
      );
      const toward = horizontal
        ? (s.z > cz ? -0.95 : 0.95)
        : (s.x > cx ? -0.95 : 0.95);
      curb.position.set(
        horizontal ? cx : s.x + toward,
        0.12,
        horizontal ? s.z + toward : cz
      );
      group.add(curb);
    }
  }

  // ---------- lane markings (merged into ONE mesh) ----------
  {
    const laneGeos: THREE.BoxGeometry[] = [];
    for (let z = -260; z < 260; z += 9) {
      const seg = new THREE.BoxGeometry(0.4, 0.02, 4.4);
      seg.translate(0, 0.05, z);
      laneGeos.push(seg);
    }
    const merged = mergeGeometriesManually(laneGeos);
    const laneMesh = new THREE.Mesh(merged, Materials.lane);
    group.add(laneMesh);
  }

  // ---------- buildings (modular, instanced, LOD-split — Phases D+H) ----------
  const buildings = buildBuildings(tile);
  group.add(buildings.group);
  for (const b of tile.buildings) {
    physics.addStaticBox(b.x, b.h / 2, b.z, b.w, b.h, b.d);
  }

  // ---------- water ----------
  for (const w of tile.water) {
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(w.r, 40), Materials.water);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(w.cx, 0.12, w.cz);
    group.add(mesh);
    waterZones.push({ x: w.cx, z: w.cz, r: w.r });
  }

  // ---------- instanced trees ----------
  {
    const trunkGeo = new THREE.CylinderGeometry(0.28, 0.42, 3.4, 7);
    const leafGeo = new THREE.SphereGeometry(2.1, 8, 7);
    const trunks = new THREE.InstancedMesh(trunkGeo, Materials.trunk, treeCount);
    const leaves = new THREE.InstancedMesh(leafGeo, Materials.leaf, treeCount);
    trunks.castShadow = true;
    leaves.castShadow = true;
    const mx = new THREE.Matrix4();
    let i = 0;
    let seed = 1337;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    while (i < treeCount) {
      const x = (rnd() * 2 - 1) * 290;
      const z = (rnd() * 2 - 1) * 290;
      if (Math.abs(x) < 10 || Math.abs(z) < 8) continue;
      const s = 0.8 + rnd() * 0.7;
      mx.makeScale(s, s, s).setPosition(x, 1.7 * s, z);
      trunks.setMatrixAt(i, mx);
      mx.makeScale(s, s, s).setPosition(x, 1.7 * s + 3.3 * s, z);
      leaves.setMatrixAt(i, mx);
      i++;
    }
    group.add(trunks, leaves);
    disposers.push(() => {
      trunkGeo.dispose();
      leafGeo.dispose();
      trunks.dispose();
      leaves.dispose();
    });
  }

  // ---------- street lamps ----------
  {
    const poleGeo = new THREE.CylinderGeometry(0.09, 0.09, 7, 6);
    const count = 36;
    const lamps = new THREE.InstancedMesh(poleGeo, Materials.pole, count);
    lamps.castShadow = true;
    const mx = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const z = -252 + i * 14.4;
      const side = i % 2 ? 8.2 : -8.2;
      mx.identity().setPosition(side, 3.5, z);
      lamps.setMatrixAt(i, mx);
    }
    group.add(lamps);
    disposers.push(() => {
      poleGeo.dispose();
      lamps.dispose();
    });
  }

  return {
    group,
    waterZones,
    buildingDetailGroup: buildings.detailGroup,
    buildingCoarseGroup: buildings.coarseGroup,
    dispose() {
      scene.remove(group);
      buildings.dispose();
      disposers.forEach((d) => d());
      disposers.length = 0;
      group.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
    }
  };
}

/** Minimal geometry merge for the lane strips. */
function mergeGeometriesManually(geos: THREE.BoxGeometry[]): THREE.BufferGeometry {
  const out = new THREE.BufferGeometry();
  let vertCount = 0;
  let idxCount = 0;
  for (const geo of geos) {
    vertCount += geo.attributes.position.count;
    idxCount += geo.index ? geo.index.count : 0;
  }
  const positions = new Float32Array(vertCount * 3);
  const normals = new Float32Array(vertCount * 3);
  const uvs = new Float32Array(vertCount * 2);
  const indices = new Uint32Array(idxCount);
  let vOff = 0;
  let iOff = 0;
  for (const geo of geos) {
    const p = geo.attributes.position as THREE.BufferAttribute;
    const n = geo.attributes.normal as THREE.BufferAttribute;
    const uv = geo.attributes.uv as THREE.BufferAttribute;
    positions.set(p.array as Float32Array, vOff * 3);
    normals.set(n.array as Float32Array, vOff * 3);
    uvs.set(uv.array as Float32Array, vOff * 2);
    if (geo.index) {
      const idx = geo.index.array as ArrayLike<number>;
      for (let i = 0; i < idx.length; i++) {
        indices[iOff + i] = idx[i] + vOff;
      }
      iOff += idx.length;
    }
    vOff += p.count;
    geo.dispose();
  }
  out.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  out.setIndex(new THREE.BufferAttribute(indices, 1));
  return out;
}
