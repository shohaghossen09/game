import * as THREE from 'three';

/** Shared PBR materials — one per category, never per-object. */

export const Materials = {
  road: new THREE.MeshStandardMaterial({ color: 0x3a3a3e, roughness: 0.95 }),
  sidewalk: new THREE.MeshStandardMaterial({ color: 0x9a948b, roughness: 0.9 }),
  wall1: new THREE.MeshStandardMaterial({ color: 0xcbb59a, roughness: 0.85 }),
  wall2: new THREE.MeshStandardMaterial({ color: 0xb7c4c9, roughness: 0.85 }),
  wall3: new THREE.MeshStandardMaterial({ color: 0xd8c9b4, roughness: 0.85 }),
  wall4: new THREE.MeshStandardMaterial({ color: 0xc9a887, roughness: 0.85 }),
  roof: new THREE.MeshStandardMaterial({ color: 0x6b625a, roughness: 0.9 }),
  window: new THREE.MeshStandardMaterial({ color: 0x2c3844, roughness: 0.4, metalness: 0.2 }),
  lane: new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.8 }),
  pole: new THREE.MeshStandardMaterial({ color: 0x444a50, roughness: 0.6 }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 1 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x3f7032, roughness: 0.9 }),
  grass: new THREE.MeshStandardMaterial({ color: 0x5d8a4a, roughness: 1 }),
  water: new THREE.MeshStandardMaterial({
    color: 0x2f6f8f,
    roughness: 0.15,
    metalness: 0.35,
    transparent: true,
    opacity: 0.88
  })
};

export function disposeMaterials(): void {
  Object.values(Materials).forEach((m) => m.dispose());
}