# Testing

## Automated
- `npm run typecheck` — strict TS must be clean before every commit
- `npm run build` — must succeed before any milestone is called done

## Manual test matrix (run after each milestone)
1. **Boot**: loading completes with real progress; no console errors
2. **Movement**: walk/run/jump; limbs animate; camera-relative turning
3. **Collision**: buildings block; sidewalk edges standable
4. **Camera**: orbit with mouse drag; pitch clamped; smooth at all speeds
5. **Vehicles**: E enters nearest (labeled); accel/brake/reverse; steering
   scales with speed; crash = speed loss; E exits beside the vehicle
6. **All 5 vehicles**: sedan / CNG / rickshaw / motorcycle / bus each drive
   differently; engine audio pitch differs per category
7. **Swimming**: pond entry — wading → swimming → underwater fog; exit works
8. **Weather**: full cycle clear → storm; rain audio scales; grip changes
   (hard braking test during heavy rain); thunder flashes
9. **Interiors**: walk into each of the 9 shops through the doorway gap;
   prompt appears outside; ambience shifts inside; exit freely
10. **Traffic**: cars stop at red lights; follow each other without
    overlapping; resume after green
11. **District travel**: Esc → Bangladesh Map → pick a district. Loading
    overlay animates through staged steps; frame never freezes; HUD location
    updates; PREVIEW label appears only for unbaked districts; travel again
    to a third district (double-travel regression)
12. **Saves**: with account — save slot 1, reload page, load slot 1 (cloud).
    Without account — save/load locally. Kill network → save → confirm
    "Offline — saved locally" fallback message
13. **Auth**: register → cookie session → pause menu shows username → sign
    out → saves switch to Local. Bad login shows generic error (no
    enumeration). 11 rapid logins → rate limited (429)
14. **Quality switching**: pause → change profile → shadows/fog change live;
    adaptive resolution recovers after quality change (watch FPS stabilize)
15. **Adaptive resolution**: throttle the browser (e.g., 6x CPU slowdown in
    DevTools) → FPS drops → render scale reduces → FPS recovers toward 58+
16. **Mobile**: joystick + RUN/JUMP/E; pause reachable; interiors doors work
    on touch; minimap renders behind the pause card
17. **Resize**: window resize mid-game — canvas/aspect update cleanly
18. **`npm run fetch:world`** → reboot → PREVIEW label gone; roads match
    baked OSM data

## Regression watchlist (known fragile seams)
- District travel swaps all systems in one atomic step — verify no "double
  dispose" console errors on the second consecutive travel
- Adaptive resolution should never oscillate visibly — watch the scale via
  FPS counter over 2 minutes of gameplay
- Audio context unlock requires a user gesture; verify no autoplay-policy
  warnings in console after first click

## Known accepted issues
- Traffic cars can overlap at sharp intersections (proximity-based only)
- NPC edge re-picking is O(edges) — imperceptible at current counts
