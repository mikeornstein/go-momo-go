# Go Momo Go — web prototype

Playable **procedural** arcade loop in the browser. Game pixels are **400×240** inside Playdate-ish chrome (no faux crank on phone). The LCD is true **1-bit**: lime BG (`#c9d63a`) and brown ink (`#2a1c12`) only. The world may be painted in greys, then Bayer-dithered onto that palette. Roads read as a dark ink dither; sidewalks as a light lime dither; cars stay a lime fill with ink outline so they do not vanish into the road. The neighborhood is larger than one screen: each **city block is a 4×8 grid of square cells** (houses, lawns, driveways, fences). About a couple of blocks fit in the view; walking to a screen edge **snaps** the camera. The Lua Playdate game in `source/` is unchanged.

Plan of record: sidewalks both sides, cars on streets, crosswalks at intersections, home at the center, busy-near / quiet-far, grass on yard edges. **Difficulty rises each win** (more sidewalk traffic / cars / pee-mail and a shorter clock). **A loss returns to level 1** / the first neighborhood.

Houses, fences, cars, Mimis, splash, and the player-home zhuz blit Game Art Director stamps from [`web/assets/`](assets/). Player home prefers `house_home_zhuz.png` (40×60). Splash is `splash.png` (400×240). Mimis use `mimi.png` (12×20). Procedural drawing is a 404 fallback. See `web/assets/README.md`.

## Open

No build step. Classic scripts, so either of these works:

```bash
# from the repo root — nicest on mobile / some browsers
python3 -m http.server 8000 --directory web
```

Then open [http://127.0.0.1:8000/?seed=20260914](http://127.0.0.1:8000/?seed=20260914).

Or open `web/index.html` directly (`file://`). If a browser blocks something, use the local server.

On a phone, use the same URL on your LAN (or a tunnel). Layout is tuned for **Mobile Safari / iPhone 17** (CSS viewport **402×874**): chrome-only (no copy outside the bezel, **no crank**), handheld pinned to the bottom with `safe-area-inset-*` so d-pad / A·B sit in thumb reach. The 400×240 screen fills the inner bezel. HUD stays inside those pixels. Seed is the query param only (no on-page seed line).

Optional query: `?seed=20260914` (default) or `?debug=1` to outline the 4×8 lots and mark tutorial grass.

## Play

| Input | Action |
| --- | --- |
| WASD / arrows / on-screen d-pad | Walk the person. Momo follows on a short leash. |
| Walk to a screen edge | Camera snaps to the next 400×240 window (no smooth pan). |
| Stand still on grass | Pace. Fill the poop meter if nobody interrupts. |
| A / Enter / R | **Splash and end screens.** Splash: start day 1. After a **win**: next day. After a **loss**: back to **day 1** / first neighborhood. During play: does nothing. |
| B / N | **Splash and end screens.** Splash: start day 1 (same neighborhood). After a **win**: next day (new neighborhood). After a **loss**: new neighborhood at **day 1**. During play: does nothing. |

**Win:** poop on grass, then reach the home stoop before the clock. The day (streak without accident) goes up one. HUD shows `D3` for day 3.  
**Lose:** clock hits zero (`Late for work.`), or you step back onto the stoop after leaving without having pooped — house accident (`Home before poop. Accident inside.`). Streak over; continue from **day 1**.

People walk loops from their own houses; dogs are leashed to those walkers (no lone dogs). **Mimis** (grandmas, no dog) use the same loop and the same distract class. Nearby distractions **slow your walk** even when you are not pacing. Dogs drop pee-mail along the route. Interrupts (person, mimi, dog, pee-mail, close car) **reset** poop progress and **flash the source entity**. Streets are for cars; you only cross on the zebra stripes. Farther blocks are quieter and a longer walk home.

A 1-bit splash waits for A/B before the clock starts. Art card `splash.png` (title **GO MOMO GO** / **Poop. Then home.**). Fallback copy lock: **Go Momo Go** / **Poop. Then home.**

On-screen d-pad / A·B glyphs are CSS shapes or `::before` content (no Unicode text nodes) so Mobile Safari cannot select them.

## Rules encoded (not a tile map)

The generator lays an even street grid in **20×20 px cells**. Each city block interior is **4×8 cells**: houses, lawns, driveways, and fences stamped from density rules (packed near home, emptier farther out). Sidewalks (1 cell) sit on **both** sides of every street; asphalt is 2 cells; **crosswalks only where sidewalks meet asphalt at intersections**. The opening camera frames home; the world is several screens, so a walk to the rim takes longer.

```bash
node web/test/map_test.js
```
