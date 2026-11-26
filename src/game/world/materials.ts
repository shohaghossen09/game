import * as THREE from 'three';
import {
  asphaltTextures,
  concreteTextures,
  plasterTextures,
  brickTextures
} from './textures';

/** Shared PBR materials — Phase E upgrade (audit A5, A7).
 *  Base color + roughness maps from the procedural generator; one material
 *  per category, never per-object. Facade materials get per-style tints so
 *  buildings vary without extra draw calls. */

const asphalt = asphaltTextures();
const concrete = concreteTextures();
const plaster = plasterTextures();
const brick = brickTextures();

export const Materials = {
  road: new THREE.MeshStandardMaterial({
    map: asphalt.map,
    roughnessMap: asphalt.roughnessMap,
    roughness: 1.0,
    color: 0xffffff
  }),
  sidewalk: new THREE.MeshStandardMaterial({
    map: concrete.map,
    roughnessMap: concrete.roughnessMap,
    roughness: 1.0,
    color: 0xffffff
  }),
  /** Facade tints — plaster texture shared, color varies per style. */
  facade1: new THREE.MeshStandardMaterial({
    map: plaster.map,
    roughnessMap: plaster.roughnessMap,
    roughness: 1.0,
    color: 0xf2e4cc // warm cream
  }),
  facade2: new THREE.MeshStandardMaterial({
    map: plaster.map,
    roughnessMap: plaster.roughnessMap,
    roughness: 1.0,
    color: 0xd9e2e8 // gray-blue
  }),
  facade3: new THREE.MeshStandardMaterial({
    map: plaster.map,
    roughnessMap: plaster.roughnessMap,
    roughness: 1.0,
    color: 0xe8d5b7 // sandstone
  }),
  facade4: new THREE.MeshStandardMaterial({
    map: brick.map,
    roughnessMap: brick.roughnessMap,
    roughness: 1.0,
    color: 0xffffff // exposed brick
  }),
  roof: new THREE.MeshStandardMaterial({
    color: 0x6f665d,
    roughness: 0.95,
    map: concrete.map,
    roughnessMap: concrete.roughnessMap
  }),
  /** Window glass — slight reflection, dark tint. */
  window: new THREE.MeshStandardMaterial({
    color: 0x2c3844,
    roughness: 0.25,
    metalness: 0.3,
    envMapIntensity: 0.6
  }),
  /** Balcony/trim concrete. */
  trim: new THREE.MeshStandardMaterial({
    map: concrete.map,
    roughnessMap: concrete.roughnessMap,
    roughness: 1.0,
    color: 0xd8d2c6
  }),
  lane: new THREE.MeshStandardMaterial({
    color: 0xd8d8d8,
    roughness: 0.8
  }),
  pole: new THREE.MeshStandardMaterial({
    color: 0x4a5056,
    roughness: 0.55,
    metalness: 0.6
  }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 1 }),
  leaf: new THREE.MeshStandardMaterial({ color: 0x3f7032, roughness: 0.9 }),
  grass: new THREE.MeshStandardMaterial({ color: 0x5d8a4a, roughness: 1 }),
  water: new THREE.MeshStandardMaterial({
    color: 0x2f6f8f,
    roughness: 0.15,
    metalness: 0.35,
    transparent: true,
    opacity: 0.88
  }),
  /** Boundary wall — brick, common in Dhanmondi. */
  boundary: new THREE.MeshStandardMaterial({
    map: brick.map,
    roughnessMap: brick.roughnessMap,
    roughness: 1.0,
    color: 0xffffff
  })
};

export const facadeMats = [
  Materials.facade1,
  Materials.facade2,
  Materials.facade3,
  Materials.facade4
];

export function disposeMaterials(): void {
  Object.values(Materials).forEach((m) => m.dispose());
}
