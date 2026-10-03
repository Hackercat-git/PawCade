(() => {
  const games = [], $ = s => document.querySelector(s);
  const store = {
    get(k, d) { try { const v = localStorage.getItem('pawcade:' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('pawcade:' + k, JSON.stringify(v)); } catch {} }
  };
  let cleanup = null, cur = null, ac, muted = store.get('mute', false);
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

  function sortedGames(q) {
    return games
      .filter(g => (g.title + ' ' + g.tags).toLowerCase().includes(q))
      .sort((a, b) => store.get('last:' + b.id, 0) - store.get('last:' + a.id, 0));
  }

  function render() {
    const q = $('#q').value.trim().toLowerCase(), el = $('#grid');
    const list = sortedGames(q);
    el.textContent = '';
    if (!list.length) { el.innerHTML = '<p class="empty">No game matches — clear the search to see all.</p>'; return; }
    list.forEach(g => {
      const best = store.get('best:' + g.id, 0), b = document.createElement('button');
      b.className = 'card';
      const idx = games.indexOf(g) + 1;
      const shortcut = idx <= 9 ? `<span class="num">${idx}</span>` : '';
      b.innerHTML = `${shortcut}<span class="em">${g.emoji}</span><span class="t">${g.title}</span><span class="d">${g.blurb}</span><span class="b">${best ? '🏆 Best: ' + best : 'Not played yet'}</span>`;
      b.setAttribute('aria-label', g.title);
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
    $('#ttl').textContent = g.emoji + ' ' + g.title;
    showBest();
    const st = $('#stage'); st.textContent = ''; $('#play').showModal();
    st.tabIndex = -1; st.focus();
    cleanup = g.mount(st, {
      beep,
      score(n) { if (n > store.get('best:' + g.id, 0)) { store.set('best:' + g.id, n); showBest(); } }
    });
  }

  function init() {
    // update subtitle with real game count
    const sub = $('#sub');
    document.addEventListener('DOMContentLoaded', () => {}, { once: true });
    // subtitle is set after games register (all deferred scripts run before this)
    requestAnimationFrame(() => {
      if (sub) sub.textContent = `${games.length} browser games with a cat on them. Pick one and play. Your best scores stay in this browser.`;
      render();
    });

    $('#q').oninput = render;
    $('#rnd').onclick = () => { const g = games[Math.floor(Math.random() * games.length)]; if (g) open(g); };
    $('#x').onclick = () => $('#play').close();
    $('#play').addEventListener('close', () => { if (cleanup) cleanup(); cleanup = null; render(); });

    // theme
    const d = document.documentElement, th = store.get('theme', null);
    if (th) d.dataset.theme = th;
    $('#theme').onclick = () => {
      const dark = (d.dataset.theme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')) === 'dark';
      d.dataset.theme = dark ? 'light' : 'dark'; store.set('theme', d.dataset.theme);
      $('#theme').textContent = d.dataset.theme === 'dark' ? '☀️ Theme' : '🌙 Theme';
    };
    // sync theme icon on load
    if (th === 'light') $('#theme').textContent = '🌙 Theme';
    if (th === 'dark') $('#theme').textContent = '☀️ Theme';

    // mute
    const mb = $('#mute'), lab = () => mb.textContent = muted ? '🔇 Sound' : '🔊 Sound';
    lab(); mb.onclick = () => { muted = !muted; store.set('mute', muted); lab(); };

    // number-key shortcuts (1–9 open game by original registration order)
    document.addEventListener('keydown', e => {
      if ($('#play').open) return;
      const n = parseInt(e.key);
      if (n >= 1 && n <= 9 && games[n - 1]) { e.preventDefault(); open(games[n - 1]); }
    });

    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
