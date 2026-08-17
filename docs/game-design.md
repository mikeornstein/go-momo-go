# Go Momo Go — Game Design

A Playdate side-scroller about walking Momo, a tan double-doodle, long enough for him to *go* — without losing him to mean dogs, grandmas, or his own nose.

This document is the source of truth for concept, mechanics, story, and v1 scope. Implementation happens in follow-up issues, not here.

---

## Pitch

You are late for work. Momo is late for the lawn. The crank is the leash.

Reel him out so he can sniff pee-mail, answer it, and squat on *nice* grass. Reel him in before a grandma steals the walk, a mean dog starts something, or he lunges at a squirrel and yanks you into a planter. Short leash is safe and useless. Long leash is how business gets done — and how walks go sideways.

| Item | Value |
|------|--------|
| Tone | Warm, funny, slightly chaotic. *Untitled Goose Game* timing with *Nintendogs* affection. Never gross-out. Poo is a solemn doodle ritual, not a toilet joke. |
| Session | One walk, **2–4 minutes**, clear win/lose |
| Structure | Authored blocks, not an endless runner |
| v1 | **Walk 1** is the complete game |

---

## Fantasy and story

### Who

- **Momo** — tan double-doodle, teddy face, floppy ears, fluffy outline. Sweet, nose-driven, easily loved, slightly dramatic when yanked.
- **You (the walker)** — visible on the left, simple side-view human. Not the star. You exist so the leash has two ends and a tug has a body.
- **The block** — a cast, not a plot dump. You learn them by walking.

### Recurring characters

| Character | Role |
|-----------|------|
| **Bruno** | Rival doodle. His pee-mail is territorial and useful ("MEAN DOG AHEAD"). |
| **Dorothy** | Neighborhood grandma. Hearts, perfume, time theft. |
| **The Nice Lawn** | Climax location. Premium grass. Sometimes a gnome / "keep off" variant next door. |
| **The Heel** | Unseen off-leash menace or fenced barker. Punishes max slack at the wrong fence. |

### Campaign spine (later walks)

Not cutscenes — title cards and pee-mail.

1. **Walk 1 — Before work.** Tutorial block. Hydrant, first pee-mail, first pee, one grandma, one mean dog, the Nice Lawn, home. Win = 1 pee + 1 poo before the clock hits zero.
2. **Walk 2 — After the rain.** Fewer grandmas, worse grass, puddles, one perfect park strip.
3. **Walk 3 — Saturday market.** Crowds, dropped food, more dogs, less lawn.
4. **Walk 4 — Evening sniff.** Better pee-mail intel, darker streets, Bruno encounter.
5. **Walk 5 — The long way home.** Full kit, best score chase.

Walks 2–5 are follow-up content issues. They are not required to call v1 done.

### Win / lose copy

| Outcome | Line |
|---------|------|
| Win | **Good boy.** End card of Momo on the lawn, walker checking a watch with time to spare. |
| Time out | **He can hold it. You cannot.** |
| Fight / tangle | **Momo, no.** |
| Forbidden lawn | **The gnome saw everything.** |
| Grandma lock until time dies | **She named him Sweetpea.** |

---

## Camera, space, and the leash

Side-view, **auto-scrolls right**. The walker walks at a steady commute pace. The screen is a slice of sidewalk:

```
  [ yards / fences / grass / trees ]     ← Momo can range UP if the leash allows
  [ sidewalk — walker ~~~~ Momo     ]     ← default path
  [ curb / street / bikes / puddles ]     ← Momo can range DOWN; dangerous
```

Resolution is 400×240. Momo is the read target: **~40×40 px** (above the 32 px Playdate floor). Walker similar. Leash max ~120–140 px so both stay on screen with margin. Do **not** zoom the world.

### Crank = leash length

**Reel model**, not absolute crank angle. `playdate.getCrankChange()` winds slack in or out, like a retractable leash.

| Slack | Length | Feel | What Momo can do |
|-------|--------|------|------------------|
| **Heel** | ~24–32 px | Safe, athletic wind-in | Pass dogs; escape grandma *if you wind before she grabs* |
| **Working** | ~60–90 px | Default walk | Reach curb hydrants, strip grass, sniff pee-mail |
| **Long** | ~120–140 px | Risky, athletic wind-out | Premium lawns, deep yards, Bruno's tree — and every trap |

