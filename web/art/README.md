# Art sheets (optional)

The arcade draws **procedural** house and fence stamps, then Bayer-dithers the 400×240 LCD onto lime `#c9d63a` + ink `#2a1c12`.

Game Art Director sheets can replace those stamps without touching the map generator. Drop files next to this README:

| File | Layout |
| --- | --- |
| `house.png` | Horizontal strip of **40×40** frames. `variant` picks the column. If the image is at least **100px** tall, row 0 is neighborhood houses and row 1 (y=40) is the **40×60** home. |
| `fence.png` | **20×20** (or a horizontal strip of 20×20). Missing file → procedural posts/rails. |

`web/js/art.js` loads these paths (`art/house.png`, `art/fence.png`). A 404 is expected until sheets land; the procedural path stays playable.

Sheets should already be 1-bit (or greyscale that dithers onto the Playdate palette). The LCD pass will quantize any leftover greys.
