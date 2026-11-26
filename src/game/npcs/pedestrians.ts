import * as THREE from 'three';
import type { DhakaTile } from '../world/dhakaTile';

/** Pedestrian NPCs — lightweight capsule figures walking the sidewalk network.
 *  Distance-based simulation budgets: full update near, cheap update far,
 *  frozen beyond the far threshold. All pedestrians share 2 instanced draw
 *  calls (bodies + heads) regardless of count. */

export interface Pedestrian {
  x: number; z: number;
  yaw: number;
  speed: number;
  // current sidewalk edge walk: from -> to
  fx: number; fz: number; tx: number; tz: number;
  t: number; // 0..1 along edge
  phase: number; // walk cycle phase
  active: boolean;
}

export interface NpcSystem {
  pedestrians: Pedestrian[];
  update(dt: number, px: number, pz: number): void;
  dispose(): void;
}

const NEAR = 40;   // full animation + steering
const FAR = 90;    // position updates only
const BODY_COLORS = [0x5d8a4a, 0x6a5acd, 0xd84315, 0x1565c0, 0x455a64, 0x8d6e63];

export function createNpcSystem(
  scene: THREE.Scene,
  tile: DhakaTile,
  count: number
): NpcSystem {
  // sidewalk edges: offset road segments to both sides
  const edges: Array<{ fx: number; fz: number; tx: number; tz: number }> = [];
  for (const r of tile.roads) {
    const len = Math.hypot(r.x2 - r.x1, r.z2 - r.z1) || 1;
    const dx = (r.x2 - r.x1) / len;
    const dz = (r.z2 - r.z1) / len;
    const off = r.width / 2 + 1.4;
    for (const side of [1, -1]) {
      edges.push({
        fx: r.x1 + -dz * off * side,
        fz: r.z1 + dx * off * side,
        tx: r.x2 + -dz * off * side,
        tz: r.z2 + dx * off * side
      });
    }
  }

  const pedestrians: Pedestrian[] = [];
  let seed = 2024;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  if (edges.length > 0) {
    for (let i = 0; i < count; i++) {
      const e = edges[Math.floor(rnd() * edges.length)];
      const t = rnd();
      pedestrians.push({
        x: e.fx + (e.tx - e.fx) * t,
        z: e.fz + (e.tz - e.fz) * t,
        yaw: Math.atan2(e.tx - e.fx, e.tz - e.fz),
        speed: 1.0 + rnd() * 0.6,
        fx: e.fx, fz: e.fz, tx: e.tx, tz: e.tz,
        t,
        phase: rnd() * Math.PI * 2,
        active: true
      });
    }
  }

  // instanced rendering: body capsule + head sphere
  const bodyGeo = new THREE.CapsuleGeometry(0.16, 0.62, 3, 8);
  const headGeo = new THREE.SphereGeometry(0.12, 6, 6);
  const bodyMat = new THREE.MeshStandardMaterial({
    vertexColors: false, color: 0xffffff, roughness: 0.8
  });
  // per-instance colors need InstancedMesh + setColorAt
  const bodies = new THREE.InstancedMesh(bodyGeo, bodyMat, count);
  const heads = new THREE.InstancedMesh(
    headGeo,
    new THREE.MeshStandardMaterial({ color: 0xc99a72, roughness: 0.7 }),
    count
  );
  bodies.castShadow = true;
  const colors: Array<THREE.Color> = [];
  const mx = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < count; i++) {
    const c = new THREE.Color(BODY_COLORS[i % BODY_COLORS.length]);
    colors.push(c);
    bodies.setColorAt(i, c);
  }
  scene.add(bodies, heads);

  function place(i: number, bob: number): void {
    const p = pedestrians[i];
    mx.makeRotationY(p.yaw).setPosition(p.x, 0.55 + bob, p.z);
    bodies.setMatrixAt(i, mx);
    mx.makeRotationY(p.yaw).setPosition(p.x, 1.28 + bob, p.z);
    heads.setMatrixAt(i, mx);
  }

  function update(dt: number, px: number, pz: number): void {
    for (let i = 0; i < pedestrians.length; i++) {
      const p = pedestrians[i];
      const dist = Math.hypot(p.x - px, p.z - pz);
      if (dist > FAR) {
        // frozen: park far pedestrians slightly underground (invisible, cheap)
        if (p.active) {
          p.active = false;
          mx.makeRotationY(0).setPosition(p.x, -5, p.z);
          bodies.setMatrixAt(i, mx);
          heads.setMatrixAt(i, mx);
        }
        continue;
      }
      p.active = true;

      // walk along the edge
      const edgeLen = Math.hypot(p.tx - p.fx, p.tz - p.fz) || 1;
      p.t += (p.speed * dt) / edgeLen;
      if (p.t >= 1) {
        // pick a new random edge starting near the current point
        let best = 0;
        let bestD = Infinity;
        for (let k = 0; k < edges.length; k++) {
          const e = edges[k];
          const d = Math.hypot(e.fx - p.x, e.fz - p.z);
          if (d < bestD) {
            bestD = d;
            best = k;
          }
        }
        const e = edges[best];
        p.fx = e.fx; p.fz = e.fz; p.tx = e.tx; p.tz = e.tz;
        p.t = 0;
        p.yaw = Math.atan2(p.tx - p.fx, p.tz - p.fz);
      }
      p.x = p.fx + (p.tx - p.fx) * p.t;
      p.z = p.fz + (p.tz - p.fz) * p.t;
      p.yaw = Math.atan2(p.tx - p.fx, p.tz - p.fz);

      const bob = dist < NEAR ? Math.abs(Math.sin(p.phase)) * 0.05 : 0;
      p.phase += dt * p.speed * 4;
      place(i, bob);
    }
    bodies.instanceMatrix.needsUpdate = true;
    heads.instanceMatrix.needsUpdate = true;
    void q; void up; void colors;
  }

  return {
    pedestrians,
    update,
    dispose() {
      bodies.dispose();
      heads.dispose();
      bodyGeo.dispose();
      headGeo.dispose();
      (bodyMat as THREE.Material).dispose();
      scene.remove(bodies, heads);
    }
  };
}
