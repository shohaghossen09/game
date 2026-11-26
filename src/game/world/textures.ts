import * as THREE from 'three';

/** Procedural PBR textures — Phase E (audit A5, A7).
 *  Canvas-generated base color + roughness maps. No external assets, no
 *  downloads: every texture is original by construction. Textures are
 *  generated once at boot and disposed with the materials that use them. */

const cache = new Map<string, THREE.Texture>();

function makeCanvas(size: number): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable for texture generation');
  return { canvas, ctx };
}

function toTexture(canvas: HTMLCanvasElement, repeat: number, key: string): THREE.Texture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  // base color maps are sRGB; roughness maps are linear (no color space set)
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}

/** Deterministic PRNG so textures are identical on every load. */
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

// ---------- asphalt (roads) ----------
export function asphaltTextures(): { map: THREE.Texture; roughnessMap: THREE.Texture } {
  const key = 'asphalt';
  const base = cachedOr(key, () => {
    const { canvas, ctx } = makeCanvas(256);
    ctx.fillStyle = '#3d3e41';
    ctx.fillRect(0, 0, 256, 256);
    const rnd = seeded(11);
    for (let i = 0; i < 9000; i++) {
      const g = 45 + Math.floor(rnd() * 35);
      ctx.fillStyle = `rgb(${g},${g},${g + 2})`;
      ctx.fillRect(rnd() * 256, rnd() * 256, 1.5, 1.5);
    }
    // patched cracks
    for (let i = 0; i < 14; i++) {
      ctx.strokeStyle = 'rgba(24,24,26,0.55)';
      ctx.lineWidth = 0.6 + rnd() * 1.2;
      ctx.beginPath();
      let x = rnd() * 256;
      let y = rnd() * 256;
      ctx.moveTo(x, y);
      for (let k = 0; k < 5; k++) {
        x += (rnd() * 2 - 1) * 26;
        y += (rnd() * 2 - 1) * 26;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    return toTexture(canvas, 8, key);
  });

  const roughKey = 'asphalt_r';
  const rough = cachedOr(roughKey, () => {
    const { canvas, ctx } = makeCanvas(256);
    const rnd = seeded(77);
    for (let y = 0; y < 256; y += 4) {
      for (let x = 0; x < 256; x += 4) {
        const v = 215 + Math.floor(rnd() * 35); // high roughness ~0.84-0.98
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x, y, 4, 4);
      }
    }
    return toLinearTexture(canvas, 8, roughKey);
  });

  return { map: base, roughnessMap: rough };
}

// ---------- concrete (sidewalks) ----------
export function concreteTextures(): { map: THREE.Texture; roughnessMap: THREE.Texture } {
  const key = 'concrete';
  const base = cachedOr(key, () => {
    const { canvas, ctx } = makeCanvas(256);
    ctx.fillStyle = '#9c968c';
    ctx.fillRect(0, 0, 256, 256);
    const rnd = seeded(23);
    for (let i = 0; i < 5200; i++) {
      const g = 140 + Math.floor(rnd() * 30);
      ctx.fillStyle = `rgba(${g},${g - 4},${g - 12},0.35)`;
      ctx.fillRect(rnd() * 256, rnd() * 256, 2, 2);
    }
    // paving slab seams
    ctx.strokeStyle = 'rgba(70,66,60,0.6)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 256; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();
    }
    return toTexture(canvas, 10, key);
  });

  const roughKey = 'concrete_r';
  const rough = cachedOr(roughKey, () => {
    const { canvas, ctx } = makeCanvas(256);
    const rnd = seeded(79);
    for (let y = 0; y < 256; y += 4) {
      for (let x = 0; x < 256; x += 4) {
        const v = 200 + Math.floor(rnd() * 40);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x, y, 4, 4);
      }
    }
    return toLinearTexture(canvas, 10, roughKey);
  });

  return { map: base, roughnessMap: rough };
}

// ---------- building plaster (facades) ----------
export function plasterTextures(): { map: THREE.Texture; roughnessMap: THREE.Texture } {
  const key = 'plaster';
  const base = cachedOr(key, () => {
    const { canvas, ctx } = makeCanvas(256);
    ctx.fillStyle = '#d9cdb8';
    ctx.fillRect(0, 0, 256, 256);
    const rnd = seeded(31);
    for (let i = 0; i < 3200; i++) {
      const g = 190 + Math.floor(rnd() * 45);
      ctx.fillStyle = `rgba(${g},${g - 8},${g - 24},0.28)`;
      ctx.fillRect(rnd() * 256, rnd() * 256, 2.5, 2.5);
    }
    // weather streaks under windows/ledges
    for (let i = 0; i < 10; i++) {
      const x = rnd() * 256;
      const grad = ctx.createLinearGradient(x, 0, x, 256);
      grad.addColorStop(0, 'rgba(120,110,90,0.16)');
      grad.addColorStop(1, 'rgba(120,110,90,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, 8 + rnd() * 14, 256);
    }
    return toTexture(canvas, 4, key);
  });

  const roughKey = 'plaster_r';
  const rough = cachedOr(roughKey, () => {
    const { canvas, ctx } = makeCanvas(256);
    const rnd = seeded(83);
    for (let y = 0; y < 256; y += 4) {
      for (let x = 0; x < 256; x += 4) {
        const v = 205 + Math.floor(rnd() * 40);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x, y, 4, 4);
      }
    }
    return toLinearTexture(canvas, 4, roughKey);
  });

  return { map: base, roughnessMap: rough };
}

// ---------- brick (boundary walls / accents) ----------
export function brickTextures(): { map: THREE.Texture; roughnessMap: THREE.Texture } {
  const key = 'brick';
  const base = cachedOr(key, () => {
    const { canvas, ctx } = makeCanvas(256);
    ctx.fillStyle = '#8a5a44';
    ctx.fillRect(0, 0, 256, 256);
    const rnd = seeded(43);
    // running-bond brick pattern
    const bh = 16, bw = 42;
    for (let row = 0; row * bh < 256; row++) {
      const offset = row % 2 === 0 ? 0 : bw / 2;
      for (let x = -bw; x < 256; x += bw) {
        const g = 120 + Math.floor(rnd() * 50);
        ctx.fillStyle = `rgb(${g + 20},${g - 26},${g - 40})`;
        ctx.fillRect(x + offset + 1.5, row * bh + 1.5, bw - 3, bh - 3);
      }
    }
    // mortar tint
    ctx.fillStyle = 'rgba(210,200,185,0.12)';
    ctx.fillRect(0, 0, 256, 256);
    return toTexture(canvas, 6, key);
  });

  const roughKey = 'brick_r';
  const rough = cachedOr(roughKey, () => {
    const { canvas, ctx } = makeCanvas(256);
    const rnd = seeded(97);
    for (let y = 0; y < 256; y += 4) {
      for (let x = 0; x < 256; x += 4) {
        const v = 210 + Math.floor(rnd() * 38);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x, y, 4, 4);
      }
    }
    return toLinearTexture(canvas, 6, roughKey);
  });

  return { map: base, roughnessMap: rough };
}

// ---------- helpers ----------

function cachedOr(key: string, make: () => THREE.Texture): THREE.Texture {
  const hit = cache.get(key);
  if (hit) return hit;
  return make();
}

function toLinearTexture(canvas: HTMLCanvasElement, repeat: number, key: string): THREE.Texture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  // roughness maps: no colorSpace set -> linear data
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}

export function disposeProceduralTextures(): void {
  for (const tex of cache.values()) tex.dispose();
  cache.clear();
}
