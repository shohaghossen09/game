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

/** Honest boot phases — the loading screen shows the true state and never
 *  claims Ready before the engine confirms a rendered first frame. */
export type BootPhase = 'probing' | 'init' | 'first-frame' | 'ready' | 'failed';

export interface GameStore {
  progress: number;
  status: string;
  bootError: string | null;
  bootPhase: BootPhase;
  touch: boolean;
  quality: Quality;
  hud: HudState;
  setProgress: (p: number, status?: string) => void;
  setStatus: (s: string) => void;
  setBootError: (e: string | null) => void;
  setBootPhase: (p: BootPhase) => void;
  setTouch: (t: boolean) => void;
  setQuality: (q: Quality) => void;
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

type QualityListener = (q: Quality) => void;
const qualityListeners = new Set<QualityListener>();

/** Subscribe to quality changes — the engine registers to apply them live
 *  (shadows, fog, pixel ratio) without a reboot. */
export function onQualityChange(fn: QualityListener): () => void {
  qualityListeners.add(fn);
  return () => qualityListeners.delete(fn);
}

export const useGameStore = create<GameStore>((set) => ({
  progress: 0,
  status: 'Booting engine…',
  bootError: null,
  bootPhase: 'init',
  touch: false,
  quality: 'high',
  hud: initialHud,
  setProgress: (p, status) =>
    set((s) => ({
      progress: Math.max(s.progress, Math.min(100, p)),
      ...(status ? { status } : {})
    })),
  setStatus: (status) => set({ status }),
  setBootError: (e) =>
    set((s) => ({
      bootError: e,
      ...(e ? { bootPhase: 'failed' as BootPhase } : {})
    })),
  setBootPhase: (bootPhase) => set({ bootPhase }),
  setTouch: (touch) => set({ touch }),
  setQuality: (quality) => {
    set({ quality });
    qualityListeners.forEach((fn) => fn(quality));
  },
  setHud: (h) => {
    set((s) => {
      let changed = false;
      for (const k of Object.keys(h) as (keyof HudState)[]) {
        if (s.hud[k] !== (h as HudState)[k]) {
          changed = true;
          break;
        }
      }
      return changed ? { hud: { ...s.hud, ...h } } : {};
    });
  }
}));
