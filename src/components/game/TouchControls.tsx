'use client';

import { useRef } from 'react';
import { useGameStore } from '@/game/core/store';
import { setJoystick, setButton, pressAction, queueJump } from '@/game/core/input';

export default function TouchControls() {
  const touch = useGameStore((s) => s.touch);
  const ready = useGameStore((s) => s.progress >= 100);
  const baseRef = useRef<HTMLDivElement | null>(null);
  const knobRef = useRef<HTMLDivElement | null>(null);
  const active = useRef<number | null>(null);

  if (!touch || !ready) return null;

  const move = (clientX: number, clientY: number) => {
    const base = baseRef.current;
    if (!base) return;
    const r = base.getBoundingClientRect();
    let dx = clientX - (r.left + 62);
    let dy = clientY - (r.top + 62);
    const len = Math.hypot(dx, dy);
    const max = 44;
    if (len > max) {
      dx = (dx / len) * max;
      dy = (dy / len) * max;
    }
    if (knobRef.current) {
      knobRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    setJoystick(dx / max, dy / max);
  };

  const reset = () => {
    active.current = null;
    setJoystick(0, 0);
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(0px, 0px)';
    }
  };

  return (
    <>
      <div
        ref={baseRef}
        className="joy"
        onPointerDown={(e) => {
          active.current = e.pointerId;
          e.currentTarget.setPointerCapture(e.pointerId);
          e.stopPropagation();
          move(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (e.pointerId === active.current) {
            e.stopPropagation();
            move(e.clientX, e.clientY);
          }
        }}
        onPointerUp={reset}
        onPointerCancel={reset}
      >
        <div ref={knobRef} className="joy-knob" />
      </div>
      <div className="tbtns">
        <button
          className="tbtn"
          onPointerDown={(e) => {
            e.stopPropagation();
            pressAction();
          }}
        >
          E
        </button>
        <button
          className="tbtn"
          onPointerDown={(e) => {
            e.stopPropagation();
            queueJump();
          }}
        >
          JUMP
        </button>
        <button
          className="tbtn"
          onPointerDown={(e) => {
            e.stopPropagation();
            setButton('run', true);
          }}
          onPointerUp={() => setButton('run', false)}
          onPointerCancel={() => setButton('run', false)}
        >
          RUN
        </button>
      </div>
    </>
  );
}