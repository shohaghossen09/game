'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/game/core/store';
import { travelState } from '@/game/core/travelState';
import { fetchAuthStatus, type AuthStatus } from '@/game/backend/client';

export default function PauseMenu() {
  const quality = useGameStore((s) => s.quality);
  const setQuality = useGameStore((s) => s.setQuality);
  const paused = useGameStore((s) => s.paused);
  const setPaused = useGameStore((s) => s.setPaused);
  const ready = useGameStore((s) => s.progress >= 100);
  const [tab, setTab] = useState<'main' | 'settings' | 'saves' | 'map'>('main');
  const [msg, setMsg] = useState('');
  const [auth, setAuth] = useState<AuthStatus>({ authenticated: false });
  const [cloudMsg, setCloudMsg] = useState<string | null>(null);

  useEffect(() => {
    if (paused) {
      void fetchAuthStatus().then(setAuth);
      setCloudMsg(travelState.saveResult);
    }
  }, [paused, tab]);

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
        {tab === 'main' && (
          <>
            <div className="pause-hint" style={{ marginBottom: 10 }}>
              {auth.authenticated
                ? `Signed in as ${auth.username} — cloud saves active`
                : 'Not signed in — saves are local only. Sign in for cloud saves.'}
            </div>
            <button className="menu-btn" onClick={() => setPaused(false)}>Resume</button>
            <button className="menu-btn" onClick={() => setTab('map')}>Bangladesh Map</button>
            <button className="menu-btn" onClick={() => setTab('saves')}>Save / Load</button>
            <button className="menu-btn" onClick={() => setTab('settings')}>Graphics Settings</button>
            {auth.authenticated ? (
              <button
                className="menu-btn"
                onClick={() => {
                  void fetch('/api/auth/logout', { method: 'POST' });
                  setAuth({ authenticated: false });
                  setMsg('Signed out.');
                }}
              >
                Sign Out
              </button>
            ) : (
              <button
                className="menu-btn"
                onClick={() => {
                  window.location.href = '/login';
                }}
              >
                Sign In / Register
              </button>
            )}
            <div className="pause-hint">
              WASD move · Shift run · Space jump · E vehicle · Esc pause
            </div>
          </>
        )}
        {tab === 'settings' && (
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
            <button className="menu-btn" onClick={() => setTab('main')}>Back</button>
            <div className="pause-hint">Quality applies live.</div>
          </>
        )}
        {tab === 'saves' && (
          <>
            <h3>Save / Load {auth.authenticated ? '(Cloud)' : '(Local)'}</h3>
            {[1, 2, 3].map((slot) => (
              <div key={slot} className="save-row">
                <button
                  className="menu-btn half"
                  onClick={() => {
                    travelState.saveRequest = { slot, kind: 'save' };
                    setMsg(`Saving slot ${slot}…`);
                    setTimeout(() => setCloudMsg(travelState.saveResult), 400);
                  }}
                >
                  Save {slot}
                </button>
                <button
                  className="menu-btn half"
                  onClick={() => {
                    travelState.saveRequest = { slot, kind: 'load' };
                    setMsg(`Loading slot ${slot}…`);
                    setTimeout(() => setCloudMsg(travelState.saveResult), 400);
                  }}
                >
                  Load {slot}
                </button>
              </div>
            ))}
            {(cloudMsg || msg) && <div className="pause-hint">{cloudMsg ?? msg}</div>}
            <button className="menu-btn" onClick={() => setTab('main')}>Back</button>
          </>
        )}
        {tab === 'map' && (
          <>
            <h3>Bangladesh — 64 Districts</h3>
            <div className="pause-hint" style={{ marginBottom: 8 }}>
              Travel to any district. Districts with baked map data
              (public/world/&lt;district&gt;.json) load real OpenStreetMap
              geometry; others load a labeled preview layout.
            </div>
            <div className="district-grid">
              {travelState.districts.map((d) => (
                <button
                  key={d.id}
                  className={'menu-btn district' + (travelState.currentDistrict === d.id ? ' active' : '')}
                  onClick={() => {
                    travelState.travelRequest = d.id;
                    setMsg(`Traveling to ${d.name}…`);
                  }}
                >
                  {d.name}
                </button>
              ))}
            </div>
            {msg && <div className="pause-hint">{msg}</div>}
            <button className="menu-btn" onClick={() => setTab('main')}>Back</button>
          </>
        )}
      </div>
    </div>
  );
}