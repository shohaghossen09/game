import { create } from 'zustand';

export interface HudState {
  location: string;
  clock: string;
  phase: string;
  fps: number;
  speed: number | null;
  prompt: string | null;
  preview: boolean;
}

export type Quality = 'low' | 'medium' | 'high' | 'ultra';

export interface GameStore {
  progress: number;
  status: string;
  bootError: string | null;
  touch: boolean;
  quality: Quality;
  paused: boolean;
  hud: HudState;
  setProgress: (p: number, status?: string) => void;
  setStatus: (s: string) => void;
  setBootError: (e: string | null) => void;
  setTouch: (t: boolean) => void;
  setQuality: (q: Quality) => void;
  setPaused: (p: boolean) => void;
  setHud: (h: Partial<HudState>) => void;
}

const initialHud: HudState = {
  location: 'Dhanmondi, Dhaka',
  clock: '07:30',
  phase: 'Day',
  fps: 0,
  speed: null,
  prompt: null,
  preview: false
};

/** Quality change notifications: the engine subscribes and applies live. */
const qualityListeners = new Set<(q: Quality) => void>();
export function onQualityChange(fn: (q: Quality) => void): () => void {
  qualityListeners.add(fn);
  return () => qualityListeners.delete(fn);
}

/** Pause change notifications: the engine subscribes and stops simulating. */
const pauseListeners = new Set<(p: boolean) => void>();
export function onPauseChange(fn: (p: boolean) => void): () => void {
  pauseListeners.add(fn);
  return () => pauseListeners.delete(fn);
}

export const useGameStore = create<GameStore>((set) => ({
  progress: 0,
  status: 'Booting engine…',
  bootError: null,
  touch: false,
  quality: 'high',
  paused: false,
  hud: initialHud,
  setProgress: (p, status) =>
    set((s) => ({
      progress: Math.max(s.progress, Math.min(100, p)),
      ...(status ? { status } : {})
    })),
  setStatus: (status) => set({ status }),
  setBootError: (e) => set({ bootError: e }),
  setTouch: (touch) => set({ touch }),
  setQuality: (quality) => {
    set({ quality });
    qualityListeners.forEach((fn) => fn(quality));
  },
  setPaused: (paused) => {
    set({ paused });
    pauseListeners.forEach((fn) => fn(paused));
  },
  setHud: (h) => set((s) => ({ hud: { ...s.hud, ...h } }))
}));
