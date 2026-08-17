# Go Momo Go — Art direction

**The call:** It is 1996. Saturday morning. You are late. The doodle still has to go.

This file owns **look**. [game-design.md](game-design.md) owns concept, mechanics, and copy. QA every new picture against the pillars and the concept stills in [art/concept/](art/concept/).

Not mid-century tasteful. Not 2019 indie-cute. Not Game Boy cargo-cult. Not Panic Settings-page restraint dressed up as a game. The pictures are a **Nicktoon suburb reduced to FatBits** — thick cel ink, squashy toys, a block you remember from after-school TV.

---

## What the pictures owe the game

Three jobs, in order:

1. Find Momo on a pocket screen, on white sidewalk and on inked lawn.
2. Read sniff / squat / lunge / loved / yanked from silhouette, including silent play.
3. Sell the block as a 90s cast — hydrant, gnome lawn, nice grass, home — not a lane diagram.

Copy is already the show. Art is the Saturday-morning cartoon the punchline plays over.

Hardware constraints (do not negotiate): 400×240 Sharp Memory LCD, 173 ppi, 30 fps, sprite system, no runtime rotate/scale, 32×32 tiles, no 8×8. Camera scrolls 2 px/frame — dither must be horizontal-stable. Leash is a drawn line, never a bitmap rope.

---

## Direction

**Nicktoon suburb × Macintosh FatBits × 90s pet toy.**

The year is 1994–1997. After-school block. Vinyl siding. Garden gnome as lawn cop. Fire hydrant as a little altar. A doodle who looks like a stuffed animal that escaped the shelf. HUD that feels like a Tamagotchi / *Dogz* status bar, not a productivity app.

### Steal this, ignore the rest

| Steal the feeling | Do not steal the look |
| --- | --- |
| *Hey Arnold!* / *Doug* / *Recess* — stoops, hydrants, grandmas, mean dogs, one block as a universe | Color, thin TV outlines, background gags that fight 1-bit |
| *Rocko's Modern Life* — objects with opinions (the gnome *watches*) | Grotesque squash, adult-swim ugliness |
| *Petz* / *Dogz* (1995–96) — affection, toy-like dog, status icons | Desktop window chrome, tiny 2D yard sim |
| Tamagotchi (1996) — glanceable meters, chunky icons, “he has to go” as a verb | Tiny LCD blobs as the *character* |
| Macintosh 1-bit / FatBits / Kid Pix — proud pixels, 2–3 px ink, no anti-alias | HyperCard grey, Cairo dingbats, ironic GeoCities |
| Saturday-morning title cards — bounce lettering, freeze-frame punchline | Lens flare, bevel, chrome wordmarks |

**Not the references.** *Untitled Goose Game* is timing only. *Peanuts* is too spare and adult. Mid-century Golden Books are the wrong decade. Playdate system UI is what the *device* looks like, not what *this cartridge* looks like. Game Boy “chunk” is 1989; we are 1996 cartoon, not Tetris.

### Five pillars

1. **Momo is a stuffed animal that breathes.** Big head, floppy ears, pom-pom tail, squashy body. He is the only fluffy silhouette. Everyone else is a harder toy (walker jacket, hydrant, gnome, fence).
2. **Cel ink, 3 px on characters.** Outlines are proud, slightly rounded, cartoon — not indie hairline, not photoreal fur. Interiors are graphic shapes, not rendered coats.
3. **The block is a Nicktoon set.** Vinyl, picket, stoop, gnome, hydrant. Houses are flat painted flats (roof + window + siding ticks). Props have opinions. If a prop could not guest-star in *Doug*, it is too tasteful.
4. **HUD is a 90s pet toy.** Chunky wells, droplet and coiled-pile icons with weight, a watch that looks like a digital kids’ watch. Not a form. Not a terminal.
5. **Comedy holds the pose.** Squat is sacred and a little embarrassing. Pee is modest. Poo is a cute coiled monument. No anatomy, no splat, no “gross-out 90s” (this is not *Ren & Stimpy*).

### Vibe test

If a still looks like it could have been a 1996 Nickelodeon bumper drawn in MacPaint, it is in. If it looks like a 2022 itch.io 1-bit or a Panic marketing screenshot, it is out.

---

## Style bible

### Line and mass

