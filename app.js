(() => {
  const $ = s => document.querySelector(s);
  const store = {
    get(k, d) { try { const v = localStorage.getItem('pawcade:' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('pawcade:' + k, JSON.stringify(v)); } catch {} }
  };
  let cleanup = null, cur = null, ac, muted = store.get('mute', false), activeTag = 'all';

  // Game manifest: metadata only, scripts loaded lazily on first open
  const MANIFEST = [
    { id: 'snake',      src: 'games/snake.js',      title: 'Cat Snake',       emoji: '🐟', tags: 'classic arcade reflex',                               blurb: 'Eat fish, grow longer, never bite your own tail.' },
    { id: 'whack',      src: 'games/whack.js',      title: 'Whack-a-Mouse',   emoji: '🐭', tags: 'reflex clicking multiplayer',                          blurb: 'Tap the mice, not the cats. You have 30 seconds.' },
    { id: 'meowmory',   src: 'games/memory.js',     title: 'Meowmory',        emoji: '😺', tags: 'memory puzzle cards multiplayer',                      blurb: 'Find all eight cat pairs. Play solo or challenge a friend.' },
    { id: 'cat2048',    src: 'games/g2048.js',      title: 'Cat 2048',        emoji: '🧶', tags: 'puzzle numbers',                                       blurb: 'Slide and merge the tiles to reach 2048.' },
    { id: 'wordcat',    src: 'games/wordcat.js',    title: 'Wordcat',         emoji: '🔤', tags: 'word puzzle',                                          blurb: 'Guess the five-letter word in six tries.' },
    { id: 'zen',        src: 'games/zen.js',        title: 'Zen Cat',         emoji: '😽', tags: 'relax sound calm chill',                               blurb: 'No goal. Pet the cat and listen to it purr.' },
    { id: 'flappy',     src: 'games/flappy.js',     title: 'Flappy Cat',      emoji: '🐈', tags: 'arcade reflex one-button',                             blurb: 'Tap or press Space to flap. Squeeze between the scratching posts.' },
    { id: 'fish',       src: 'games/fish.js',       title: 'Fish Catcher',    emoji: '🧺', tags: 'arcade reflex catch',                                  blurb: 'Catch the falling fish. Dodge the boots and do not miss three.' },
    { id: 'pong',       src: 'games/pong.js',       title: 'Paddle Pounce',   emoji: '🏓', tags: 'arcade classic pong',                                  blurb: 'Pong against the computer. You lose after three misses.' },
    { id: 'breakout',   src: 'games/breakout.js',   title: 'Cat Breakout',    emoji: '🧱', tags: 'arcade classic paddle ball',                           blurb: 'Bounce the ball to smash all the fish bricks. Three lives.' },
    { id: 'dash',       src: 'games/dash.js',       title: 'Cat Dash',        emoji: '🏃', tags: 'endless runner jump reflex arcade',                    blurb: 'Jump over dogs and yarn. Collect coins. How far can you run?' },
    { id: 'simon',      src: 'games/simon.js',      title: 'Simon Paws',      emoji: '🐾', tags: 'memory sequence pattern multiplayer two-player',       blurb: 'Repeat the growing paw pattern. Solo or challenge a friend.' },
    { id: 'asteroids',  src: 'games/asteroids.js',  title: 'Asteroid Cat',    emoji: '🚀', tags: 'arcade shooter space action',                          blurb: 'Rotate and shoot. Blast asteroids before they hit your cat ship.' },
    { id: 'typing',     src: 'games/typing.js',     title: 'Typing Cat',      emoji: '⌨️', tags: 'typing words speed reflex multiplayer',                blurb: 'Type the falling cat words before they hit the floor. Three misses.' },
    { id: 'slide',      src: 'games/slide.js',      title: 'Slide Paws',      emoji: '🔢', tags: 'puzzle sliding brain',                                 blurb: 'Slide the cat tiles into order. Fewer moves = better score.' },
    { id: 'pong2p',     src: 'games/pong2p.js',     title: 'Pong 2 Players',  emoji: '🏓', tags: 'arcade classic multiplayer two-player',                blurb: 'Local 2-player Pong. W/S vs arrows. First to 7 wins!' },
    { id: 'yarnduel',   src: 'games/yarnduel.js',   title: 'Yarn Duel',       emoji: '🧶', tags: 'arcade multiplayer two-player fighting',               blurb: 'Two cats, one screen. Throw yarn balls at each other. 3 hits wins!' },
    { id: 'stack',      src: 'games/stack.js',      title: 'Cat Stack',       emoji: '📦', tags: 'arcade reflex one-button',                             blurb: 'Stack cat boxes as high as you can! Tap to drop each layer.' },
    { id: 'darts',      src: 'games/darts.js',      title: 'Cat Darts',       emoji: '🎯', tags: 'arcade reflex clicking multiplayer',                   blurb: 'Hit the cat dartboard! Play solo or challenge a friend.' },
    { id: 'tugofwar',   src: 'games/tugofwar.js',   title: 'Tug of War',      emoji: '🐈', tags: 'arcade multiplayer two-player reflex',                 blurb: 'Two cats fight over a fish! Mash your key or tap your side to pull!' },
    { id: 'seabattle',  src: 'games/seabattle.js',  title: 'Sea Battle',      emoji: '⚓', tags: 'puzzle brain multiplayer two-player',                  blurb: 'Sink the fleet! Battleship vs AI or pass-and-play with a friend.' },
    { id: 'checkers',   src: 'games/checkers.js',   title: 'Cat Checkers',    emoji: '🔴', tags: 'puzzle brain multiplayer two-player',                  blurb: 'Classic draughts! Play solo vs AI or challenge a friend.' },
    { id: 'chess',      src: 'games/chess.js',      title: 'Cat Chess',       emoji: '♟️', tags: 'puzzle brain multiplayer two-player',                  blurb: 'Chess with cat pieces! Play solo vs AI or challenge a friend.' },
    { id: 'catjump',    src: 'games/catjump.js',    title: 'Cat Jump',        emoji: '🪂', tags: 'arcade reflex one-button',                             blurb: 'Jump as high as you can! Hold left/right to move. Auto-jump on platforms.' },
    { id: 'balloon',    src: 'games/balloon.js',    title: 'Balloon Pop',     emoji: '🎈', tags: 'arcade reflex chill one-button',                       blurb: 'Pop the cat balloons before they escape! Dodge the dog balloons.' },
    { id: 'fishslap',   src: 'games/fishslap.js',   title: 'Fish Slap',       emoji: '🐟', tags: 'arcade reflex multiplayer two-player one-button',      blurb: 'Two players, one fish. Slap first to claim it! P1: top, P2: bottom.' },
    { id: 'gravcat',    src: 'games/gravcat.js',    title: 'Gravity Cat',     emoji: '🙃', tags: 'arcade reflex one-button',                             blurb: 'Tap to flip gravity. Dodge the spikes — top and bottom!' },
    { id: 'catpinball', src: 'games/catpinball.js', title: 'Cat Pinball',     emoji: '🎯', tags: 'arcade reflex one-button',                             blurb: 'Tap left or right to flip! Keep the ball in play and rack up points.' },
  ];

  // Mount functions populated when scripts load
  const mounts = new Map();
  const scriptLoaded = new Set(['games/sprites.js', 'games/thumbnails.js']);

  window.Pawcade = { register: g => mounts.set(g.id, g.mount) };

  function loadScript(src) {
    if (scriptLoaded.has(src)) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => { scriptLoaded.add(src); resolve(); };
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.append(s);
    });
  }

  function debounce(fn, ms) {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }

  const beep = (f = 440, d = .08, t = 'square') => {
    if (muted) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = t; o.frequency.value = f; g.gain.value = .06; o.connect(g); g.connect(ac.destination);
      o.start(); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + d); o.stop(ac.currentTime + d);
    } catch {}
  };

  let deferredInstall = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); deferredInstall = e;
    const btn = document.getElementById('installBtn');
    if (btn) { btn.hidden = false; btn.onclick = () => { deferredInstall.prompt(); deferredInstall = null; btn.hidden = true; }; }
  });
  window.addEventListener('appinstalled', () => { const btn = document.getElementById('installBtn'); if (btn) btn.hidden = true; });

  const CATS = [
    { id: 'all',    label: '🐾 All' },
    { id: 'recent', label: '🕐 Recent' },
    { id: 'arcade', label: '🕹️ Arcade' },
    { id: 'puzzle', label: '🧩 Puzzle' },
    { id: 'word',   label: '🔤 Word' },
    { id: 'chill',  label: '😽 Chill' },
    { id: 'versus', label: '🆚 Versus' },
  ];
  const TAG_MAP = {
    arcade: ['arcade','reflex','action','one-button','catch','clicking','runner','shooter','space','multiplayer','two-player','fighting','endless'],
    puzzle: ['puzzle','numbers','memory','cards','sliding','brain','pattern','sequence'],
    word:   ['word','typing','speed'],
    chill:  ['relax','calm','sound','chill'],
    versus: ['multiplayer','two-player','fighting'],
  };

  function gameMatchesCat(g, catId) {
    if (catId === 'all') return true;
    if (catId === 'recent') return store.get('last:' + g.id, 0) > 0;
    const keywords = TAG_MAP[catId] || [];
    return keywords.some(k => g.tags.includes(k));
  }

  function filteredGames(q) {
    return MANIFEST
      .filter(g => gameMatchesCat(g, activeTag))
      .filter(g => (g.title + ' ' + g.tags + ' ' + g.blurb).toLowerCase().includes(q))
      .sort((a, b) => store.get('last:' + b.id, 0) - store.get('last:' + a.id, 0));
  }

  function buildTabs() {
    const wrap = document.createElement('div'); wrap.className = 'tabs'; wrap.setAttribute('role', 'tablist');
    CATS.forEach(cat => {
      const b = document.createElement('button'); b.className = 'tab' + (cat.id === activeTag ? ' active' : '');
      b.textContent = cat.label; b.setAttribute('role', 'tab');
      b.onclick = () => { activeTag = cat.id; document.querySelectorAll('.tab').forEach(t => t.classList.remove('active')); b.classList.add('active'); render(); };
      wrap.append(b);
    });
    return wrap;
  }

  function render() {
    const q = $('#q').value.trim().toLowerCase(), el = $('#grid');
    const list = filteredGames(q);
    el.textContent = '';
    if (activeTag === 'recent' && !list.length) {
      el.innerHTML = '<p class="empty">No recently played games yet — pick one!</p>'; return;
    }
    if (!list.length) { el.innerHTML = '<p class="empty">No games here — try another filter or clear the search.</p>'; return; }
    const frag = document.createDocumentFragment();
    list.forEach((g, i) => {
      const best = store.get('best:' + g.id, 0);
      const plays = store.get('plays:' + g.id, 0);
      const b = document.createElement('button');
      b.className = 'card'; b.setAttribute('aria-label', g.title);
      b.innerHTML = `
        <div class="thumb-wrap">
          <canvas class="thumb" width="200" height="150" aria-hidden="true"></canvas>
          <div class="card-overlay"><span class="t">${g.title}</span></div>
        </div>
        <div class="card-footer">
          <span class="b">${best ? '🏆 ' + best : 'Not played yet'}</span>
          ${plays > 1 ? `<span class="plays">${plays}×</span>` : ''}
        </div>`;
      b.style.animationDelay = (i * 28) + 'ms';
      b.onclick = () => open(g);
      requestAnimationFrame(() => {
        const cv = b.querySelector('.thumb');
        if (cv && window.Thumbs) Thumbs.draw(cv.getContext('2d'), g.id, 200, 150);
      });
      frag.append(b);
    });
    el.append(frag);
  }

  function showBest() {
    const b = store.get('best:' + cur.id, 0);
    $('#best').textContent = b ? '🏆 ' + b : '';
  }

  async function open(g) {
    cur = g;
    store.set('last:' + g.id, Date.now());
    store.set('plays:' + g.id, store.get('plays:' + g.id, 0) + 1);
    $('#ttl').textContent = g.emoji + ' ' + g.title;
    showBest();
    const st = $('#stage');
    st.textContent = '';
    st.innerHTML = '<p class="loading-game">🐾</p>';
    const dlg = $('#play');
    dlg.showModal();
    st.tabIndex = -1; st.focus();
    document.body.classList.add('dialog-open');
    try {
      if (!mounts.has(g.id)) await loadScript(g.src);
      const mountFn = mounts.get(g.id);
      if (!mountFn) throw new Error('Game script loaded but did not register: ' + g.id);
      st.textContent = '';
      cleanup = mountFn(st, {
        beep,
        score(n) {
          if (n > store.get('best:' + g.id, 0)) {
            store.set('best:' + g.id, n);
            showBest();
            try { navigator.vibrate?.([30, 20, 60]); } catch {}
            const el = $('#best'); el.style.animation = 'none'; el.offsetWidth; el.style.animation = 'score-pop .4s ease';
          }
        }
      });
    } catch (err) {
      console.error('[PawCade] Game mount failed:', err);
      st.innerHTML = '<p style="padding:2rem;text-align:center;color:#ff6b9a">⚠️ Game failed to load.<br><small>' + (err && err.message ? err.message : 'Unknown error') + '</small></p>';
      cleanup = null;
    }
  }

  function closeDialog() { $('#play').close(); }

  function toggleFullscreen() {
    const dlg = $('#play');
    if (!document.fullscreenElement) dlg.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  }

  function initSwipeClose(dlg) {
    let startY = 0, startX = 0, dragging = false;
    dlg.addEventListener('touchstart', e => {
      const tag = e.target.tagName;
      if (tag === 'CANVAS' || tag === 'INPUT') return;
      startY = e.touches[0].clientY; startX = e.touches[0].clientX; dragging = true;
    }, { passive: true });
    dlg.addEventListener('touchmove', e => {
      if (!dragging) return;
      const dy = e.touches[0].clientY - startY;
      const dx = e.touches[0].clientX - startX;
      if (Math.abs(dy) > Math.abs(dx) && dy > 0) {
        if (e.target.tagName === 'CANVAS') { dragging = false; return; }
        dlg.style.transform = 'translateY(' + Math.min(dy, 200) + 'px)';
        dlg.style.transition = 'none';
      }
    }, { passive: true });
    dlg.addEventListener('touchend', e => {
      if (!dragging) return; dragging = false;
      const dy = e.changedTouches[0].clientY - startY;
      if (dy > 100) {
        dlg.style.transition = 'transform .25s ease';
        dlg.style.transform = 'translateY(100vh)';
        setTimeout(closeDialog, 220);
      } else {
        dlg.style.transition = 'transform .2s ease';
        dlg.style.transform = '';
        setTimeout(() => { dlg.style.transition = ''; dlg.style.transform = ''; }, 220);
      }
    }, { passive: true });
  }

  function init() {
    const sub = $('#sub');
    const tabEl = buildTabs();
    sub.after(tabEl);

    $('#q').oninput = debounce(render, 120);
    $('#rnd').onclick = () => {
      const unplayed = MANIFEST.filter(g => !store.get('last:' + g.id, 0));
      const pool = unplayed.length ? unplayed : MANIFEST;
      open(pool[Math.floor(Math.random() * pool.length)]);
    };
    $('#x').onclick = closeDialog;
    $('#fs').onclick = toggleFullscreen;
    document.addEventListener('fullscreenchange', () => {
      $('#fs').title = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen';
    });

    const dlg = $('#play');
    dlg.addEventListener('close', () => {
      dlg.style.transform = ''; dlg.style.transition = '';
      document.body.classList.remove('dialog-open');
      if (cleanup) cleanup(); cleanup = null;
      render();
    });

    initSwipeClose(dlg);

    dlg.addEventListener('click', e => {
      const r = dlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeDialog();
    });

    const d = document.documentElement, th = store.get('theme', null);
    if (th) d.dataset.theme = th;
    const syncThemeBtn = () => $('#theme').textContent = (d.dataset.theme === 'dark' || (!d.dataset.theme && !matchMedia('(prefers-color-scheme:light)').matches)) ? '☀️ Theme' : '🌙 Theme';
    syncThemeBtn();
    $('#theme').onclick = () => {
      const dark = (d.dataset.theme || (matchMedia('(prefers-color-scheme:light)').matches ? 'light' : 'dark')) === 'dark';
      d.dataset.theme = dark ? 'light' : 'dark'; store.set('theme', d.dataset.theme); syncThemeBtn();
    };

    const mb = $('#mute'), lab = () => mb.textContent = muted ? '🔇 Sound' : '🔊 Sound';
    lab(); mb.onclick = () => { muted = !muted; store.set('mute', muted); lab(); };

    document.addEventListener('keydown', e => {
      if ($('#play').open) return;
      const n = parseInt(e.key);
      if (n >= 1 && n <= 9 && MANIFEST[n - 1]) { e.preventDefault(); open(MANIFEST[n - 1]); }
    });

    requestAnimationFrame(() => {
      if (sub) sub.textContent = MANIFEST.length + ' browser games with a cat on them. Pick one and play. Best scores stay in this browser.';
      render();
    });
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
