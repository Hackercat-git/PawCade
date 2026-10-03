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
      // each obstacle is a gap with spikes above and below; gap position varies
      const gapY = 30 + Math.random() * (H - 60), gapH = 70 + Math.random() * 30;
      const cols = [];
      // top spikes from y=0 to gapY
      for (let y = SPIKE_H; y < gapY - 4; y += SPIKE_H + 2) cols.push({ x, y, up: false });
      // bottom spikes from gapY+gapH to H
      for (let y = gapY + gapH; y < H; y += SPIKE_H + 2) cols.push({ x, y, up: true });
      return { x, cols, gapY, gapH };
    }
    function burst(x, y) {
      for (let i = 0; i < 8; i++) particles.push({ x, y, vx:(Math.random()-.5)*4, vy:(Math.random()-.5)*4, life:1 });
    }
    function reset() {
      cat = { y: H/2, vy: 0 }; grav = 1; speed = SPEED_BASE; score = 0; frame = 0;
      spikes = []; nextSpike = 90; particles = []; state = 'ready';
    }
    function flipGrav() {
      if (state === 'ready') { state = 'play'; return; }
      if (state === 'over') { reset(); return; }
      grav = -grav; cat.vy = grav * -5; api.beep(600, .04);
    }

    function tick() {
      if (state === 'play') {
        frame++; score = Math.floor(frame / 6);
        speed = SPEED_BASE + score * 0.015;
        cat.vy += grav * 0.42; cat.y += cat.vy;
        // wall collision
        if (cat.y < CAT_R + 2 || cat.y > H - CAT_R - 2) {
          burst(CAT_X, cat.y); state = 'over'; api.score(score); api.beep(120,.4,'sawtooth'); return;
        }
        // move spikes
        spikes.forEach(s => { s.x -= speed; s.cols.forEach(col => col.x -= speed); });
        spikes = spikes.filter(s => s.x > -SPIKE_W - 10);
        if (frame >= nextSpike) {
          spikes.push(mkSpike(W + 10));
          nextSpike = frame + Math.max(55, 110 - score * 0.3);
        }
        // collision
        for (const s of spikes) {
          for (const col of s.cols) {
            if (Math.abs(col.x - CAT_X) < CAT_R + SPIKE_W/2 - 4 && Math.abs(col.y - cat.y) < CAT_R + SPIKE_H/2 - 4) {
              burst(CAT_X, cat.y); state = 'over'; api.score(score); api.beep(120,.4,'sawtooth');
            }
          }
        }
      }
      particles.forEach(p => { p.x+=p.vx; p.y+=p.vy; p.life-=.06; });
      particles = particles.filter(p => p.life > 0);
      draw(); raf = requestAnimationFrame(tick);
    }

    function draw() {
      const cs = getComputedStyle(el);
      const bg = cs.getPropertyValue('--bg').trim(), accent = cs.getPropertyValue('--accent').trim();
      const ink = cs.getPropertyValue('--ink').trim(), line = cs.getPropertyValue('--line').trim();
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      // top/bottom danger strips
      ctx.fillStyle = 'rgba(220,50,50,.12)'; ctx.fillRect(0,0,W,6); ctx.fillRect(0,H-6,W,6);
      // spikes
      spikes.forEach(s => {
        s.cols.forEach(col => {
          ctx.fillStyle = col.up ? '#e44' : '#e44';
          ctx.beginPath();
          if (col.up) { ctx.moveTo(col.x-SPIKE_W/2,col.y+SPIKE_H/2); ctx.lineTo(col.x,col.y-SPIKE_H/2); ctx.lineTo(col.x+SPIKE_W/2,col.y+SPIKE_H/2); }
          else { ctx.moveTo(col.x-SPIKE_W/2,col.y-SPIKE_H/2); ctx.lineTo(col.x,col.y+SPIKE_H/2); ctx.lineTo(col.x+SPIKE_W/2,col.y-SPIKE_H/2); }
          ctx.closePath(); ctx.fill();
        });
      });
      // particles
      particles.forEach(p => { ctx.globalAlpha=p.life; ctx.fillStyle=accent; ctx.fillRect(p.x-2,p.y-2,4,4); });
      ctx.globalAlpha=1;
      // cat (flips with gravity)
      ctx.save(); ctx.translate(CAT_X, cat.y); ctx.scale(1, grav);
      if (window.Sprites) Sprites.draw(ctx,'cat',0,0,2,false);
      else { ctx.font='22px serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('🐱',0,0); }
      ctx.restore();
      // gravity arrow
      ctx.fillStyle=accent; ctx.font='16px serif'; ctx.textAlign='left'; ctx.textBaseline='middle';
      ctx.fillText(grav > 0 ? '▼' : '▲', 6, H/2);
      // HUD
      ctx.fillStyle=ink; ctx.font='bold 13px system-ui'; ctx.textAlign='right'; ctx.textBaseline='top';
      ctx.fillText('Score: '+score, W-6, 5);
      if (state==='ready') {
        ctx.fillStyle='rgba(0,0,0,.5)'; ctx.fillRect(0,H/2-22,W,38);
        ctx.fillStyle='#fff'; ctx.font='bold 14px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('Tap to flip gravity and start!', W/2, H/2);
      }
      if (state==='over') {
        ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fillRect(0,H/2-28,W,50);
        ctx.fillStyle='#fff'; ctx.font='bold 16px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('💥 Score: '+score, W/2, H/2-8);
        ctx.font='13px system-ui'; ctx.fillText('Tap to try again', W/2, H/2+14);
      }
    }

    c.addEventListener('pointerdown', () => flipGrav());
    document.addEventListener('keydown', e => { if(e.code==='Space'){e.preventDefault();flipGrav();} });
    reset(); tick();
    return () => cancelAnimationFrame(raf);
  }
});
