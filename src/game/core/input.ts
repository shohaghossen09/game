/** Unified input snapshot — keyboard, mouse, touch merged before simulation. */

export interface InputSnapshot {
  moveX: number; // -1..1 (strafe, camera-relative)
  moveZ: number; // -1..1 (forward)
  run: boolean;
  jump: boolean;
  jumpQueued: boolean;
  lookDX: number; // accumulated mouse drag delta this frame
  lookDY: number;
  actionPressed: boolean; // E / action edge
}

const keys: Record<string, boolean> = {};
const touch = { jx: 0, jy: 0, run: false, jump: false };
let lookAccumX = 0;
let lookAccumY = 0;
let actionQueued = false;
let jumpQueued = false;

export function initInput(): () => void {
  const kd = (e: KeyboardEvent) => {
    keys[e.code] = true;
    if (e.code === 'KeyE') actionQueued = true;
    if (e.code === 'Space') {
      jumpQueued = true;
      e.preventDefault();
    }
    if (e.code.startsWith('Arrow')) e.preventDefault();
  };
  const ku = (e: KeyboardEvent) => {
    keys[e.code] = false;
  };

  let dragging = false;
  let lx = 0;
  let ly = 0;
  const pd = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button === 0) {
      dragging = true;
      lx = e.clientX;
      ly = e.clientY;
    }
  };
  const pm = (e: PointerEvent) => {
    if (dragging) {
      lookAccumX += e.clientX - lx;
      lookAccumY += e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
    }
  };
  const pu = () => {
    dragging = false;
  };

  window.addEventListener('keydown', kd);
  window.addEventListener('keyup', ku);
  window.addEventListener('pointerdown', pd);
  window.addEventListener('pointermove', pm);
  window.addEventListener('pointerup', pu);

  return () => {
    window.removeEventListener('keydown', kd);
    window.removeEventListener('keyup', ku);
    window.removeEventListener('pointerdown', pd);
    window.removeEventListener('pointermove', pm);
    window.removeEventListener('pointerup', pu);
  };
}

export function setJoystick(x: number, y: number): void {
  touch.jx = x;
  touch.jy = y;
}

export function setButton(name: 'run' | 'jump', value: boolean): void {
  if (name === 'run') touch.run = value;
  else touch.jump = value;
}

export function pressAction(): void {
  actionQueued = true;
}

export function queueJump(): void {
  jumpQueued = true;
}

export function readInput(): InputSnapshot {
  const moveX =
    (keys['KeyA'] || keys['ArrowLeft'] ? -1 : 0) +
    (keys['KeyD'] || keys['ArrowRight'] ? 1 : 0) +
    touch.jx;
  const moveZ =
    (keys['KeyW'] || keys['ArrowUp'] ? 1 : 0) +
    (keys['KeyS'] || keys['ArrowDown'] ? -1 : 0) +
    -touch.jy;
  const snap: InputSnapshot = {
    moveX: clamp(moveX, -1, 1),
    moveZ: clamp(moveZ, -1, 1),
    run: !!(keys['ShiftLeft'] || keys['ShiftRight'] || touch.run),
    jump: !!(keys['Space'] || touch.jump),
    jumpQueued,
    lookDX: lookAccumX,
    lookDY: lookAccumY,
    actionPressed: actionQueued
  };
  lookAccumX = 0;
  lookAccumY = 0;
  jumpQueued = false;
  actionQueued = false;
  return snap;
}

function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}