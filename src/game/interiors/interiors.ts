import * as THREE from 'three';
import type { CollisionWorld } from '../physics/collision';
import { Materials } from '../world/materials';

/** Enterable building interiors — Phase 3 continuation. */

export interface Interior {
  doorX: number;
  doorZ: number;
  minX: number; maxX: number; minZ: number; maxZ: number;
  label: string;
  group: THREE.Group;
}

export interface InteriorSystem {
  interiors: Interior[];
  insideOf(pos: { x: number; z: number }): Interior | null;
  nearestDoor(pos: { x: number; z: number }, range: number): Interior | null;
  dispose(): void;
}

export const SHOP_STYLE = [
  { label: 'Tea Stall', wall: 0xd8c9b4, counter: 0x8d6e63, shelf: 0x6d4c41 },
  { label: 'Grocery Store', wall: 0xcbb59a, counter: 0x00695c, shelf: 0x5d4037 },
  { label: 'Mobile Shop', wall: 0xb7c4c9, counter: 0x1565c0, shelf: 0x37474f },
  { label: 'Pharmacy', wall: 0xd8c9b4, counter: 0x2e7d32, shelf: 0x33691e },
  { label: 'Restaurant', wall: 0xc9a887, counter: 0xbf360c, shelf: 0x4e342e }
];

/** Shop slots along the main avenue: z position, side (+1 east, -1 west), style index. */
export const SHOP_SLOTS: Array<{ z: number; side: number; style: number }> = [
  { z: -120, side: 1, style: 0 },
  { z: -60, side: 1, style: 1 },
  { z: 0, side: 1, style: 2 },
  { z: 60, side: 1, style: 3 },
  { z: 120, side: 1, style: 4 },
  { z: -90, side: -1, style: 2 },
  { z: -30, side: -1, style: 0 },
  { z: 30, side: -1, style: 4 },
  { z: 90, side: -1, style: 1 }
];

/** buildInteriors is implemented in interiors-build.ts and re-exported here. */
export { buildInteriors } from './interiors-build';
