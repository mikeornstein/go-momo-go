# Concept stills

Style-anchor frames for [art-direction.md](../../art-direction.md). Direction locks, not engine sprites.

Momo’s 1-bit lock is [`reference/imagine_momo/`](../../../reference/imagine_momo/). Photos in [`reference/momo/`](../../../reference/momo/) are the likeness check only.

| File | Lock |
| --- | --- |
| `momo-stand.png` | Canonical stand (also copied as `momo-side.png`) |
| `momo-sniff.png` | Sniff |
| `momo-squat.png` | Squat hold |
| `momo-lift-leg.png` | Lift-leg |
| `momo-pee.png` | Lift-leg + puddle |
| `momo-pooed.png` | Sit + coiled pile |
| `walk-slice.png` | Block + walker + leash — **stale dog**; re-chain from `momo-stand` |
| `gnome-bumper.png` | Gnome bumper — **stale dog**; re-chain from `momo-stand` |

## Known defects

- `walk-slice.png` and `gnome-bumper.png` still show the previous doodle. Next Imagine pass must `image_edit` them from `momo-stand.png`.
- Stipple must stay locked to the sprite (not a 2×2 that strobes).
- Engine art FatBits-cleans outlines to a true 3 px cel.
