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

    // ── State ──────────────────────────────────────────────────────────
    let score = 0, lives = 3, state = 'ready'; // ready | play | over
    let ball, lFlip, rFlip, leftDown = false, rightDown = false;
    let bumpers, targets, lastTime = 0, raf;

    const FLIP_LEN = 55, FLIP_W = 10;
    const LBASE = { x: 72, y: H - 46 };
    const RBASE = { x: W - 72, y: H - 46 };
    const FLIP_REST = 28 * Math.PI / 180;  // angle down
    const FLIP_UP   = -20 * Math.PI / 180; // angle up

    function makeBumper(bx, by, r, pts) { return { x: bx, y: by, r, pts, hit: 0 }; }
    function makeTarget(tx, ty, w, h, pts) { return { x: tx, y: ty, w, h, pts, hit: 0 }; }

    function reset() {
      score = 0; lives = 3; state = 'ready';
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

    // ── Collision helpers ──────────────────────────────────────────────
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
      }
    }

    // Flipper: line segment collision
    function flipperEndpoint(base, angle, side) {
      // side: 1=right (left flipper), -1=left (right flipper)
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
        // add flipper velocity boost when flipping up
        const flipping = (side === 1 && leftDown) || (side === -1 && rightDown);
        if (flipping) ball.vy = Math.min(ball.vy, -8);
        api.beep(330, .05, 'triangle');
      }
    }

    // ── Update ─────────────────────────────────────────────────────────
    function update(dt) {
      dt = Math.min(dt, 32);
      const steps = 2;
      for (let s = 0; s < steps; s++) {
        ball.vy += 0.18 * dt / steps;
        ball.x += ball.vx * dt / steps / 8;
        ball.y += ball.vy * dt / steps / 8;
      }

      // walls
      if (ball.x - ball.r < 0) { ball.x = ball.r; ball.vx = Math.abs(ball.vx); api.beep(220,.04); }
      if (ball.x + ball.r > W) { ball.x = W - ball.r; ball.vx = -Math.abs(ball.vx); api.beep(220,.04); }
      if (ball.y - ball.r < 0) { ball.y = ball.r; ball.vy = Math.abs(ball.vy); }

      // bumpers
      bumpers.forEach(b => { reflectBumper(b); if (b.hit > 0) b.hit--; });
      targets.forEach(t => { reflectTarget(t); if (t.hit > 0) t.hit--; });

      // flippers
      const targetL = leftDown ? FLIP_UP : FLIP_REST;
      const targetR = rightDown ? FLIP_UP : FLIP_REST;
      lFlip += (targetL - lFlip) * 0.35;
      rFlip += (targetR - rFlip) * 0.35;
      checkFlipper(LBASE, lFlip, 1);
      checkFlipper(RBASE, rFlip, -1);

      // lost ball
      if (ball.y > H + 20) {
        lives--;
        if (lives <= 0) { state = 'over'; }
        else {
          ball = { x: W / 2, y: H / 2, vx: (Math.random() - 0.5) * 3, vy: -5, r: 9 };
          api.beep(180, .2, 'sawtooth');
        }
      }
    }

    // ── Draw ───────────────────────────────────────────────────────────
    function drawFlipper(base, angle, side, active) {
      const tip = flipperEndpoint(base, angle, side);
      const grad = x.createLinearGradient(base.x, base.y, tip.x, tip.y);
      grad.addColorStop(0, active ? '#ffb347' : '#8a80cc');
      grad.addColorStop(1, active ? '#ff9a5c' : '#5a5088');
      x.beginPath();
      x.moveTo(base.x, base.y);
      x.lineTo(tip.x, tip.y);
      x.strokeStyle = grad;
      x.lineWidth = FLIP_W;
      x.lineCap = 'round';
      x.stroke();
    }

    function draw(ts) {
      const dt = ts - lastTime; lastTime = ts;
      if (state === 'play') update(dt);

      const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#16162b';
      const panel = getComputedStyle(document.documentElement).getPropertyValue('--panel').trim() || '#23234a';
      const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#f3f0ff';
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ffb347';
      const mute = getComputedStyle(document.documentElement).getPropertyValue('--mute').trim() || '#aaa7cf';
      const line = getComputedStyle(document.documentElement).getPropertyValue('--line').trim() || '#3c3c78';

      x.fillStyle = bg;
      x.fillRect(0, 0, W, H);

      // guide lines
      x.strokeStyle = line; x.lineWidth = 1.5;
      x.beginPath();
      x.moveTo(0, H - 30); x.lineTo(LBASE.x, LBASE.y);
      x.moveTo(W, H - 30); x.lineTo(RBASE.x, RBASE.y);
      x.stroke();

      // bumpers
      bumpers.forEach(b => {
        x.beginPath(); x.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        x.fillStyle = b.hit > 0 ? accent : panel;
        x.fill(); x.strokeStyle = b.hit > 0 ? '#fff' : accent; x.lineWidth = 2.5; x.stroke();
        x.fillStyle = b.hit > 0 ? '#1a1030' : mute;
        x.font = 'bold 9px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('+' + b.pts, b.x, b.y);
      });

      // targets
      targets.forEach(t => {
        x.fillStyle = t.hit > 0 ? accent : panel;
        x.strokeStyle = t.hit > 0 ? '#fff' : accent;
        x.lineWidth = 2;
        x.beginPath(); x.roundRect(t.x, t.y, t.w, t.h, 4); x.fill(); x.stroke();
        x.fillStyle = t.hit > 0 ? '#1a1030' : mute;
        x.font = 'bold 9px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('+' + t.pts, t.x + t.w / 2, t.y + t.h / 2);
      });

      // flippers
      drawFlipper(LBASE, lFlip, 1, leftDown);
      drawFlipper(RBASE, rFlip, -1, rightDown);

      // ball
      if (state !== 'over' || lives > 0) {
        const bg2 = x.createRadialGradient(ball.x - 3, ball.y - 3, 1, ball.x, ball.y, ball.r);
        bg2.addColorStop(0, '#fff');
        bg2.addColorStop(1, accent);
        x.beginPath(); x.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        x.fillStyle = bg2; x.fill();
        x.font = '10px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('🐾', ball.x, ball.y);
      }

      // HUD
      x.fillStyle = ink; x.font = 'bold 14px system-ui'; x.textAlign = 'left'; x.textBaseline = 'top';
      x.fillText('Score: ' + score, 10, 10);
      x.textAlign = 'right';
      x.fillText('Lives: ' + '🐱'.repeat(Math.max(0, lives)), W - 8, 10);

      // touch zone hints (faint)
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
        x.fillStyle = 'rgba(0,0,0,0.5)'; x.fillRect(0, 0, W, H);
        x.fillStyle = ink; x.font = 'bold 32px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('🎯 Cat Pinball', W / 2, H / 2 - 30);
        x.font = '15px system-ui'; x.fillStyle = mute;
        x.fillText('Tap left / right flipper zones', W / 2, H / 2 + 10);
        x.fillText('to keep the ball in play!', W / 2, H / 2 + 32);
        x.font = 'bold 14px system-ui'; x.fillStyle = accent;
        x.fillText('Tap to start', W / 2, H / 2 + 70);
      }
      if (state === 'over') {
        x.fillStyle = 'rgba(0,0,0,0.6)'; x.fillRect(0, 0, W, H);
        x.fillStyle = ink; x.font = 'bold 28px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('Game Over', W / 2, H / 2 - 24);
        x.font = '18px system-ui'; x.fillStyle = accent;
        x.fillText('Score: ' + score, W / 2, H / 2 + 10);
        x.font = '14px system-ui'; x.fillStyle = mute;
        x.fillText('Tap to play again', W / 2, H / 2 + 42);
      }

      raf = requestAnimationFrame(draw);
    }

    // ── Input ──────────────────────────────────────────────────────────
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

    // keyboard fallback
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
