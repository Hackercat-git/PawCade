Pawcade.register({
  id: 'pong', title: 'Paddle Pounce', emoji: '🏓', tags: 'arcade classic pong',
  blurb: 'Pong against the computer. You lose after three misses.',
  mount(el, api) {
    const W = 360, H = 240, PH = 50, c = document.createElement('canvas');
    c.width = W; c.height = H; c.className = 'board';
    const hint = document.createElement('p'); hint.className = 'hint'; hint.textContent = 'Drag, or use the arrow keys or W and S. Space or tap to restart.';
    el.append(c, hint);
    const x = c.getContext('2d'), keys = {};
    let py, ay, bx, by, vx, vy, sc, miss, over, raf;
    function serve(dir) { bx = W / 2; by = H / 2; vx = 3 * dir; vy = (Math.random() * 2 - 1) * 2; }
    function reset() { py = ay = H / 2; sc = 0; miss = 0; over = false; serve(1); }
    function tick() {
      if (!over) {
        if (keys.ArrowUp || keys.w) py -= 4; if (keys.ArrowDown || keys.s) py += 4;
        py = Math.max(PH / 2, Math.min(H - PH / 2, py));
        bx += vx; by += vy;
        if (by < 6 || by > H - 6) { vy = -vy; by = Math.max(6, Math.min(H - 6, by)); }
        ay += Math.max(-2.6, Math.min(2.6, by - ay));
        if (vx < 0 && bx < 26 && bx > 14 && Math.abs(by - py) < PH / 2 + 6) { vx = -vx * 1.06; vy += (by - py) * .08; bx = 26; api.beep(500, .04); }
        if (vx > 0 && bx > W - 26 && bx < W - 14 && Math.abs(by - ay) < PH / 2 + 6) { vx = -vx * 1.04; vy += (by - ay) * .05; bx = W - 26; api.beep(400, .04); }
        vx = Math.max(-9, Math.min(9, vx)); vy = Math.max(-6, Math.min(6, vy));
        if (bx < 0) { miss++; api.beep(150, .2, 'sawtooth'); if (miss >= 3) { over = true; api.score(sc); } else serve(1); }
        if (bx > W) { sc++; api.beep(800, .08); serve(-1); }
      }
      draw(); raf = requestAnimationFrame(tick);
    }
    function draw() {
      const cs = getComputedStyle(el);
      x.fillStyle = cs.getPropertyValue('--bg'); x.fillRect(0, 0, W, H);
      x.fillStyle = cs.getPropertyValue('--accent');
      x.fillRect(10, py - PH / 2, 8, PH); x.fillRect(W - 18, ay - PH / 2, 8, PH);
      x.fillStyle = cs.getPropertyValue('--ink'); x.beginPath(); x.arc(bx, by, 6, 0, 7); x.fill();
      x.font = 'bold 14px system-ui'; x.textAlign = 'center'; x.fillText('Points ' + sc + '   Misses ' + miss + '/3', W / 2, 16);
      if (over) x.fillText('Game over. Space or tap to restart.', W / 2, H / 2);
    }
    const kd = e => { keys[e.key] = true; if (e.key.startsWith('Arrow') || e.key == ' ') e.preventDefault(); if (e.key == ' ' && over) reset(); };
    const ku = e => keys[e.key] = false;
    c.onpointermove = e => { const r = c.getBoundingClientRect(); py = (e.clientY - r.top) * H / r.height; };
    c.onpointerdown = () => { if (over) reset(); };
    c.style.touchAction = 'none';
    document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
    reset(); tick();
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); };
  }
});
