(() => {
  const games = [], $ = s => document.querySelector(s);
  const store = {
    get(k, d) { try { const v = localStorage.getItem('pawcade:' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('pawcade:' + k, JSON.stringify(v)); } catch {} }
  };
  let cleanup = null, cur = null, ac, muted = store.get('mute', false), activeTag = 'all';

  const beep = (f = 440, d = .08, t = 'square') => {
    if (muted) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = t; o.frequency.value = f; g.gain.value = .06; o.connect(g); g.connect(ac.destination);
      o.start(); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + d); o.stop(ac.currentTime + d);
    } catch {}
  };

  window.Pawcade = { register: g => games.push(g) };

  // Category definitions (tags used in register calls)
  const CATS = [
    { id: 'all',    label: '🐾 All' },
    { id: 'arcade', label: '🕹️ Arcade' },
    { id: 'puzzle', label: '🧩 Puzzle' },
    { id: 'word',   label: '🔤 Word' },
    { id: 'chill',  label: '😽 Chill' },
  ];
  const TAG_MAP = {
    arcade: ['arcade','reflex','action','one-button','catch','clicking','runner','shooter','space'],
    puzzle: ['puzzle','numbers','memory','cards','sliding','brain','pattern','sequence'],
    word:   ['word','typing','speed'],
    chill:  ['relax','calm','sound'],
  };

  function gameMatchesCat(g, catId) {
    if (catId === 'all') return true;
    const keywords = TAG_MAP[catId] || [];
    return keywords.some(k => g.tags.includes(k));
  }

  function filteredGames(q) {
    return games
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
    if (!list.length) { el.innerHTML = '<p class="empty">No games here — try another filter or clear the search.</p>'; return; }
    list.forEach(g => {
      const best = store.get('best:' + g.id, 0);
      const plays = store.get('plays:' + g.id, 0);
      const idx = games.indexOf(g) + 1;
      const b = document.createElement('button');
      b.className = 'card'; b.setAttribute('aria-label', g.title);
      b.innerHTML = `
        ${idx <= 9 ? `<span class="num">${idx}</span>` : ''}
        <span class="em">${g.emoji}</span>
        <span class="t">${g.title}</span>
        <span class="d">${g.blurb}</span>
        <span class="b">${best ? `🏆 ${best}` : 'Not played yet'}${plays > 1 ? `<span class="plays">${plays} plays</span>` : ''}</span>`;
      b.onclick = () => open(g);
      el.append(b);
    });
  }

  function showBest() {
    const b = store.get('best:' + cur.id, 0);
    $('#best').textContent = b ? '🏆 ' + b : '';
  }

  function open(g) {
    cur = g;
    store.set('last:' + g.id, Date.now());
    store.set('plays:' + g.id, store.get('plays:' + g.id, 0) + 1);
    $('#ttl').textContent = g.emoji + ' ' + g.title;
    showBest();
    const st = $('#stage'); st.textContent = ''; $('#play').showModal();
    st.tabIndex = -1; st.focus();
    cleanup = g.mount(st, {
      beep,
      score(n) {
        if (n > store.get('best:' + g.id, 0)) {
          store.set('best:' + g.id, n);
          showBest();
          // flash best score
          const el = $('#best'); el.style.animation = 'none'; el.offsetWidth; el.style.animation = 'score-pop .4s ease';
        }
      }
    });
  }

  function toggleFullscreen() {
    const dlg = $('#play');
    if (!document.fullscreenElement) dlg.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  }

  function init() {
    // inject tabs
    const sub = $('#sub');
    const tabEl = buildTabs();
    sub.after(tabEl);

    $('#q').oninput = render;
    $('#rnd').onclick = () => { const g = games[Math.floor(Math.random() * games.length)]; if (g) open(g); };
    $('#x').onclick = () => $('#play').close();
    $('#fs').onclick = toggleFullscreen;
    document.addEventListener('fullscreenchange', () => {
      $('#fs').textContent = document.fullscreenElement ? '⛶' : '⛶';
      $('#fs').title = document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen';
    });
    $('#play').addEventListener('close', () => { if (cleanup) cleanup(); cleanup = null; render(); });

    // theme
    const d = document.documentElement, th = store.get('theme', null);
    if (th) d.dataset.theme = th;
    const syncThemeBtn = () => $('#theme').textContent = (d.dataset.theme === 'dark' || (!d.dataset.theme && !matchMedia('(prefers-color-scheme:light)').matches)) ? '☀️ Theme' : '🌙 Theme';
    syncThemeBtn();
    $('#theme').onclick = () => {
      const dark = (d.dataset.theme || (matchMedia('(prefers-color-scheme:light)').matches ? 'light' : 'dark')) === 'dark';
      d.dataset.theme = dark ? 'light' : 'dark'; store.set('theme', d.dataset.theme); syncThemeBtn();
    };

    // mute
    const mb = $('#mute'), lab = () => mb.textContent = muted ? '🔇 Sound' : '🔊 Sound';
    lab(); mb.onclick = () => { muted = !muted; store.set('mute', muted); lab(); };

    // 1–9 shortcuts
    document.addEventListener('keydown', e => {
      if ($('#play').open) return;
      const n = parseInt(e.key);
      if (n >= 1 && n <= 9 && games[n - 1]) { e.preventDefault(); open(games[n - 1]); }
    });

    // subtitle with count
    requestAnimationFrame(() => {
      if (sub) sub.textContent = `${games.length} browser games with a cat on them. Pick one and play. Best scores stay in this browser.`;
      render();
    });
    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
