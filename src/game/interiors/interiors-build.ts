import * as THREE from 'three';
import type { CollisionWorld } from '../physics/collision';
import { Materials } from '../world/materials';
import { SHOP_STYLE, SHOP_SLOTS } from './interiors';
import type { Interior, InteriorSystem } from './interiors';

export function buildInteriors(scene: THREE.Scene, physics: CollisionWorld): InteriorSystem {
  const interiors: Interior[] = [];
  const disposers: Array<() => void> = [];

  for (const s of SHOP_SLOTS) {
    const style = SHOP_STYLE[s.style];
    const group = new THREE.Group();
    scene.add(group);
    const W = 10, D = 10, H = 4;
    const cx = s.side * (11 + W / 2);
    const cz = s.z;
    const doorW = 2.2;
    const frontX = cx - s.side * (W / 2);
    const wallMat = new THREE.MeshStandardMaterial({ color: style.wall, roughness: 0.85 });
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x8d8d85, roughness: 0.9 });

    const addBox = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, collide = true) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      group.add(m);
      if (collide) physics.addStaticBox(x, y, z, w, h, d);
      return m;
    };

    addBox(W, 0.1, D, floorMat, cx, 0.05, cz, false);
    addBox(W + 0.4, 0.4, D + 0.4, Materials.roof, cx, H + 0.2, cz, false);
    addBox(W, H, 0.3, wallMat, cx, H / 2, cz + D / 2);
    addBox(0.3, H, D, wallMat, cx + s.side * (W / 2), H / 2, cz);
    addBox(0.3, H, D, wallMat, cx - s.side * (W / 2), H / 2, cz);
    const segW = (W - doorW) / 2;
    addBox(segW, H, 0.3, wallMat, frontX + s.side * (doorW / 2 + segW / 2), H / 2, cz - D / 2);
    addBox(segW, H, 0.3, wallMat, frontX - s.side * (doorW / 2 + segW / 2), H / 2, cz - D / 2);
    addBox(doorW, H - 2.4, 0.3, wallMat, frontX, 2.4 + (H - 2.4) / 2, cz - D / 2, false);

    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(W + 1, 0.15, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x1565c0, roughness: 0.6 })
    );
    awning.position.set(cx, 2.7, cz - D / 2 - 1.2);
    awning.castShadow = true;
    group.add(awning);

    addBox(3.4, 1.0, 0.9, new THREE.MeshStandardMaterial({ color: style.counter, roughness: 0.7 }), cx, 0.6, cz + D / 2 - 1.6);
    addBox(W - 1.6, 2.2, 0.5, new THREE.MeshStandardMaterial({ color: style.shelf, roughness: 0.85 }), cx - s.side * 0.5, 1.2, cz + D / 2 - 0.9);

    const lamp = new THREE.PointLight(0xffe0b2, 8, 12, 2);
    lamp.position.set(cx, H - 0.8, cz);
    group.add(lamp);
    disposers.push(() => lamp.dispose());

    interiors.push({
      doorX: frontX, doorZ: cz - D / 2,
      minX: cx - W / 2, maxX: cx + W / 2,
      minZ: cz - D / 2, maxZ: cz + D / 2,
      label: style.label, group
    });

    disposers.push(() => {
      scene.remove(group);
      group.traverse((o) => { if (o instanceof THREE.Mesh) o.geometry.dispose(); });
      wallMat.dispose();
      floorMat.dispose();
    });
  }

  return {
    interiors,
    insideOf(pos) {
      for (const i of interiors) {
        if (pos.x > i.minX && pos.x < i.maxX && pos.z > i.minZ && pos.z < i.maxZ) return i;
      }
      return null;
    },
    nearestDoor(pos, range) {
      let best: Interior | null = null;
      let bestD = Infinity;
      for (const i of interiors) {
        const d = Math.hypot(pos.x - i.doorX, pos.z - i.doorZ);
        if (d < range && d < bestD) { bestD = d; best = i; }
      }
      return best;
    },
    dispose() { disposers.forEach((d) => d()); }
  };
}
