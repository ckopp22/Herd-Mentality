# Herd Mentality - Web App MDD

2026-09-20 · @Someone

A cow-themed, single-page HTML/CSS/JavaScript party game (in the spirit of "Herd Mentality") where players shout out answers to a prompt and score Cow Coins for matching the majority. Built by Claude Code, installable as a PWA, and deployed via a GitHub repo with GitHub Pages.

## 1. Overview & Objective

**Working title:** Herd Mentality (Web)

**Elevator pitch:** A cow-themed party game for one group sharing a single device. A prompt appears (e.g. "Best topping on pancakes"), everyone counts down together, then shouts their answer out loud at once. The host taps to award Cow Coins to every player whose answer matched the majority ("the herd") — because in this game, thinking like everyone else is how you win. First player to 20 Cow Coins wins, or the host can end the game anytime for a final scorecard.

**Primary objective:** Ship a single, self-contained web app (HTML/CSS/JS, no backend, no build tooling) that Claude Code builds, commits to a new GitHub repo, and deploys via GitHub Pages. The app must also be installable as a PWA so it works like a native app on a phone passed around the group.

**Target platform:** Mobile-first responsive web, played mostly on one shared phone/tablet; also usable on desktop/laptop browsers.

**Out of scope for v1:** accounts, networked multiplayer (separate devices), backend/database, native app store builds.

## 2. Core Gameplay Loop

1. **Main Menu** — PLAY, How to Play, and a Sound On/Off toggle (persists between sessions).
2. **Player Setup** — Host picks number of players, 1–8, via a stepper or tappable number grid. Each player can optionally be given a name (default "Player 1", "Player 2", etc. if skipped). "Start Game" begins the round.
3. **Play Screen (repeats each round):**