Docked crank: official `playdate.ui.crankIndicator`, Momo locked at heel, cannot finish the walk. New players must undock.

Fast wind-in while Momo is committed (sniff, squat, lunge) **yanks**. Yank interrupts the action, drops a little poo-urge (stage fright), and can tug the walker (brief slow).

Reel (not angle-as-length) makes length an investment: you *paid* crank travel to reach the lawn, and you *pay it back* to survive the dog. That is the game.

### The two-body rule

- Walker wants to keep commuting (auto-move right).
- Momo wants the nearest interesting thing (sniff, squirrel, grandma, grass).
- Leash is a **max-distance constraint**. Hit the end → walker slows and/or Momo gets yanked.
- Slack = Momo's AI is free inside the radius.

You are not steering a single avatar. You are managing a relationship.

---

## Controls

Playdate guidance: crank + **B** (left thumb) is the comfortable combo. D-pad doubles as accessibility.

| Input | Action |
|-------|--------|
| **Crank** | Reel leash out / in |
| **B tap** | "Come!" — Momo turns toward walker, brief ignore of distractions |
| **B hold** | "Wait" — walker slows/stops. Use to time a squat or a dog pass |
| **A** | "Good boy" / treat. Short focus burst after a success; not required to potty |
| **D-pad U/D** | Hint Momo toward yards or curb (within slack) |
| **D-pad L/R** | Hint Momo back / ahead; also **accessibility reel** (L in, R out) if crank is unused |
| **System Menu** | Restart walk, mute, (later) walk select |

If the walk only needs one panic verb, bind it to B, A, and d-pad down so players can pick a comfortable hand.

---

## The "go" loop

Two urges, independent:

| Urge | Fills | Empties | Surface |
|------|-------|---------|---------|
| **Pee** | Time + reading pee-mail | Lift-leg (~0.6 s) | Hydrant, tree, lamp, pee-mail spot, grass |
| **Poo** | Time only (slow). Sniffing interesting things helps a little. Grandma-love **drains** it | Circle + squat (~1.8 s, interruptible) | **Nice or premium grass only** |

**Walk 1 win:** empty both before the commute clock hits zero, then reach the end-of-block home marker. Pee alone is not a win. Poo on the sidewalk is refused (he sniffs and looks at you).

### The squat is the set-piece

On valid grass + poo urge high enough, Momo **circles** (readable wind-up) then squats. For those ~2 seconds the player must:

1. Give enough slack that he stays on the patch.
2. Not yank.
3. Hold "Wait" if a threat is incoming, or heel-reel only after he finishes.
4. Keep grandmas and dogs outside his radius.

Interrupted squat = embarrassment, urge stays, he will not retry that same patch for a few seconds.

Pee is the small reward and the information tool. Poo is the level boss.

---

## Encounters

### Pee-mail (read + reply)

Marks on hydrants, trees, lamp posts, fence corners.

- **Read:** hold Momo on the mark ~1 s (sniff frames). HUD shows a short line in 12 px+ type.
- **Reply:** if pee urge is high, lift-leg is a valid empty. If not, he memorizes it and moves on. Reply is **optional** for the win; hydrants and grass also empty pee.
- **Radar:** pee-mail telegraphs the next hazard (`BRUNO WAS HERE`, `SQUIRREL 3 HOUSES DOWN`, `DOROTHY ON THE BENCH`, `DO NOT SNIFF THE GNOME LAWN`).
- Rushing (heel past every mark) = you walk blind. That is the skill expression.

Keep copy to one line. Type: **≥12 px cap height, ≥2 px stroke**. Never ship Asheville as the game font.

### Mean dogs

Telegraph (hackles / bark ticks) then occupy a sidewalk or yard lane.

- **Heel** past them: safe.
- **Long slack + overlap:** tangle / scrap. Walk 1 treats this as a **fail**.
- **Fenced barkers:** only dangerous if you let Momo reach the fence (pee-mail often sits *on* that fence). Bait.

### Grandmas (Dorothy and friends)

Detection radius on the sidewalk. If Momo stays in it, she **locks** him in a petting loop (hearts, muffled crank).

- Escape: rapid wind-in **before** the grab, or mash B + crank after (slower, costs more clock).
- After extract: **Loved** state — hearts, slower, poo urge drops. Comedy, and a real cost.
- Later variants: treat grandma (tiny focus buff) vs perfume grandma (sniff disabled briefly).

### Surfaces and traps

