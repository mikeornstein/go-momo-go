# Go Momo Go — web prototype

Playable **procedural** arcade loop in the browser. Game pixels are **400×240**, two-ink, inside Playdate-ish chrome. The neighborhood is larger than one screen: each **city block is a 4×8 grid of square cells** (houses, lawns, driveways, fences). About a couple of blocks fit in the view; walking to a screen edge **snaps** the camera. The Lua Playdate game in `source/` is unchanged.

Plan of record: sidewalks both sides, cars on streets, crosswalks at intersections, home at the center, busy-near / quiet-far, grass on yard edges. Later chaos (dying grass, rising difficulty across runs) is **not** in this slice.

## Open

No build step. Classic scripts, so either of these works:

```bash
# from the repo root — nicest on mobile / some browsers
python3 -m http.server 8000 --directory web
```

Then open [http://127.0.0.1:8000/?seed=20260914](http://127.0.0.1:8000/?seed=20260914).

Or open `web/index.html` directly (`file://`). If a browser blocks something, use the local server.

On a phone, use the same URL on your LAN (or a tunnel). Layout is tuned for **Mobile Safari / iPhone 17** (CSS viewport **402×874**): chrome-only (no copy outside the bezel), handheld pinned to the bottom with `safe-area-inset-*` so d-pad / A·B sit in thumb reach. HUD stays inside the 400×240 pixels. Seed is the query param only (no on-page seed line).

Optional query: `?seed=20260914` (default) or `?debug=1` to outline the 4×8 lots and mark tutorial grass.

## Play

| Input | Action |
| --- | --- |
| WASD / arrows / on-screen d-pad | Walk the person. Momo follows on a short leash. |
| Walk to a screen edge | Camera snaps to the next 400×240 window (no smooth pan). |
| Stand still on grass | Pace. Fill the poop meter if nobody interrupts. |
| A / Enter / R | Restart this block. |
| B / N | New neighborhood (next seed). |

**Win:** poop on grass, then reach the home stoop before the clock.  
**Lose:** clock hits zero, or you step back onto the stoop after leaving without having pooped.

Interrupts (person, dog, pee-mail, close car) reset poop progress. Streets are for cars; you only cross on the zebra stripes. Farther blocks are quieter and a longer walk home.

## Rules encoded (not a tile map)

The generator lays an even street grid in **20×20 px cells**. Each city block interior is **4×8 cells**: houses, lawns, driveways, and fences stamped from density rules (packed near home, emptier farther out). Sidewalks (1 cell) sit on **both** sides of every street; asphalt is 2 cells; **crosswalks only where sidewalks meet asphalt at intersections**. The opening camera frames home; the world is several screens, so a walk to the rim takes longer.

```bash
node web/test/map_test.js
```
