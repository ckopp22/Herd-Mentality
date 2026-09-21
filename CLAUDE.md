# CLAUDE.md

Herd Mentality (Web): a cow-themed, single-device party game. Players shout answers to a prompt; the host taps everyone who matched the majority to award Cow Coins. First to 20 wins, or the host ends the game. Installable PWA, deployed on GitHub Pages.

Source of truth for requirements: `Herd Mentality - Web App MDD.md` (acceptance criteria in section 9).

## Hard rules
- **No framework, no bundler, no npm, no build step.** The files in the repo are the deployed files. Plain HTML5 + CSS3 + vanilla JS.
- **Relative paths only.** The game must work opened as `file://.../index.html` and from a GitHub Pages subpath (`/<repo>/`). Never use root-absolute URLs like `/style.css`.
- **No ES modules.** They are blocked on `file://`. Scripts are plain `<script>` tags; the prompt bank is the global `window.PROMPTS`.
- **No backend, no secrets, no env vars.** State is in memory; only the sound preference (and last setup) use `localStorage`, always wrapped in try/catch.
- Out of scope for v1: accounts, networked multiplayer, backend, native builds (see MDD sections 1 and 10).

## File map
- `index.html`: five `<section class="screen" data-screen="...">` (menu, howto, setup, play, score); registers the service worker only over http(s).
- `style.css`: cow theme via CSS variables at the top of the file; portrait + short-landscape layouts.
- `script.js`: one IIFE. `state` object, `showScreen()`, prompt queue (shuffle, consume, reshuffle), countdown, award/undo, scorecard, synthesized sound effects.
- `data/prompts.js`: `window.PROMPTS = [...]`. Adding a prompt is a one-line edit here and nothing else.
- `manifest.json`, `service-worker.js`: PWA. Icons in `icons/`.
- `tools/make_icons.py`: regenerates the icons (needs Pillow). Not used at runtime.

## Conventions
- **Bump `CACHE_VERSION` in `service-worker.js`** whenever any cached file changes (including `data/prompts.js`), and add any new shell file to `APP_SHELL`. Otherwise installed copies keep serving the old version.
- **Sound:** effects are synthesized with the Web Audio API (no audio files). Every sound goes through `play(name)` / `tone()`, which check `state.soundOn`. The `AudioContext` is created on a user gesture (iOS requirement).
- **Tap targets:** at least 48px (`--tap`); player chips are larger because they are tapped repeatedly. With 8 players the chips must stay in two rows (4 columns), not shrink.
- **The two host actions are single taps:** awarding a coin (tap a chip; tap again to undo) and next prompt (the big dashed zone, kept visually separate from the chips so awarding never advances).
- Game ends the instant any player reaches `winTarget` (20), inside `toggleAward()`.
- Prompts: short, open-ended, lighthearted, no divisive/offensive/NSFW content. Target 75-100 with no duplicates.
- Match the existing style: 2-space indent, `var`/function style in `script.js` (ES5-compatible), textContent instead of innerHTML for user-entered names.

## Run and test
- Serve: `python3 -m http.server 8000`, then open http://localhost:8000 (needed to test the service worker and manifest; `localhost` counts as secure).
- Also check `file://` still plays the game.
- Prompt sanity check: `node`-free, e.g. `python3 -c "import re;s=open('data/prompts.js').read();p=re.findall(r'^\s+\"(.+)\",?$',s,re.M);print(len(p),len(set(p)))"` should print equal numbers in the 75-100 range.

## Deploy
Push to `main`; GitHub Pages serves the repo root (see README). Do not push or create remote repos without the user asking.
