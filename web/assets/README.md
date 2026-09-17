# Art assets (playtest #3)

Game Art Director tiles for the 20px cell grid. The arcade **prefers these stamps**; procedural drawing in `web/js/art.js` is only a fallback if a PNG 404s.

Final LCD pixels are Bayer-dithered to lime `#c9d63a` + ink `#2a1c12`. Sprites may use hard alpha. Do **not** blit `preview-on-road.png` into the game (that proof uses `#0e0c0a`).

## Drop new sheets here

| File | Use |
| --- | --- |
| `house_2x2.png` / `house_2x2_b.png` / `house_face_2x2.png` / `house_face_2x2_b.png` | Typical 40×40 lots (`variant` picks). North-facing lots flip Y so the door faces the north street. |
| `house_home_2x3.png` | Generic 40×60 home (door south). Fallback if zhuz is missing. |
| `house_home_zhuz.png` | **Player home landmark**, 40×60, door south. Prefers over `house_home_2x3`. |
| `house_home_zhuz_3x3.png` | Optional denser 60×60 home. On disk for later layout. |
| `house_home_landmark.png` / `house_home_landmark_2x3.png` | Extra landmark swap path. Missing → zhuz, else `house_home_2x3` plus flag / stoop / mailbox overlay. |
| `splash.png` | Full 400×240 Art Director Imagine next-pass title card. Baked **GO MOMO GO** / **Poop. Then home.** Poster: Momo lower-left, walker right, taut leash, wall cat+heart, Bayer halftone. Engine blits it full-canvas; only A/B / Best hints are post-dither bitmap type. |
| `mimi.png` | 12×20 grandma NPC (no dog). |
| `house_face_3x2*.png` / `house_face_3x3*.png` / `house_home_3x3.png` | Denser 3×2 / 3×3 variants on disk for later layout; not blitted until lots grow. |
| `fence_h.png` / `fence_v.png` / `fence_corner_*.png` / `fence_gate.png` | 20×20 perimeter autotile. |
| `car_h_20x12.png` / `car_v_12x20.png` | Preferred cars (lime body, ink cabin). Hitbox matches. |
| `houses.png` / `fences.png` / `cars.png` | Labeled atlases (also `sheet-*.png`). Loaded stamps are the loose tiles. |

Replace a PNG in this folder and reload. No map generator change required for 2×2 houses / 2×3 home / 20×20 fences.
