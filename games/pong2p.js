Pawcade.register({
  id: 'pong2p', title: 'Pong 2 Players', emoji: '🏓', tags: 'arcade classic multiplayer two-player',
  blurb: 'Local 2-player Pong. W/S vs ↑/↓. First to 7 wins!',
  mount(el, api) {
    const W = 360, H = 260, PH = 54, PR = 6, GOAL = 7;
    const c = document.createElement('canvas');
    c.width = W; c.height = H; c.className = 'board';
    const hint = document.createElement('p'); hint.className = 'hint';
    hint.textContent = '📱 Drag your half to move paddle.  ⌨️ P1: W/S  •  P2: ↑/↓  •  Space to serve';
    el.append(c, hint);
    const x = c.getContext('2d'), keys = {};
    let p1y, p2y, bx, by, vx, vy, sc1, sc2, state, raf, trail, serveDir, frame;

    function serve(dir) {
      bx = W / 2; by = H / 2;
      const angle = (Math.random() * .6 - .3);
      vx = dir * 3.5; vy = Math.sin(angle) * 3.5;
      trail = []; state = 'play';
    }
    function reset() {
      p1y = p2y = H / 2; sc1 = sc2 = 0; frame = 0; state = 'ready'; trail = [];
    }
    function tick() {
      frame++;
      if (state === 'play') {
        // paddles
        if (keys.w || keys.W) p1y -= 5; if (keys.s || keys.S) p1y += 5;
        if (keys.ArrowUp) p2y -= 5; if (keys.ArrowDown) p2y += 5;
        p1y = Math.max(PH/2, Math.min(H - PH/2, p1y));
        p2y = Math.max(PH/2, Math.min(H - PH/2, p2y));
        // ball
        bx += vx; by += vy;
        trail.push([bx, by]); if (trail.length > 7) trail.shift();
        // top/bottom walls
        if (by < PR) { by = PR; vy = Math.abs(vy); api.beep(280, .03); }
        if (by > H - PR) { by = H - PR; vy = -Math.abs(vy); api.beep(280, .03); }
        // P1 paddle (left)
        if (vx < 0 && bx < 26 && bx > 14 && Math.abs(by - p1y) < PH/2 + PR) {
          vx = Math.abs(vx) * 1.06 + .1; vy += (by - p1y) * .1;
          vx = Math.min(vx, 12); vy = Math.max(-8, Math.min(8, vy));
          bx = 26; api.beep(500, .04);
        }
        // P2 paddle (right)
        if (vx > 0 && bx > W - 26 && bx < W - 14 && Math.abs(by - p2y) < PH/2 + PR) {
          vx = -(Math.abs(vx) * 1.06 + .1); vy += (by - p2y) * .1;
          vx = Math.max(vx, -12); vy = Math.max(-8, Math.min(8, vy));
          bx = W - 26; api.beep(500, .04);
        }
        // scoring
        if (bx < 0) { sc2++; api.beep(150, .2, 'sawtooth'); trail = []; if (sc2 >= GOAL) { state = 'win2'; api.score(sc2); } else setTimeout(() => serve(1), 800); state = state === 'play' ? 'pause' : state; }
        if (bx > W) { sc1++; api.beep(150, .2, 'sawtooth'); trail = []; if (sc1 >= GOAL) { state = 'win1'; api.score(sc1); } else setTimeout(() => serve(-1), 800); state = state === 'play' ? 'pause' : state; }
      }
      draw(); raf = requestAnimationFrame(tick);
    }
    function draw() {
      const cs = getComputedStyle(el);
      const bg = cs.getPropertyValue('--bg').trim(), accent = cs.getPropertyValue('--accent').trim();
      const ink = cs.getPropertyValue('--ink').trim(), line = cs.getPropertyValue('--line').trim();
      const mute = cs.getPropertyValue('--mute').trim();
      x.fillStyle = bg; x.fillRect(0, 0, W, H);
      // touch zone tints (subtle)
      if (state === 'ready') {
        x.fillStyle = 'rgba(255,179,71,.06)'; x.fillRect(0, 0, W/2, H);
        x.fillStyle = 'rgba(100,200,255,.06)'; x.fillRect(W/2, 0, W/2, H);
      }
      // center line
      x.setLineDash([6, 6]); x.strokeStyle = line; x.lineWidth = 1.5;
      x.beginPath(); x.moveTo(W/2, 0); x.lineTo(W/2, H); x.stroke(); x.setLineDash([]);
      // player labels
      x.fillStyle = mute; x.font = '11px system-ui'; x.textAlign = 'center'; x.textBaseline = 'top';
      x.fillText('P1  drag / W·S', W/4, 4); x.fillText('P2  drag / ↑↓', W*3/4, 4);
      // scores
      x.fillStyle = ink; x.font = 'bold 36px system-ui';
      x.textAlign = 'center'; x.textBaseline = 'top';
      x.fillText(sc1, W/2 - 50, 16); x.fillText(sc2, W/2 + 50, 16);
      // goal bar
      x.fillStyle = line; x.fillRect(W/2 - 28, 58, 56, 4);
      x.fillStyle = accent;
      x.fillRect(W/2 - 28, 58, (sc1 / GOAL) * 28, 4);
      x.fillRect(W/2, 58, (sc2 / GOAL) * 28, 4);
      // ball trail
      trail.forEach((p, i) => {
        x.globalAlpha = (i+1) / trail.length * .3;
        x.fillStyle = accent; x.beginPath(); x.arc(p[0], p[1], PR * .85, 0, 7); x.fill();
      });
      x.globalAlpha = 1;
      // paddles
      x.fillStyle = accent;
      x.beginPath(); x.roundRect(10, p1y - PH/2, 8, PH, 4); x.fill();
      x.beginPath(); x.roundRect(W - 18, p2y - PH/2, 8, PH, 4); x.fill();
      // ball (cat emoji as ball!)
      if (state === 'play' || state === 'pause') {
        x.font = '20px serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('🐱', bx, by);
      }
      // overlays
      x.font = '15px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
      if (state === 'ready') {
        x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(0, H/2 - 22, W, 38);
        x.fillStyle = '#fff'; x.fillText('Space or tap to start', W/2, H/2);
      }
      if (state === 'win1' || state === 'win2') {
        const winner = state === 'win1' ? 'P1' : 'P2';
        x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, H/2 - 28, W, 50);
        x.fillStyle = accent; x.font = 'bold 18px system-ui';
        x.fillText('🏆 ' + winner + ' wins!  Space or tap to play again', W/2, H/2);
      }
    }
    // touch controls: left half = P1, right half = P2
    const touches = {};
    c.addEventListener('touchstart', e => { e.preventDefault(); [...e.changedTouches].forEach(t => { touches[t.identifier] = { x: t.clientX, y: t.clientY, side: t.clientX < c.getBoundingClientRect().left + W/2 ? 1 : 2 }; }); }, { passive: false });
    c.addEventListener('touchmove', e => { e.preventDefault();
      const r = c.getBoundingClientRect();
      [...e.changedTouches].forEach(t => {
        if (!touches[t.identifier]) return;
        const ny = (t.clientY - r.top) * H / r.height;
        if (touches[t.identifier].side === 1) p1y = Math.max(PH/2, Math.min(H - PH/2, ny));
        else p2y = Math.max(PH/2, Math.min(H - PH/2, ny));
      });
    }, { passive: false });
    c.addEventListener('touchend', e => { [...e.changedTouches].forEach(t => delete touches[t.identifier]); if (state === 'ready' || state === 'win1' || state === 'win2') { if (state !== 'ready') reset(); serve(1); } }, { passive: false });
    c.style.touchAction = 'none';

    const kd = e => {
      keys[e.key] = true;
      if (['ArrowUp','ArrowDown',' '].includes(e.key)) e.preventDefault();
      if (e.key === ' ') {
        if (state === 'ready') serve(1);
        else if (state === 'win1' || state === 'win2') { reset(); serve(1); }
      }
    };
    const ku = e => keys[e.key] = false;
    document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
    reset(); tick();
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); };
  }
});