Grass is a **surface type**, not a decoration.

| Surface | Pee | Poo | Notes |
|---------|-----|-----|-------|
| Patchy strip | yes | no | Common. He will not poo. |
| Nice lawn | yes | yes | The goal. Tufts, even dither. |
| Premium park | yes | yes + score | Rare. |
| Forbidden / gnome | yes (naughty) | **fail if he goes** | Fancy gate, gnome, "keep off". Pee-mail may dare you. |
| Sidewalk / gravel | no poo | refused | |

Walk 1 ships 2–3 traps; the rest wait for later walks.

- **Squirrel** — Momo lunges to max slack; yank risk; B "Come!" cancels if you are quick.
- **Dropped food** — he eats, tummy gurgle, poo urge spikes but squat becomes more interruptible.
- **Bike / scooter** in the street lane — collision if ranged down.
- **Sprinkler** — startles, interrupts squat.
- **Leash tangle** with another walker — later walk.

### The clock

A commute timer, not a score attack. Visible as a small watch / "work in 2:30" HUD. 10 px+ cap is acceptable because it is glanced, not read continuously. Time pressure makes grandma-love and long sniffs expensive.

---

## HUD and juice

- **No numeric leash.** The leash *is* the meter.
- Pee / poo: two small icons that fill (droplet + a cute coiled pile). High-contrast, not anatomical.
- Clock: tiny, top corner.
- Pee-mail: one-line banner, large type, auto-dismiss.
- Yank / loved / hackles: readable state VFX on Momo (motion lines, hearts, spikes) so silent play still works.
- Crank-docked: system crank indicator.

Honor accessibility prefs. Subtitles for grandma lines and pee-mail. Visual blip for every SFX.

---

## Playdate feel targets

These are design constraints, not polish notes.

- **30 fps.** Sprite system, dirty rects. No runtime rotate/scale of Momo or leash art — draw the leash as a line/curve, not a rotating bitmap.
- **1-bit dither:** Momo's tan is a *stable* mid dither (not a 2×2 checker that scrolls). Scroll grass/dither by **multiples of 2 px**, or apply dither after scroll.
- **No 8×8 tiles.** Sidewalk / grass tiles **32×32**.
- **Judge type and Momo on device**, not the Simulator. Simulator sign-off is not enough for ears, squat silhouette, or pee-mail type.
- **Audio:** normalize to system games. Tiny speaker: collar jingle and sniff must read without bass. Headphones get the extra woofs.
- **Physical center** of the Playdate screen is x≈228 if a title lockup needs it; gameplay camera can ignore that.

See [AGENTS.md](../AGENTS.md) for Simulator, screenshot, and device-check workflow.

---

## Asset list

Look is specified in **[art-direction.md](art-direction.md)** (1996 Nicktoon / FatBits / pet-toy). Generate in later art tickets against that bible and the concept stills in `docs/art/concept/`. All 1-bit, chunky silhouettes, pocket-readable at 173 ppi.

### Characters (image tables, not runtime transforms)

**Momo (hero sheet, ~40×40)**  
Idle pant, walk (4–6 frames), sniff, lunge, lift-leg pee, circle, squat poo, loved/belly, recoil/yank, hackles.  
Side-view facing right is default; mirrored left when called back.  
Identity lock: floppy ears, round teddy muzzle, fluffy outline, dark nose/eyes. Tan = mid dither that does **not** strobe when scrolling.

**Walker (~40×48)**  
Walk, brace, yanked, wait. Simple clothing silhouette. Face can be minimal.

**Dorothy (~40×48)**  
Walk, notice, grab/pet loop, release.

**Mean dog (~36×32)**  
Walk, telegraph bark, lunge. Pointy, darker fill, contrast with Momo's fluff.

**Later:** Bruno (doodle variant, different ear/chest mark), squirrel, cyclist.

### World (32×32 tiles + props)

- Sidewalk, curb, street
- Grass: patchy, nice, premium, forbidden
- Fence, gate, gnome lawn marker
- Hydrant, tree trunk + pee-mail stain, lamp, mailbox, bench
- House/yard background strips (low detail, not a second playfield)
- Home marker / front stoop

### UI / launcher

- **Launcher card must contain the title** (the system does not draw the name). Momo straining toward grass, leash taut.
- Title/menu frames, "Good boy" / fail cards
- Icons: pee, poo, hearts, bark, crank hint
- `playdate.setMenuImage` from a paused walk slice (later)

