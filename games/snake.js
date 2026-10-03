Pawcade.register({
  id: 'snake', title: 'Cat Snake', emoji: '🐟', tags: 'classic arcade reflex',
  blurb: 'Eat fish, grow longer, never bite your own tail.',
  mount(el, api) {
    const N = 18, S = 20, c = document.createElement('canvas');
    c.width = c.height = N * S; c.className = 'board';
    const row = document.createElement('div'); row.className = 'row';
    const msg = document.createElement('p'); msg.className = 'hint';
    msg.textContent = 'Arrow keys, WASD or swipe. Space/tap to restart, P to pause.';
    const wrapBtn = document.createElement('button');
    wrapBtn.textContent = 'Walls: On'; wrapBtn.title = 'Toggle wall-wrap mode';
    wrapBtn.onclick = () => { wrap = !wrap; wrapBtn.textContent = wrap ? 'Walls: Off' : 'Walls: On'; draw(); };
    row.append(wrapBtn); el.append(c, row, msg);
    const x = c.getContext('2d');
    let s, d, nd, f, sc, t, over, p0, sp, pz, wrap = false, combo = 0, lastEat = 0;
    const same = (a, b) => a[0] == b[0] && a[1] == b[1];
    function food() { do f = [Math.random() * N | 0, Math.random() * N | 0]; while (s.some(p => same(p, f))); }
    function reset() { s = [[9, 9], [8, 9], [7, 9]]; d = nd = [1, 0]; sc = 0; over = false; combo = 0; food(); clearInterval(t); sp = 110; pz = false; t = setInterval(step, sp); draw(); }
    function step() {
      d = nd;
      let h = [s[0][0] + d[0], s[0][1] + d[1]];
      if (wrap) { h[0] = (h[0] + N) % N; h[1] = (h[1] + N) % N; }
      if (!wrap && (h[0] < 0 || h[1] < 0 || h[0] >= N || h[1] >= N)) { over = true; clearInterval(t); api.score(sc); api.beep(150, .3, 'sawtooth'); draw(); return; }
      if (s.some(p => same(p, h))) { over = true; clearInterval(t); api.score(sc); api.beep(150, .3, 'sawtooth'); draw(); return; }
      s.unshift(h);
      if (same(h, f)) {
        const now = Date.now(); combo = now - lastEat < 3000 ? combo + 1 : 1; lastEat = now;
        const pts = combo >= 3 ? 2 : 1; sc += pts;
        food(); api.beep(combo >= 3 ? 880 : 660, .06); api.score(sc);
        if (sc % 4 == 0) { sp = Math.max(55, sp - 10); clearInterval(t); t = setInterval(step, sp); }
      } else { s.pop(); }
      draw();
    }
    function draw() {
      const cs = getComputedStyle(el);
      const bg = cs.getPropertyValue('--bg').trim();
      const accent = cs.getPropertyValue('--accent').trim();
      const ink = cs.getPropertyValue('--ink').trim();
      const line = cs.getPropertyValue('--line').trim();
      x.fillStyle = bg; x.fillRect(0, 0, c.width, c.height);
      // subtle grid
      x.strokeStyle = line; x.lineWidth = .3; x.globalAlpha = .4;
      for (let i = 0; i <= N; i++) {
        x.beginPath(); x.moveTo(i * S, 0); x.lineTo(i * S, c.height); x.stroke();
        x.beginPath(); x.moveTo(0, i * S); x.lineTo(c.width, i * S); x.stroke();
      }
      x.globalAlpha = 1;
      // body segments
      for (let i = s.length - 1; i >= 1; i--) {
        const p = s[i], alpha = .5 + .5 * (i / s.length);
        x.globalAlpha = 1 - (i / s.length) * .4;
        x.fillStyle = accent;
        const px = p[0] * S + 2, py = p[1] * S + 2, pw = S - 4, ph = S - 4;
        x.beginPath(); x.roundRect(px, py, pw, ph, 4); x.fill();
      }
      x.globalAlpha = 1;
      // head
      x.font = (S - 2) + 'px serif'; x.textBaseline = 'top';
      x.fillText('🐱', s[0][0] * S, s[0][1] * S + 1);
      // food
      x.font = '16px serif'; x.fillText('🐟', f[0] * S + 1, f[1] * S + 2);
      // combo indicator
      if (combo >= 3) {
        x.fillStyle = '#ff6b9a'; x.font = 'bold 12px system-ui'; x.textBaseline = 'top'; x.textAlign = 'right';
        x.fillText('x' + combo + ' COMBO!', c.width - 6, 4);
      }
      // score
      x.fillStyle = ink; x.font = 'bold 14px system-ui'; x.textBaseline = 'top'; x.textAlign = 'left';
      x.fillText('Fish: ' + sc + '  Speed: ' + Math.round(100 * 110 / sp) + '%' + (wrap ? '  🔄' : ''), 6, 4);
      if (pz) {
        x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(0, 0, c.width, c.height);
        x.fillStyle = '#fff'; x.font = 'bold 20px system-ui'; x.textAlign = 'center';
        x.fillText('⏸ Paused — press P', c.width / 2, c.height / 2);
      }
      if (over) {
        x.fillStyle = 'rgba(0,0,0,.52)'; x.fillRect(0, 0, c.width, c.height);
        x.fillStyle = '#fff'; x.font = 'bold 18px system-ui'; x.textAlign = 'center';
        x.fillText('💀 Game over! Score: ' + sc, c.width / 2, c.height / 2 - 14);
        x.font = '14px system-ui';
        x.fillText('Space or tap to restart', c.width / 2, c.height / 2 + 14);
      }
    }
    const dirs = { ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0] };
    const turn = v => { if (v[0] != -d[0] || v[1] != -d[1]) nd = v; };
    const key = e => {
      const v = dirs[e.key]; if (v) { e.preventDefault(); turn(v); }
      else if (e.key.toLowerCase() == 'p' && !over) { pz = !pz; clearInterval(t); if (!pz) t = setInterval(step, sp); draw(); }
      else if (e.key == ' ' && over) { e.preventDefault(); reset(); }
    };
    c.onpointerdown = e => { p0 = [e.clientX, e.clientY]; if (over) reset(); };
    c.onpointerup = e => {
      if (!p0) return; const dx = e.clientX - p0[0], dy = e.clientY - p0[1];
      if (Math.max(Math.abs(dx), Math.abs(dy)) > 20) turn(Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]);
    };
    document.addEventListener('keydown', key); reset();
    return () => { clearInterval(t); document.removeEventListener('keydown', key); };
  }
});
