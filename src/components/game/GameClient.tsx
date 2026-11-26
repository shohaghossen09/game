'use client';

import { useEffect, useRef } from 'react';
import Hud from './Hud';
import TouchControls from './TouchControls';
import DevPanel from './DevPanel';
import TravelPanel from './TravelPanel';
import { useGameStore } from '@/game/core/store';

export default function GameClient() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let dispose: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const mod = await import('@/game/core/engine');
      if (cancelled || !canvasRef.current) return;
      const engine = await mod.createEngine(canvasRef.current);
      if (cancelled) {
        engine.dispose();
        return;
      }
      dispose = engine.dispose;
    })().catch((err: unknown) => {
      useGameStore.setState({
        bootError: err instanceof Error ? err.message : String(err)
      });
    });

    return () => {
      cancelled = true;
      if (dispose) dispose();
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="game-canvas" />
      <Hud />
      <TouchControls />
      <DevPanel />
      <TravelPanel />
      <LoadingScreen />
    </>
  );
}

function LoadingScreen() {
  const progress = useGameStore((s) => s.progress);
  const status = useGameStore((s) => s.status);
  const error = useGameStore((s) => s.bootError);
  const ready = progress >= 100 && !error;
  return (
    <div className={'loading' + (ready ? ' done' : '')}>
      <h1>BANGLADESH LIFE SIMULATOR</h1>
      <div className="sub">DHAKA PROTOTYPE · DHANMONDI TILE</div>
      {error ? (
        <div className="load-error-box">
          <div className="load-error">Failed to start: {error}</div>
          <button
            className="load-retry"
            onClick={() => location.reload()}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="bar-wrap">
            <div className="bar" style={{ width: progress + '%' }} />
          </div>
          <div className="load-status">{status}</div>
        </>
      )}
    </div>
  );
}