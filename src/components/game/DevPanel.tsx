'use client';

import { useEffect, useState } from 'react';
import { perfStats } from '@/game/core/perf';
import { useGameStore } from '@/game/core/store';

/** Developer performance panel — toggle with F3. All numbers are real
 *  measurements from renderer.info and the FPS sampler; unsupported
 *  metrics are labeled, never faked. */

export default function DevPanel() {
  const ready = useGameStore((s) => s.progress >= 100);
  const [visible, setVisible] = useState(false);
  const [, force] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'F3') {
        e.preventDefault();
        setVisible((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!visible || !ready) return;
    const timer = setInterval(() => force((n) => n + 1), 500);
    return () => clearInterval(timer);
  }, [visible, ready]);

  if (!visible || !ready) return null;

  return (
    <div className="dev-panel">
      <div className="dev-title">DEV PANEL · F3 to hide</div>
      <Row label="FPS" value={String(perfStats.fps)} />
      <Row label="Frame time" value={`${perfStats.frameMs.toFixed(1)} ms`} />
      <Row label="Draw calls" value={String(perfStats.drawCalls)} />
      <Row label="Triangles" value={perfStats.triangles.toLocaleString()} />
      <Row label="Points" value={String(perfStats.points)} />
      <Row label="Geometries (GPU)" value={String(perfStats.geometries)} />
      <Row label="Textures (GPU)" value={String(perfStats.textures)} />
      <Row label="Shader programs" value={String(perfStats.programs)} />
      <Row
        label="JS heap"
        value={
          perfStats.jsHeapUsedMb !== null
            ? `${perfStats.jsHeapUsedMb} / ${perfStats.jsHeapTotalMb} MB`
            : 'not supported by this browser'
        }
      />
      <Row label="Renderer" value={perfStats.renderer} />
      <Row label="Active tile" value={perfStats.tileActive} />
      <Row label="Tiles cached" value={String(perfStats.tileCached)} />
      <Row label="Tiles loading" value={String(perfStats.tileInFlight)} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="dev-row">
      <span className="dev-label">{label}</span>
      <span className="dev-value">{value}</span>
    </div>
  );
}