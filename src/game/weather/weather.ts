/** Weather state machine: clear -> cloudy -> rain -> heavy rain -> thunderstorm.
 *  Transitions are time-based with hysteresis. Effects are visual + physical
 *  (road friction, visibility). Bangladesh monsoon flavor: long rain spells. */

export type WeatherKind = 'clear' | 'cloudy' | 'rain' | 'heavyRain' | 'thunderstorm';

export interface WeatherState {
  kind: WeatherKind;
  /** 0..1 rain intensity for particle opacity/count scaling */
  intensity: number;
  /** visibility multiplier for fog distance (1 = full) */
  visibility: number;
  /** road grip multiplier (1 = dry) */
  grip: number;
  /** ambient darkening multiplier (1 = normal) */
  darkness: number;
  /** thunder flash countdown, seconds; 0 = no flash */
  flash: number;
}

const DURATION: Record<WeatherKind, number> = {
  clear: 120,
  cloudy: 60,
  rain: 90,
  heavyRain: 60,
  thunderstorm: 45
};

const NEXT: Record<WeatherKind, WeatherKind> = {
  clear: 'cloudy',
  cloudy: 'rain',
  rain: 'heavyRain',
  heavyRain: 'thunderstorm',
  thunderstorm: 'clear'
};

export function createWeather(): WeatherState {
  return {
    kind: 'clear',
    intensity: 0,
    visibility: 1,
    grip: 1,
    darkness: 1,
    flash: 0
  };
}

/** Advance weather. dt seconds. Returns true if the kind changed this frame. */
export function stepWeather(w: WeatherState, dt: number, rnd: () => number): boolean {
  w.timerAccum = (w.timerAccum ?? 0) + dt;
  const target = DURATION[w.kind];

  // intensity eases toward the kind's target
  const targetI = TARGET_INTENSITY[w.kind];
  w.intensity += (targetI - w.intensity) * Math.min(1, dt * 0.4);

  // derived values
  w.visibility = 1 - w.intensity * 0.55;
  w.grip = 1 - w.intensity * 0.3;
  w.darkness = 1 - w.intensity * 0.25;

  // thunderstorm flashes
  if (w.kind === 'thunderstorm' && w.flash <= 0 && rnd() < dt * 0.25) {
    w.flash = 0.18;
  }
  if (w.flash > 0) w.flash -= dt;

  if (w.timerAccum >= target) {
    w.timerAccum = 0;
    w.kind = NEXT[w.kind];
    return true;
  }
  return false;
}

const TARGET_INTENSITY: Record<WeatherKind, number> = {
  clear: 0,
  cloudy: 0.15,
  rain: 0.55,
  heavyRain: 0.8,
  thunderstorm: 1
};

// extend interface with a private accumulator
declare module './weather' {
  interface WeatherState {
    timerAccum?: number;
  }
}

/** Rain particle system sizing per weather state. */
export function rainParticleCount(intensity: number, qualityScale: number): number {
  return Math.floor(intensity * 2400 * qualityScale);
}
