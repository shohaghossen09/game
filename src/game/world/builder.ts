import * as THREE from 'three';
import type { CollisionWorld } from '../physics/collision';
import { Materials } from './materials';
import type { DhakaTile } from './dhakaTile';

export interface BuiltWorld {
  group: THREE.Group;
  waterZones: { x: number; z: number; r: number }[];
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
  const disposers: (() => void)[] = [];
  const waterZones: { x: number; z: number; r: number }[] = [];

  const addBox = (
    w: number, h: number, d: number,
    mat: THREE.Material, x: number, y: number, z: number,
    collide = true
  ) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    if (collide) physics.addStaticBox(x, y, z, w, h, d);
    return m;
  };

  // ground plane
  {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(760, 760), Materials.grass);
    g.rotation.x = -Math.PI / 2;
    g.receiveShadow = true;
    group.add(g);
  }

  // roads + sidewalks
  for (const r of tile.roads) {
    const len = Math.hypot(r.x2 - r.x1, r.z2 - r.z1);
    const cx = (r.x1 + r.x2) / 2;
    const cz = (r.z1 + r.z2) / 2;
    const horizontal = Math.abs(r.x2 - r.x1) > Math.abs(r.z2 - r.z1);
    addBox(
      horizontal ? len : r.width, 0.04,
      horizontal ? r.width : len,
      Materials.road, cx, 0.02, cz, false
    );
    if (horizontal) {
      addBox(len, 0.22, 1.6, Materials.sidewalk, cx, 0.11, cz - r.width / 2 - 0.8, false);
      addBox(len, 0.22, 1.6, Materials.sidewalk, cx, 0.11, cz + r.width / 2 + 0.8, false);
    } else {
      addBox(1.6, 0.22, len, Materials.sidewalk, cx - r.width / 2 - 0.8, 0.11, cz, false);
      addBox(1.6, 0.22, len, Materials.sidewalk, cx + r.width / 2 + 0.8, 0.11, cz, false);
    }
  }

  // lane markings on the main avenue
  for (let z = -260; z < 260; z += 9) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 4.4), Materials.lane);
    m.position.set(0, 0.05, z);
    group.add(m);
  }

  // buildings
  const wallMats = [Materials.wall1, Materials.wall2, Materials.wall3, Materials.wall4];
  for (const b of tile.buildings) {
    addBox(b.w, b.h, b.d, wallMats[b.style % 4], b.x, b.h / 2, b.z, true);
    addBox(b.w * 0.55, 1.1, b.d * 0.55, Materials.roof, b.x, b.h + 0.55, b.z, false);
    // window strips
    const strips = Math.max(2, Math.floor(b.h / 3.2));
    for (let i = 1; i < strips; i++) {
      const s = new THREE.Mesh(
        new THREE.BoxGeometry(b.w * 1.01, 1.15, b.d * 1.01),
        Materials.window
      );
      s.position.set(b.x, (b.h / strips) * i + 0.6, b.z);
      group.add(s);
    }
  }

  // water
  for (const w of tile.water) {
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(w.r, 40), Materials.water);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(w.cx, 0.12, w.cz);
    group.add(mesh);
    waterZones.push({ x: w.cx, z: w.cz, r: w.r });
  }

  // instanced trees (2 draw calls for all vegetation)
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
      trunks.dispose();
      leaves.dispose();
    });
  }

  // street lamps along the main avenue (1 draw call)
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
    disposers.push(() => lamps.dispose());
  }

  return {
    group,
    waterZones,
    dispose() {
      scene.remove(group);
      group.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      disposers.forEach((d) => d());
    }
  };
}