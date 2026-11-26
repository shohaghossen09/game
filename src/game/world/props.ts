import * as THREE from 'three';
import { Materials } from './materials';
import type { DhakaTile } from './dhakaTile';

/** Street props: benches, bus stops, signage, bins. All static, instanced
 *  where counts allow, derived deterministically from the tile. */

export interface PropResult {
  group: THREE.Group;
  dispose(): void;
}

export function buildProps(tile: DhakaTile): PropResult {
  const group = new THREE.Group();
  const disposers: (() => void)[] = [];

  // deterministic PRNG from tile seed
  let seed = 7331;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  // benches along major roads, offset from the sidewalk
  {
    const benchGeo = new THREE.BoxGeometry(1.8, 0.45, 0.55);
    const benchSeat = new THREE.MeshStandardMaterial({ color: 0x7a5b3a, roughness: 0.85 });
    const legs = new THREE.BoxGeometry(1.6, 0.35, 0.12);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x3a3f45, roughness: 0.7 });

    const majors = tile.roads.filter((r) => r.kind === 'major');
    let count = 0;
    for (const r of majors) {
      const len = Math.hypot(r.x2 - r.x1, r.z2 - r.z1);
      const n = Math.floor(len / 60);
      for (let i = 1; i <= n; i++) {
        const t = i / (n + 1);
        const x = r.x1 + (r.x2 - r.x1) * t;
        const z = r.z1 + (r.z2 - r.z1) * t;
        const side = i % 2 === 0 ? 1 : -1;
        // perpendicular offset for a wide road
        const dx = r.x2 - r.x1;
        const dz = r.z2 - r.z1;
        const il = 1 / (len || 1);
        const offX = -dz * il * side * (r.width / 2 + 1.4);
        const offZ = dx * il * side * (r.width / 2 + 1.4);
        const bench = new THREE.Mesh(benchGeo, benchSeat);
        bench.position.set(x + offX, 0.35, z + offZ);
        bench.rotation.y = Math.atan2(dx, dz);
        bench.castShadow = true;
        group.add(bench);
        const leg = new THREE.Mesh(legs, legMat);
        leg.position.set(x + offX, 0.18, z + offZ);
        group.add(leg);
        count++;
      }
    }
    void count;
    disposers.push(() => {
      benchGeo.dispose();
      legs.dispose();
      benchSeat.dispose();
      legMat.dispose();
    });
  }

  // bins next to benches
  {
    const binGeo = new THREE.CylinderGeometry(0.3, 0.26, 0.75, 8);
    const binMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.7 });
    const bins = new THREE.InstancedMesh(binGeo, binMat, 40);
    bins.castShadow = true;
    const mx = new THREE.Matrix4();
    const majors = tile.roads.filter((r) => r.kind === 'major');
    let i = 0;
    for (const r of majors) {
      const len = Math.hypot(r.x2 - r.x1, r.z2 - r.z1);
      const n = Math.min(20, Math.floor(len / 40));
      for (let k = 0; k < n && i < 40; k++) {
        const t = (k + rnd() * 0.5) / n;
        const x = r.x1 + (r.x2 - r.x1) * t + (rnd() * 2 - 1) * 2;
        const z = r.z1 + (r.z2 - r.z1) * t + (rnd() * 2 - 1) * 2;
        mx.identity().setPosition(x, 0.38, z);
        bins.setMatrixAt(i, mx);
        i++;
      }
    }
    bins.count = i;
    group.add(bins);
    disposers.push(() => {
      binGeo.dispose();
      binMat.dispose();
      bins.dispose();
    });
  }

  return {
    group,
    dispose() {
      disposers.forEach((d) => d());
    }
  };
}