- **Characters: 3 px outline.** 2 px only on tiny HUD icons and leash.
- Momo’s outline **nubs** every 3–5 px along the back (stuffed-animal seam, not noise).
- Humans, hydrant, gnome, HUD: **clean rounded-cel** — toy plastic, not fur.
- No 1 px sparkle. Eye shine is a 2×2. Nose highlight is a 2 px dash.
- Nicktoon proportions: Momo head is ~40% of his height. Walker head is a graphic oval, not a portrait.

### 1-bit “color”

| Role | Treatment |
| --- | --- |
| Paper / sidewalk / muzzle / chest | Solid white |
| Ink / outlines / ears / nose / jacket / pile | Solid black |
| Momo “tan” | **Stuffed-animal patches** — a few 2–3 px clumps on the saddle and ear backs, like sewn-on felt. Not a screen, not a coat photo |
| Nice / premium grass | Graphic tuft stamps + period-2-or-4 horizontal fill. Lawn as a *pattern*, like a 90s sweater |
| Patchy | Sparse, weedy, uneven. Must not equal default yard |
| Forbidden | Tidy, owned, darker period-4 brick or 2 px pipes + hedge. **Never 2×2 checker** |
| Street | Darker than sidewalk, fat lane dashes. Period-2 |
| Walker jacket | Flat black. Optional 90s windbreaker slash: one white chevron or stripe. No dither |

**Strobe rule:** regular 2×2 on a ~2 px/frame mover inverts every frame. Illegal on Momo, the pile, and any grass he walks.

### Scale (pocket)

- Momo: **48×40** cell, ~40 px of dog, fluff may hang.
- Walker / Dorothy: **40×48**.
- Mean dog: **36×32**, pointy, blacker — the anti-plush.
- Tiles: **32×32** only.
- Hydrant ~24×32. Gnome ~24×40 (hat is the read). Tree trunk 12–16.
- HUD icons: **16×16** in a chunky 20 px well.

Judge ears, squat, and pee-mail type on a **physical Playdate**. Simulator sign-off is not enough.

### Type

- **Body: Roobert.** On-device, 2 px stroke. Never Asheville.
  - Banner: Roobert 20, all-caps pee-mail.
  - Clock / hints: Roobert 10 if it holds on device; else Roobert 20 and shorter strings.
  - Punchlines: Roobert 24.
- **Title is a cartoon logo, not a font.** Painted **GO MOMO GO** — bounce baseline, the middle **O** is Momo’s head. Slight tilt. 3 px ink.
- Lockup sits near **x ≈ 228** on title only (physical center of the Playdate). Gameplay ignores that.
- No type baked into tiles or icons. Image models garble letters; engine type and code-composited punchlines only.

### Motion

- Image tables. Flip-X when called back. No rotate, no scale.
- Walk 4–6 frames with **ear lag** (ears a frame late).
- Idle is a **pant** — stuffed chest that squishes.
- Squat is two beats: circle (nose-to-tail, 3–4 frames) then a **held** squash.
- Leash: 2 px polyline. Slack sags. Taut is a straight rubber-band.

### Draw order

Yard fill → house flats + fence → yard props → sidewalk/curb → street → stains/puddle/pile → walker → leash → **Momo** → HUD. Banner is a short paper scrap, not a modal. No parallax.

---

## Per-asset specs

All engine art: 1-bit, isolated on one keyable flat (white or magenta — pick one and keep it), no baked shadow, no baked sidewalk. Subject registered to a shared ground line and (for Momo) a shared collar pixel.

### Momo — 1996 plush doodle

Beanie-adjacent double-doodle that walked off the shelf. Teddy muzzle. Floppy ears that hang *below* the skull (not Mickey discs). Dark wet nose. Close-set eyes with one 2×2 shine. Pom-pom tail. Short legs that exist. Side-view **right**. Tan = felt patches.

| State | Squint must read |
| --- | --- |
| Idle pant | Loaf, ears hanging, chest squash |
| Walk 4–6 | Ear bounce late, pom-pom counterweight |
| Sniff | Nose down, one ear forward, butt up |
| Lunge | Stretch, ears back, tail a line |
| Lift-leg | Tripod, rear leg a fat comma. Stream is 2–3 px, procedural |
| Circle | Nose chasing tail |
| Squat | Compact, back round, tail aside. Sacred. Hold. |
| Loved | Melt into pets, ears soft |
| Yank | Neck long, eyes wide, ears pinned |
| Hackles | Fur ridge, taller ears |
| Refuse | Look *back at you*. Not `...`. |

