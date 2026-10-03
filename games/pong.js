Pawcade.register({
  id: 'pong', title: 'Paddle Pounce', emoji: '🏓', tags: 'arcade classic pong',
  blurb: 'Pong against the computer. You lose after three misses.',
  mount(el, api) {
    const W = 360, H = 240, PH = 50, PR = 6, c = document.createElement('canvas');
    c.width = W; c.height = H; c.className = 'board';
    const hint = document.createElement('p'); hint.className = 'hint'; hint.textContent = '📱 Drag to move paddle · ⌨️ W/S or arrow keys · tap to restart';
    el.append(c, hint);
    const x = c.getContext('2d'), keys = {};
    let py, ay, bx, by, vx, vy, sc, miss, over, raf, trail;
    function serve(dir) { bx = W / 2; by = H / 2; vx = 3.2 * dir; vy = (Math.random() * 2 - 1) * 2; trail = []; }
    function reset() { py = ay = H / 2; sc = 0; miss = 0; over = false; serve(1); }
    function tick() {
      if (!over) {
        if (keys.ArrowUp || keys.w) py -= 4.5; if (keys.ArrowDown || keys.s) py += 4.5;
        py = Math.max(PH / 2, Math.min(H - PH / 2, py));
        bx += vx; by += vy;
        // ball trail
        trail.push([bx, by]); if (trail.length > 6) trail.shift();
        if (by < PR || by > H - PR) { vy = -vy; by = Math.max(PR, Math.min(H - PR, by)); api.beep(300, .03); }
        // AI paddle — speed scales with ball speed
        const aiSpd = Math.min(3.5, Math.abs(vx) * .55);
        ay += Math.max(-aiSpd, Math.min(aiSpd, by - ay));
        // player paddle hit
        if (vx < 0 && bx < 26 && bx > 14 && Math.abs(by - py) < PH / 2 + PR) {
          vx = Math.abs(vx) * 1.07 + .1; vy += (by - py) * .09; bx = 26; api.beep(500, .04);
        }
        // AI paddle hit
        if (vx > 0 && bx > W - 26 && bx < W - 14 && Math.abs(by - ay) < PH / 2 + PR) {
          vx = -(Math.abs(vx) * 1.04 + .1); vy += (by - ay) * .05; bx = W - 26; api.beep(400, .04);
        }
        vx = Math.max(-11, Math.min(11, vx)); vy = Math.max(-7, Math.min(7, vy));
        if (bx < 0) { miss++; api.beep(150, .2, 'sawtooth'); if (miss >= 3) { over = true; api.score(sc); } else serve(1); }
        if (bx > W) { sc++; api.beep(800, .08); serve(-1); }
      }
      draw(); raf = requestAnimationFrame(tick);
    }
    function draw() {
      const cs = getComputedStyle(el);
      const bg = cs.getPropertyValue('--bg').trim();
      const accent = cs.getPropertyValue('--accent').trim();
      const ink = cs.getPropertyValue('--ink').trim();
      const line = cs.getPropertyValue('--line').trim();
      x.fillStyle = bg; x.fillRect(0, 0, W, H);
      // center line
      x.setLineDash([6, 6]); x.strokeStyle = line; x.lineWidth = 1.5;
      x.beginPath(); x.moveTo(W / 2, 0); x.lineTo(W / 2, H); x.stroke(); x.setLineDash([]);
      // ball trail
      trail.forEach((p, i) => {
        x.globalAlpha = (i + 1) / trail.length * .35;
        x.fillStyle = accent; x.beginPath(); x.arc(p[0], p[1], PR * .8, 0, 7); x.fill();
      });
      x.globalAlpha = 1;
      // paddles (rounded)
      x.fillStyle = accent;
      x.beginPath(); x.roundRect(10, py - PH / 2, 8, PH, 4); x.fill();
      x.fillStyle = line;
      x.beginPath(); x.roundRect(W - 18, ay - PH / 2, 8, PH, 4); x.fill();
      // ball
      x.fillStyle = ink; x.beginPath(); x.arc(bx, by, PR, 0, 7); x.fill();
      // hud
      x.font = 'bold 14px system-ui'; x.textAlign = 'center'; x.fillStyle = ink;
      x.fillText('Points ' + sc + '   Misses ' + miss + '/3', W / 2, 16);
      if (over) { x.fillText('Game over — Space or tap to restart', W / 2, H / 2); }
    }
    const kd = e => { keys[e.key] = true; if (e.key.startsWith('Arrow') || e.key == ' ') e.preventDefault(); if (e.key == ' ' && over) reset(); };
    const ku = e => keys[e.key] = false;
    c.onpointermove = e => { if (e.buttons || e.pointerType !== 'mouse') { const r = c.getBoundingClientRect(); py = (e.clientY - r.top) * H / r.height; } };
    c.onpointerdown = e => { const r = c.getBoundingClientRect(); py = Math.max(PH/2, Math.min(H - PH/2, (e.clientY - r.top) * H / r.height)); if (over) reset(); };
    c.style.touchAction = 'none';
    document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
    reset(); tick();
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); };
  }
});
