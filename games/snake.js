Pawcade.register({
  id: 'snake', title: 'Cat Snake', emoji: '🐟', tags: 'classic arcade reflex',
  blurb: 'Eat fish, grow longer, never bite your own tail.',
  mount(el, api) {
    const N = 18, S = 20, c = document.createElement('canvas');
    c.width = c.height = N * S; c.className = 'board';
    const msg = document.createElement('p'); msg.className = 'hint';
    msg.textContent = 'Arrow keys, WASD or swipe. Press Space or tap to restart, P to pause. The snake speeds up as it grows.';
    el.append(c, msg);
    const x = c.getContext('2d');
    let s, d, nd, f, sc, t, over, p0, sp, pz;
    const same = (a, b) => a[0] == b[0] && a[1] == b[1];
    function food() { do f = [Math.random() * N | 0, Math.random() * N | 0]; while (s.some(p => same(p, f))); }
    function reset() { s = [[9, 9], [8, 9], [7, 9]]; d = nd = [1, 0]; sc = 0; over = false; food(); clearInterval(t); sp = 110; pz = false; t = setInterval(step, sp); draw(); }
    function step() {
      d = nd; const h = [s[0][0] + d[0], s[0][1] + d[1]];
      if (h[0] < 0 || h[1] < 0 || h[0] >= N || h[1] >= N || s.some(p => same(p, h))) { over = true; clearInterval(t); api.score(sc); api.beep(150, .3, 'sawtooth'); draw(); return; }
      s.unshift(h); if (same(h, f)) { sc++; food(); api.beep(660, .06); if (sc % 4 == 0) { sp = Math.max(60, sp - 10); clearInterval(t); t = setInterval(step, sp); } } else s.pop(); draw();
    }
    function draw() {
      const cs = getComputedStyle(el);
      x.fillStyle = cs.getPropertyValue('--bg'); x.fillRect(0, 0, c.width, c.height);
      x.fillStyle = cs.getPropertyValue('--accent'); s.forEach(p => x.fillRect(p[0] * S + 1, p[1] * S + 1, S - 2, S - 2));
      x.textBaseline = 'top'; x.font = '16px serif'; x.fillText('🐟', f[0] * S + 1, f[1] * S + 2);
      x.fillStyle = cs.getPropertyValue('--ink'); x.font = 'bold 14px system-ui'; x.fillText('Fish: ' + sc, 6, 4);
      if (over) x.fillText('Game over. Space or tap to restart.', 60, c.height / 2);
    }
    const dirs = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] };
    const turn = v => { if (v[0] != -d[0] || v[1] != -d[1]) nd = v; };
    const key = e => { const v = dirs[e.key]; if (v) { e.preventDefault(); turn(v); } else if (e.key == 'p' && !over) { pz = !pz; clearInterval(t); if (!pz) t = setInterval(step, sp); } else if (e.key == ' ' && over) { e.preventDefault(); reset(); } };
    c.onpointerdown = e => { p0 = [e.clientX, e.clientY]; if (over) reset(); };
    c.onpointerup = e => {
      if (!p0) return; const dx = e.clientX - p0[0], dy = e.clientY - p0[1];
      if (Math.max(Math.abs(dx), Math.abs(dy)) > 20) turn(Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]);
    };
    document.addEventListener('keydown', key); reset();
    return () => { clearInterval(t); document.removeEventListener('keydown', key); };
  }
});
