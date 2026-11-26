/** Capsule-vs-AABB collision world (Phase 1).
 *  A Rapier 3D swap behind this same interface is a Phase 2 task. */

export interface AABB {
  minX: number; minY: number; minZ: number;
  maxX: number; maxY: number; maxZ: number;
}

export interface CollisionWorld {
  addStaticBox(cx: number, cy: number, cz: number, sx: number, sy: number, sz: number): void;
  queryBox(x: number, z: number, halfW: number, halfD: number): AABB[];
  dispose(): void;
}

const CELL = 20;

export function createCollisionWorld(): CollisionWorld {
  const boxes: AABB[] = [];
  let grid: Map<string, AABB[]> = new Map();
  let dirty = false;

  function rebuild(): void {
    grid = new Map();
    for (const b of boxes) {
      const x0 = Math.floor(b.minX / CELL);
      const x1 = Math.floor(b.maxX / CELL);
      const z0 = Math.floor(b.minZ / CELL);
      const z1 = Math.floor(b.maxZ / CELL);
      for (let i = x0; i <= x1; i++) {
        for (let j = z0; j <= z1; j++) {
          const k = `${i}:${j}`;
          const arr = grid.get(k);
          if (arr) arr.push(b);
          else grid.set(k, [b]);
        }
      }
    }
    dirty = false;
  }

  rebuild();

  return {
    addStaticBox(cx, cy, cz, sx, sy, sz) {
      boxes.push({
        minX: cx - sx / 2, maxX: cx + sx / 2,
        minY: cy - sy / 2, maxY: cy + sy / 2,
        minZ: cz - sz / 2, maxZ: cz + sz / 2
      });
      dirty = true;
    },
    queryBox(x, z, halfW, halfD) {
      if (dirty) rebuild();
      const seen = new Set<AABB>();
      const out: AABB[] = [];
      const x0 = Math.floor((x - halfW) / CELL);
      const x1 = Math.floor((x + halfW) / CELL);
      const z0 = Math.floor((z - halfD) / CELL);
      const z1 = Math.floor((z + halfD) / CELL);
      for (let i = x0; i <= x1; i++) {
        for (let j = z0; j <= z1; j++) {
          const arr = grid.get(`${i}:${j}`);
          if (!arr) continue;
          for (const b of arr) {
            if (!seen.has(b)) {
              seen.add(b);
              out.push(b);
            }
          }
        }
      }
      return out;
    },
    dispose() {
      boxes.length = 0;
      grid = new Map();
    }
  };
}

/** Resolve a capsule (cylinder approx) against AABBs — least-penetration pushout.
 *  Returns true if grounded (standing on top of something). */
export function resolveCapsule(
  pos: { x: number; y: number; z: number },
  radius: number,
  height: number,
  boxes: AABB[]
): boolean {
  let grounded = false;
  for (const c of boxes) {
    if (pos.x + radius < c.minX || pos.x - radius > c.maxX) continue;
    if (pos.z + radius < c.minZ || pos.z - radius > c.maxZ) continue;
    if (pos.y >= c.maxY - 0.05) {
      grounded = true;
      continue;
    }
    if (pos.y + height <= c.minY) continue;
    const px = Math.min(pos.x + radius - c.minX, c.maxX - (pos.x - radius));
    const pz = Math.min(pos.z + radius - c.minZ, c.maxZ - (pos.z - radius));
    if (px < pz) pos.x += pos.x < (c.minX + c.maxX) / 2 ? -px : px;
    else pos.z += pos.z < (c.minZ + c.maxZ) / 2 ? -pz : pz;
  }
  return grounded;
}

/** Car body (approx AABB) vs building AABBs. Returns speed loss factor. */
export function resolveCar(
  pos: { x: number; y: number; z: number },
  boxes: AABB[]
): number {
  let loss = 1;
  for (const c of boxes) {
    if (pos.x + 1.2 < c.minX || pos.x - 1.2 > c.maxX) continue;
    if (pos.z + 1.2 < c.minZ || pos.z - 1.2 > c.maxZ) continue;
    if (c.maxY < 0.5) continue;
    const px = Math.min(pos.x + 1.2 - c.minX, c.maxX - (pos.x - 1.2));
    const pz = Math.min(pos.z + 1.2 - c.minZ, c.maxZ - (pos.z - 1.2));
    if (px < pz) pos.x += pos.x < (c.minX + c.maxX) / 2 ? -px : px;
    else pos.z += pos.z < (c.minZ + c.maxZ) / 2 ? -pz : pz;
    loss *= 0.35;
  }
  return Math.max(0, loss);
}