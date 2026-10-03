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

    // Deterministic starfield
    const STARS = Array.from({length: 50}, (_, i) => ({
      x: (i * 97 + 13) % W,
      y: (i * 137 + 7) % H,
      r: i % 3 === 0 ? 1.5 : 1,
      bright: 0.3 + (i % 7) * 0.1
    }));

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
      for (let i = 0; i < n; i++) particles.push({ x, y, vx: (Math.random()-.5)*3, vy: (Math.random()-.5)*3, life: 1, col, size: 2 + Math.random() * 2 });
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
        if (keys.ArrowLeft || keys.a) ship.angle -= .07;
        if (keys.ArrowRight || keys.d) ship.angle += .07;
        if (keys.ArrowUp || keys.w) {
          ship.vx += Math.cos(ship.angle)*.18; ship.vy += Math.sin(ship.angle)*.18;
          // trail particles
          if (frame % 2 === 0) {
            particles.push({ x: ship.x - Math.cos(ship.angle)*14, y: ship.y - Math.sin(ship.angle)*14,
              vx: -Math.cos(ship.angle)*1.5 + (Math.random()-.5)*1.5,
              vy: -Math.sin(ship.angle)*1.5 + (Math.random()-.5)*1.5,
              life: 0.8, col: '#ffb347', size: 2 });
          }
        }
        ship.vx *= .97; ship.vy *= .97;
        ship.x += ship.vx; ship.y += ship.vy; wrap(ship);
        if (ship.cooldown > 0) ship.cooldown--;
        if (ship.inv > 0) ship.inv--;
        if (keys[' ']) shoot();
        bullets.forEach(b => { b.x += b.vx; b.y += b.vy; b.life--; wrap(b); });
        bullets = bullets.filter(b => b.life > 0);
        rocks.forEach(r => { r.x += r.vx; r.y += r.vy; r.angle += r.va; wrap(r); });
        for (let bi = bullets.length - 1; bi >= 0; bi--) {
          for (let ri = rocks.length - 1; ri >= 0; ri--) {
            if (dist(bullets[bi], rocks[ri]) < rocks[ri].r - 4) {
              burst(rocks[ri].x, rocks[ri].y, '#ffb347', 10);
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
        if (ship.inv === 0) {
          for (const r of rocks) {
            if (dist(ship, r) < r.r - 6) {
              lives--; ship.inv = 150; burst(ship.x, ship.y, '#ff6b9a', 14); api.beep(150, .3, 'sawtooth');
              if (lives <= 0) { state = 'over'; api.score(sc); } break;
            }
          }
        }
        particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= .04; p.vx *= .93; p.vy *= .93; });
        particles = particles.filter(p => p.life > 0);
        if (rocks.length === 0) { spawnRocks(Math.min(4 + Math.floor(sc/60), 10)); }
      }
      draw(); raf = requestAnimationFrame(tick);
    }
    function draw() {
      const cs = getComputedStyle(el);
      const ink = cs.getPropertyValue('--ink').trim();
      const accent = cs.getPropertyValue('--accent').trim();
      const line = cs.getPropertyValue('--line').trim();

      // Gradient bg
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#12122a'); grad.addColorStop(1, '#0d1b3e');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

      // Starfield
      STARS.forEach(s => {
        ctx.globalAlpha = s.bright * (0.7 + Math.sin(frame * 0.02 + s.x) * 0.3);
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha = 1;

      // touch zone overlay
      if (state === 'play' || state === 'ready') {
        ctx.save(); ctx.globalAlpha = state === 'ready' ? 0.18 : 0.07;
        ctx.fillStyle = '#6699ff'; ctx.fillRect(0, 0, W * .28, H);
        ctx.fillStyle = '#6699ff'; ctx.fillRect(W * .72, 0, W * .28, H);
        ctx.fillStyle = '#ffb347'; ctx.fillRect(0, H * .72, W, H * .28);
        ctx.restore();
        ctx.save(); ctx.globalAlpha = state === 'ready' ? 0.55 : 0.18;
        ctx.font = '18px serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
        ctx.fillText('◀', W * .14, H * .36);
        ctx.fillText('▶', W * .86, H * .36);
        ctx.fillText('🔥', W / 2, H * .86);
        ctx.restore();
      }

      // particles
      particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.col;
        ctx.shadowBlur = 8; ctx.shadowColor = p.col;
        ctx.beginPath(); ctx.arc(p.x, p.y, (p.size || 2) * p.life, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
      });
      ctx.globalAlpha = 1;

      // rocks
      rocks.forEach(r => {
        ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.angle);
        ctx.font = (r.r * 1.6) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🪨', 0, 0); ctx.restore();
      });

      // bullets — glowing
      ctx.shadowBlur = 14; ctx.shadowColor = '#7ecaff';
      ctx.fillStyle = '#7ecaff';
      bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, 3, 0, 7); ctx.fill(); });
      ctx.shadowBlur = 0;

      // ship with gradient
      if (ship.inv === 0 || Math.floor(frame / 6) % 2 === 0) {
        ctx.save(); ctx.translate(ship.x, ship.y); ctx.rotate(ship.angle + Math.PI/2);
        // glow around ship
        ctx.shadowBlur = 12; ctx.shadowColor = '#7ecaff';
        ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🐱', 0, 0);
        ctx.shadowBlur = 0;
        ctx.restore();
        if (keys.ArrowUp || keys.w) {
          ctx.save(); ctx.translate(ship.x, ship.y); ctx.rotate(ship.angle + Math.PI/2);
          ctx.font = '14px serif'; ctx.fillText('🔥', 0, 16); ctx.restore();
        }
      }

      // hud pill
      const hudText = 'Score ' + sc + '   Lives ' + '❤️'.repeat(Math.max(0,lives));
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath(); ctx.roundRect(4, 2, 200, 22, 6); ctx.fill();
      ctx.fillStyle = ink; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(hudText, 8, 5);

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
