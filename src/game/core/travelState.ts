/** Travel + streaming bridge — Phase G.
 *  React UI writes travel requests here; the engine consumes them in the
 *  game loop. Mutable, outside Zustand — frame-level data that must never
 *  trigger React re-renders per frame. */

export const travelState = {
  /** district id requested by the UI; engine consumes and clears */
  travelRequest: null as string | null,
  /** 0..1 progress during an active travel (engine writes) */
  travelProgress: 0,
  /** true while the engine is swapping tiles (engine writes) */
  traveling: false,
  /** last travel outcome for UI feedback (engine writes) */
  message: null as string | null
};