Collar: 2 px band + 3×3 tag. Leash docks to one documented pixel.

### Walker — 90s commuter extra

Boxy **windbreaker**, dark pants, chunky sneakers, almost no face. One white chevron or sleeve stripe. Visible **fist** on the leash side. States: walk, wait (glance at a chunky digital watch), brace/yank, bag. Flat black jacket. Anonymous.

### Dorothy (with her encounter PR)

40×48, rounder coat, helmet-of-hair or soft hat, purse. 90s-sitcom grandma who just wants to say hi. Hearts + squash, not horror.

### Mean dog / Bruno / squirrel (later)

- Mean dog: anti-plush. Pointed, blacker, straight tail, hackles. 36×32.
- Bruno: doodle family, chest patch + different ears.
- Squirrel: 16×16 dart. Sit + leap.

### Tiles — Nicktoon block

32×32, side-view, gravity-aware. A few anonymous variants so the grid does not chant.

| Tile | Design | Reject |
| --- | --- | --- |
| Sidewalk | Fat pale slabs, *thin* mortar, one crack variant | Full-height black grout |
| Curb | 8–10 px lip | Street that just starts |
| Street | Dark, fat dashes | Crawling 50% checker |
| Default yard | Quiet, lighter than grass | Reusing patchy’s hatch |
| Patchy | Weedy strip. Pee-legal, poo-illegal must be obvious | Same as dirt |
| Nice | Even tuft rows, “dad mows on Saturday” | TV-bar 0xFF/0x00 |
| Premium | Nice + a rare anonymous flower | Landmark bloom repeating every 32 px |
| Forbidden | Tidy, darker, hedge + gnome territory | 2×2 checker; 8 px “KEEP OFF” type |

**House flats:** 64–96 px panels, low contrast. Vinyl ticks, one window, maybe a stoop shadow.

**Fence:** white picket on the seam. Forbidden gets a short hedge and a hint of a gate.

### Props

| Prop | Read | Personality |
| --- | --- | --- |
| Hydrant | Two caps + top nut, ~24×32, white body, fat black ink | Slightly proud. First pee-mail altar |
| Tree | Trunk + stain at the foot; canopy a black cloud with 2–3 white holes | Canopy rhymes with Momo |
| Gnome | Pointed hat, beard, belly, hands on hips, **eyes** | The witness. Owns an end card |
| Mailbox / lamp / bench | One each for Walk 1 flavor | Bench is Dorothy’s throne later |
| Stoop | Door + two steps. No `home` label | The walk has a door at both ends |
| Stain | Dark ellipse. Lightens when read | ~16×6 |

If the gnome does not look like he could file a report, redraw him.

### Mess

- **Puddle:** flat dark ellipse, thin white rim, two steam ticks for ~1 s.
- **Pile:** coiled swirl, 12–16 px, black, on a small white pad. A monument, not a splat.
- **Bagged:** gone. Optional tiny tied bag in the walker’s bag frames.

### HUD

| Element | Design |
| --- | --- |
| Clock | Chunky digital kids’ watch chip: black bezel, white face, `work in 2:30`. Top-right |
| Pee | Fat droplet that fills bottom-up |
| Poo | Coiled pile icon, same shape as the ground monument |
| Banner | Torn fridge note / mail flag, ~280×22, never covering Momo’s band |
| Hint | Small, bottom-left. Hide when idle |
| Hearts / bark / yank | 8–12 px, 2 px stroke, 2–3 frames |
| Crank docked | Official `crankIndicator` |

### Title, launcher, end cards

- **Launcher card 350×155:** Momo lunging toward nice grass, leash taut off the left, walker reduced to a windbreaker arm. **GO MOMO GO** painted in the sky, middle O = his face. If you crop the card and cannot read the title, it fails.
- **Icon 32×32:** Momo head 3/4. Ears + nose only.
- **Wrapping 400×240 (later):** hydrant + picket + tiny gnome, anonymous repeat.
- **Title 400×240:** same family as the card. Official crank bubble when docked. No Playdate glyph.
- **End cards:** cartoon bumpers, thick 4 px frame or rounded TV-bezel, Roobert 24 punchline, small restart hint.