### Audio

Collar, sniff, pee, poo (soft comic), bark, grandma "ooh", yank, success, fail, walk loop (light). Every cue has a visual twin.

### Not in v1 art

Runtime-rotated Momo, 8×8 tiles, color mockups as source of truth, photoreal fur, a second playable character.

---

## Technical shape

Replace the stock crank-demo `source/main.lua`. Suggested modules (each can be its own PR):

```
source/
  main.lua              -- boot, scene swap
  walk/
    walk_scene.lua      -- scroll, clock, win/lose
    leash.lua           -- crank reel, constraint
    walker.lua
    momo.lua            -- AI wants + states
    surfaces.lua        -- grass / sidewalk / forbidden
    encounters.lua      -- spawn + update
    hud.lua
  data/
    walk1.lua           -- authored block layout
```

Momo states: `heel`, `wander`, `sniff`, `lunge`, `loved`, `circle`, `squat`, `pee`, `yanked`.

Encounters are data on the walk timeline (x position + type), not a random endless spawner in v1. Authored first block = teachable and screenshotable.

Greybox first (placeholder rects/circles), then a Momo sheet so silhouette can be judged on device.

Verification follows [AGENTS.md](../AGENTS.md): `pdc`, Simulator, `writeToFile` frames for heel / long-leash / squat / grandma — then **revert dump hooks**. Human playtest on a physical Playdate for crank feel, type, and silhouette.

---

## Key decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Player fantasy | You walk Momo; crank is the leash | Matches the title and the hardware. Momo is the character; you are the relationship. |
| Camera | Side-scroll, auto-commute right | Hands stay on crank + B, not a move stick. |
| Crank model | Reel (`getCrankChange`), not angle-as-length | Feels like a retractable leash; length is an investment. |
| Win | 1 pee + 1 poo on legal surfaces, then home, before the clock | "Go" is the goal; pee-mail is the tool; poo-on-nice-grass is the set-piece. |
| Pee-mail | Intel is the reward; reply is optional | The nose compulsion is strategic, not a fetch quest. |
| Grandma | Soft lock that drains poo urge | Distraction with comedy and a real cost to the mission. |
| Mean dogs | Heel = safe; slack + overlap = fail (Walk 1) | Teaches the short-leash verb without a combat system. |
| Forbidden lawn | Instant fail | Readable, funny, no chase system in v1. |
| Scope of v1 | One authored walk, placeholder art OK, full loop | A playable joke before a neighborhood engine. |
| Walker on-screen | Yes, simple | Leash and tug need two bodies. |
| Endless runner | No | A walk has a door at both ends. |
| Art order | Greybox loop, then Momo sheet | Mechanics first; silhouette check on device second. |

---

## Out of scope (v1)

- Combat system, inventory, multiplayer, GPS / real-neighborhood maps
- Walks 2–5, Bruno as a character encounter, cyclist, daily seed, score attack, wrapping paper
- 8×8 tiles, runtime-rotated doodle
- Shipping `writeToFile` hooks or compiled `.pdx` bundles

---

## Build order

Ticket-driven. One issue per vertical slice. Branches `docs/N-…` / `feat/N-…`. PRs into `main` with `Refs` until the slice that ships the playable walk.

| PR | Work |
|----|------|
| 1 | This document + README pointer |
| 2 | Walk scene skeleton: auto-scroll sidewalk, clock, win/lose stubs, crank indicator |
| 3 | Leash: walker + Momo placeholders, reel, constraint, yank, B come/wait |
| 4 | Surfaces + go: grass types, urges, circle/squat/lift-leg, win on 1+1 and home |
| 5 | Pee-mail: sniff spots, one-line HUD, optional reply, one telegraph message |
| 6 | Mean dogs + grandma: heel-pass vs tangle fail; lock, extract, loved drain |
| 7 | Walk 1 layout: hydrant → pee-mail → grandma → dog → nice lawn → home; squirrel + forbidden lawn |
| 8 | Art direction bible + Imagine concept stills; then Momo art + launcher card (title in the card); device check |
| 9 | Audio, menu image, accessibility bindings |

---

## First playable definition

A stranger can undock the crank, walk one block, read one pee-mail, heel past a dog, escape Dorothy or pay the cost, and get Momo to poo on the nice lawn before work. If that loop is funny on a physical Playdate, the concept is right.
