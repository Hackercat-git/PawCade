Pawcade.register({
  id: 'breakout', title: 'Cat Breakout', emoji: '🧱', tags: 'arcade classic paddle ball',
  blurb: 'Bounce the ball to smash all the fish bricks. Three lives.',
  mount(el, api) {
    const W = 340, H = 420, PW_BASE = 60, PH = 10, BR = 5, BC = 7, c = document.createElement('canvas');
    c.width = W; c.height = H; c.className = 'board';
    const hint = document.createElement('p'); hint.className = 'hint';
    hint.textContent = '📱 Drag to move paddle · Tap to launch · Grab 🍖 for wider paddle';
    el.append(c, hint);
    const x = c.getContext('2d'), keys = {};
    let px, bx, by, vx, vy, bricks, sc, lives, state, raf, PW, powerups, wideTimer;
    let particles = [], ballTrail = [];

    const ROW_COLORS = ['#ff4e6a','#ff9a3c','#ffd600','#4ef07c','#4ec4ff'];
    const ROW_GLOW   = ['#ff2244','#ff7a00','#e6bc00','#00cc44','#00aaff'];

    function makeBricks() {
      const b = [];
      for (let r = 0; r < BR; r++) for (let col = 0; col < BC; col++) {
        b.push({ x: 10 + col * (W - 20) / BC, y: 38 + r * 30, w: (W - 20) / BC - 6, h: 22, hp: BR - r, alive: true, row: r });
      }
      return b;
    }
    function reset() {
      px = W / 2; bx = W / 2; by = H - 60; vx = 0; vy = 0; PW = PW_BASE;
      bricks = makeBricks(); sc = 0; lives = 3; state = 'ready'; powerups = []; wideTimer = 0;
      particles = []; ballTrail = [];
    }
    function spawnParticles(bx2, by2, color, n) {
      for (let i = 0; i < n; i++) {
        const a = Math.random()*Math.PI*2, sp = 1 + Math.random()*4;
        particles.push({ x: bx2, y: by2, vx: Math.cos(a)*sp, vy: Math.sin(a)*sp, life: 1, color, size: 2+Math.random()*3 });
      }
    }
    function launch() {
      if (state === 'over') { reset(); return; }
      if (state === 'ready') { state = 'play'; vx = (Math.random() > .5 ? 1 : -1) * 2.8; vy = -3.8; }
    }
    function spawnPowerup(brickX, brickY) {
      powerups.push({ x: brickX, y: brickY, vy: 1.2, alive: true });
    }
    function tick() {
      if (state === 'play') {
        if (keys.a || keys.ArrowLeft) px = Math.max(PW / 2, px - 5.5);
        if (keys.d || keys.ArrowRight) px = Math.min(W - PW / 2, px + 5.5);
        bx += vx; by += vy;
        ballTrail.push({ x: bx, y: by, life: 1 });
        if (ballTrail.length > 14) ballTrail.shift();

        if (wideTimer > 0) { wideTimer--; if (wideTimer === 0) PW = PW_BASE; }
        if (bx < 8) { bx = 8; vx = Math.abs(vx); api.beep(300, .03); }
        if (bx > W - 8) { bx = W - 8; vx = -Math.abs(vx); api.beep(300, .03); }
        if (by < 12) { by = 12; vy = Math.abs(vy); api.beep(300, .03); }
        if (vy > 0 && by > H - 30 - 8 && by < H - 30 + 6 && Math.abs(bx - px) < PW / 2 + 8) {
          vy = -Math.abs(vy) * 1.01;
          vx += (bx - px) / (PW / 2) * 1.5;
          vx = Math.max(-6, Math.min(6, vx));
          by = H - 38; api.beep(500, .04);
        }
        for (const br of bricks) {
          if (!br.alive) continue;
          if (bx + 8 > br.x && bx - 8 < br.x + br.w && by + 8 > br.y && by - 8 < br.y + br.h) {
            const ol = bx - (br.x + br.w), or2 = br.x - bx, ot = by - (br.y + br.h), ob = br.y - by;
            const hv = Math.min(Math.abs(ol), Math.abs(or2)) < Math.min(Math.abs(ot), Math.abs(ob));
            if (hv) vx = -vx; else vy = -vy;
            br.hp--;
            if (br.hp <= 0) {
              br.alive = false; sc++; api.beep(660 + sc * 10, .05); api.score(sc);
              spawnParticles(br.x + br.w/2, br.y + br.h/2, ROW_COLORS[br.row], 14);
              if (br.row <= 1 && Math.random() < .4) spawnPowerup(br.x + br.w / 2, br.y + br.h);
            } else { api.beep(400, .03); spawnParticles(br.x + br.w/2, br.y + br.h/2, ROW_COLORS[br.row], 5); }
            break;
          }
        }
        powerups.forEach(pu => { pu.y += pu.vy; pu.vy += .06; });
        for (const pu of powerups) {
          if (!pu.alive) continue;
          if (pu.y > H - 30 && pu.y < H - 18 && Math.abs(pu.x - px) < PW / 2 + 10) {
            pu.alive = false; PW = PW_BASE * 1.8; wideTimer = 480; api.beep(1100, .1); api.score(sc);
          } else if (pu.y > H + 10) pu.alive = false;
        }
        powerups = powerups.filter(pu => pu.alive);
        if (by > H + 10) {
          lives--; api.beep(150, .25, 'sawtooth'); PW = PW_BASE; wideTimer = 0; ballTrail = [];
          if (lives <= 0) { state = 'over'; api.score(sc); }
          else { bx = px; by = H - 60; vx = vy = 0; state = 'ready'; }
        }
        if (bricks.every(b => !b.alive)) {
          bricks = makeBricks(); vy -= .3; api.beep(880, .15); state = 'ready';
          bx = px; by = H - 60; vx = vy = 0;
        }
      } else if (state === 'ready') {
        if (keys.a || keys.ArrowLeft) px = Math.max(PW / 2, px - 5.5);
        if (keys.d || keys.ArrowRight) px = Math.min(W - PW / 2, px + 5.5);
        bx = px;
      }
      particles = particles.filter(p => p.life > 0);
      draw(); raf = requestAnimationFrame(tick);
    }

    function draw() {
      const cs = getComputedStyle(el);
      const bg = cs.getPropertyValue('--bg').trim(), accent = cs.getPropertyValue('--accent').trim();

      const sky = x.createLinearGradient(0,0,0,H);
      sky.addColorStop(0,'#0d1240'); sky.addColorStop(1,'#12122a');
      x.fillStyle = sky; x.fillRect(0, 0, W, H);

      x.strokeStyle = 'rgba(255,255,255,0.04)'; x.lineWidth = 1;
      for (let i = 0; i < W; i += 20) { x.beginPath(); x.moveTo(i,0); x.lineTo(i,H); x.stroke(); }
      for (let j = 0; j < H; j += 20) { x.beginPath(); x.moveTo(0,j); x.lineTo(W,j); x.stroke(); }

      bricks.forEach(br => {
        if (!br.alive) return;
        const col = ROW_COLORS[br.row], glow = ROW_GLOW[br.row];
        const alpha = 0.5 + (br.hp / BR) * 0.5;
        x.globalAlpha = alpha;
        const bg2 = x.createLinearGradient(br.x, br.y, br.x, br.y + br.h);
        bg2.addColorStop(0, col); bg2.addColorStop(1, glow);
        x.fillStyle = bg2;
        x.shadowBlur = 8; x.shadowColor = glow;
        x.beginPath(); x.roundRect(br.x, br.y, br.w, br.h, 5); x.fill();
        x.shadowBlur = 0;
        x.fillStyle = 'rgba(255,255,255,0.25)';
        x.beginPath(); x.roundRect(br.x+3, br.y+3, br.w-6, 4, 2); x.fill();
        x.globalAlpha = 1;
        x.font = '12px serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('🐟', br.x + br.w/2, br.y + br.h/2);
      });

      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.055;
        x.globalAlpha = p.life; x.fillStyle = p.color;
        x.shadowBlur = 8; x.shadowColor = p.color;
        x.beginPath(); x.arc(p.x, p.y, p.size * p.life, 0, Math.PI*2); x.fill();
        x.shadowBlur = 0;
      }
      x.globalAlpha = 1;

      powerups.forEach(pu => {
        x.font = '18px serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.shadowBlur = 12; x.shadowColor = '#ff9a3c';
        x.fillText('🍖', pu.x, pu.y);
        x.shadowBlur = 0;
      });

      ballTrail.forEach((t, i) => {
        const a = (i / ballTrail.length) * 0.5;
        x.globalAlpha = a;
        x.fillStyle = wideTimer > 0 ? '#ff9a5c' : '#7ecaff';
        x.beginPath(); x.arc(t.x, t.y, 5 * (i / ballTrail.length), 0, Math.PI*2); x.fill();
      });
      x.globalAlpha = 1;

      const paddleColor = wideTimer > 0 ? '#ff9a5c' : accent;
      const pg = x.createLinearGradient(px - PW/2, H-30, px + PW/2, H-30);
      pg.addColorStop(0, paddleColor); pg.addColorStop(0.5, '#fff'); pg.addColorStop(1, paddleColor);
      x.fillStyle = pg;
      x.shadowBlur = wideTimer > 0 ? 16 : 10;
      x.shadowColor = paddleColor;
      x.beginPath(); x.roundRect(px - PW/2, H-30, PW, PH, 6); x.fill();
      x.shadowBlur = 0;

      x.shadowBlur = 14; x.shadowColor = '#fff';
      x.fillStyle = '#fff';
      x.beginPath(); x.arc(bx, by, 8, 0, Math.PI*2); x.fill();
      x.shadowBlur = 0;

      x.fillStyle = 'rgba(0,0,0,0.45)';
      x.beginPath(); x.roundRect(4, 4, W-8, 24, 8); x.fill();
      x.fillStyle = '#fff'; x.font = 'bold 13px system-ui'; x.textAlign = 'left'; x.textBaseline = 'middle';
      const wideStr = wideTimer > 0 ? '  🍖 ' + Math.ceil(wideTimer/60) + 's' : '';
      x.fillText('Score ' + sc + '   ' + '❤️'.repeat(Math.max(0,lives)) + wideStr, 10, 16);

      if (state === 'ready') {
        x.fillStyle = 'rgba(0,0,0,0.5)';
        x.beginPath(); x.roundRect(W/2-110, H/2-18, 220, 32, 10); x.fill();
        x.fillStyle = '#fff'; x.font = 'bold 15px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('Space or tap to launch', W/2, H/2-2);
      }
      if (state === 'over') {
        x.fillStyle = 'rgba(0,0,15,0.7)'; x.fillRect(0,0,W,H);
        x.fillStyle = 'rgba(255,255,255,0.07)';
        x.beginPath(); x.roundRect(W/2-115, H/2-40, 230, 72, 16); x.fill();
        x.strokeStyle = accent; x.lineWidth = 1.5;
        x.beginPath(); x.roundRect(W/2-115, H/2-40, 230, 72, 16); x.stroke();
        x.shadowBlur = 18; x.shadowColor = accent;
        x.fillStyle = '#fff'; x.font = 'bold 18px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('Game Over — Score: ' + sc, W/2, H/2-14);
        x.shadowBlur = 0;
        x.fillStyle = 'rgba(255,255,255,0.6)'; x.font = '13px system-ui';
        x.fillText('Space or tap to restart', W/2, H/2+16);
      }
    }
    const kd = e => {
      keys[e.key] = true;
      if (['ArrowLeft','ArrowRight','a','d',' '].includes(e.key)) e.preventDefault();
      if (e.key === ' ') launch();
    };
    const ku = e => keys[e.key] = false;
    c.onpointermove = e => { const r = c.getBoundingClientRect(); px = Math.max(PW/2, Math.min(W - PW/2, (e.clientX - r.left) * W / r.width)); };
    c.onpointerdown = () => launch();
    c.style.touchAction = 'none';
    document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
    reset(); tick();
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); };
  }
});
