import * as THREE from 'three';
import type { DhakaTile } from '../world/dhakaTile';

/** Traffic lights at road intersections — Phase 5 continuation.
 *  A global timer cycles green -> yellow -> red for the main avenue while
 *  cross streets get the inverse phase. Traffic cars query light state by
 *  proximity to a stop line and brake when their axis is red. */

export interface TrafficLight {
  x: number; z: number;           // intersection center
  stopX: number; stopZ: number;   // stop line for the main avenue axis
  axis: 'ns' | 'ew';
}

export interface TrafficLightSystem {
  lights: TrafficLight[];
  /** 0 = green, 1 = yellow, 2 = red — for the NS axis; EW is the inverse. */
  phaseFor(axis: 'ns' | 'ew'): number;
  update(dt: number): void;
  /** true if a car at (x,z) heading along axis should stop within d meters */
  shouldStop(x: number, z: number, axis: 'ns' | 'ew'): boolean;
  dispose(): void;
}

const GREEN_TIME = 12;
const YELLOW_TIME = 2.5;
const RED_TIME = 14.5;
const STOP_DISTANCE = 6;

export function createTrafficLights(
  scene: THREE.Scene,
  tile: DhakaTile
): TrafficLightSystem {
  // intersections: end points of cross roads that touch the main avenue (x1 != x2)
  const lights: TrafficLight[] = [];
  const visualGroups: THREE.Group[] = [];
  const lamps: Array<{ mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial }> = [];

  const majors = tile.roads.filter((r) => r.kind === 'major');
  const crossings = tile.roads.filter((r) => r.kind !== 'major' && r.x1 !== r.x2);

  for (const m of majors) {
    for (const c of crossings) {
      // crossing roughly perpendicular to the major road
      const mx = (m.x1 + m.x2) / 2;
      const dx = Math.abs(c.x1 - c.x2);
      if (dx < 10) continue;
      const cx = mx;
      const cz = (c.z1 + c.z2) / 2;
      // only if the crossing actually spans the avenue
      if (Math.min(c.x1, c.x2) <= mx && Math.max(c.x1, c.x2) >= mx) {
        lights.push({
          x: cx, z: cz,
          stopX: cx, stopZ: cz - (m.width / 2 + 2),
          axis: 'ns'
        });
        // visual: pole + 3-lamp box
        const g = new THREE.Group();
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 5.2, 6),
          new THREE.MeshStandardMaterial({ color: 0x333, roughness: 0.6 })
        );
        pole.position.set(cx + 8, 2.6, cz);
        pole.castShadow = true;
        g.add(pole);
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.5, 1.3, 0.4),
          new THREE.MeshStandardMaterial({ color: 0x1b1b1b, roughness: 0.7 })
        );
        box.position.set(cx + 8, 5.4, cz);
        g.add(box);
        const mkLamp = (yOff: number) => {
          const mat = new THREE.MeshStandardMaterial({
            color: 0x333333, emissive: 0x000000, roughness: 0.4
          });
          const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), mat);
          mesh.position.set(cx + 8, 5.85 - yOff, cz + 0.25);
          g.add(mesh);
          lamps.push({ mesh, mat });
          return mesh;
        };
        mkLamp(0);   // red
        mkLamp(0.42); // yellow
        mkLamp(0.84); // green
        scene.add(g);
        visualGroups.push(g);
      }
    }
  }

  let timer = 0;
  // phase timeline for NS: green(12) -> yellow(2.5) -> red(14.5)
  function nsPhase(): number {
    const t = timer % (GREEN_TIME + YELLOW_TIME + RED_TIME);
    if (t < GREEN_TIME) return 0;
    if (t < GREEN_TIME + YELLOW_TIME) return 1;
    return 2;
  }

  function update(dt: number): void {
    timer += dt;
    const ns = nsPhase();
    // lamp visuals: red index 0, yellow 1, green 2
    lamps.forEach((l, idx) => {
      const lampPhase = idx; // 0 red, 1 yellow, 2 green
      const on = lampPhase === ns;
      l.mat.emissive.setHex(on ? (lampPhase === 0 ? 0xff0000 : lampPhase === 1 ? 0xffcc00 : 0x00ff44) : 0x000000);
      l.mat.emissiveIntensity = on ? 2.5 : 0;
    });
  }

  function phaseFor(axis: 'ns' | 'ew'): number {
    const ns = nsPhase();
    if (axis === 'ns') return ns;
    return ns === 2 ? 0 : 2; // simplified inverse (yellow folded)
  }

  function shouldStop(x: number, z: number, axis: 'ns' | 'ew'): boolean {
    const phase = phaseFor(axis);
    if (phase !== 2 && phase !== 1) return false; // green: go
    // yellow: stop only if before the line; red: stop
    for (const l of lights) {
      if (axis === 'ns') {
        if (Math.abs(x - l.x) < l.width ?? 0) continue;
      }
      const d = Math.hypot(x - l.stopX, z - l.stopZ);
      if (d < STOP_DISTANCE) {
        return phase === 2;
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
