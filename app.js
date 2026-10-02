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

  function render() {
    const q = $('#q').value.trim().toLowerCase(), el = $('#grid');
    const list = games.filter(g => (g.title + ' ' + g.tags).toLowerCase().includes(q));
    el.textContent = '';
    if (!list.length) { el.innerHTML = '<p class="empty">No game matches that search. Clear it to see every game.</p>'; return; }
    for (const g of list) {
      const best = store.get('best:' + g.id, 0), b = document.createElement('button');
      b.className = 'card';
      b.innerHTML = `<span class="em">${g.emoji}</span><span class="t">${g.title}</span><span class="d">${g.blurb}</span><span class="b">${best ? 'Best: ' + best : 'Not played yet'}</span>`;
      b.onclick = () => open(g);
      el.append(b);
    }
  }
  function showBest() { const b = store.get('best:' + cur.id, 0); $('#best').textContent = b ? 'Best ' + b : ''; }
  function open(g) {
    cur = g; $('#ttl').textContent = g.emoji + ' ' + g.title; showBest();
    const st = $('#stage'); st.textContent = ''; $('#play').showModal(); st.tabIndex = -1; st.focus();
    cleanup = g.mount(st, { beep, score(n) { if (n > store.get('best:' + g.id, 0)) { store.set('best:' + g.id, n); showBest(); } } });
  }
  function init() {
    $('#q').oninput = render;
    $('#rnd').onclick = () => open(games[Math.floor(Math.random() * games.length)]);
    $('#x').onclick = () => $('#play').close();
    $('#play').addEventListener('close', () => { if (cleanup) cleanup(); cleanup = null; render(); });
    const d = document.documentElement, th = store.get('theme', null);
    if (th) d.dataset.theme = th;
    $('#theme').onclick = () => {
      const dark = (d.dataset.theme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')) === 'dark';
      d.dataset.theme = dark ? 'light' : 'dark'; store.set('theme', d.dataset.theme);
    };
    const mb = $('#mute'), lab = () => mb.textContent = muted ? 'Sound off' : 'Sound on';
    lab(); mb.onclick = () => { muted = !muted; store.set('mute', muted); lab(); };
    render();
  }
  document.addEventListener('DOMContentLoaded', init);
})();
