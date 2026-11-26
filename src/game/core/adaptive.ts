/** Adaptive resolution — Phase 8.
 *  Watches a rolling FPS average and nudges an internal render-scale factor
 *  up when the GPU has headroom, down when frames are dropping. The engine
 *  multiplies this by the quality profile's pixel-ratio cap each resize.
 *  Hysteresis: changes are small, rate-limited, and bounded so the picture
 *  never visibly oscillates. */

export interface AdaptiveResolution {
  /** current dynamic scale 0.6..1.0 */
  scale: number;
  /** feed measured fps every ~0.5s */
  reportFps(fps: number): void;
  reset(): void;
}

const MIN_SCALE = 0.6;
const MAX_SCALE = 1.0;
const TARGET_FPS = 58;
const DROP_FPS = 45;
const STEP = 0.05;
const COOLDOWN_MS = 1200;

export function createAdaptiveResolution(): AdaptiveResolution {
  let scale = 1.0;
  let lastChange = 0;
  const history: number[] = [];

  function reportFps(fps: number): void {
    history.push(fps);
    if (history.length > 6) history.shift();
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
