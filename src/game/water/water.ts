/** Water interaction: swimming depth states, underwater camera tint values,
 *  and shoreline detection. Pure logic — no Three.js dependency. */

export interface WaterZone {
  x: number;
  z: number;
  r: number;
}

export type SwimState = 'land' | 'wading' | 'swimming' | 'underwater';

export interface WaterResult {
  state: SwimState;
  /** 0 = fully dry, 1 = head under water */
  submersion: number;
}

export function evalWater(
  pos: { x: number; y: number; z: number },
  zones: WaterZone[]
): WaterResult {
  let inZone = false;
  for (const w of zones) {
    if (Math.hypot(pos.x - w.x, pos.z - w.z) < w.r) {
      inZone = true;
      break;
    }
  }
  if (!inZone) return { state: 'land', submersion: 0 };

  // player capsule: feet at pos.y, head at pos.y + ~1.75
  const headY = pos.y + 1.62;
  if (headY < -0.15) return { state: 'underwater', submersion: 1 };
  if (pos.y < -0.15) return { state: 'swimming', submersion: 0.5 };
  if (pos.y < 0.05) return { state: 'wading', submersion: 0.15 };
  return { state: 'land', submersion: 0 };
}

/** Buoyancy + drag applied to a velocity while swimming.
 *  Returns new y velocity and clamped y position. */
export function applyBuoyancy(
  pos: { y: number },
  vel: { y: number },
  state: SwimState,
  dt: number
): void {
  if (state === 'land') return;
  if (state === 'wading') {
    // walkable shallow water: mild drag
    vel.y *= 0.8;
    return;
  }
  // swimming / underwater: spring toward float depth
  const FLOAT_Y = -0.75;
  const spring = (FLOAT_Y - pos.y) * 6;
  vel.y += (spring - vel.y * 2.5) * dt;
}

/** Swim movement is slower than walking and disables jumping. */
export const SWIM_SPEED = 2.2;
