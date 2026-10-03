Pawcade.register({
  id: 'gravcat', title: 'Gravity Cat', emoji: '🙃', tags: 'arcade reflex one-button',
  blurb: 'Tap to flip gravity. Dodge the spikes — top and bottom!',
  mount(el, api) {
    const W = 320, H = 260;
    const c = document.createElement('canvas');
    c.width = W; c.height = H; c.className = 'board'; c.style.touchAction = 'none';
    const hint = document.createElement('p'); hint.className = 'hint';
    hint.textContent = '📱 Tap anywhere to flip gravity · Survive as long as possible';
    el.append(c, hint);
    const ctx = c.getContext('2d');

    const CAT_X = 70, CAT_R = 12, SPIKE_W = 18, SPIKE_H = 22, SPEED_BASE = 3;
    let cat, spikes, score, state, raf, frame, grav, speed, gap, nextSpike, particles;

    function mkSpike(x) {
      const gapY = 30 + Math.random() * (H - 60), gapH = 70 + Math.random() * 30;
      const cols = [];
      for (let y = SPIKE_H; y < gapY - 4; y += SPIKE_H + 2) cols.push({ x, y, up: false });
      for (let y = gapY + gapH; y < H; y += SPIKE_H + 2) cols.push({ x, y, up: true });
      return { x, cols, gapY, gapH };
    }
    function burst(x, y) {
      for (let i = 0; i < 10; i++) particles.push({
        x, y, vx:(Math.random()-.5)*4, vy:(Math.random()-.5)*4,
        life: 1, color: '#ff6b6b', size: 2 + Math.random()*2
      });
    }
    function reset() {
      cat = { y: H/2, vy: 0 }; grav = 1; speed = SPEED_BASE; score = 0; frame = 0;
      spikes = []; nextSpike = 90; particles = []; state = 'ready';
    }
    function flipGrav() {
      if (state === 'ready') { state = 'play'; return; }
      if (state === 'over') { reset(); return; }
      grav = -grav; cat.vy = grav * -5; api.beep(600, .04);
      // flip trail
      for (let i = 0; i < 5; i++) particles.push({
        x: CAT_X + (Math.random()-.5)*16, y: cat.y + (Math.random()-.5)*16,
        vx: (Math.random()-.5)*2, vy: (Math.random()-.5)*2,
        life: 0.8, color: '#7ecaff', size: 2
      });
    }

    function tick() {
      if (state === 'play') {
        frame++; score = Math.floor(frame / 6);
        speed = SPEED_BASE + score * 0.015;
        cat.vy += grav * 0.42; cat.y += cat.vy;
        // cat trail particles
        if (frame % 3 === 0) {
          particles.push({ x: CAT_X - 8, y: cat.y, vx: -1 + (Math.random()-.5),
            vy: (Math.random()-.5)*1.5, life: 0.6, color: '#7ecaff', size: 1.5 });
        }
        if (cat.y < CAT_R + 2 || cat.y > H - CAT_R - 2) {
          burst(CAT_X, cat.y); state = 'over'; api.score(score); api.beep(120,.4,'sawtooth');
        } else {
          spikes.forEach(s => { s.x -= speed; s.cols.forEach(col => col.x -= speed); });
          spikes = spikes.filter(s => s.x > -SPIKE_W - 10);
          if (frame >= nextSpike) {
            spikes.push(mkSpike(W + 10));
            nextSpike = frame + Math.max(55, 110 - score * 0.3);
          }
          for (const s of spikes) {
            for (const col of s.cols) {
              if (Math.abs(col.x - CAT_X) < CAT_R + SPIKE_W/2 - 4 && Math.abs(col.y - cat.y) < CAT_R + SPIKE_H/2 - 4) {
                burst(CAT_X, cat.y); state = 'over'; api.score(score); api.beep(120,.4,'sawtooth');
              }
            }
          }
        }
      }
      particles = particles.filter(p => p.life > 0);
      for (const p of particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life -= 0.05; }
      draw(); raf = requestAnimationFrame(tick);
    }

    function draw() {
      const cs = getComputedStyle(el);
      const accent = cs.getPropertyValue('--accent').trim();
      const ink = cs.getPropertyValue('--ink').trim();

      // gradient bg
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#12122a'); grad.addColorStop(1, '#0d1b3e');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

      // top/bottom danger strips
      ctx.fillStyle = 'rgba(220,50,50,.15)'; ctx.fillRect(0,0,W,6); ctx.fillRect(0,H-6,W,6);

      // spikes with red glow
      spikes.forEach(s => {
        s.cols.forEach(col => {
          ctx.shadowBlur = 10; ctx.shadowColor = '#ff3333';
          ctx.fillStyle = '#e44';
          ctx.beginPath();
          if (col.up) { ctx.moveTo(col.x-SPIKE_W/2,col.y+SPIKE_H/2); ctx.lineTo(col.x,col.y-SPIKE_H/2); ctx.lineTo(col.x+SPIKE_W/2,col.y+SPIKE_H/2); }
          else { ctx.moveTo(col.x-SPIKE_W/2,col.y-SPIKE_H/2); ctx.lineTo(col.x,col.y+SPIKE_H/2); ctx.lineTo(col.x+SPIKE_W/2,col.y-SPIKE_H/2); }
          ctx.closePath(); ctx.fill();
          ctx.shadowBlur = 0;
        });
      });

      // particles
      particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8; ctx.shadowColor = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, (p.size||2) * p.life, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
      });
      ctx.globalAlpha = 1;

      // cat with glow
      ctx.shadowBlur = 14; ctx.shadowColor = '#7ecaff';
      ctx.save(); ctx.translate(CAT_X, cat.y); ctx.scale(1, grav);
      if (window.Sprites) Sprites.draw(ctx,'cat',0,0,2,false);
      else { ctx.font='22px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('🐱',0,0); }
      ctx.restore();
      ctx.shadowBlur = 0;

      // gravity arrow with glow
      ctx.shadowBlur = 8; ctx.shadowColor = accent;
      ctx.fillStyle = accent; ctx.font = '16px serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(grav > 0 ? '▼' : '▲', 6, H/2);
      ctx.shadowBlur = 0;

      // HUD pill
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath(); ctx.roundRect(W - 110, 2, 106, 22, 6); ctx.fill();
      ctx.fillStyle = ink; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText('Score: ' + score, W - 6, 13);

      if (state === 'ready') {
        ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, H/2-22, W, 38);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('Tap to flip gravity and start!', W/2, H/2);
      }
      if (state === 'over') {
        ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, H/2-28, W, 50);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('💥 Score: ' + score, W/2, H/2-8);
        ctx.font = '13px system-ui'; ctx.fillText('Tap to try again', W/2, H/2+14);
      }
    }

    c.addEventListener('pointerdown', () => flipGrav());
    document.addEventListener('keydown', e => { if(e.code==='Space'){e.preventDefault();flipGrav();} });
    reset(); tick();
    return () => cancelAnimationFrame(raf);
  }
});
