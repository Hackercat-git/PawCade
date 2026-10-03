Pawcade.register({
  id: 'asteroids', title: 'Asteroid Cat', emoji: '🚀', tags: 'arcade shooter space action',
  blurb: 'Rotate and shoot. Blast asteroids before they hit your cat ship.',
  mount(el, api) {
    const W = 340, H = 340, c = document.createElement('canvas');
    c.width = W; c.height = H; c.className = 'board';
    const hint = document.createElement('p'); hint.className = 'hint';
    hint.textContent = '📱 Left = rotate left · Right = rotate right · Bottom = thrust · Center = shoot';
    el.append(c, hint);
    const ctx = c.getContext('2d');
    const keys = {};
    let ship, bullets, rocks, sc, lives, state, raf, frame, particles;

    function vec(angle, spd) { return { x: Math.cos(angle) * spd, y: Math.sin(angle) * spd }; }
    function wrap(o) { if (o.x < 0) o.x += W; if (o.x > W) o.x -= W; if (o.y < 0) o.y += H; if (o.y > H) o.y -= H; }
    function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    function makeRock(x, y, r) { return { x, y, r, vx: (Math.random()-.5)*1.4, vy: (Math.random()-.5)*1.4, angle: 0, va: (Math.random()-.5)*.05, hp: r > 22 ? 3 : r > 12 ? 2 : 1 }; }
    function spawnRocks(n) {
      for (let i = 0; i < n; i++) {
        let rx, ry;
        do { rx = Math.random() * W; ry = Math.random() * H; } while (dist({x:rx,y:ry}, ship) < 80);
        rocks.push(makeRock(rx, ry, 28 + Math.random() * 10));
      }
    }
    function burst(x, y, col, n = 6) {
      for (let i = 0; i < n; i++) particles.push({ x, y, vx: (Math.random()-.5)*3, vy: (Math.random()-.5)*3, life: 1, col });
    }
    function reset() {
      ship = { x: W/2, y: H/2, angle: -Math.PI/2, vx: 0, vy: 0, cooldown: 0, inv: 120 };
      bullets = []; rocks = []; particles = []; sc = 0; lives = 3; state = 'ready'; frame = 0;
      spawnRocks(4);
    }
    function shoot() {
      if (ship.cooldown > 0 || state !== 'play') return;
      const a = ship.angle;
      bullets.push({ x: ship.x + Math.cos(a)*14, y: ship.y + Math.sin(a)*14, vx: Math.cos(a)*7, vy: Math.sin(a)*7, life: 55 });
      ship.cooldown = 12; api.beep(700, .04);
    }
    function tick() {
      if (state === 'play') {
        frame++;
        // ship
        if (keys.ArrowLeft || keys.a) ship.angle -= .07;
        if (keys.ArrowRight || keys.d) ship.angle += .07;
        if (keys.ArrowUp || keys.w) { ship.vx += Math.cos(ship.angle)*.18; ship.vy += Math.sin(ship.angle)*.18; }
        ship.vx *= .97; ship.vy *= .97;
        ship.x += ship.vx; ship.y += ship.vy; wrap(ship);
        if (ship.cooldown > 0) ship.cooldown--;
        if (ship.inv > 0) ship.inv--;
        if (keys[' ']) shoot();
        // bullets
        bullets.forEach(b => { b.x += b.vx; b.y += b.vy; b.life--; wrap(b); });
        bullets = bullets.filter(b => b.life > 0);
        // rocks
        rocks.forEach(r => { r.x += r.vx; r.y += r.vy; r.angle += r.va; wrap(r); });
        // collisions: bullet vs rock
        for (let bi = bullets.length - 1; bi >= 0; bi--) {
          for (let ri = rocks.length - 1; ri >= 0; ri--) {
            if (dist(bullets[bi], rocks[ri]) < rocks[ri].r - 4) {
              burst(rocks[ri].x, rocks[ri].y, '#ffb347');
              rocks[ri].hp--;
              if (rocks[ri].hp <= 0) {
                const nr = rocks[ri].r * .56;
                if (nr > 8) { rocks.push(makeRock(rocks[ri].x, rocks[ri].y, nr)); rocks.push(makeRock(rocks[ri].x, rocks[ri].y, nr)); }
                rocks.splice(ri, 1); sc += 10; api.score(sc); api.beep(520 + sc, .05);
              } else { api.beep(300, .03); }
              bullets.splice(bi, 1); break;
            }
          }
        }
        // ship vs rock
        if (ship.inv === 0) {
          for (const r of rocks) {
            if (dist(ship, r) < r.r - 6) {
              lives--; ship.inv = 150; burst(ship.x, ship.y, '#ff6b9a', 10); api.beep(150, .3, 'sawtooth');
              if (lives <= 0) { state = 'over'; api.score(sc); } break;
            }
          }
        }
        // particles
        particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= .04; p.vx *= .93; p.vy *= .93; });
        particles = particles.filter(p => p.life > 0);
        // next wave
        if (rocks.length === 0) { spawnRocks(Math.min(4 + Math.floor(sc/60), 10)); }
      }
      draw(); raf = requestAnimationFrame(tick);
    }
    function draw() {
      const cs = getComputedStyle(el);
      const bg = cs.getPropertyValue('--bg').trim(), ink = cs.getPropertyValue('--ink').trim();
      const accent = cs.getPropertyValue('--accent').trim(), line = cs.getPropertyValue('--line').trim();
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      // stars (deterministic)
      ctx.fillStyle = line;
      for (let i = 0; i < 40; i++) {
        const sx = (i * 97 + 13) % W, sy = (i * 137 + 7) % H;
        ctx.fillRect(sx, sy, 1, 1);
      }
      // touch zone overlay (mobile hint, fades when playing)
      if (state === 'play' || state === 'ready') {
        ctx.save(); ctx.globalAlpha = state === 'ready' ? 0.18 : 0.07;
        ctx.fillStyle = '#6699ff'; ctx.fillRect(0, 0, W * .28, H);          // left
        ctx.fillStyle = '#6699ff'; ctx.fillRect(W * .72, 0, W * .28, H);    // right
        ctx.fillStyle = '#ffb347'; ctx.fillRect(0, H * .72, W, H * .28);    // bottom thrust
        ctx.restore();
        ctx.save(); ctx.globalAlpha = state === 'ready' ? 0.55 : 0.18;
        ctx.font = '18px serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
        ctx.fillText('◀', W * .14, H * .36);
        ctx.fillText('▶', W * .86, H * .36);
        ctx.fillText('🔥', W / 2, H * .86);
        ctx.restore();
      }
      // particles
      particles.forEach(p => { ctx.globalAlpha = p.life; ctx.fillStyle = p.col; ctx.fillRect(p.x-2, p.y-2, 4, 4); });
      ctx.globalAlpha = 1;
      // rocks
      rocks.forEach(r => {
        ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.angle);
        ctx.font = (r.r * 1.6) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🪨', 0, 0); ctx.restore();
      });
      // bullets
      ctx.fillStyle = accent;
      bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, 7); ctx.fill(); });
      // ship
      if (ship.inv === 0 || Math.floor(frame / 6) % 2 === 0) {
        ctx.save(); ctx.translate(ship.x, ship.y); ctx.rotate(ship.angle + Math.PI/2);
        ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🐱', 0, 0); ctx.restore();
        if (keys.ArrowUp || keys.w) { // thrust flame
          ctx.save(); ctx.translate(ship.x, ship.y); ctx.rotate(ship.angle + Math.PI/2);
          ctx.font = '14px serif'; ctx.fillText('🔥', 0, 16); ctx.restore();
        }
      }
      // hud
      ctx.fillStyle = ink; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('Score ' + sc + '   Lives ' + '❤️'.repeat(Math.max(0,lives)), 6, 5);
      if (state === 'ready') {
        ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, H/2-24, W, 36);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('Space or tap to start', W/2, H/2-6);
      }
      if (state === 'over') {
        ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, H/2-28, W, 44);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('💥 Game over — Space or tap', W/2, H/2-6);
      }
    }
    const kd = e => {
      keys[e.key] = true;
      if ([' ','ArrowUp','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
      if (e.key === ' ') {
        if (state === 'ready') { state = 'play'; return; }
        if (state === 'over') { reset(); return; }
        shoot();
      }
    };
    const ku = e => keys[e.key] = false;
    // touch zones: left=turn left, right=turn right, center=shoot/start
    c.addEventListener('pointerdown', e => {
      const r = c.getBoundingClientRect();
      const tx = (e.clientX - r.left) / r.width;
      const ty = (e.clientY - r.top) / r.height;
      if (state === 'ready') { state = 'play'; return; }
      if (state === 'over') { reset(); return; }
      if (ty > .72) { keys['ArrowUp'] = true; e.currentTarget._thrust = e.pointerId; }
      else if (tx < .28) keys['ArrowLeft'] = true;
      else if (tx > .72) keys['ArrowRight'] = true;
      else shoot();
    });
    c.addEventListener('pointerup', e => {
      keys['ArrowLeft'] = false; keys['ArrowRight'] = false;
      if (e.currentTarget._thrust === e.pointerId) { keys['ArrowUp'] = false; e.currentTarget._thrust = null; }
    });
    c.addEventListener('pointercancel', e => {
      keys['ArrowLeft'] = false; keys['ArrowRight'] = false; keys['ArrowUp'] = false;
    });
    c.style.touchAction = 'none';
    document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
    reset(); tick();
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); };
  }
});
