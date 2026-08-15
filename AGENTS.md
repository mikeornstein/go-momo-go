# Agent notes (Grok / automated dev)

Playbook for agents working on **go-momo-go**. Prefer these commands over asking the user to paste CI logs.

## Project at a glance

| Item | Value |
|------|--------|
| Repo | `mikeornstein/go-momo-go` |
| Intent | Playdate game in Lua (fork of the SquidGod playdate-template) |
| Stack | Lua + Playdate SDK; VS Code build/debug tasks in `.vscode/` |
| Git model | **Issues → branches → PRs** — never commit or push product work to `main` |

### Local app commands

Build and run via VS Code **Run Build Task** (`cmd + shift + b`) or `pdc` if the Playdate SDK is on `PATH`:

```bash
pdc source builds/Game.pdx
```

Always verify graphics, type, audio, and performance on a **physical Playdate**. The Simulator is larger, faster, and higher-contrast than the device. See [Playdate design constraints](#playdate-design-constraints) below.

## Hard rules for agents

1. **Never** commit product work on `main`.
2. **Never** `git push origin main` (or push new work on a branch named `main`).
3. **All work is done on branches** — implement, test, commit, and push only on the feature branch.
4. **Every branch references an issue** — branch name and PR body include the issue number.
5. Changes land on `main` **only via pull request** after checks (prefer **squash-merge**).
6. **Issues close when the work is complete** — use `Closes #N` only on the PR that fully meets acceptance criteria; partial work uses `Refs #N`.
7. **Do not** commit secrets, credentials, private keys, `.env` with real values, compiled `.pdx` bundles, or large binaries.
8. Prefer machine-readable failure sources (`gh run view --log-failed`, local tests) over asking the user to paste logs.
9. Stay in scope of the ticket — no drive-by refactors or unrelated files.
10. Confirm with the user before destructive or hard-to-reverse git actions (force-push to shared branches, hard reset of published history, deleting remote branches they did not ask for).

## Tickets, branches, and pull requests

```text
Issue (ticket)  →  branch type/N-slug  →  one or more PRs  →  green CI  →  merge  →  issue closes
```

| Step | What agents do |
|------|----------------|
| **1. Pick or create a ticket** | Use an open issue, or `gh issue create` if the user asked for work with no ticket. |
| **2. Branch from up-to-date `main`** | Branch name **must** include the issue number. |
| **3. Implement only on that branch** | Commits stay off `main`. Link with `(#N)` when helpful. |
| **4. Open a PR into `main`** | Title/body **must** reference `#N`. Use the PR template sections. |
| **5. Resolve via PR(s)** | Full done → `Closes #N`. More work remains → `Refs #N`. |
| **6. After merge** | Pull `main`, delete the local feature branch, confirm issue state. |

### Branch naming

```text
type/<issue-number>-short-kebab-description
```

| Type | Use |
|------|-----|
| `feat/` | New capability |
| `fix/` | Bug fix |
| `docs/` | Documentation only |
| `chore/` | Tooling, deps, CI |
| `refactor/` | Structure without behavior change |
| `test/` | Tests only |

Examples: `docs/1-agent-contribution-guidelines`, `feat/12-crank-move`.

No issue yet? Create one first — do not invent `feat/wip-no-ticket` for real work.

### Issue ↔ PR linking

| Situation | PR body | Issue result |
|-----------|---------|--------------|
| This PR **fully** resolves the issue | `Closes #N` or `Fixes #N` | Closes on merge |
| Partial work; more PRs follow | `Refs #N` or `Part of #N` | Stays open |
| Multiple PRs | Only the **last** completing PR uses `Closes #N` | Closes on final merge |

Prefer the keyword in the **PR body**, not only the commit message. Do not manually close an issue while acceptance criteria remain unmet.

### Standard flow

```bash
# 0) Know the ticket
gh issue view <N>
# or: gh issue create --title "…" --body "…"

git fetch origin
git checkout main
git pull origin main
git checkout -b feat/<N>-short-kebab-description

# 1) implement + verify on the feature branch only

git add …
git commit -m "Describe change (#N)"
git push -u origin HEAD

gh pr create --base main --title "feat: short title (#N)" --body "$(cat <<'EOF'
## Summary
- …

## Issue
Closes #<N>
# or: Refs #<N>

## Test plan
- [ ] …
EOF
)"
```

After green checks:

```bash
gh pr merge --squash
git checkout main
git pull origin main
git branch -d feat/<N>-short-kebab-description
gh issue view <N>   # CLOSED if Closes was used and criteria met
```

### When the user says “commit and push”

Interpret as:

1. Ensure work is on a **feature branch tied to an issue** (create issue + branch if still on `main`).
2. Commit on **that branch**.
3. Push **that branch** to `origin`.
4. Open or update a **PR to `main`** that references the issue.
5. **Do not** push to `main`.

If already on `main` with dirty work:

```bash
N=$(gh issue create --title "…" --body "…" | grep -oE '[0-9]+$')
git fetch origin
git checkout -b feat/${N}-describe-change
git add … && git commit -m "… (#${N})"
git push -u origin HEAD
gh pr create --base main --title "… (#${N})" --body "Closes #${N}"
```

### PR checklist (agent)

- [ ] Branch is **not** `main`
- [ ] Branch name includes **issue number** (`type/N-slug`)
- [ ] PR body has `Closes #N` **or** `Refs #N`
- [ ] `Closes` only if acceptance criteria are fully met
- [ ] Local verification passed (see below)
- [ ] PR targets `main` with a clear summary
- [ ] No secrets, compiled `.pdx` bundles, or other ignored junk committed
- [ ] Diff is focused — no unrelated cleanup

### Finding work

```bash
gh issue list --limit 20
gh issue view <N>
gh pr list
```

## Git hygiene

- Run `git status` / review the diff before every commit; stage only intentional paths.
- Prefer conventional, imperative subjects (`docs: …`, `feat: …`, `fix: …`, `chore: …`). One logical change per commit when practical.
- Never skip hooks with `--no-verify` unless the user explicitly allows it.
- **Do not force-push `main`.** Force-push a **feature branch** only when rewriting that branch’s history; prefer `git push --force-with-lease`.
- Do not amend commits already on the remote unless you intentionally rewrite that feature branch.
- When behind `main`, update the **feature branch** (rebase or merge); resolve conflicts there, never by committing product work on `main`.
- Prefer GitHub **noreply** author email if private-email push blocks apply:

  ```text
  10444033+mikeornstein@users.noreply.github.com
  ```

  If push fails with `GH007`: check `git log -1 --format='%ae %ce'`, rewrite **unpushed feature-branch** commits with noreply author/committer, push the feature branch again.

## Branch protection (`main`)

**Enforced on GitHub** (re-apply if settings drift):

- Direct pushes to `main` blocked (`enforce_admins: true`)
- Changes only via pull request
- Force-push and branch deletion on `main` blocked
- Required status check: **`check`** (CI job name)
- Approving reviews: **0** required (solo + agent workflow); raise later if desired
- Linear history required (fits squash-merge)

```bash
./scripts/setup-branch-protection.sh
# or:
gh api --method PUT repos/mikeornstein/go-momo-go/branches/main/protection \
  --input scripts/branch-protection.json
```

If the API returns 403 on a private Free plan, upgrade to Pro or make the repo public, then re-run the script. Agents must still follow the hard rules even if protection is temporarily missing.

## CI

| Trigger | Behavior |
|---------|----------|
| PRs to `main` | CI — [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) |
| Pushes to non-`main` branches | CI |

The **`check`** job verifies `source/main.lua` and `source/pdxinfo` exist with required keys, and that compiled `.pdx` bundles are not committed. It does not run the Playdate Simulator or SDK compiler.

Debug CI yourself:

```bash
gh run list --limit 5
gh run view <run-id> --log-failed
gh pr checks
```

## Verification before “done”

| Situation | Agent does |
|-----------|------------|
| Always | Review `git status` and the full diff; no accidental files |
| Docs-only | Proofread; keep `AGENTS.md` / `CONTRIBUTING.md` consistent |
| Game code | Build in the Simulator; verify on a physical Playdate when graphics, type, audio, crank, or performance change |
| PR open | `gh pr checks` green, or fix failures on the same branch |

Never use `Closes #N` if acceptance criteria remain unmet.

## Scope and safety

- Prefer small PRs; split large tickets (`Refs #N` until the final `Closes #N`).
- Do not invent long-lived branches without issues.
- Do not commit `.env` with secrets or compiled `.pdx` output.
- Risky remote actions need explicit user confirmation.

## Full human summary

See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

# Playdate Design Constraints

Source: [Designing for Playdate](https://help.play.date/developer/designing-for-playdate/). These are Panic’s guidelines, not hard SDK rules — but ignore them and the game will be hard to play on real hardware.

Playdate looks retro. The hardware is not. Design for a tiny 1-bit reflective screen, a crank, and no GPU.

Always verify graphics, type, audio, and performance on a physical Playdate. The Simulator is larger, faster, and higher-contrast than the device.

## Screen

- Resolution is **400 × 240** at **173 ppi**. Pixels are small. Size sprites and fonts for a pocket screen, not a 1990s handheld and not the Simulator window.
- The screen is **Sharp Memory LCD**: paper-like, highly reflective, **no backlight**. Games must stay readable in ambient light. Players cannot play in the dark without a lamp.
- A **3 mm black bezel** blends into black pixels. Push graphics to the edge when that helps.
- The screen is offset left. To center something on the *physical* device (not the framebuffer), use **x = 228** (28 px right of the 200 midpoint).

### Sprites

- Player sprites should be about **32 × 32** minimum. Smaller is hard to track.
- Large sprites are fine. Scaling the *whole world* up is not — it causes too much camera panning.
- Fast-moving sprites (and ones with particles) read better when smaller. Slow games can use larger ones.
- Anything the player must parse like text (cards, icons with suits/values) must be large enough to read on a real Playdate, not just a monitor.

### Tiles

- Do not use **8 × 8** tiles. They strain the eye.
- **32 × 32** is a comfortable default.
- Prefer **power-of-2** tile sizes so patterns tile cleanly.

### Text

“Font size” here means **cap height** (baseline to top of a capital), not the full glyph box. A 20 × 20 grid font is usually ~14 px cap height.

| Role | Minimum cap height |
| --- | --- |
| Dialogue / frequent reading | **12 px**, prefer **14 px** |
| HUD (score, health, level) if rarely scanned | **10 px** |
| Everything, including jokes and disclaimers | **8 px** (smaller only if deliberately hidden) |

- Stroke weight at least **2 px**. 1 px fonts look wispy on device.
- Text-forward games need a highly legible face: strong shapes, distinct similar letters, generous x-height.
- Judge size by holding the Playdate next to a printed book. On-device type should be at least that physical size.
- Fonts imported via [Caps](https://play.date/caps) may be unhinted. Touch up pixels if they look fuzzy.
- Default system UI font is **Roobert 20 Medium** (headings: **Roobert 24 Medium**). Aim for that clarity.
- **Asheville 14** is the SDK fallback when a font or glyph fails to load. Never ship it as the game font — it means something is broken.

### 2× scale

`playdate.display.setScale` makes chunkier, easier-to-track pixels at the cost of detail. 2× fonts need extra care; keep them readable.

### Bitmap transforms

Playdate has **no GPU**. Runtime rotate/scale/stretch is CPU-heavy and often looks noisy in 1-bit.

Prefer **pre-transformed frames** (editor or script) stored in an [image table](https://sdk.play.date/#C-graphics.imagetable). 1-bit art is cheap to store and load; you can clean artifacts by hand.

Runtime transforms are acceptable when:

- the sprite moves fast and settles in its untransformed pose, or
- the sprite is large and low-detail.

Touch up generated pixels. Do not ship raw computer-dithered or raw rotated frames if they look fuzzy.

### Dither

- Hand-clean auto-dithered color conversions. They usually look noisy.
- A **2 × 2 checker** scrolled by **1 px** swaps black and white every frame and **flashes**. Avoid this.

Mitigations:

1. Scroll by a **multiple of 2 px** so the dither stays locked to the screen.
2. Apply the pattern **after** scrolling (mask the dithered region and draw it separately).
3. Use a pattern that does not shift under the scroll axis (e.g. horizontal pipes for horizontal scroll).

Same rules apply to other flashing dithers.

### Frame rate

- Default is **30 fps**. Target 30 for anything with lots of motion.
- **20 fps** is acceptable for chunky animation that does not scroll the whole screen often.
- Board/card/static games can request a **lower** refresh to save battery.
- Max is **50 fps**. Smoother on curves, but **40% less time per frame**. Expect to write hot paths in **C**, not Lua. Battery cost is real.

### Screen accessibility

Honor player accessibility prefs from Settings. See [Accessibility](https://sdk.play.date/#_accessibility) in *Inside Playdate*.

## Sound

Playdate is not a beep-chip. It plays compressed or uncompressed audio at **44,100 Hz**.

- Test on the **device speaker** and with **headphones**. The tiny speaker drops bass and can make peaks sound noisy.
- **Normalize** sample loudness. Match other Playdate games and system sounds at the same system volume. Do not ship a game that is much quieter or louder than the system.

### Sound accessibility

Players are often in noisy or quiet places, or cannot hear well.

- Subtitles for dialogue.
- On-screen blips / visual feedback for SFX.
- If audio is required, say so on the start screen (un-silence the device or use headphones).

## Input

### Crank

Map crank travel to feel: large ratios feel athletic, small ratios feel precise. Tune on hardware.

**Crank + one button:** prefer **B**, not A. Right-handed crank + left-thumb B is comfortable. Crank + A is a long reach.

If the d-pad is unused for movement, its directions can be extra action buttons (more comfortable than A while cranking, including for left-handed / Upside Down play).

**Crank accessibility:** provide **d-pad alternatives** whenever possible (left/right or up/down as forward/back crank).

If the game is crank-operated, show [`playdate.ui.crankIndicator`](https://sdk.play.date/#C-ui.crankIndicator) when the crank is docked. New players will not assume every game uses the crank.

### Buttons

| Context | A | B |
| --- | --- | --- |
| Menus / system-like UI | Confirm / activate | Cancel / close / back |
| Gameplay | Whatever fits | Whatever fits |

When documenting controls, draw **A** and **B** in circles, as on the hardware.

**Button accessibility:** if the game only needs one or two actions, bind them to **multiple inputs** (A, B, d-pad, crank) so players can pick what is comfortable.

### Accelerometer

3-axis accelerometer. **Not a gyro.** Flat-on-table twist reports no change.

Good for tilt, shake, and lean. Offer **calibration** so “zero” can be a player lying down, not a desk.

Inspect values with Settings → System → **Input Test**.

## UI

Playdate has almost no system chrome (Setup, Home, Menu, Settings). Games should look like themselves. The SDK has few widgets; build custom UI. [`playdate.ui.gridview`](https://sdk.play.date/#C-ui.gridview) is the main helper.

- [`playdate.keyboard.show`](https://sdk.play.date/#M-keyboard) is for **short** input (names). Lots of typing is not fun on this device; a custom keyboard may be better for constrained alphabets.
- Short memorable URLs can be shown as text. Long or generated URLs should use [`playdate.graphics.generateQRCode`](https://sdk.play.date/#_qrcode) **and** the URL string (not everyone can scan).

## Launcher and system menu

`pdxinfo` is visible in Settings → Games (name, version). Keep it accurate. See [System and Game Metadata](https://sdk.play.date/#pdxinfo).

- **Launcher card:** first impression. The system does **not** draw the game name — put the title **in the card art**.
- Cards can animate on select, on A-to-launch, and while loading. Chain them for a continuous transition, or cut deliberately.
- **Wrapping paper:** customize the download-present pattern to hint at the game.
- **System Menu** items: options that do not belong on the playfield (music, font size, inventory, map, restart). Space is tight — collapse several choices into one row if needed. Teach players that custom items live in the Menu.
- **Menu image** (`playdate.setMenuImage`): the paused-game panel left of the System Menu. Can be generated from live game state.

## Performance

Optimize for **hardware**, not the Simulator. The Simulator is faster and has different performance shapes.

- Do not redraw more than you must. Enable Simulator **Highlight Screen Updates**. Constant full-screen orange means you are wasting CPU and battery.
- Prefer the **sprite system**: unchanged sprites are not repainted.
- Without sprites, dirty-rect only. Huge win for non-action games.
- Smooth frame time and low battery use are the same problem: less drawing, less work.

## Simulator vs device

| | Simulator | Hardware |
| --- | --- | --- |
| Speed | Often much faster | The real budget |
| On-screen size | Usually larger than 400×240 at 173 ppi | Pocket screen — judge type/sprites here |
| Contrast | Optional gray approximation | Reflective, environment-dependent |

Never sign off legibility, motion, crank feel, or audio from the Simulator alone.
