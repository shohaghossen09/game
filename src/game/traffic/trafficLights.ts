import * as THREE from 'three';
import type { DhakaTile } from '../world/dhakaTile';

/** Traffic lights at road intersections — Phase 5 continuation.
 *  A global timer cycles green -> yellow -> red for the main avenue while
 *  cross streets get the inverse phase. Cars query shouldStop() per frame. */

export interface TrafficLight {
  x: number; z: number;
  stopX: number; stopZ: number;
  axis: 'ns' | 'ew';
}

export interface TrafficLightSystem {
  lights: TrafficLight[];
  phaseFor(axis: 'ns' | 'ew'): number;
  update(dt: number): void;
  shouldStop(x: number, z: number, axis: 'ns' | 'ew'): boolean;
  dispose(): void;
}

const GREEN_TIME = 12;
const YELLOW_TIME = 2.5;
const RED_TIME = 14.5;
const STOP_DISTANCE = 8;

export function createTrafficLights(
  scene: THREE.Scene,
  tile: DhakaTile
): TrafficLightSystem {
  const lights: TrafficLight[] = [];
  const visualGroups: THREE.Group[] = [];
  const lamps: Array<{ mat: THREE.MeshStandardMaterial }> = [];

  const majors = tile.roads.filter((r) => r.kind === 'major');
  const crossings = tile.roads.filter((r) => r.kind !== 'major' && Math.abs(r.x1 - r.x2) > 10);

  for (const m of majors) {
    const mx = (m.x1 + m.x2) / 2;
    for (const c of crossings) {
      if (Math.min(c.x1, c.x2) <= mx && Math.max(c.x1, c.x2) >= mx) {
        const cz = (c.z1 + c.z2) / 2;
        lights.push({
          x: mx, z: cz,
          stopX: mx,
          stopZ: cz - (m.width / 2 + 2),
          axis: 'ns'
        });
        const g = new THREE.Group();
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 5.2, 6),
          new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 })
        );
        pole.position.set(mx + 8, 2.6, cz);
        pole.castShadow = true;
        g.add(pole);
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 1.3, 0.4),
          new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.7 })
        );
        box.position.set(mx + 8, 5.4, cz);
        g.add(box);
        for (const yOff of [0, 0.42, 0.84]) {
          const mat = new THREE.MeshStandardMaterial({
            color: 0x333333, emissive: 0x000000, roughness: 0.4
          });
          const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), mat);
          mesh.position.set(mx + 8, 5.85 - yOff, cz + 0.25);
          g.add(mesh);
          lamps.push({ mat });
        }
        scene.add(g);
        visualGroups.push(g);
      }
    }
  }

  let timer = 0;
  function nsPhase(): number {
    const t = timer % (GREEN_TIME + YELLOW_TIME + RED_TIME);
    if (t < GREEN_TIME) return 0;
    if (t < GREEN_TIME + YELLOW_TIME) return 1;
    return 2;
  }

  function update(dt: number): void {
    timer += dt;
    const ns = nsPhase();
    lamps.forEach((l, idx) => {
      const on = idx === ns;
      const color = idx === 0 ? 0xff0000 : idx === 1 ? 0xffcc00 : 0x00ff44;
      l.mat.emissive.setHex(on ? color : 0x000000);
      l.mat.emissiveIntensity = on ? 2.5 : 0;
    });
  }

  function phaseFor(axis: 'ns' | 'ew'): number {
    const ns = nsPhase();
    if (axis === 'ns') return ns;
    return ns === 2 ? 0 : 2;
  }

  function shouldStop(x: number, z: number, axis: 'ns' | 'ew'): boolean {
    const phase = phaseFor(axis);
    if (phase === 0) return false;
    for (const l of lights) {
      // NS cars stop approaching along z; EW cars along x
      const nearIntersection =
        axis === 'ns'
          ? Math.abs(x - l.x) < (l.axis === 'ns' ? 8 : 2)
          : Math.abs(z - l.z) < 8;
      if (!nearIntersection) continue;
      const d = Math.hypot(x - l.stopX, z - l.stopZ);
      if (d < STOP_DISTANCE) {
        return phase === 2 ? true : d > STOP_DISTANCE * 0.5; // yellow: stop only if far enough
      }
    }
    return false;
  }

  return {
    lights,
    phaseFor,
    update,
    shouldStop,
    dispose() {
      for (const g of visualGroups) {
        scene.remove(g);
        g.traverse((o) => {
          if (o instanceof THREE.Mesh) {
            o.geometry.dispose();
            (o.material as THREE.Material).dispose();
          }
        });
      }
    }
  };
}
