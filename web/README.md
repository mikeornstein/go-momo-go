# Go Momo Go — web prototype

Smallest playable **procedural** arcade loop in the browser. Game pixels are **400×240**, two-ink, inside Playdate-ish chrome. The Lua Playdate game in `source/` is unchanged.

Plan of record: sidewalks both sides, cars on streets, crosswalks at intersections, home at the center, busy-near / quiet-far, grass on yard edges. Later chaos (dying grass, rising difficulty across runs) is **not** in this slice.

## Open

No build step. Classic scripts, so either of these works:

```bash
# from the repo root — nicest on mobile / some browsers
python3 -m http.server 8000 --directory web
```

Then open [http://127.0.0.1:8000/](http://127.0.0.1:8000/).

Or open `web/index.html` directly (`file://`). If a browser blocks something, use the local server.

Optional query: `?seed=20260914` (default) or `?debug=1` to tint the tutorial grass.

## Play

| Input | Action |
| --- | --- |
| WASD / arrows / on-screen d-pad | Walk the person. Momo follows on a short leash. |
| Stand still on grass | Pace. Fill the poop meter if nobody interrupts. |
| A / Enter / R | Restart this block. |
| B / N | New neighborhood (next seed). |

**Win:** poop on grass, then reach the home stoop before the clock.  
**Lose:** clock hits zero, or you step back onto the stoop after leaving without having pooped.

Interrupts (person, dog, pee-mail, close car) reset poop progress. Streets are for cars; you only cross on the zebra stripes.

## Rules encoded (not a tile map)

The generator lays an even street grid on 400×240, puts **home in the center lot**, paints sidewalks on **both** sides of every street, and stamps **crosswalks only where sidewalks meet asphalt at intersections**. Lots nearer the center get more houses and more sidewalk traffic; the rim is quieter and a longer walk. Grass sits on sidewalk/yard edges; the nearest home-lot patch is the tutorial-style win.

```bash
node web/test/map_test.js
```
