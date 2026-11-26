import * as THREE from 'three';
import type { DhakaTile } from '../world/dhakaTile';

/** Traffic AI — NPC vehicles driving the road graph, obeying traffic lights,
 *  and keeping distance from the vehicle ahead. Distance-based activation. */

export interface TrafficCar {
  x: number; z: number;
  yaw: number;
  speed: number;
  targetSpeed: number;
  fx: number; fz: number; tx: number; tz: number;
  t: number;
  width: number;
  lane: number;
  axis: 'ns' | 'ew';
  active: boolean;
}

export interface TrafficSystem {
  cars: TrafficCar[];
  update(dt: number, px: number, pz: number, shouldStop?: (x: number, z: number, axis: 'ns' | 'ew') => boolean): void;
  dispose(): void;
}

const TRAFFIC_NEAR = 60;
const TRAFFIC_FAR = 130;
const COLORS = [0xcfd8dc, 0x37474f, 0xb71c1c, 0x1565c0, 0x2e7d32, 0xf9a825];

export function createTrafficSystem(
  scene: THREE.Scene,
  tile: DhakaTile,
  count: number
): TrafficSystem {
  const roads = tile.roads.filter((r) => r.kind !== 'residential');
  const cars: TrafficCar[] = [];
  let seed = 4242;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  for (let i = 0; i < count && roads.length > 0; i++) {
    const r = roads[Math.floor(rnd() * roads.length)];
    const len = Math.hypot(r.x2 - r.x1, r.z2 - r.z1) || 1;
    const t = rnd();
    const lane = rnd() > 0.5 ? 1 : -1;
    const laneOff = (r.width / 4) * lane;
    const dx = (r.x2 - r.x1) / len;
    const dz = (r.z2 - r.z1) / len;
    const ox = -dz * laneOff;
    const oz = dx * laneOff;
    const axis: 'ns' | 'ew' = Math.abs(dz) > Math.abs(dx) ? 'ns' : 'ew';
    cars.push({
      x: r.x1 + (r.x2 - r.x1) * t + ox,
      z: r.z1 + (r.z2 - r.z1) * t + oz,
      yaw: Math.atan2(dx, dz) * (lane === 1 ? 1 : -1),
      speed: 6 + rnd() * 5,
      targetSpeed: 8 + rnd() * 6,
      fx: r.x1, fz: r.z1, tx: r.x2, tz: r.z2,
      t,
      width: r.width,
      lane,
      axis,
      active: true
    });
  }

  const bodyGeo = new THREE.BoxGeometry(1.7, 1.1, 3.9);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45, metalness: 0.4 });
  const bodies = new THREE.InstancedMesh(bodyGeo, bodyMat, count);
  bodies.castShadow = true;
  const roofGeo = new THREE.BoxGeometry(1.5, 0.5, 2.0);
  const roofs = new THREE.InstancedMesh(
    roofGeo,
    new THREE.MeshStandardMaterial({ color: 0x1a222b, roughness: 0.3 }),
    count
  );
  const mx = new THREE.Matrix4();
  for (let i = 0; i < count; i++) {
    bodies.setColorAt(i, new THREE.Color(COLORS[i % COLORS.length]));
  }
  scene.add(bodies, roofs);

  function place(i: number): void {
    const c = cars[i];
    mx.makeRotationY(c.yaw).setPosition(c.x, 0.55, c.z);
    bodies.setMatrixAt(i, mx);
    const rx = c.x - Math.sin(c.yaw) * 0.3;
    const rz = c.z - Math.cos(c.yaw) * 0.3;
    mx.makeRotationY(c.yaw).setPosition(rx, 1.35, rz);
    roofs.setMatrixAt(i, mx);
  }

  function update(
    dt: number,
    px: number,
    pz: number,
    shouldStop?: (x: number, z: number, axis: 'ns' | 'ew') => boolean
  ): void {
    for (let i = 0; i < cars.length; i++) {
      const c = cars[i];
      const dist = Math.hypot(c.x - px, c.z - pz);
      if (dist > TRAFFIC_FAR) {
        if (c.active) {
          c.active = false;
          mx.makeRotationY(0).setPosition(c.x, -6, c.z);
          bodies.setMatrixAt(i, mx);
          roofs.setMatrixAt(i, mx);
        }
        continue;
      }
      c.active = true;

      let target = c.targetSpeed;

      // traffic light obedience
      if (shouldStop) {
        const lookAheadX = c.x + Math.sin(c.yaw) * 8;
        const lookAheadZ = c.z + Math.cos(c.yaw) * 8;
        if (shouldStop(lookAheadX, lookAheadZ, c.axis)) {
          target = Math.min(target, 2.5);
        }
      }

      // car-following
      if (dist < TRAFFIC_NEAR) {
        for (const o of cars) {
          if (o === c || !o.active) continue;
          const ahead = Math.hypot(o.x - c.x, o.z - c.z);
          if (ahead < 7) {
            const headingDot =
              Math.sin(c.yaw) * (o.x - c.x) + Math.cos(c.yaw) * (o.z - c.z);
            if (headingDot > 0) {
              target = Math.min(target, o.speed * 0.8);
            }
          }
        }
      }

      c.speed += Math.max(-9 * dt, Math.min(6 * dt, target - c.speed));
      c.speed = Math.max(0, c.speed);

      const segLen = Math.hypot(c.tx - c.fx, c.tz - c.fz) || 1;
      const dx = (c.tx - c.fx) / segLen;
      const dz = (c.tz - c.fz) / segLen;
      c.t += (c.speed * dt) / segLen;
      if (c.t >= 1) {
        let best = 0;
        let bestD = Infinity;
        for (let k = 0; k < roads.length; k++) {
          const r = roads[k];
          const d = Math.hypot(r.x1 - c.tx, r.z1 - c.tz);
          if (d < bestD) {
            bestD = d;
            best = k;
          }
        }
        const r = roads[best];
        c.fx = r.x1; c.fz = r.z1; c.tx = r.x2; c.tz = r.z2;
        c.t = 0;
        c.width = r.width;
        c.axis = Math.abs(c.tz - c.fz) > Math.abs(c.tx - c.fx) ? 'ns' : 'ew';
      }
      const laneOff = (c.width / 4) * c.lane;
      const ox = -dz * laneOff;
      const oz = dx * laneOff;
      c.x = c.fx + (c.tx - c.fx) * c.t + ox;
      c.z = c.fz + (c.tz - c.fz) * c.t + oz;
      c.yaw = c.lane === 1 ? Math.atan2(dx, dz) : Math.atan2(-dx, -dz);

      place(i);
    }
    bodies.instanceMatrix.needsUpdate = true;
    roofs.instanceMatrix.needsUpdate = true;
  }

  return {
    cars,
    update,
    dispose() {
      bodies.dispose();
      roofs.dispose();
      bodyGeo.dispose();
      roofGeo.dispose();
      (bodyMat as THREE.Material).dispose();
      scene.remove(bodies, roofs);
    }
  };
}
