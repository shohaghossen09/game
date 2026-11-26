/** Dev performance stats — Phase F (Task 9).
 *  Reads renderer.info (draw calls, triangles, points, textures) and
 *  performance.memory where supported. Updated at 2 Hz into a mutable
 *  object read by the dev panel component — outside Zustand so stats
 *  sampling never triggers React re-renders per frame. */

import type * as THREE from 'three';

export interface PerfStats {
  fps: number;
  frameMs: number;
  drawCalls: number;
  triangles: number;
  points: number;
  geometries: number;
  textures: number;
  programs: number;
  jsHeapUsedMb: number | null; // null when performance.memory unsupported
  jsHeapTotalMb: number | null;
  renderer: 'webgl2' | 'webgl';
}

export const perfStats: PerfStats = {
  fps: 0,
  frameMs: 0,
  drawCalls: 0,
  triangles: 0,
  points: 0,
  geometries: 0,
  textures: 0,
  programs: 0,
  jsHeapUsedMb: null,
  jsHeapTotalMb: null,
  renderer: 'webgl2'
};

export function createPerfSampler(
  renderer: THREE.WebGLRenderer,
  rendererKind: 'webgl2' | 'webgl'
): {
  /** call once per frame after render */
  tick(frameMs: number): void;
} {
  let sampleT = 0;
  const info = renderer.info;

  return {
    tick(frameMs) {
      perfStats.frameMs = frameMs;
      sampleT += frameMs;
      if (sampleT < 500) return;
      sampleT = 0;

      perfStats.fps = Math.round(1000 / frameMs);
      perfStats.drawCalls = info.render.calls;
      perfStats.triangles = info.render.triangles;
      perfStats.points = info.render.points;
      perfStats.geometries = info.memory.geometries;
      perfStats.textures = info.memory.textures;
      perfStats.programs = info.programs?.length ?? 0;
      perfStats.renderer = rendererKind;

      const mem = (
        performance as Performance & {
          memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
        }
      ).memory;
      if (mem) {
        perfStats.jsHeapUsedMb = Math.round(mem.usedJSHeapSize / 1048576);
        perfStats.jsHeapTotalMb = Math.round(mem.totalJSHeapSize / 1048576);
      } else {
        perfStats.jsHeapUsedMb = null;
        perfStats.jsHeapTotalMb = null;
      }
    }
  };
}