- A prompt is shown center-screen (e.g. "Best topping on pancakes").
- A countdown plays (visual + optional sound), giving everyone a moment to think.
- At "0", all players shout their answer out loud simultaneously (this happens off-screen/verbally — the app doesn't capture audio).
- The host taps each player who answered with the majority/matching answer to award them a Cow Coin; the host can award 0, some, or all players depending on how the group's answers split.
- Once coins are awarded, the host taps the center of the screen to reveal the next prompt.
- This repeats indefinitely, round after round.

4. **End conditions:**

- **Automatic:** the moment any player's coin total reaches 20, the game ends immediately and shows the scorecard.
- **Manual:** the host can tap "End Game" at any point to end early and show the scorecard with current standings.

5. **Scorecard** — Final standings for all players sorted by Cow Coins, winner highlighted, with "Play Again" (same players) and "Back to Menu" options.

The two core host interactions — awarding a coin to a player and advancing to the next prompt — should each take a single tap, since this is played live and the group is waiting on the host between rounds.

## 3. Prompts & Content

**Prompt style:** Short, open-ended questions with answers that a group is likely to cluster on — the whole game hinges on there usually being a clear majority answer.

**Example prompts (seed list, expand at launch):**

- Best topping on pancakes
- Where to go on a first date
- Name a movie trilogy
- Wild animal you would pet
- Musical instrument you can fit in your pocket
- Favorite season
- Best hot drink
- A food that's overrated
- Best superhero
- A country you'd love to visit
- Best pizza topping
- Something everyone should own

Launch target is roughly 75–100 prompts so a long game session (up to 20 coins per player) doesn't repeat within one sitting. Prompts should avoid anything divisive, offensive, or NSFW — this is meant to be a lighthearted party game for mixed groups.

**Cow theme:** The scoring currency is called "Cow Coins," visual language leans on cow spots/pasture colors (black, white, soft green/brown), and copy can lean into herd/cow puns ("Moove to the next prompt," "Don't be a black sheep — er, cow") without overdoing it.

## 4. Screens & UI

**A. Main Menu**

- Cow-themed title/logo, "PLAY" (primary button), "How to Play" (secondary), and a sound on/off icon toggle in a corner.

**B. How to Play**

- Short rules explanation (prompt → countdown → shout → majority wins coins → first to 20 or host ends), "Back" button.

**C. Player Setup**

- Number stepper or 1–8 tappable grid for player count, optional name field per player, "Start Game" button.

**D. Play Screen (core screen)**

- Large prompt text, centered.
- Countdown indicator (numeric and/or circular progress ring) that plays automatically after the prompt loads, with an optional sound cue on each tick and on "go."
- Below the prompt: a row/grid of player chips (name + running Cow Coin count); tapping a chip awards that player one coin for the current round (tap again to undo if the host misclicks).
- A clear "tap here for next prompt" affordance in the remaining center space, separate from the player chips so host doesn't accidentally advance while awarding coins.
- "End Game" button always visible (e.g. top corner).
- Subtle visual/sound feedback when a coin is awarded and when the game ends by reaching 20.

**E. Scorecard**

- All players ranked by final Cow Coin count, winner visually highlighted (e.g. trophy or cow-crown icon), "Play Again" (same players) and "Back to Menu" buttons.

Layout must work in portrait and landscape, and the player chip row must stay tappable and legible with up to 8 players on a phone screen (wrap to two rows rather than shrinking below a comfortable tap target).

## 5. Technical Architecture

- **Stack:** Plain HTML5 + CSS3 + vanilla JavaScript. No framework, no bundler, no npm build step — deployable files are the built files.
- **Rendering:** Single-page app with JS-driven screen switching (show/hide `<section>`s or a small state machine) — no reload flicker mid-game.
- **State management:** In-memory JS object holds current screen, player list + coin counts, remaining/shuffled prompt queue, sound-on/off setting, and countdown state. No backend, no database.
- **Persistence:** `localStorage` remembers the sound on/off preference between sessions (required, since it's an explicit menu toggle); optionally remembers last-used player names/count as a nice-to-have.
- **Sound handling:** A handful of short sound effects (countdown tick, "go," coin awarded, game won) played via the `<audio>` element or Web Audio API, all gated by the sound toggle; audio files kept small and cached by the service worker for offline play.
- **PWA support (v1 requirement):**
- `manifest.json` (name, short\_name, icons at 192px/512px, `start_url`, `display: standalone`, cow-themed color scheme) so it's installable to a home screen.
- A service worker (`service-worker.js`) registered from `index.html` that caches the app shell (HTML/CSS/JS/prompts data/sounds/icons) on install and serves from cache first, so the game works offline once installed/visited.
- Must pass basic installability checks (served over HTTPS — GitHub Pages provides this — valid manifest, registered service worker) so browsers show an install/"Add to Home Screen" prompt.
- **Responsiveness:** CSS flexbox/grid, relative units, touch-friendly hit targets (min \~48px, larger for the coin-award chips since they're tapped repeatedly and quickly). Must support touch and mouse.
- **Browser support target:** Latest 2 versions of Chrome, Safari (iOS), Firefox, Edge.

## 6. Data Model

**Prompts** live in a single data file, separate from game logic, so the prompt bank can grow without touching code:

```json
{
 "prompts": [
 "Best topping on pancakes",
 "Where to go on a first date",
 "Name a movie trilogy",
 "Wild animal you would pet",
 "Musical instrument you can fit in your pocket",
 "Favorite season",
 "Best hot drink"
 ]
}
```

**Runtime player state** (in-memory, not in the data file):

```json
{
 "players": [
 {"id": "p1", "name": "Alex", "coins": 0},
 {"id": "p2", "name": "Sam", "coins": 0}
 ],
 "winTarget": 20,
 "soundOn": true
}
```

**Rules encoded in data, not code:** the prompt list. Adding, removing, or editing prompts is a content edit only. Player count (1–8) and per-round scoring are game logic, not data, since they're core mechanics rather than content.

## 7. File Structure & Repo Layout

```
herd-mentality/
├── index.html # markup + screen containers, registers the service worker
├── style.css # cow-themed styling, responsive rules
├── script.js # game logic, state machine, tap handlers, countdown
├── manifest.json # PWA manifest (name, icons, start_url, display: standalone)
├── service-worker.js # caches the app shell for offline/installed use
├── data/
│ └── prompts.js # exports the prompts array (see Data Model)
├── sounds/
│ ├── tick.mp3
│ ├── go.mp3
│ ├── coin.mp3
│ └── win.mp3
├── icons/
│ ├── icon-192.png
│ └── icon-512.png
└── README.md # how to run locally + how to add prompts
```

Plain relative paths only so the same files work identically opened locally as `file://index.html` or served from the repo's Pages URL. Prompts, logic, and styling stay in separate files so growing the prompt bank never touches game code.

## 8. Deployment

1. **Create the repo:** A new GitHub repository (e.g. `herd-mentality`) is created for this project, public so GitHub Pages can serve it for free.
2. **Build:** Claude Code writes `index.html`, `style.css`, `script.js`, `manifest.json`, `service-worker.js`, `data/prompts.js`, sound files, and icons directly per the File Structure section — no compilation step.
3. **Commit:** Files are committed and pushed to the repo (e.g. `git init`, `git add .`, `git commit -m "..."`, `git remote add origin ...`, `git push`).
4. **Enable Pages:** GitHub Pages is turned on for the repo (serving from `main` branch root, or a `/docs` folder), which gives a public URL like `https://<username>.github.io/herd-mentality/`.
5. **Update flow going forward:** Any future change (new prompts, tweaked scoring, UI/theme tweaks) is a normal commit + push to the same repo; the live Pages site picks it up automatically, near-instantly.
6. **PWA requirement:** GitHub Pages serves over HTTPS automatically, which is required for the service worker and install prompt to work — no extra config needed.
7. **No environment variables or secrets** are needed since there's no backend or API calls.

## 9. Acceptance Criteria

- [ ] App is live at a public GitHub Pages URL and loads on mobile and desktop browsers, no login.
- [ ] App is installable as a PWA (manifest + service worker pass installability checks; install prompt appears).
- [ ] Installed app's shell still loads when offline.
- [ ] Main menu shows PLAY, How to Play, and a sound on/off toggle that persists between sessions.
- [ ] Player setup accepts 1–8 players, with optional per-player names.
- [ ] Play screen shows a prompt, runs a countdown, and reveals a tappable player list for awarding coins.
- [ ] Tapping a player chip awards them one Cow Coin for the current round and can be un-tapped to correct a misclick.
- [ ] Tapping the designated center area advances to a new, non-repeating prompt (until the pool is exhausted, then reshuffles).
- [ ] Game auto-ends and shows the scorecard the instant any player reaches 20 coins.
- [ ] "End Game" button ends the game early at any time and shows the scorecard with current standings.
- [ ] Scorecard ranks all players by final coin count with the winner clearly highlighted.
- [ ] Adding a new prompt requires only editing `data/prompts.js`, no other file changes.
- [ ] Sound effects respect the sound on/off toggle.
- [ ] Works over touch and mouse input; layout holds up in portrait and landscape with up to 8 players.

## 10. Future Enhancements (Out of Scope for v1)

- Custom/user-submitted prompts, or themed prompt packs (family-friendly, adult party, holiday).
- Haptic buzz on coin award and game win, in addition to sound.
- Persistent multi-game leaderboard across sessions.
- Adjustable win target (currently fixed at 20) as a settings option.
- Light/dark theme toggle alongside the cow theme.
- Shareable final scorecard image via native share sheet.
- A "random majority reveal" animation for extra flair when coins are awarded.