| State | Picture | Line |
| --- | --- | --- |
| Win | Momo sitting proud on nice grass; walker in the corner, watch up | **Good boy.** |
| Time out | Momo mid-step, unbothered; walker frozen on the watch | **He can hold it. You cannot.** |
| Gnome | Gnome fills the foreground, staring out; Momo tiny on the forbidden lawn | **The gnome saw everything.** |
| Left it | Empty sidewalk, monument still on the lawn, leash gone | **You left it.** |
| Fight (later) | Tangle silhouette | **Momo, no.** |
| Grandma (later) | Dorothy + hearts | **She named him Sweetpea.** |

---

## Imagine concept art

Style-anchor stills live in [art/concept/](art/concept/). They are **direction locks**, not engine sprites. QA later sheets against them. Engine art is FatBits-cleaned to true 1-bit; concept stills may carry light grey from the model and still pass if the *cartoon* is right.

### How to run these prompts

- Use the **verbatim** prompt in each block. Do not paraphrase. Style words are load-bearing.
- `image_gen` for the first still of a subject. `image_edit` for every reappearance, seeded from the previous still. Never a fresh generate of “the same” Momo.
- One pose / one scene per call. Do not ask the model for contact sheets, comic grids, or baked punchline type.
- Punchlines (`The gnome saw everything.` etc.) are composited in-engine with Roobert 24. Concept illustrations are **silent**.
- If a still fails the vibe test, edit-chain a correction from that still. Do not start over unless identity is broken.

### Shared style lock (already inlined in every prompt)

1-bit Macintosh FatBits cartoon. Pure black and pure white. No grey, no anti-alias, no photoreal fur. Thick rounded cel outlines. 1996 Nickelodeon Saturday-morning suburb. Proud chunky pixels like MacPaint and Kid Pix.

### A — Momo identity (canonical)

**File:** `docs/art/concept/momo-side.png`  
**Tool:** `image_gen` · **aspect:** `1:1`

```
A stuffed-animal double-doodle dog named Momo in strict side view facing right, standing on a flat white field like a toy on a lightbox. He has a huge teddy head about forty percent of his height, floppy ears hanging below the skull, a round white muzzle, a black wet nose, close-set black eyes with one tiny square shine, a pom-pom tail, short squashy legs, a nubby fluffy outline like a Beanie Baby seam, a few felt-like black clumps on his saddle, and a thin collar with a square tag. 1-bit Macintosh FatBits cartoon, only pure black and pure white pixels, no grey, no anti-alias, thick rounded cel outlines, 1996 Nickelodeon Saturday-morning toy, proud chunky MacPaint pixels, isolated character, no ground shadow, no background scene.
```

**Pass:** ears hang below the skull (not Mickey discs on top); muzzle is a light teddy pad; outline is nubby; head is oversized; white field only.

### A2 — Squat (edit-chain from A)

**File:** `docs/art/concept/momo-squat.png`  
**Tool:** `image_edit` of `momo-side.png` · keep the same dog

```
Keep this exact stuffed doodle — same face, same floppy hanging ears, same white muzzle, same black nose, same pom-pom tail, same nubby outline, same collar, same 1-bit FatBits cartoon on a flat white field. Change only the pose: he is squatting to poo, body compact and slightly embarrassed, back rounded, tail nudged aside, short legs planted, head a little down, still facing right. Same thick cel outlines, pure black and white, no new background.
```

**Pass:** unique silhouette vs stand; sacred and a little ashamed, not a joke splat.

### A3 — Sniff (edit-chain from A)

**File:** `docs/art/concept/momo-sniff.png`  
**Tool:** `image_edit` of `momo-side.png`

```
Keep this exact stuffed doodle — same face, same floppy hanging ears, same white muzzle, same black nose, same pom-pom tail, same nubby outline, same collar, same 1-bit FatBits cartoon on a flat white field. Change only the pose: he is sniffing, nose down to the ground, one ear tipped forward, rump slightly up, still facing right. Same thick cel outlines, pure black and white, no new background.
```

**Pass:** nose-down / butt-up reads at a squint; still the same dog as A.

### B — Walk slice

**File:** `docs/art/concept/walk-slice.png`  
**Tool:** `image_edit` of `momo-side.png` (put this Momo in the block) · **aspect:** `16:9`

