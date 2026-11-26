/** Mutable minimap state — written by the engine each frame (cheap), read by
 *  the React canvas component. Deliberately OUTSIDE Zustand: this updates every
 *  frame and must never trigger React re-renders. */

export interface MinimapRoad {
  x1: number; z1: number; x2: number; z2: number; width: number;
}
export interface MinimapBuilding {
  x: number; z: number; w: number; d: number;
}
export interface MinimapWater {
  x: number; z: number; r: number;
}

export const minimapState = {
  px: 0,
  pz: 0,
  yaw: 0,
  driving: false,
  roads: [] as MinimapRoad[],
  buildings: [] as MinimapBuilding[],
  water: [] as MinimapWater[],
  vehicleX: 0,
  vehicleZ: 0
};

export function resetMinimap(): void {
  minimapState.roads = [];
  minimapState.buildings = [];
  minimapState.water = [];
}