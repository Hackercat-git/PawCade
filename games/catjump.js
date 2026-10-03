Pawcade.register({
  id: 'catjump', title: 'Cat Jump', emoji: '🪂', tags: 'arcade reflex one-button',
  blurb: 'Jump as high as you can! Hold left/right to move. Auto-jump on platforms.',
  mount(el, api) {
    const W = 300, H = 460;
    const c = document.createElement('canvas');
    c.width = W; c.height = H; c.className = 'board'; c.style.touchAction = 'none';
    const hint = document.createElement('p'); hint.className = 'hint';
    hint.textContent = '📱 Hold left half = move left · Hold right half = move right';
    el.append(c, hint);
    const ctx = c.getContext('2d');

    const PLAT_W = 56, PLAT_H = 10, CAT_W = 20, CAT_H = 18;
    let cat, plats, score, best, state, raf, camY, holdL, holdH, particles;

    function spawnParticles(px, py, col, n) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, spd = 1.5 + Math.random() * 3;
        particles.push({ x: px, y: py, vx: Math.cos(a)*spd, vy: Math.sin(a)*spd, life: 1, size: 2+Math.random()*3, color: col });
      }
    }
    function mkPlat(y) {
      return { x: 20 + Math.random() * (W - PLAT_W - 40), y, spring: Math.random() < 0.12, broken: Math.random() < 0.1, cracked: false };
    }
    function reset() {
      camY = 0; score = 0; holdL = false; holdH = false; particles = [];
      cat = { x: W / 2, y: H - 80, vx: 0, vy: -12, w: CAT_W, h: CAT_H };
      plats = [{ x: W/2 - PLAT_W/2, y: H - 40, spring: false, broken: false, cracked: false }];
      for (let y = H - 120; y > -200; y -= 60 + Math.random() * 40) plats.push(mkPlat(y));
      state = 'play'; best = best || 0;
    }

    function tick() {
      if (state === 'play') {
        if (holdL) cat.vx = Math.max(cat.vx - 1.2, -5);
        else if (holdH) cat.vx = Math.min(cat.vx + 1.2, 5);
        else cat.vx *= 0.82;
        cat.x += cat.vx;
        if (cat.x < -CAT_W) cat.x = W + CAT_W;
        if (cat.x > W + CAT_W) cat.x = -CAT_W;
        cat.vy += 0.38; cat.y += cat.vy;
        if (cat.vy > 0) {
          for (const p of plats) {
            const cx = cat.x - cat.w/2, cy = cat.y;
            if (cx < p.x + PLAT_W && cx + cat.w > p.x && cy > p.y - 6 && cy < p.y + 8) {
              if (p.broken) { p.cracked = true; setTimeout(() => { p.broken = 'gone'; }, 150); continue; }
              if (p.broken === 'gone') continue;
              cat.vy = p.spring ? -18 : -12.5;
              if (p.spring) { api.beep(900, .06); spawnParticles(p.x+PLAT_W/2, p.y-camY, '#4aeeff', 10); }
              else { api.beep(500 + Math.random()*100, .04); }
              break;
            }
          }
        }
        const screenY = cat.y - camY;
        if (screenY < H * 0.45) { const d = H * 0.45 - screenY; camY -= d; score = Math.max(score, Math.round(-camY / 40)); }
        if (cat.y - camY > H + 40) { state = 'over'; best = Math.max(best, score); api.score(score); api.beep(150, .4, 'sawtooth'); spawnParticles(cat.x - camY, H, '#ff5555', 16); }
        const top = plats.reduce((m, p) => Math.min(m, p.y), 9999);
        if (top > camY - 100) plats.push(mkPlat(camY - 80 - Math.random() * 60));
        plats = plats.filter(p => p.y < camY + H + 100);
      }
      draw(); raf = requestAnimationFrame(tick);
    }

    function draw() {
      const cs = getComputedStyle(el);
      const accent = cs.getPropertyValue('--accent').trim();
      const ink = cs.getPropertyValue('--ink').trim();
      // gradient bg
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#060618'); grad.addColorStop(1, '#12122a');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      // stars
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      for (let i = 0; i < 30; i++) { const sx=(i*83+7)%W,sy=((i*137+camY*0.05|0)+H)%H; ctx.fillRect(sx,sy,1,1); }
      // platforms
      plats.forEach(p => {
        const py = p.y - camY;
        if (py < -20 || py > H + 20) return;
        ctx.globalAlpha = p.broken === 'gone' ? 0.2 : 1;
        if (p.spring) {
          ctx.shadowBlur = 12; ctx.shadowColor = '#4aeeff';
          ctx.fillStyle = '#4aeeff';
        } else if (p.cracked || p.broken === 'gone') {
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#553';
        } else {
          ctx.shadowBlur = 8; ctx.shadowColor = accent;
          ctx.fillStyle = accent;
        }
        ctx.beginPath(); ctx.roundRect(p.x, py, PLAT_W, PLAT_H, 4); ctx.fill();
        ctx.shadowBlur = 0;
        if (p.spring) { ctx.fillStyle='#fff'; ctx.font='10px serif'; ctx.textAlign='center'; ctx.fillText('🌀',p.x+PLAT_W/2,py+2); }
        ctx.globalAlpha = 1;
      });
      // particles
      particles = particles.filter(p => p.life > 0);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.06;
        ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
        ctx.shadowBlur = 8; ctx.shadowColor = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
      // cat
      const cy = cat.y - camY;
      ctx.save(); ctx.translate(cat.x, cy);
      if (cat.vy < 0) { ctx.shadowBlur = 14; ctx.shadowColor = '#7ecaff'; }
      if (window.Sprites) {
        Sprites.draw(ctx, 'cat', 0, 0, 2, cat.vx < 0);
      } else {
        ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🐱', 0, 0);
      }
      ctx.shadowBlur = 0;
      ctx.restore();
      // HUD pill
      const hudText = 'Height: ' + score + (best ? '  Best: ' + best : '');
      ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      const tw = ctx.measureText(hudText).width;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath(); ctx.roundRect(4, 4, tw + 16, 22, 8); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.fillText(hudText, 12, 8);
      // touch hint zones (subtle)
      ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fillRect(0, 0, W/2, H);
      ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fillRect(W/2, 0, W/2, H);
      if (state === 'over') {
        ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(0, 0, W, H);
        ctx.shadowBlur = 20; ctx.shadowColor = '#7ecaff';
        ctx.fillStyle = 'rgba(10,10,40,0.92)';
        ctx.beginPath(); ctx.roundRect(W/2-110, H/2-40, 220, 72, 14); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#7ecaff'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(W/2-110, H/2-40, 220, 72, 14); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🐱 Reached height ' + score + '!', W/2, H/2 - 12);
        ctx.font = '13px system-ui'; ctx.fillText('Tap to play again', W/2, H/2 + 14);
      }
    }

    c.addEventListener('pointerdown', e => {
      if (state === 'over') { reset(); return; }
      const r = c.getBoundingClientRect();
      if ((e.clientX - r.left) / r.width < 0.5) holdL = true; else holdH = true;
    });
    c.addEventListener('pointerup', () => { holdL = false; holdH = false; });
    c.addEventListener('pointercancel', () => { holdL = false; holdH = false; });
    c.addEventListener('pointermove', e => {
      if (e.buttons === 0) return;
      const r = c.getBoundingClientRect(), tx = (e.clientX - r.left) / r.width;
      if (e.pointerId % 2 === 0) { if (tx < 0.5) holdL = true; else holdH = true; }
    });
    reset(); tick();
    return () => { cancelAnimationFrame(raf); };
  }
});
