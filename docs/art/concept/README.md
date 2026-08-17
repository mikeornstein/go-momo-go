# Concept stills

Style-anchor frames for [art-direction.md](../../art-direction.md). Direction locks, not engine sprites.

| File | Lock |
| --- | --- |
| `momo-side.png` | Canonical Momo |
| `momo-squat.png` | Squat silhouette |
| `momo-sniff.png` | Sniff silhouette |
| `walk-slice.png` | Block + walker + leash |
| `gnome-bumper.png` | Gnome end-card picture (punchline is type, not pixels) |

Prompts are verbatim in the bible. Re-run with `image_edit` from `momo-side.png` if identity drifts.

## Known defects (honest QA)

These are Imagine drafts. Engine art must FatBits-clean them.

- All stills have light grey anti-alias. Illegal in-game; keep the *shapes*.
- `walk-slice.png` still has grey house fills and too much perspective. Hydrant, windbreaker, three-band stage, and Momo identity are the lock. Flatten houses in the tile PR.
- `momo-side.png` reads a bit spaniel. Keep the hanging ears, teddy muzzle, pom-pom, nubs; add doodle fluff when we pixel him.
- `gnome-bumper.png` Momo is larger than “tiny in the distance.” Gnome face is the lock.
