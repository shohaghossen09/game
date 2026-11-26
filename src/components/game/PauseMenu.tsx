'use client';

import { useState } from 'react';
import { useGameStore } from '@/game/core/store';
import { travelState } from '@/game/core/travelState';

export default function PauseMenu() {
  const quality = useGameStore((s) => s.quality);
  const setQuality = useGameStore((s) => s.setQuality);
  const paused = useGameStore((s) => s.paused);
  const setPaused = useGameStore((s) => s.setPaused);
  const ready = useGameStore((s) => s.progress >= 100);
  const [showSettings, setShowSettings] = useState(false);
  const [showSaves, setShowSaves] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

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
        {!showSettings && !showSaves && !showMap ? (
          <>
            <button className="menu-btn" onClick={() => setPaused(false)}>Resume</button>
            <button className="menu-btn" onClick={() => setShowMap(true)}>Bangladesh Map</button>
            <button className="menu-btn" onClick={() => setShowSaves(true)}>Save / Load</button>
            <button className="menu-btn" onClick={() => setShowSettings(true)}>Graphics Settings</button>
            <div className="pause-hint">
              WASD move · Shift run · Space jump · E vehicle · Esc pause
            </div>
          </>
        ) : showSettings ? (
          <>
            <h3>Quality Profile</h3>
            {qualities.map((q) => (
              <button
                key={q.id}
                className={'menu-btn' + (quality === q.id ? ' active' : '')}
                onClick={() => setQuality(q.id)}
              >
                {q.label}{quality === q.id ? ' ✓' : ''}
              </button>
            ))}
            <button className="menu-btn" onClick={() => setShowSettings(false)}>Back</button>
            <div className="pause-hint">Quality applies live.</div>
          </>
        ) : showSaves ? (
          <>
            <h3>Save / Load</h3>
            {[1, 2, 3].map((slot) => (
              <div key={slot} className="save-row">
                <button
                  className="menu-btn half"
                  onClick={() => {
                    travelState.saveRequest = { slot, kind: 'save' };
                    setSaveMsg(`Saved to slot ${slot}`);
                  }}
                >
                  Save {slot}
                </button>
                <button
                  className="menu-btn half"
                  onClick={() => {
                    travelState.saveRequest = { slot, kind: 'load' };
                    setSaveMsg(loadMsgFor(slot));
                  }}
                >
                  Load {slot}
                </button>
              </div>
            ))}
            {saveMsg && <div className="pause-hint">{saveMsg}</div>}
            <button className="menu-btn" onClick={() => setShowSaves(false)}>Back</button>
          </>
        ) : (
          <>
            <h3>Bangladesh — {64} Districts</h3>
            <div className="pause-hint" style={{ marginBottom: 8 }}>
              Travel is enabled for districts with baked map data
              (public/world/&lt;district&gt;.json). Others load a labeled
              preview layout.
            </div>
            <div className="district-grid">
              {travelState.districts.map((d) => (
                <button
                  key={d.id}
                  className={'menu-btn district' + (travelState.currentDistrict === d.id ? ' active' : '')}
                  onClick={() => {
                    travelState.travelRequest = d.id;
                    setSaveMsg('');
                  }}
                >
                  {d.name}
                </button>
              ))}
            </div>
            <button className="menu-btn" onClick={() => setShowMap(false)}>Back</button>
          </>
        )}
      </div>
    </div>
  );
}

function loadMsgFor(slot: number): string {
  const raw = typeof localStorage !== 'undefined'
    ? localStorage.getItem(`bls_save_v1_slot_${slot}`)
    : null;
  if (!raw) return `Slot ${slot} is empty`;
  try {
    const data = JSON.parse(raw) as { savedAt: number };
    return `Loaded slot ${slot} (saved ${new Date(data.savedAt).toLocaleString()})`;
  } {
    return `Slot ${slot} unreadable`;
  }
}