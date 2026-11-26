'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/game/core/store';
import { minimapState } from '@/game/core/minimap';

const RANGE = 160; // meters shown across the minimap radius
const SIZE = 180; // css pixels

export default function Minimap() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ready = useGameStore((s) => s.progress >= 100);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !ready) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      const { px, pz, yaw, driving, roads, buildings, water, vehicleX, vehicleZ } = minimapState;
      const dpr = Math.min(devicePixelRatio, 2);
      const size = SIZE * dpr;
      if (canvas.width !== size) {
        canvas.width = size;
        canvas.height = size;
      }
      const scale = size / (RANGE * 2);
      const cx = size / 2;
      const cy = size / 2;

      ctx.clearRect(0, 0, size, size);
      // background
      ctx.fillStyle = '#20303d';
      ctx.fillRect(0, 0, size, size);

      const toX = (x: number) => cx + (x - px) * scale;
      const toY = (z: number) => cy + (z - pz) * scale;

      // water
      ctx.fillStyle = '#2f6f8f';
      for (const w of water) {
        ctx.beginPath();
        ctx.arc(toX(w.x), toY(w.z), w.r * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // roads
      ctx.strokeStyle = '#556068';
      for (const r of roads) {
        ctx.lineWidth = Math.max(1, r.width * scale * 0.9);
        ctx.beginPath();
        ctx.moveTo(toX(r.x1), toY(r.z1));
        ctx.lineTo(toX(r.x2), toY(r.z2));
        ctx.stroke();
      }

      // buildings
      ctx.fillStyle = '#5c5348';
      for (const b of buildings) {
        const bx = toX(b.x - b.w / 2);
        const bz = toY(b.z - b.d / 2);
        ctx.fillRect(bx, bz, b.w * scale, b.d * scale);
      }

      // player arrow (north-up map, player rotates)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(driving ? yaw + Math.PI : yaw + Math.PI);
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.moveTo(0, -8 * dpr);
      ctx.lineTo(5 * dpr, 6 * dpr);
      ctx.lineTo(-5 * dpr, 6 * dpr);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // vehicle marker
      if (!driving) {
        ctx.fillStyle = '#ff8f00';
        ctx.beginPath();
        ctx.arc(toX(vehicleX), toY(vehicleZ), 4 * dpr, 0, Math.PI * 2);
        ctx.fill();
      }

      // circular mask + border
      ctx.globalCompositeOperation = 'destination-in';
      ctx.beginPath();
      ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 2 * dpr;
      ctx.beginPath();
      ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
      ctx.stroke();
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  if (!ready) return null;
  return <canvas ref={canvasRef} className="minimap" style={{ width: SIZE, height: SIZE }} />;
}