'use client';

import { useState } from 'react';
import { useGameStore } from '@/game/core/store';

export default function PauseMenu() {
  const quality = useGameStore((s) => s.quality);
  const setQuality = useGameStore((s) => s.setQuality);
  const paused = useGameStore((s) => s.paused);
  const setPaused = useGameStore((s) => s.setPaused);
  const ready = useGameStore((s) => s.progress >= 100);
  const [showSettings, setShowSettings] = useState(false);

  if (!ready || !paused) return null;

  const qualities: Array<{ id: typeof quality; label: string }> = [
    { id: 'low', label: 'Low — best for mobile' },
    { id: 'medium', label: 'Medium' },
    { id: 'high', label: 'High — default' },
    { id: 'ultra', label: 'Ultra — desktop only' }
  ];

  return (
    <div className="pause-backdrop">
      <div className="pause-card">
        <h2>PAUSED</h2>
        {!showSettings ? (
          <>
            <button className="menu-btn" onClick={() => setPaused(false)}>
              Resume
            </button>
            <button className="menu-btn" onClick={() => setShowSettings(true)}>
              Graphics Settings
            </button>
            <div className="pause-hint">
              Controls: WASD move · Shift run · Space jump · E vehicle · Esc pause
            </div>
          </>
        ) : (
          <>
            <h3>Quality Profile</h3>
            {qualities.map((q) => (
              <button
                key={q.id}
                className={'menu-btn' + (quality === q.id ? ' active' : '')}
                onClick={() => setQuality(q.id)}
              >
                {q.label}
                {quality === q.id ? ' ✓' : ''}
              </button>
            ))}
            <button className="menu-btn" onClick={() => setShowSettings(false)}>
              Back
            </button>
            <div className="pause-hint">
              Quality applies live — shadows, fog distance, and detail density change instantly.
            </div>
          </>
        )}
      </div>
    </div>
  );
}