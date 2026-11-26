'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/game/core/store';
import { travelState } from '@/game/core/travelState';
import { DISTRICTS, DISTRICT_COUNT } from '@/game/geo/registry';

/** Travel panel — Phase G. Toggle with M. Lists all 64 districts; clicking
 *  one hands the request to the engine via the travel bridge. Districts
 *  with baked tiles load real OpenStreetMap geometry; others load the
 *  clearly labeled PREVIEW layout. */

export default function TravelPanel() {
  const ready = useGameStore((s) => s.progress >= 100);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyM') {
        setOpen((v) => !v);
        setMsg(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!ready) return null;

  return (
    <>
      {open && (
        <div className="travel-backdrop" onClick={() => setOpen(false)}>
          <div className="travel-card" onClick={(e) => e.stopPropagation()}>
            <h2>BANGLADESH — {DISTRICT_COUNT} DISTRICTS</h2>
            <div className="travel-hint">
              Travel anywhere. Districts with baked map data
              (public/world/) load real OpenStreetMap geometry; others
              load a clearly labeled preview layout.
            </div>
            <div className="district-grid">
              {DISTRICTS.map((d) => (
                <button
                  key={d.id}
                  className="district-btn"
                  onClick={() => {
                    travelState.travelRequest = d.id;
                    setMsg(`Traveling to ${d.name}…`);
                  }}
                >
                  {d.name}
                </button>
              ))}
            </div>
            {travelState.traveling && (
              <div className="travel-progress">
                Loading district… {Math.round(travelState.travelProgress * 100)}%
              </div>
            )}
            {msg && !travelState.traveling && (
              <div className="travel-done">{travelState.message ?? msg}</div>
            )}
            <button className="travel-close" onClick={() => setOpen(false)}>
              Close (M)
            </button>
          </div>
        </div>
      )}
      {!open && (
        <button className="travel-fab" onClick={() => setOpen(true)}>
          MAP
        </button>
      )}
    </>
  );
}