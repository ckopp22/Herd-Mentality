/* Herd Mentality — game logic. Vanilla JS, no build step. */
(function () {
  'use strict';

  var WIN_TARGET = 20;
  var MIN_PLAYERS = 1;
  var MAX_PLAYERS = 8;
  var COUNTDOWN_SECONDS = 3;
  var RING_LENGTH = 276.46; // 2 * PI * r (r = 44), matches style.css
  var LS_SOUND = 'herd.soundOn';
  var LS_SETUP = 'herd.setup';

  var state = {
    screen: 'menu',
    players: [],          // [{ id, name, coins }]
    winTarget: WIN_TARGET,
    soundOn: true,
    promptQueue: [],
    lastPrompt: null,
    currentPrompt: '',
    round: 0,
    roundAwards: new Set(), // player ids awarded a coin this round
    countdownReady: false,
    timer: null
  };

  var setup = { count: 4, names: [] };

  var $ = function (id) { return document.getElementById(id); };
  var els = {
    screens: document.querySelectorAll('.screen'),
    soundToggle: $('sound-toggle'),
    countGrid: $('count-grid'),
    nameFields: $('name-fields'),
    roundBadge: $('round-badge'),
    promptText: $('prompt-text'),
    countdown: $('countdown'),
    countdownNum: $('countdown-num'),
    ring: $('ring'),
    chips: $('player-chips'),
    scoreHeading: $('score-heading'),
    scoreList: $('score-list')
  };

  /* ---------- Storage (may be unavailable, so always guarded) ---------- */
  function store(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
  }
  function load(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  /* ---------- Audio (synthesized with Web Audio, gated by soundOn) ---------- */
  var audioCtx = null;

  function ensureAudio() {
    if (audioCtx || !(window.AudioContext || window.webkitAudioContext)) {
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      return;
    }
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { audioCtx = null; }
  }

  function tone(freq, start, dur, type, gain) {
    if (!state.soundOn || !audioCtx) return;
    var t0 = audioCtx.currentTime + start;
    var osc = audioCtx.createOscillator();
    var amp = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(gain || 0.25, t0 + 0.01);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp);
    amp.connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  var sfx = {
    tick: function () { tone(660, 0, 0.12, 'square', 0.12); },
    go: function () {
      // a low, moo-ish slide
      if (!state.soundOn || !audioCtx) return;
      var t0 = audioCtx.currentTime;
      var osc = audioCtx.createOscillator();
      var amp = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t0);
      osc.frequency.linearRampToValueAtTime(130, t0 + 0.55);
      amp.gain.setValueAtTime(0.0001, t0);
      amp.gain.exponentialRampToValueAtTime(0.22, t0 + 0.08);
      amp.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);
      osc.connect(amp);
      amp.connect(audioCtx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.65);
    },
    coin: function () {
      tone(988, 0, 0.09, 'triangle', 0.25);
      tone(1319, 0.08, 0.18, 'triangle', 0.25);
    },
    undo: function () { tone(330, 0, 0.12, 'triangle', 0.18); },
    win: function () {
      [523, 659, 784, 1047].forEach(function (f, i) {
        tone(f, i * 0.13, 0.25, 'triangle', 0.28);
      });
    }
  };

  function play(name) {
    if (state.soundOn && sfx[name]) sfx[name]();
  }

  /* ---------- Screens ---------- */
  function showScreen(name) {
    state.screen = name;
    Array.prototype.forEach.call(els.screens, function (s) {
      s.hidden = s.getAttribute('data-screen') !== name;
    });
  }

  /* ---------- Sound toggle ---------- */
  function renderSound() {
    els.soundToggle.textContent = state.soundOn ? '🔊' : '🔇';
    els.soundToggle.setAttribute('aria-pressed', String(state.soundOn));
    els.soundToggle.setAttribute('aria-label', state.soundOn ? 'Sound on' : 'Sound off');
    els.soundToggle.classList.toggle('off', !state.soundOn);
  }

  function toggleSound() {
    state.soundOn = !state.soundOn;
    store(LS_SOUND, state.soundOn ? '1' : '0');
    renderSound();
    if (state.soundOn) { ensureAudio(); play('coin'); }
  }

  /* ---------- Setup screen ---------- */
  function readNamesFromInputs() {
    var inputs = els.nameFields.querySelectorAll('input');
    Array.prototype.forEach.call(inputs, function (input, i) {
      setup.names[i] = input.value;
    });
  }

  function renderSetup() {
    els.countGrid.innerHTML = '';
    for (var n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'count-btn';
      b.textContent = n;
      b.dataset.count = n;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(n === setup.count));
      els.countGrid.appendChild(b);
    }
    els.nameFields.innerHTML = '';
    for (var i = 0; i < setup.count; i++) {
      var input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 14;
      input.placeholder = 'Player ' + (i + 1);
      input.value = setup.names[i] || '';
      input.setAttribute('aria-label', 'Name for player ' + (i + 1));
      input.autocomplete = 'off';
      els.nameFields.appendChild(input);
    }
  }

  function loadSetup() {
    var raw = load(LS_SETUP);
    if (!raw) return;
    try {
      var saved = JSON.parse(raw);
      var c = parseInt(saved.count, 10);
      if (c >= MIN_PLAYERS && c <= MAX_PLAYERS) setup.count = c;
      if (Array.isArray(saved.names)) setup.names = saved.names.slice(0, MAX_PLAYERS).map(String);
    } catch (e) { /* ignore bad data */ }
  }

  function goToSetup() {
    renderSetup();
    showScreen('setup');
  }

  /* ---------- Prompts ---------- */
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function refillQueue() {
    var all = (window.PROMPTS && window.PROMPTS.length) ? window.PROMPTS : ['Best topping on pancakes'];
    state.promptQueue = shuffle(all);
    // don't show the same prompt twice in a row across the reshuffle boundary
    var last = state.promptQueue.length - 1;
    if (last > 0 && state.promptQueue[last] === state.lastPrompt) {
      var swap = Math.floor(Math.random() * last);
      var t = state.promptQueue[last];
      state.promptQueue[last] = state.promptQueue[swap];
      state.promptQueue[swap] = t;
    }
  }

  function nextPrompt() {
    if (!state.promptQueue.length) refillQueue();
    state.lastPrompt = state.promptQueue.pop(); // queue is consumed from the end
    return state.lastPrompt;
  }

  /* ---------- Play screen ---------- */
  function clearTimer() {
    if (state.timer) { clearTimeout(state.timer); state.timer = null; }
  }

  function setChipsEnabled(enabled) {
    Array.prototype.forEach.call(els.chips.querySelectorAll('.chip'), function (c) {
      c.disabled = !enabled;
    });
  }

  function renderChips() {
    els.chips.innerHTML = '';
    state.players.forEach(function (p) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.dataset.id = p.id;
      var name = document.createElement('span');
      name.className = 'chip-name';
      name.textContent = p.name;
      var coins = document.createElement('span');
      coins.className = 'chip-coins';
      chip.appendChild(name);
      chip.appendChild(coins);
      els.chips.appendChild(chip);
    });
    updateChips();
  }

  function updateChips() {
    Array.prototype.forEach.call(els.chips.querySelectorAll('.chip'), function (chip) {
      var p = findPlayer(chip.dataset.id);
      if (!p) return;
      chip.querySelector('.chip-coins').textContent = '🪙 ' + p.coins;
      chip.classList.toggle('awarded', state.roundAwards.has(p.id));
      chip.setAttribute('aria-pressed', String(state.roundAwards.has(p.id)));
      chip.setAttribute('aria-label', p.name + ', ' + p.coins + ' Cow Coins');
    });
  }

  function findPlayer(id) {
    for (var i = 0; i < state.players.length; i++) {
      if (state.players[i].id === id) return state.players[i];
    }
    return null;
  }

  function startCountdown() {
    clearTimer();
    state.countdownReady = false;
    setChipsEnabled(false);
    els.countdown.classList.remove('done');

    // reset the ring to full, then let it drain across the whole countdown
    els.ring.style.transition = 'none';
    els.ring.style.strokeDashoffset = '0';
    void els.ring.getBoundingClientRect(); // force reflow so the reset sticks
    els.ring.style.transition = 'stroke-dashoffset ' + COUNTDOWN_SECONDS + 's linear';
    els.ring.style.strokeDashoffset = String(RING_LENGTH);

    var remaining = COUNTDOWN_SECONDS;
    els.countdownNum.textContent = remaining;
    play('tick');

    function step() {
      remaining -= 1;
      if (remaining > 0) {
        els.countdownNum.textContent = remaining;
        play('tick');
        state.timer = setTimeout(step, 1000);
      } else {
        finishCountdown();
      }
    }
    state.timer = setTimeout(step, 1000);
  }

  function finishCountdown() {
    state.timer = null;
    state.countdownReady = true;
    els.ring.style.transition = 'none';
    els.ring.style.strokeDashoffset = '0';
    els.countdown.classList.add('done');
    els.countdownNum.textContent = 'MOO!';
    play('go');
    setChipsEnabled(true);
  }

  function loadRound() {
    state.round += 1;
    state.roundAwards = new Set();
    state.currentPrompt = nextPrompt();
    els.roundBadge.textContent = 'Round ' + state.round;
    els.promptText.textContent = state.currentPrompt;
    updateChips();
    startCountdown();
  }

  function startGame(players) {
    clearTimer();
    state.players = players;
    state.round = 0;
    state.lastPrompt = null;
    state.promptQueue = [];
    renderChips();
    showScreen('play');
    loadRound();
  }

  function toggleAward(id) {
    if (!state.countdownReady) return;
    var p = findPlayer(id);
    if (!p) return;
    if (state.roundAwards.has(id)) {
      state.roundAwards.delete(id);
      p.coins = Math.max(0, p.coins - 1);
      play('undo');
    } else {
      state.roundAwards.add(id);
      p.coins += 1;
      play('coin');
    }
    updateChips();
    var chip = els.chips.querySelector('.chip[data-id="' + id + '"]');
    if (chip && state.roundAwards.has(id)) {
      chip.classList.remove('pop');
      void chip.offsetWidth;
      chip.classList.add('pop');
    }
    if (p.coins >= state.winTarget) endGame(true);
  }

  /* ---------- Scorecard ---------- */
  function endGame(reachedTarget) {
    clearTimer();
    renderScorecard();
    showScreen('score');
    if (reachedTarget) play('win');
  }

  function renderScorecard() {
    var sorted = state.players.slice().sort(function (a, b) { return b.coins - a.coins; });
    var top = sorted.length ? sorted[0].coins : 0;
    var winners = top > 0 ? sorted.filter(function (p) { return p.coins === top; }) : [];

    if (winners.length === 1) els.scoreHeading.textContent = winners[0].name + ' wins!';
    else if (winners.length > 1) els.scoreHeading.textContent = "It's a herd tie!";
    else els.scoreHeading.textContent = 'Final Scorecard';

    els.scoreList.innerHTML = '';
    var rank = 0;
    sorted.forEach(function (p, i) {
      if (i === 0 || p.coins !== sorted[i - 1].coins) rank = i + 1; // ties share a rank
      var li = document.createElement('li');
      li.className = 'score-row' + (winners.indexOf(p) !== -1 ? ' winner' : '');
      var r = document.createElement('span');
      r.className = 'rank';
      r.textContent = winners.indexOf(p) !== -1 ? '👑' : rank;
      var n = document.createElement('span');
      n.className = 'name';
      n.textContent = p.name;
      var c = document.createElement('span');
      c.className = 'coins';
      c.textContent = '🪙 ' + p.coins;
      li.appendChild(r);
      li.appendChild(n);
      li.appendChild(c);
      els.scoreList.appendChild(li);
    });
  }

  /* ---------- Wiring ---------- */
  function buildPlayersFromSetup() {
    readNamesFromInputs();
    var players = [];
    for (var i = 0; i < setup.count; i++) {
      var name = (setup.names[i] || '').trim();
      players.push({ id: 'p' + (i + 1), name: name || 'Player ' + (i + 1), coins: 0 });
    }
    store(LS_SETUP, JSON.stringify({ count: setup.count, names: setup.names.slice(0, setup.count) }));
    return players;
  }

  function on(id, fn) { $(id).addEventListener('click', fn); }

  on('btn-play', function () { ensureAudio(); goToSetup(); });
  on('btn-howto', function () { showScreen('howto'); });
  on('btn-howto-back', function () { showScreen('menu'); });
  on('btn-setup-back', function () { readNamesFromInputs(); showScreen('menu'); });
  on('btn-start', function () { ensureAudio(); startGame(buildPlayersFromSetup()); });
  on('sound-toggle', toggleSound);
  on('btn-next', function () { ensureAudio(); loadRound(); });
  on('btn-end', function () { endGame(false); });
  on('btn-menu', function () { showScreen('menu'); });
  on('btn-again', function () {
    ensureAudio();
    startGame(state.players.map(function (p) { return { id: p.id, name: p.name, coins: 0 }; }));
  });

  els.countGrid.addEventListener('click', function (e) {
    var btn = e.target.closest('.count-btn');
    if (!btn) return;
    readNamesFromInputs();
    setup.count = parseInt(btn.dataset.count, 10);
    renderSetup();
  });

  els.chips.addEventListener('click', function (e) {
    var chip = e.target.closest('.chip');
    if (chip) toggleAward(chip.dataset.id);
  });

  /* ---------- Init ---------- */
  state.soundOn = load(LS_SOUND) !== '0';
  loadSetup();
  renderSound();
  showScreen('menu');
})();
