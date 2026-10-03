Pawcade.register({
  id: 'dash', title: 'Cat Dash', emoji: '🏃', tags: 'endless runner jump reflex',
  blurb: 'Jump over dogs and yarn. How far can you run?',
  mount(el, api) {
    const W = 340, H = 200, GY = 155, c = document.createElement('canvas');
    c.width = W; c.height = H; c.className = 'board';
    const hint = document.createElement('p'); hint.className = 'hint';
    hint.textContent = 'Space, ↑, or tap to jump. Double-jump allowed!';
    el.append(c, hint);
    const x = c.getContext('2d');
    const OBSTACLES = ['🐕', '🧶', '🐾', '🦮'];
    let cy, vy, jumps, obs, sc, spd, state, raf, frame, p0;

    function reset() {
      cy = GY; vy = 0; jumps = 0; obs = []; sc = 0; spd = 3; frame = 0; state = 'ready';
    }
    function jump() {
      if (state === 'over') { reset(); return; }
      if (state === 'ready') { state = 'play'; return; }
      if (jumps < 2) {
        vy = jumps === 0 ? -7.5 : -5.5;
        jumps++; api.beep(jumps === 1 ? 600 : 800, .05);
      }
    }
    function tick() {
      if (state === 'play') {
        frame++; sc = Math.floor(frame / 6);
        spd = 3 + sc * .008;
        vy += .45; cy += vy;
        if (cy >= GY) { cy = GY; vy = 0; jumps = 0; }
        // spawn obstacles: gap shrinks with speed
        const gap = Math.max(55, 110 - sc / 4);
        if (obs.length === 0 || obs[obs.length - 1].x < W - gap - Math.random() * 80) {
          obs.push({ x: W + 20, e: OBSTACLES[Math.random() * OBSTACLES.length | 0], h: 28 + Math.random() * 14 });
        }
        obs.forEach(o => o.x -= spd);
        obs = obs.filter(o => o.x > -40);
        // collision: cat at x=60, cy, size ~24
        for (const o of obs) {
          if (Math.abs(o.x - 60) < 20 && cy + 12 > GY - o.h + 4) {
            state = 'over'; api.score(sc); api.beep(150, .3, 'sawtooth'); break;
          }
        }
        api.score(sc);
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
      // ground
      x.fillStyle = line; x.fillRect(0, GY + 18, W, 2);
      // cat
      x.font = '28px serif'; x.textAlign = 'center'; x.textBaseline = 'bottom';
      // slight rotation when airborne
      x.save(); x.translate(60, cy);
      if (cy < GY) x.rotate(Math.max(-.3, Math.min(.3, vy * .04)));
      x.fillText('🐱', 0, 0); x.restore();
      // obstacles
      obs.forEach(o => { x.font = o.h + 'px serif'; x.textBaseline = 'bottom'; x.fillText(o.e, o.x, GY + 18); });
      // hud
      x.fillStyle = ink; x.font = 'bold 14px system-ui'; x.textAlign = 'left'; x.textBaseline = 'top';
      x.fillText('Distance: ' + sc + 'm' + (spd > 4 ? '  🔥' : ''), 8, 6);
      if (state === 'ready') {
        x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(0, 70, W, 36);
        x.fillStyle = '#fff'; x.font = 'bold 16px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('Space or tap to start', W / 2, 88);
      }
      if (state === 'over') {
        x.fillStyle = 'rgba(0,0,0,.5)'; x.fillRect(0, 70, W, 36);
        x.fillStyle = '#fff'; x.font = 'bold 15px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('Wiped out at ' + sc + 'm — tap to retry', W / 2, 88);
      }
    }
    const kd = e => { if (['ArrowUp',' '].includes(e.key)) { e.preventDefault(); jump(); } };
    c.onpointerdown = e => { p0 = [e.clientX, e.clientY]; jump(); };
    document.addEventListener('keydown', kd);
    reset(); tick();
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); };
  }
});
