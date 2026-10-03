Pawcade.register({
  id: 'cat2048', title: 'Cat 2048', emoji: '🧶', tags: 'puzzle numbers',
  blurb: 'Slide and merge the tiles to reach 2048.',
  mount(el, api) {
    if (!document.getElementById('g2048-styles')) {
      const s = document.createElement('style');
      s.id = 'g2048-styles';
      s.textContent = `
        .g2048-wrap { background:linear-gradient(160deg,#0d0d1f,#1a1830); border-radius:16px; padding:16px; box-shadow:0 8px 32px #0009; }
        .g2048-hud { display:flex; align-items:center; gap:12px; margin-bottom:14px; justify-content:space-between; }
        .g2048-hud span { color:#ccc; font-weight:700; font-size:1rem; }
        .g2048-hud button { background:linear-gradient(135deg,#2a1a4a,#3a2a5a); color:#c0a0ff; border:1px solid #5a3a8a; border-radius:20px; padding:5px 18px; cursor:pointer; font-size:.9rem; font-weight:700; }
        .g2048 { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; background:#1a1830; border-radius:12px; padding:10px; box-shadow:inset 0 2px 12px #0006; }
        .g2048 i { aspect-ratio:1; border-radius:10px; display:flex; align-items:center; justify-content:center; font-style:normal; font-weight:900; font-size:1.3rem; transition:transform .12s; }
        .g2048 i[data-v="0"]  { background:#2a2845; color:transparent; }
        .g2048 i[data-v="2"]  { background:linear-gradient(135deg,#3a3060,#2a2048); color:#c8b8ff; box-shadow:inset 0 1px 6px #ffffff18; animation:tile-pop .18s cubic-bezier(.2,1.4,.4,1); }
        .g2048 i[data-v="4"]  { background:linear-gradient(135deg,#4a3070,#382060); color:#d8c8ff; box-shadow:inset 0 1px 6px #ffffff22; animation:tile-pop .18s cubic-bezier(.2,1.4,.4,1); }
        .g2048 i[data-v="8"]  { background:linear-gradient(135deg,#6040a0,#4a2a80); color:#f0e0ff; box-shadow:0 0 10px #8060c044, inset 0 1px 6px #ffffff28; animation:tile-pop .18s cubic-bezier(.2,1.4,.4,1); }
        .g2048 i[data-v="16"] { background:linear-gradient(135deg,#7a3090,#5a2070); color:#ffe0ff; box-shadow:0 0 12px #c060a066, inset 0 1px 6px #ffffff30; animation:tile-pop .18s cubic-bezier(.2,1.4,.4,1); }
        .g2048 i[data-v="32"] { background:linear-gradient(135deg,#2060c0,#1040a0); color:#a0d4ff; box-shadow:0 0 14px #2060c077, inset 0 1px 8px #ffffff35; animation:tile-pop .18s cubic-bezier(.2,1.4,.4,1); }
        .g2048 i[data-v="64"] { background:linear-gradient(135deg,#1080d0,#0060b0); color:#c0e8ff; box-shadow:0 0 16px #1080d088, inset 0 1px 8px #ffffff40; animation:tile-pop .18s cubic-bezier(.2,1.4,.4,1); }
        .g2048 i[data-v="128"] { background:linear-gradient(135deg,#00a0c0,#007090); color:#e0ffff; font-size:1.1rem; box-shadow:0 0 18px #00a0c099, inset 0 1px 8px #ffffff45; animation:tile-pop .18s cubic-bezier(.2,1.4,.4,1); }
        .g2048 i[data-v="256"] { background:linear-gradient(135deg,#00c080,#009060); color:#e0fff4; font-size:1rem; box-shadow:0 0 20px #00c08099, inset 0 1px 8px #ffffff50; animation:tile-pop .18s cubic-bezier(.2,1.4,.4,1); }
        .g2048 i[data-v="512"] { background:linear-gradient(135deg,#c0a000,#908000); color:#fff8c0; font-size:.95rem; box-shadow:0 0 22px #c0a000aa, inset 0 1px 8px #ffffff55; animation:tile-pop .18s cubic-bezier(.2,1.4,.4,1); }
        .g2048 i[data-v="1024"] { background:linear-gradient(135deg,#e07000,#c05000); color:#fff0c0; font-size:.85rem; box-shadow:0 0 24px #e07000bb, inset 0 1px 8px #ffffff60; animation:tile-pop .18s cubic-bezier(.2,1.4,.4,1); }
        .g2048 i[data-v="2048"] { background:linear-gradient(135deg,#ff8800,#e06000); color:#fff; font-size:.8rem; box-shadow:0 0 28px #ff8800cc, inset 0 1px 8px #ffffff70; animation:tile-pop .22s cubic-bezier(.2,1.6,.4,1); }
        @keyframes tile-pop { 0%{transform:scale(.82)} 60%{transform:scale(1.08)} 100%{transform:scale(1)} }
        .hint { color:#667; font-size:.85rem; text-align:center; margin-top:8px; }
      `;
      document.head.appendChild(s);
    }

    el.innerHTML = `
      <div class="g2048-wrap">
        <div class="g2048-hud"><span class="gs">Score 0</span><button class="gn">New game</button></div>
        <div class="g2048"></div>
        <p class="hint">Arrow keys or swipe.</p>
      </div>`;
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
    function move(d) {
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
