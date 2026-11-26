import * as THREE from 'three';
import type { CollisionWorld } from '../physics/collision';
import { resolveCar } from '../physics/collision';
import { VEHICLE_SPECS, type VehicleCategory, type VehicleSpec } from './specs';

export interface Vehicle {
  group: THREE.Group;
  category: VehicleCategory;
  spec: VehicleSpec;
  pos: THREE.Vector3;
  yaw: number;
  speed: number;
  steer: number;
  wheels: THREE.Object3D[];
  occupied: boolean;
}

function buildMesh(spec: VehicleSpec): THREE.Group {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(spec.bodyW, spec.bodyH, spec.bodyL),
    new THREE.MeshStandardMaterial({ color: spec.color, roughness: 0.4, metalness: 0.5 })
  );
  body.position.y = spec.bodyH / 2 + spec.wheelR * 0.7;
  body.castShadow = true;
  group.add(body);

  if (spec.cabin) {
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(spec.bodyW * 0.9, spec.bodyH * 0.8, spec.bodyL * 0.45),
      new THREE.MeshStandardMaterial({ color: 0x1a222b, roughness: 0.25, metalness: 0.4 })
    );
    cabin.position.set(0, spec.bodyH + spec.wheelR * 0.7 + spec.bodyH * 0.4, -spec.bodyL * 0.05);
    cabin.castShadow = true;
    group.add(cabin);
  }

  const wg = new THREE.CylinderGeometry(spec.wheelR, spec.wheelR, 0.24, 12);
  wg.rotateZ(Math.PI / 2);
  const wm = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  const halfTrack = spec.bodyW / 2;
  const halfWheelbase = spec.bodyL / 2 - spec.wheelR;
  const wheels = [-halfTrack, halfTrack].flatMap((x) =>
    [halfWheelbase, -halfWheelbase].map((z) => {
      const w = new THREE.Mesh(wg, wm);
      w.position.set(x, spec.wheelR, z);
      w.castShadow = true;
      group.add(w);
      return w;
    })
  );
  void wheels;
  return group;
}

export function createVehicle(
  scene: THREE.Scene,
  category: VehicleCategory,
  x: number,
  z: number,
  yaw = 0
): Vehicle {
  const spec = VEHICLE_SPECS[category];
  const group = buildMesh(spec);
  scene.add(group);
  const v: Vehicle = {
    group,
    category,
    spec,
    pos: new THREE.Vector3(x, 0, z),
    yaw,
    speed: 0,
    steer: 0,
    wheels: group.children.filter((c) => c instanceof THREE.Mesh && c.geometry.type === 'CylinderGeometry') as THREE.Object3D[],
    occupied: false
  };
  group.position.copy(v.pos);
  return v;
}

export interface VehicleStepArgs {
  moveX: number;
  moveZ: number;
  dt: number;
  collision: CollisionWorld;
  bound: number;
}

export function stepVehicle(v: Vehicle, args: VehicleStepArgs): void {
  const { moveX, moveZ, dt, collision, bound } = args;
  const spec = v.spec;

  const throttle = moveZ;
  v.speed += throttle * (throttle > 0 ? spec.accel : spec.brakeOrReverseAccel) * dt;
  v.speed *= 1 - Math.min(0.9, dt * spec.drag);
  if (Math.abs(throttle) < 0.05) v.speed *= 1 - dt * 1.1;
  v.speed = Math.max(spec.maxReverse, Math.min(spec.maxSpeed, v.speed));

  v.steer += (moveX * 0.55 - v.steer) * (1 - Math.pow(0.001, dt));
  v.yaw -= v.steer * v.speed * dt * (spec.steerRate * 2);

  v.pos.x += Math.sin(v.yaw) * v.speed * dt;
  v.pos.z += Math.cos(v.yaw) * v.speed * dt;

  const nearby = collision.queryBox(v.pos.x, v.pos.z, spec.collideHalf + 1, spec.collideHalf + 1);
  const loss = resolveCarScaled(
    { x: v.pos.x, y: v.pos.y, z: v.pos.z },
    nearby,
    spec.collideHalf
  );
  v.speed *= loss;

  v.pos.x = Math.max(-bound, Math.min(bound, v.pos.x));
  v.pos.z = Math.max(-bound, Math.min(bound, v.pos.z));

  v.group.position.copy(v.pos);
  v.group.rotation.y = v.yaw;
  for (const w of v.wheels) w.rotation.x -= v.speed * dt * (2.4 / spec.wheelR * 0.3);
}

/** Same pushout as resolveCar but with per-vehicle collide half-width. */
function resolveCarScaled(
  pos: { x: number; y: number; z: number },
  boxes: import('../physics/collision').AABB[],
  half: number
): number {
  let loss = 1;
  for (const c of boxes) {
    if (pos.x + half < c.minX || pos.x - half > c.maxX) continue;
    if (pos.z + half < c.minZ || pos.z - half > c.maxZ) continue;
    if (c.maxY < 0.5) continue;
    const px = Math.min(pos.x + half - c.minX, c.maxX - (pos.x - half));
    const pz = Math.min(pos.z + half - c.minZ, c.maxZ - (pos.z - half));
    if (px < pz) pos.x += pos.x < (c.minX + c.maxX) / 2 ? -px : px;
    else pos.z += pos.z < (c.minZ + c.maxZ) / 2 ? -pz : pz;
    loss *= 0.35;
  }
  return Math.max(0, loss);
}

export function enterVehicle(v: Vehicle, p: { group: THREE.Group }): void {
  v.occupied = true;
  p.group.visible = false;
}

export function exitVehicle(v: Vehicle, p: { pos: THREE.Vector3; vel: THREE.Vector3; group: THREE.Group }): void {
  v.occupied = false;
  p.pos.set(
    v.pos.x + (v.spec.collideHalf + 1) * Math.cos(v.yaw),
    0,
    v.pos.z - (v.spec.collideHalf + 1) * Math.sin(v.yaw)
  );
  p.vel.set(0, 0, 0);
  p.group.visible = true;
}

/** Nearest unoccupied vehicle within range of a position. */
export function nearestVehicle(
  vehicles: Vehicle[],
  pos: THREE.Vector3,
  range: number
): Vehicle | null {
  let best: Vehicle | null = null;
  let bestD = Infinity;
  for (const v of vehicles) {
    if (v.occupied) continue;
    const d = pos.distanceTo(v.pos);
    if (d < range && d < bestD) {
      bestD = d;
      best = v;
    }
  }
  return best;
}