```
Keep this exact stuffed doodle and drop him into a 1996 Nicktoon sidewalk scene, side view, he is on a long leash lunging a little toward a strip of tidy tufted lawn. A boxy windbreaker commuter stands on the left, almost no face, one white chevron on the jacket, chunky sneakers, a visible fist holding a taut 2-pixel black leash. White picket fence, a proud toy fire hydrant with two side caps, vinyl house flats with one window each, fat pale sidewalk slabs with thin mortar, a dark street with fat lane dashes along the bottom. 1-bit Macintosh FatBits cartoon, only pure black and pure white, thick rounded cel outlines, 1996 Saturday-morning suburb, no grey, no anti-alias, no HUD, no letters, no Playdate chrome, wide side-scroller frame.
```

**Pass:** three bands (yard / sidewalk / street) read instantly; Momo matches A; walker is a hard toy; hydrant looks like a hydrant; no type.

### C — Gnome bumper (silent illustration)

**File:** `docs/art/concept/gnome-bumper.png`  
**Tool:** `image_gen` · **aspect:** `16:9`

```
A 1996 Nicktoon garden gnome fills the foreground in a Playdate-wide bumper still, pointed hat, fat beard, round belly, hands on hips, staring straight out with clear cartoon eyes like he is filing a report. Behind him a tiny stuffed double-doodle is caught on a tidy forbidden lawn behind a short hedge, same nubby plush dog as a guest in the distance. 1-bit Macintosh FatBits cartoon, only pure black and pure white, thick rounded cel outlines, Saturday-morning freeze-frame, proud MacPaint pixels, no grey, no anti-alias, no letters, no captions, no TV bezel.
```

**Pass:** gnome could guest-star in *Doug*; he has eyes; Momo is small and guilty; no baked punchline.

Punchline **The gnome saw everything.** is Roobert 24 in-engine, not in this PNG.

### Later stills (same locks, not this PR)

When those PRs start, edit-chain from A/B/C. Do not invent a new Momo.

| Still | Seed | Notes |
| --- | --- | --- |
| Walker wait / yank / bag | B | Same windbreaker |
| Hydrant + tree + stoop turnaround | B | Toy props, isolated |
| Win bumper | A + B | Momo proud on nice grass; walker checks a chunky watch |
| Time-out bumper | A + B | Momo unbothered; walker frozen on the watch |
| Left-it bumper | B | Empty sidewalk, coiled pile monument, leash gone |
| Title / launcher lockup | A + B | Paint **GO MOMO GO** by hand or composite type; do not trust the model with the wordmark |

### QA against the stills

A later asset fails if any of these are true:

- Momo’s ears sit on top of the head like Mickey discs.
- Momo is a smooth circle, a panda, or a photoreal doodle.
- Outline is 1 px or anti-aliased grey.
- Grass or fur is a 2×2 checker.
- Walker is more detailed / fluffier than Momo.
- The gnome has no face, or looks tasteful and European-catalogue.
- Type is baked into a tile, icon, or concept PNG we treat as final.
- The still would look at home on a 2022 itch.io 1-bit page.

---

## Production notes

1. Lock A/B/C before any 40-frame sheet.
2. Generate, then FatBits-clean for engine: 3 px outlines, no strobe grids, feet on the cell baseline.
3. Momo is always an edit-chain from `momo-side.png`.
4. Cycles (walk, pant, circle) can go video-first from the still, then harvest and clean. Holds (squat, yank, refuse) are pose edits.
5. Tiles painted as a strip, sliced to 32, verified with a 2×2 and a 4-wide scroll. Side-view tiles do not rotate.
6. Engine path: `source/images/` PNGs → PDI via `pdc`. Image tables. Leash stays code.
7. Do not commit color comps as truth or compiled `.pdx`. These concept PNGs are the intentional exception.

---

## Follow-up PRs

| Next | Work |
| --- | --- |
| Toy HUD | Roobert, digital-watch clock, droplet/pile wells, fridge-note banner |
| Momo plush sheet | Wire identity + states from still A |
| Windbreaker walker | Sheet from still B |
| Nicktoon block | Tiles + hydrant, tree, gnome, stoop |
| Saturday-morning card kit | Wordmark, 350×155 card, 32 icon, four bumpers |
