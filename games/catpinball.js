// catpinball.js — Cat Pinball for PawCade
// Tap left half = left flipper, right half = right flipper. Pure phone-friendly.
Pawcade.register({
  id: 'catpinball', title: 'Cat Pinball', emoji: '🎯',
  tags: 'arcade reflex one-button',
  blurb: 'Tap left or right to flip! Keep the ball in play and rack up points.',
  mount(el, api) {
    const W = 300, H = 480;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    c.style.cssText = 'display:block;width:100%;touch-action:none;border-radius:12px;';
    el.append(c);
    const x = c.getContext('2d');

    let score = 0, lives = 3, state = 'ready';
    let ball, lFlip, rFlip, leftDown = false, rightDown = false;
    let bumpers, targets, lastTime = 0, raf, particles;

    const FLIP_LEN = 55, FLIP_W = 10;
    const LBASE = { x: 72, y: H - 46 };
    const RBASE = { x: W - 72, y: H - 46 };
    const FLIP_REST = 28 * Math.PI / 180;
    const FLIP_UP   = -20 * Math.PI / 180;

    function spawnParticles(px, py, col, n) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, spd = 2 + Math.random() * 4;
        particles.push({ x: px, y: py, vx: Math.cos(a)*spd, vy: Math.sin(a)*spd, life: 1, size: 2+Math.random()*3, color: col });
      }
    }
    function makeBumper(bx, by, r, pts) { return { x: bx, y: by, r, pts, hit: 0 }; }
    function makeTarget(tx, ty, w, h, pts) { return { x: tx, y: ty, w, h, pts, hit: 0 }; }

    function reset() {
      score = 0; lives = 3; state = 'ready'; particles = [];
      ball = { x: W / 2, y: H / 2, vx: 1.5, vy: -4, r: 9 };
      lFlip = FLIP_REST; rFlip = FLIP_REST;
      leftDown = false; rightDown = false;
      bumpers = [
        makeBumper(80, 160, 20, 10),
        makeBumper(W - 80, 160, 20, 10),
        makeBumper(W / 2, 110, 22, 15),
        makeBumper(W / 2 - 60, 230, 15, 8),
        makeBumper(W / 2 + 60, 230, 15, 8),
      ];
      targets = [
        makeTarget(30, 80, 14, 50, 5),
        makeTarget(W - 44, 80, 14, 50, 5),
      ];
    }

    function reflectBumper(b) {
      const dx = ball.x - b.x, dy = ball.y - b.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ball.r + b.r) {
        const nx = dx / dist, ny = dy / dist;
        const overlap = ball.r + b.r - dist;
        ball.x += nx * overlap; ball.y += ny * overlap;
        const dot = ball.vx * nx + ball.vy * ny;
        ball.vx -= 2 * dot * nx; ball.vy -= 2 * dot * ny;
        const spd = Math.hypot(ball.vx, ball.vy);
        ball.vx = ball.vx / spd * Math.max(spd, 5);
        ball.vy = ball.vy / spd * Math.max(spd, 5);
        score += b.pts; api.score(score);
        b.hit = 12; api.beep(440 + b.pts * 20, .06);
        spawnParticles(b.x, b.y, '#ffb347', 8);
        return true;
      }
      return false;
    }

    function reflectTarget(t) {
      if (ball.x > t.x && ball.x < t.x + t.w && ball.y > t.y && ball.y < t.y + t.h) {
        ball.vx = -ball.vx;
        ball.x += ball.vx > 0 ? 2 : -2;
        score += t.pts; api.score(score);
        t.hit = 12; api.beep(600, .05);
        spawnParticles(t.x + t.w/2, t.y + t.h/2, '#7ecaff', 6);
      }
    }

    function flipperEndpoint(base, angle, side) {
      return {
        x: base.x + Math.cos(angle) * FLIP_LEN * side,
        y: base.y + Math.sin(angle) * FLIP_LEN
      };
    }

    function closestPtOnSeg(ax, ay, bx, by, px, py) {
      const dx = bx - ax, dy = by - ay;
      const len2 = dx * dx + dy * dy;
      if (len2 === 0) return { x: ax, y: ay };
      const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
      return { x: ax + t * dx, y: ay + t * dy };
    }

    function checkFlipper(base, angle, side) {
      const tip = flipperEndpoint(base, angle, side);
      const cp = closestPtOnSeg(base.x, base.y, tip.x, tip.y, ball.x, ball.y);
      const dx = ball.x - cp.x, dy = ball.y - cp.y;
      const dist = Math.hypot(dx, dy);
      if (dist < ball.r + FLIP_W / 2) {
        const nx = dx / (dist || 1), ny = dy / (dist || 1);
        const overlap = ball.r + FLIP_W / 2 - dist;
        ball.x += nx * overlap * 1.5; ball.y += ny * overlap * 1.5;
        const dot = ball.vx * nx + ball.vy * ny;
        ball.vx -= 2 * dot * nx; ball.vy -= 2 * dot * ny;
        const flipping = (side === 1 && leftDown) || (side === -1 && rightDown);
        if (flipping) ball.vy = Math.min(ball.vy, -8);
        api.beep(330, .05, 'triangle');
      }
    }

    function update(dt) {
      dt = Math.min(dt, 32);
      const steps = 2;
      for (let s = 0; s < steps; s++) {
        ball.vy += 0.18 * dt / steps;
        ball.x += ball.vx * dt / steps / 8;
        ball.y += ball.vy * dt / steps / 8;
      }
      if (ball.x - ball.r < 0) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); api.beep(220,.04); }
      if (ball.x + ball.r > W) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx); api.beep(220,.04); }
      if (ball.y - ball.r < 0) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); }
      bumpers.forEach(b => { reflectBumper(b); if (b.hit > 0) b.hit--; });
      targets.forEach(t => { reflectTarget(t); if (t.hit > 0) t.hit--; });
      const targetL = leftDown ? FLIP_UP : FLIP_REST;
      const targetR = rightDown ? FLIP_UP : FLIP_REST;
      lFlip += (targetL - lFlip) * 0.35;
      rFlip += (targetR - rFlip) * 0.35;
      checkFlipper(LBASE, lFlip, 1);
      checkFlipper(RBASE, rFlip, -1);
      if (ball.y > H + 20) {
        lives--;
        spawnParticles(ball.x, H - 20, '#ff5555', 12);
        if (lives <= 0) { state = 'over'; }
        else {
          ball = { x: W / 2, y: H / 2, vx: (Math.random() - 0.5) * 3, vy: -5, r: 9 };
          api.beep(180, .2, 'sawtooth');
        }
      }
    }

    function drawFlipper(base, angle, side, active) {
      const tip = flipperEndpoint(base, angle, side);
      const grad = x.createLinearGradient(base.x, base.y, tip.x, tip.y);
      grad.addColorStop(0, active ? '#ffb347' : '#8a80cc');
      grad.addColorStop(1, active ? '#ff9a5c' : '#5a5088');
      x.shadowBlur = active ? 14 : 6;
      x.shadowColor = active ? '#ffb347' : '#8a80cc';
      x.beginPath();
      x.moveTo(base.x, base.y);
      x.lineTo(tip.x, tip.y);
      x.strokeStyle = grad;
      x.lineWidth = FLIP_W;
      x.lineCap = 'round';
      x.stroke();
      x.shadowBlur = 0;
    }

    function draw(ts) {
      const dt = ts - lastTime; lastTime = ts;
      if (state === 'play') update(dt);

      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ffb347';
      const mute = getComputedStyle(document.documentElement).getPropertyValue('--mute').trim() || '#aaa7cf';
      const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#f3f0ff';
      const line = getComputedStyle(document.documentElement).getPropertyValue('--line').trim() || '#3c3c78';

      // gradient bg
      const gradBg = x.createLinearGradient(0, 0, 0, H);
      gradBg.addColorStop(0, '#10102a'); gradBg.addColorStop(1, '#0d1b3e');
      x.fillStyle = gradBg; x.fillRect(0, 0, W, H);

      // guide lines
      x.strokeStyle = line; x.lineWidth = 1.5;
      x.beginPath();
      x.moveTo(0, H - 30); x.lineTo(LBASE.x, LBASE.y);
      x.moveTo(W, H - 30); x.lineTo(RBASE.x, RBASE.y);
      x.stroke();

      // bumpers with glow
      bumpers.forEach(b => {
        x.shadowBlur = b.hit > 0 ? 20 : 8;
        x.shadowColor = b.hit > 0 ? '#ffb347' : accent;
        x.beginPath(); x.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        x.fillStyle = b.hit > 0 ? accent : 'rgba(30,25,70,0.9)';
        x.fill();
        x.strokeStyle = b.hit > 0 ? '#fff' : accent; x.lineWidth = 2.5; x.stroke();
        x.shadowBlur = 0;
        x.fillStyle = b.hit > 0 ? '#1a1030' : mute;
        x.font = 'bold 9px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('+' + b.pts, b.x, b.y);
      });

      // targets
      targets.forEach(t => {
        x.shadowBlur = t.hit > 0 ? 16 : 6;
        x.shadowColor = t.hit > 0 ? '#7ecaff' : accent;
        x.fillStyle = t.hit > 0 ? accent : 'rgba(30,25,70,0.9)';
        x.strokeStyle = t.hit > 0 ? '#fff' : accent;
        x.lineWidth = 2;
        x.beginPath(); x.roundRect(t.x, t.y, t.w, t.h, 4); x.fill(); x.stroke();
        x.shadowBlur = 0;
        x.fillStyle = t.hit > 0 ? '#1a1030' : mute;
        x.font = 'bold 9px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('+' + t.pts, t.x + t.w / 2, t.y + t.h / 2);
      });

      // flippers
      drawFlipper(LBASE, lFlip, 1, leftDown);
      drawFlipper(RBASE, rFlip, -1, rightDown);

      // particles
      particles = particles.filter(p => p.life > 0);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.05;
        x.globalAlpha = p.life; x.fillStyle = p.color;
        x.shadowBlur = 8; x.shadowColor = p.color;
        x.beginPath(); x.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); x.fill();
        x.shadowBlur = 0;
      }
      x.globalAlpha = 1;

      // ball
      if (state !== 'over' || lives > 0) {
        const bg2 = x.createRadialGradient(ball.x - 3, ball.y - 3, 1, ball.x, ball.y, ball.r);
        bg2.addColorStop(0, '#fff');
        bg2.addColorStop(1, accent);
        x.shadowBlur = 16; x.shadowColor = '#ffffff';
        x.beginPath(); x.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        x.fillStyle = bg2; x.fill();
        x.shadowBlur = 0;
        x.font = '10px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('🐾', ball.x, ball.y);
      }

      // HUD pill
      x.font = 'bold 13px system-ui'; x.textAlign = 'left'; x.textBaseline = 'top';
      const scoreText = 'Score: ' + score;
      const livesText = 'Lives: ' + '🐱'.repeat(Math.max(0, lives));
      const sw = x.measureText(scoreText).width;
      x.fillStyle = 'rgba(0,0,0,0.45)';
      x.beginPath(); x.roundRect(6, 6, sw + 14, 22, 8); x.fill();
      x.fillStyle = '#ffffff'; x.fillText(scoreText, 13, 10);
      x.textAlign = 'right';
      const lw = x.measureText(livesText).width;
      x.fillStyle = 'rgba(0,0,0,0.45)';
      x.beginPath(); x.roundRect(W - lw - 20, 6, lw + 14, 22, 8); x.fill();
      x.fillStyle = '#ffffff'; x.fillText(livesText, W - 6, 10);

      // touch zone hints
      x.globalAlpha = 0.07;
      x.fillStyle = accent;
      x.fillRect(0, H - 80, W / 2, 80);
      x.fillRect(W / 2, H - 80, W / 2, 80);
      x.globalAlpha = 1;
      x.fillStyle = mute; x.font = '11px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText('◀ flip', W / 4, H - 18);
      x.fillText('flip ▶', W * 3 / 4, H - 18);

      // overlays
      if (state === 'ready') {
        x.fillStyle = 'rgba(0,0,0,0.55)'; x.fillRect(0, 0, W, H);
        x.shadowBlur = 20; x.shadowColor = accent;
        x.fillStyle = 'rgba(15,10,40,0.92)';
        x.beginPath(); x.roundRect(W/2-120, H/2-60, 240, 120, 16); x.fill();
        x.shadowBlur = 0;
        x.strokeStyle = accent; x.lineWidth = 1.5;
        x.beginPath(); x.roundRect(W/2-120, H/2-60, 240, 120, 16); x.stroke();
        x.fillStyle = ink; x.font = 'bold 28px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('🎯 Cat Pinball', W / 2, H / 2 - 24);
        x.font = '14px system-ui'; x.fillStyle = mute;
        x.fillText('Tap left / right flipper zones', W / 2, H / 2 + 10);
        x.font = 'bold 13px system-ui'; x.fillStyle = accent;
        x.fillText('Tap to start', W / 2, H / 2 + 42);
      }
      if (state === 'over') {
        x.fillStyle = 'rgba(0,0,0,0.65)'; x.fillRect(0, 0, W, H);
        x.shadowBlur = 22; x.shadowColor = '#ff5555';
        x.fillStyle = 'rgba(20,5,5,0.92)';
        x.beginPath(); x.roundRect(W/2-110, H/2-50, 220, 90, 14); x.fill();
        x.shadowBlur = 0;
        x.strokeStyle = '#ff7777'; x.lineWidth = 1.5;
        x.beginPath(); x.roundRect(W/2-110, H/2-50, 220, 90, 14); x.stroke();
        x.fillStyle = ink; x.font = 'bold 26px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('Game Over', W / 2, H / 2 - 16);
        x.font = '17px system-ui'; x.fillStyle = accent;
        x.fillText('Score: ' + score, W / 2, H / 2 + 14);
        x.font = '13px system-ui'; x.fillStyle = mute;
        x.fillText('Tap to play again', W / 2, H / 2 + 38);
      }

      raf = requestAnimationFrame(draw);
    }

    c.addEventListener('pointerdown', e => {
      const r = c.getBoundingClientRect();
      const tx = (e.clientX - r.left) / r.width;
      if (state === 'ready') { state = 'play'; lastTime = performance.now(); return; }
      if (state === 'over') { reset(); state = 'play'; lastTime = performance.now(); return; }
      if (tx < 0.5) leftDown = true; else rightDown = true;
    });
    c.addEventListener('pointerup', e => {
      const r = c.getBoundingClientRect();
      const tx = (e.clientX - r.left) / r.width;
      if (tx < 0.5) leftDown = false; else rightDown = false;
    });
    c.addEventListener('pointercancel', () => { leftDown = false; rightDown = false; });

    const keys = {};
    const kd = e => {
      if (e.key === 'z' || e.key === 'Z') leftDown = true;
      if (e.key === '/') rightDown = true;
    };
    const ku = e => {
      if (e.key === 'z' || e.key === 'Z') leftDown = false;
      if (e.key === '/') rightDown = false;
    };
    document.addEventListener('keydown', kd);
    document.addEventListener('keyup', ku);

    reset();
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', kd);
      document.removeEventListener('keyup', ku);
    };
  }
});
