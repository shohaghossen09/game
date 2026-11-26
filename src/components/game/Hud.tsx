'use client';

import { useGameStore } from '@/game/core/store';

export default function Hud() {
  const hud = useGameStore((s) => s.hud);
  const driving = hud.speed !== null;
  return (
    <>
      <div className="hud-top">
        <div>{hud.location}</div>
        <div>
          {hud.clock} · {hud.phase}
        </div>
        {hud.preview && (
          <div className="warn">
            PREVIEW LAYOUT — NOT MAP DATA (run npm run fetch:world)
          </div>
        )}
      </div>
      <div className="hud-fps">{hud.fps} fps</div>
      {driving && <div className="hud-speed">{hud.speed} km/h</div>}
      {hud.prompt !== null && <div className="hud-prompt">{hud.prompt}</div>}
    </>
  );
}