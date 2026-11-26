import * as THREE from 'three';

/** Building detail LOD — Phase H (Task 6).
 *  The modular building generator creates one detail InstancedMesh set
 *  (windows/balconies/trims). Detail matters near the camera and is wasted
 *  far away, so the detail group toggles by distance band:
 *  - within NEAR: all detail visible
 *  - NEAR..FAR:   coarse only (windows stay, balconies/trims drop)
 *  - beyond FAR:  detail group fully hidden (facades alone)
 *  Frustum culling still applies per-mesh inside each band. */

export interface BuildingLod {
  /** call each frame with the camera position */
  update(camX: number, camZ: number): void;
}

export function createBuildingLod(
  detailGroup: THREE.Object3D,
  coarseGroup: THREE.Object3D
): BuildingLod {
  const NEAR = 90;
  const FAR = 220;

  return {
    update(camX, camZ) {
      // distance from tile center (tile-local coords, tile ~600m across)
      const d = Math.hypot(camX, camZ);
      if (d < NEAR) {
        detailGroup.visible = true;
        coarseGroup.visible = true;
      } else if (d < FAR) {
        // coarse band: hide the finest detail, keep the mid layer
        detailGroup.visible = false;
        coarseGroup.visible = true;
      } else {
        detailGroup.visible = false;
        coarseGroup.visible = false;
      }
    }
  };
}
