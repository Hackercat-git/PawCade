Pawcade.register({
  id: 'cat2048', title: 'Cat 2048', emoji: '🧶', tags: 'puzzle numbers',
  blurb: 'Slide and merge the tiles to reach 2048.',
  mount(el, api) {
    el.innerHTML = '<div class="row"><span class="gs">Score 0</span><button class="gn">New game</button></div><div class="g2048"></div><p class="hint">Arrow keys or swipe.</p>';
    const B = el.querySelector('.g2048'), S = el.querySelector('.gs');
    let g, sc;
    function add() {
      const e = []; g.forEach((r, i) => r.forEach((v, j) => v || e.push([i, j])));
      if (!e.length) return; const [i, j] = e[Math.random() * e.length | 0]; g[i][j] = Math.random() < .9 ? 2 : 4;
    }
    function line(r) {
      const a = r.filter(Boolean), o = [];
      for (let i = 0; i < a.length; i++) { if (a[i] == a[i + 1]) { o.push(a[i] * 2); sc += a[i] * 2; i++; } else o.push(a[i]); }
      while (o.length < 4) o.push(0); return o;
    }
    function draw() {
      B.innerHTML = g.flat().map(v => `<i data-v="${Math.min(v, 2048)}">${v || ''}</i>`).join('');
      S.textContent = 'Score ' + sc; api.score(sc);
      if (!g.flat().includes(0) && !g.some((r, i) => r.some((v, j) => v == r[j + 1] || (g[i + 1] && g[i + 1][j] == v)))) S.textContent = 'No moves left. Score ' + sc;
    }
    function move(d) { // 0 left, 1 up, 2 right, 3 down
      const old = JSON.stringify(g), s0 = sc;
      for (let k = 0; k < 4; k++) {
        let r = d % 2 ? g.map(x => x[k]) : g[k].slice();
        if (d > 1) r.reverse(); r = line(r); if (d > 1) r.reverse();
        if (d % 2) r.forEach((v, i) => g[i][k] = v); else g[k] = r;
      }
      if (JSON.stringify(g) != old) { add(); draw(); if (sc > s0) api.beep(520, .05); }
    }
    function reset() { g = [...Array(4)].map(() => Array(4).fill(0)); sc = 0; add(); add(); draw(); }
    const keys = { ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2, ArrowDown: 3 };
    const key = e => { if (e.key in keys) { e.preventDefault(); move(keys[e.key]); } };
    let p0; B.onpointerdown = e => p0 = [e.clientX, e.clientY];
    B.onpointerup = e => {
      if (!p0) return; const dx = e.clientX - p0[0], dy = e.clientY - p0[1];
      if (Math.max(Math.abs(dx), Math.abs(dy)) > 24) move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 2 : 0) : (dy > 0 ? 3 : 1));
    };
    el.querySelector('.gn').onclick = reset;
    document.addEventListener('keydown', key); reset();
    return () => document.removeEventListener('keydown', key);
  }
});
