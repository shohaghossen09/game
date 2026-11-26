/** Adaptive resolution — Phase H (Task 9).
 *  Watches a rolling FPS average and nudges an internal render-scale factor
 *  down when frames are consistently dropping, back up when there is
 *  headroom. The engine multiplies this by the quality profile's pixel-ratio
 *  cap — the scale can never exceed what the profile allows.
 *  Hysteresis: small steps, cooldown between changes, bounded range, so the
 *  picture never visibly oscillate. */

export interface AdaptiveResolution {
  /** current dynamic scale 0.6..1.0 */
  scale: number;
  /** feed the measured fps (called ~2 Hz from the engine) */
  reportFps(fps: number): void;
  reset(): void;
}

const MIN_SCALE = 0.6;
const MAX_SCALE = 1.0;
const TARGET_FPS = 58;
const DROP_FPS = 45;
const STEP = 0.05;
const COOLDOWN_MS = 1500;
const SAMPLES = 6;

export function createAdaptiveResolution(): AdaptiveResolution {
  let scale = 1.0;
  let lastChange = 0;
  const history: number[] = [];

  function reportFps(fps: number): void {
    history.push(fps);
    if (history.length > SAMPLES) history.shift();
    const now = performance.now();
    if (now - lastChange < COOLDOWN_MS) return;

    const avg = history.reduce((a, b) => a + b, 0) / history.length;
    if (avg >= TARGET_FPS && scale < MAX_SCALE) {
      scale = Math.min(MAX_SCALE, scale + STEP);
      lastChange = now;
      history.length = 0;
    } else if (avg <= DROP_FPS && scale > MIN_SCALE) {
      scale = Math.max(MIN_SCALE, scale - STEP);
      lastChange = now;
      history.length = 0;
    }
  }

  return {
    get scale() {
      return scale;
    },
    reportFps,
    reset() {
      scale = 1.0;
      history.length = 0;
      lastChange = 0;
    }
  };
}
