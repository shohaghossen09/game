import * as THREE from 'three';
import type { CollisionWorld } from '../physics/collision';
import { resolveCapsule } from '../physics/collision';

export interface Player {
  group: THREE.Group;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  yaw: number;
  onGround: boolean;
  radius: number;
  height: number;
  animT: number;
  limbs: {
    armL: THREE.Object3D;
    armR: THREE.Object3D;
    legL: THREE.Object3D;
    legR: THREE.Object3D;
  };
}

export const WALK_SPEED = 4.4;
export const RUN_SPEED = 7.6;
export const JUMP_SPEED = 9;
export const GRAVITY = 24;
export const BOUND = 290;

export function createPlayer(scene: THREE.Scene): Player {
  const group = new THREE.Group();
  scene.add(group);

  const skin = new THREE.MeshStandardMaterial({ color: 0xc99a72, roughness: 0.7 });
  const shirt = new THREE.MeshStandardMaterial({ color: 0x2f6f4f, roughness: 0.8 });
  const pant = new THREE.MeshStandardMaterial({ color: 0x33404f, roughness: 0.85 });

  const mk = (g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number) => {
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    o.castShadow = true;
    group.add(o);
    return o;
  };

  mk(new THREE.CapsuleGeometry(0.19, 0.34, 4, 10), shirt, 0, 1.12, 0);
  mk(new THREE.SphereGeometry(0.15, 10, 10), skin, 0, 1.62, 0);
  const armL = mk(new THREE.CapsuleGeometry(0.06, 0.42, 4, 8), shirt, -0.26, 1.15, 0);
  const armR = mk(new THREE.CapsuleGeometry(0.06, 0.42, 4, 8), shirt, 0.26, 1.15, 0);
  const legL = mk(new THREE.CapsuleGeometry(0.075, 0.5, 4, 8), pant, -0.11, 0.35, 0);
  const legR = mk(new THREE.CapsuleGeometry(0.075, 0.5, 4, 8), pant, 0.11, 0.35, 0);

  return {
    group,
    pos: new THREE.Vector3(4, 0, -40),
    vel: new THREE.Vector3(),
    yaw: Math.PI,
    onGround: true,
    radius: 0.42,
    height: 1.75,
    animT: 0,
    limbs: { armL, armR, legL, legR }
  };
}

export interface StepArgs {
  moveX: number;
  moveZ: number;
  run: boolean;
  jumpQueued: boolean;
  camYaw: number;
  dt: number;
  collision: CollisionWorld;
  waterZones: { x: number; z: number; r: number }[];
}

export function stepPlayer(p: Player, args: StepArgs): void {
  const { moveX, moveZ, run, jumpQueued, camYaw, dt, collision, waterZones } = args;

  const mag = Math.min(Math.hypot(moveX, moveZ), 1);
  const spd = run ? RUN_SPEED : WALK_SPEED;

  if (mag > 0.01) {
    const dirAngle = Math.atan2(moveX, moveZ) + camYaw + Math.PI;
    const d = Math.atan2(Math.sin(dirAngle - p.yaw), Math.cos(dirAngle - p.yaw));
    p.yaw += d * (1 - Math.pow(0.0001, dt));
    p.vel.x = Math.sin(p.yaw) * mag * spd;
    p.vel.z = Math.cos(p.yaw) * mag * spd;
  } else {
    p.vel.x *= 0.8;
    p.vel.z *= 0.8;
  }

  if (jumpQueued && p.onGround) {
    p.vel.y = JUMP_SPEED;
    p.onGround = false;
  }

  p.vel.y -= GRAVITY * dt;
  p.pos.x += p.vel.x * dt;
  p.pos.z += p.vel.z * dt;
  p.pos.y += p.vel.y * dt;

  // ground plane
  const inWater = waterZones.some(
    (w) => Math.hypot(p.pos.x - w.x, p.pos.z - w.z) < w.r
  );
  p.onGround = false;
  if (p.pos.y <= 0) {
    if (inWater) {
      p.pos.y = Math.max(p.pos.y, -0.4);
      p.vel.y = Math.max(p.vel.y * 0.5, 0);
      if (p.pos.y >= -0.01) {
        p.pos.y = 0;
        p.onGround = true;
      }
    } else {
      p.pos.y = 0;
      p.vel.y = 0;
      p.onGround = true;
    }
  }

  // static colliders
  const nearby = collision.queryBox(p.pos.x, p.pos.z, p.radius + 1, p.radius + 1);
  const grounded = resolveCapsule(
    { x: p.pos.x, y: p.pos.y, z: p.pos.z },
    p.radius,
    p.height,
    nearby
  );
  if (grounded) p.onGround = true;

  // play area bounds
  p.pos.x = Math.max(-BOUND, Math.min(BOUND, p.pos.x));
  p.pos.z = Math.max(-BOUND, Math.min(BOUND, p.pos.z));

  // animation
  const moveSpd = Math.hypot(p.vel.x, p.vel.z);
  p.animT += dt * (4 + moveSpd * 1.4);
  const sw = Math.sin(p.animT * 2) * (moveSpd > 0.4 ? 0.55 : 0.06);
  p.limbs.armL.rotation.x = sw;
  p.limbs.armR.rotation.x = -sw;
  p.limbs.legL.rotation.x = -sw;
  p.limbs.legR.rotation.x = sw;

  p.group.position.copy(p.pos);
  p.group.rotation.y = p.yaw + Math.PI;
}