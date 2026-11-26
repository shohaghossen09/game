/** Procedural audio engine — 100% synthesized with WebAudio, so every sound
 *  is original by construction (no licensed assets, no attribution debt).
 *  Systems: engine loop (speed-pitched), rain loop (intensity-scaled noise),
 *  footsteps (on-foot), city ambience (low noise bed). All lazily initialized
 *  on first user gesture (browser autoplay policy). */

export interface AudioSystem {
  /** call from any user-gesture-driven event; no-op after first success */
  unlock(): void;
  /** engine: category base pitch 0..1, speed 0..1 (normalized), active */
  setEngine(pitch: number, speed01: number, active: boolean): void;
  setRain(intensity: number): void;
  footstep(): void;
  setAmbience(indoor: boolean): void;
  dispose(): void;
}

export function createAudioSystem(): AudioSystem {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let engineOsc: OscillatorNode | null = null;
  let engineGain: GainNode | null = null;
  let rainSrc: AudioBufferSourceNode | null = null;
  let rainGain: GainNode | null = null;
  let rainFilter: BiquadFilterNode | null = null;
  let ambSrc: AudioBufferSourceNode | null = null;
  let ambGain: GainNode | null = null;
  let disposed = false;

  function makeNoiseBuffer(seconds: number, brownish = true): AudioBuffer {
    const sr = ctx!.sampleRate;
    const buf = ctx!.createBuffer(1, sr * seconds, sr);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      if (brownish) {
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      } else {
        data[i] = white;
      }
    }
    return buf;
  }

  function unlock(): void {
    if (ctx || disposed) return;
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);

      // rain: looped brown noise through a lowpass, gain driven by intensity
      rainSrc = ctx.createBufferSource();
      rainSrc.buffer = makeNoiseBuffer(3);
      rainSrc.loop = true;
      rainFilter = ctx.createBiquadFilter();
      rainFilter.type = 'lowpass';
      rainFilter.frequency.value = 1400;
      rainGain = ctx.createGain();
      rainGain.gain.value = 0;
      rainSrc.connect(rainFilter).connect(rainGain).connect(master);
      rainSrc.start();

      // ambience: very low noise bed
      ambSrc = ctx.createBufferSource();
      ambSrc.buffer = makeNoiseBuffer(4);
      ambSrc.loop = true;
      ambGain = ctx.createGain();
      ambGain.gain.value = 0.015;
      ambSrc.connect(ambGain).connect(master);
      ambSrc.start();

      // engine: sawtooth + sub sine, pitch/gain driven per frame
      engineOsc = ctx.createOscillator();
      engineOsc.type = 'sawtooth';
      engineOsc.frequency.value = 60;
      engineGain = ctx.createGain();
      engineGain.gain.value = 0;
      engineOsc.connect(engineGain).connect(master);
      engineOsc.start();
    } catch {
      ctx = null; // audio unsupported: game runs silent
    }
  }

  function setEngine(pitch: number, speed01: number, active: boolean): void {
    if (!ctx || !engineOsc || !engineGain) return;
    const t = ctx.currentTime;
    const base = 45 + pitch * 60; // category flavor
    engineOsc.frequency.setTargetAtTime(base + speed01 * 120, t, 0.08);
    engineGain.gain.setTargetAtTime(active ? 0.05 + speed01 * 0.07 : 0, t, 0.1);
  }

  function setRain(intensity: number): void {
    if (!ctx || !rainGain || !rainFilter) return;
    const t = ctx.currentTime;
    rainGain.gain.setTargetAtTime(intensity * 0.22, t, 0.4);
    rainFilter.frequency.setTargetAtTime(900 + intensity * 1800, t, 0.4);
  }

  function footstep(): void {
    if (!ctx || !master) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140 + Math.random() * 40, t);
    g.gain.setValueAtTime(0.0, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(g).connect(master);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  function setAmbience(indoor: boolean): void {
    if (!ctx || !ambGain) return;
    ambGain.gain.setTargetAtTime(indoor ? 0.005 : 0.015, ctx.currentTime, 0.6);
  }

  return {
    unlock,
    setEngine,
    setRain,
    footstep,
    setAmbience,
    dispose() {
      disposed = true;
      try {
        rainSrc?.stop();
        ambSrc?.stop();
        engineOsc?.stop();
        ctx?.close();
      } catch {
        /* already closed */
      }
      ctx = null;
    }
  };
}
