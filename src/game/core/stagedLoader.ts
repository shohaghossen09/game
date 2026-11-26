/** Async staged loader — Phase 8.
 *  Runs a list of build steps across multiple frames, yielding to the event
 *  loop between them. Used by district travel so the render loop keeps
 *  running (loading screen up) instead of a synchronous ~200ms freeze.
 *  Each step is a thunk; the loader reports progress 0..1. */

export interface StagedLoader {
  run(
    steps: Array<{ label: string; fn: () => void }>,
    onProgress: (p: number, label: string) => void
  ): Promise<void>;
}

export function createStagedLoader(): StagedLoader {
  return {
    run(steps, onProgress) {
      return new Promise<void>((resolve, reject) => {
        let i = 0;
        const total = steps.length;

        const tick = () => {
          if (i >= total) {
            onProgress(1, 'Done');
            resolve();
            return;
          }
          const step = steps[i];
          try {
            onProgress(i / total, step.label);
            step.fn();
          } catch (err) {
            reject(err instanceof Error ? err : new Error(String(err)));
            return;
          }
          i++;
          // yield to the browser between steps
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }
  };
}
