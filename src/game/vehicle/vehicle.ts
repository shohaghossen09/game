import * as THREE from 'three';
import type { CollisionWorld } from '../physics/collision';
import { resolveCar } from '../physics/collision';

export interface Vehicle {
  group: THREE.Group;
  pos: THREE.Vector3;
  yaw: number;
  speed: number;
  steer: number;
  wheels: THREE.Object3D[];
  occupied: boolean;
}

const MAX_FWD = 26;
const MAX_REV = -9;

export function createVehicle(
  scene: THREE.Scene,
  collision: CollisionWorld
): Vehicle {
  void collision;
  const group = new THREE.Group();
  scene.add(group);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.9, 0.62, 4.4),
    new THREE.MeshStandardMaterial({ color: 0x8a1f1f, roughness: 0.35, metalness: 0.55 })
  );
  body.position.y = 0.62;
  body.castShadow = true;
  group.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.55, 2.2),
    new THREE.MeshStandardMaterial({ color: 0x1a222b, roughness: 0.25, metalness: 0.4 })
  );
  cabin.position.set(0, 1.15, -0.25);
  cabin.castShadow = true;
  group.add(cabin);

  const wg = new THREE.CylinderGeometry(0.34, 0.34, 0.26, 14);
  wg.rotateZ(Math.PI / 2);
  const wm = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  const wheels = [-0.85, 0.85].flatMap((x) =>
    [1.45, -1.45].map((z) => {
      const w = new THREE.Mesh(wg, wm);
      w.position.set(x, 0.34, z);
      w.castShadow = true;
      group.add(w);
      return w;
    })
  );

  const v: Vehicle = {
    group,
    pos: new THREE.Vector3(10, 0, -46),
    yaw: 0,
    speed: 0,
    steer: 0,
    wheels,
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

  const throttle = moveZ;
  v.speed += throttle * (throttle > 0 ? 14 : 10) * dt;
  v.speed *= 1 - Math.min(0.9, dt * 0.5);
  if (Math.abs(throttle) < 0.05) v.speed *= 1 - dt * 1.1;
  v.speed = Math.max(MAX_REV, Math.min(MAX_FWD, v.speed));

  v.steer += (moveX * 0.55 - v.steer) * (1 - Math.pow(0.001, dt));
  v.yaw -= v.steer * v.speed * dt * 0.14;

  v.pos.x += Math.sin(v.yaw) * v.speed * dt;
  v.pos.z += Math.cos(v.yaw) * v.speed * dt;

  const nearby = collision.queryBox(v.pos.x, v.pos.z, 2.2, 2.2);
  const loss = resolveCar(
    { x: v.pos.x, y: v.pos.y, z: v.pos.z },
    nearby
  );
  v.speed *= loss;

  v.pos.x = Math.max(-bound, Math.min(bound, v.pos.x));
  v.pos.z = Math.max(-bound, Math.min(bound, v.pos.z));

  v.group.position.copy(v.pos);
  v.group.rotation.y = v.yaw;
  for (const w of v.wheels) w.rotation.x -= v.speed * dt * 2.4;
}

export function enterVehicle(v: Vehicle, p: { group: THREE.Group }): void {
  v.occupied = true;
  p.group.visible = false;
}

export function exitVehicle(v: Vehicle, p: { pos: THREE.Vector3; vel: THREE.Vector3; group: THREE.Group }): void {
  v.occupied = false;
  p.pos.set(
    v.pos.x + 2.2 * Math.cos(v.yaw),
    0,
    v.pos.z - 2.2 * Math.sin(v.yaw)
  );
  p.vel.set(0, 0, 0);
  p.group.visible = true;
}