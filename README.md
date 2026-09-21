# 🐄 Herd Mentality (Web)

A cow-themed party game for one group sharing one device. A prompt appears (“Best topping on pancakes”), everyone counts down together, then shouts an answer at once. The host taps every player who matched the majority (“the herd”) to award a **Cow Coin**. First to **20** wins, or the host ends the game any time.

Plain HTML/CSS/JavaScript. No build step, no backend, no accounts. Installable as a PWA and playable offline.

## Play locally

Open `index.html` directly in a browser (`file://` works), or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

The service worker and install prompt only work over `http://localhost` or HTTPS, so use the local server (or the deployed site) to test the PWA parts.

## How to play

1. Tap **PLAY**, choose 1-8 players, and optionally enter names.
2. A prompt appears and a 3-2-1 countdown runs.
3. At “MOO!”, everyone shouts their answer out loud.
4. The host taps each player who matched the majority to give them a Cow Coin. Tap again to undo a misclick.
5. Tap the big **next prompt** area to move on.
6. The game ends automatically when someone reaches 20 Cow Coins, or tap **End Game** for the scorecard.

## Add or edit prompts

Edit the array in [`data/prompts.js`](data/prompts.js). One line per prompt, nothing else to change:

```js
window.PROMPTS = [
  "Best topping on pancakes",
  "Your new prompt here"
];
```

Keep prompts short, lighthearted, and likely to produce a clear majority answer.

After changing any file, **bump `CACHE_VERSION` in `service-worker.js`** (for example `v1` to `v2`) so installed copies pick up the update.

## Project layout

```
index.html          markup + screens, registers the service worker
style.css           cow-themed, responsive styles
script.js           game logic and sound effects
data/prompts.js     the prompt bank
manifest.json       PWA manifest
service-worker.js   offline cache of the app shell
icons/              PWA icons
tools/make_icons.py regenerates the icons (needs Pillow)
```

Sound effects are synthesized with the Web Audio API, so there are no audio files to load. The sound on/off toggle is remembered between sessions.

## Deploy with GitHub Pages

1. Create a new **public** GitHub repository, e.g. `herd-mentality`.
2. From this folder:
   ```bash
   git init -b main
   git add .
   git commit -m "Herd Mentality web app"
   git remote add origin https://github.com/<your-username>/herd-mentality.git
   git push -u origin main
   ```
3. In the repo, go to **Settings → Pages**, set **Source** to “Deploy from a branch”, branch `main`, folder `/ (root)`.
4. After a minute the game is live at `https://<your-username>.github.io/herd-mentality/`.

Future changes are a normal commit and push; Pages redeploys automatically. Pages serves HTTPS, which the service worker and install prompt require.

## Install as an app

Open the deployed site on your phone and use **Add to Home Screen** (iOS Safari: Share menu; Android Chrome: install prompt or menu). Once visited, it loads offline.

## Requirements source

See `Herd Mentality - Web App MDD.md` for the full spec and acceptance criteria.
