Pawcade.register({
  id: 'pong', title: 'Paddle Pounce', emoji: '🏓', tags: 'arcade classic pong',
  blurb: 'Pong against the computer. You lose after three misses.',
  mount(el, api) {
    const W = 360, H = 240, PH = 50, PR = 6, c = document.createElement('canvas');
    c.width = W; c.height = H; c.className = 'board';
    const hint = document.createElement('p'); hint.className = 'hint'; hint.textContent = '📱 Drag to move paddle · ⌨️ W/S or arrow keys · tap to restart';
    el.append(c, hint);
    const x = c.getContext('2d'), keys = {};
    let py, ay, bx, by, vx, vy, sc, miss, over, raf, trail, particles;
    function spawnParticles(px, py, col, n) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, spd = 1.5 + Math.random() * 3;
        particles.push({ x: px, y: py, vx: Math.cos(a)*spd, vy: Math.sin(a)*spd, life: 1, size: 2+Math.random()*3, color: col });
      }
    }
    function serve(dir) { bx = W / 2; by = H / 2; vx = 3.2 * dir; vy = (Math.random() * 2 - 1) * 2; trail = []; }
    function reset() { py = ay = H / 2; sc = 0; miss = 0; over = false; particles = []; serve(1); }
    function tick() {
      if (!over) {
        if (keys.ArrowUp || keys.w) py -= 4.5; if (keys.ArrowDown || keys.s) py += 4.5;
        py = Math.max(PH / 2, Math.min(H - PH / 2, py));
        bx += vx; by += vy;
        trail.push([bx, by]); if (trail.length > 6) trail.shift();
        if (by < PR || by > H - PR) { vy = -vy; by = Math.max(PR, Math.min(H - PR, by)); api.beep(300, .03); }
        const aiSpd = Math.min(3.5, Math.abs(vx) * .55);
        ay += Math.max(-aiSpd, Math.min(aiSpd, by - ay));
        if (vx < 0 && bx < 26 && bx > 14 && Math.abs(by - py) < PH / 2 + PR) {
          vx = Math.abs(vx) * 1.07 + .1; vy += (by - py) * .09; bx = 26; api.beep(500, .04);
          spawnParticles(bx, by, '#7ecaff', 8);
        }
        if (vx > 0 && bx > W - 26 && bx < W - 14 && Math.abs(by - ay) < PH / 2 + PR) {
          vx = -(Math.abs(vx) * 1.04 + .1); vy += (by - ay) * .05; bx = W - 26; api.beep(400, .04);
          spawnParticles(bx, by, '#ffb347', 8);
        }
        vx = Math.max(-11, Math.min(11, vx)); vy = Math.max(-7, Math.min(7, vy));
        if (bx < 0) { miss++; api.beep(150, .2, 'sawtooth'); spawnParticles(10, by, '#ff5555', 12); if (miss >= 3) { over = true; api.score(sc); } else serve(1); }
        if (bx > W) { sc++; api.beep(800, .08); spawnParticles(W-10, by, '#ffff55', 12); serve(-1); }
      }
      draw(); raf = requestAnimationFrame(tick);
    }
    function draw() {
      const cs = getComputedStyle(el);
      const accent = cs.getPropertyValue('--accent').trim();
      const ink = cs.getPropertyValue('--ink').trim();
      const line = cs.getPropertyValue('--line').trim();
      // gradient bg
      const grad = x.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#12122a'); grad.addColorStop(1, '#0d1b3e');
      x.fillStyle = grad; x.fillRect(0, 0, W, H);
      // center line
      x.setLineDash([6, 6]); x.strokeStyle = 'rgba(255,255,255,0.15)'; x.lineWidth = 1.5;
      x.beginPath(); x.moveTo(W / 2, 0); x.lineTo(W / 2, H); x.stroke(); x.setLineDash([]);
      // ball trail
      trail.forEach((p, i) => {
        x.globalAlpha = (i + 1) / trail.length * .35;
        x.fillStyle = accent; x.beginPath(); x.arc(p[0], p[1], PR * .8, 0, 7); x.fill();
      });
      x.globalAlpha = 1;
      // particles
      particles = particles.filter(p => p.life > 0);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life -= 0.06;
        x.globalAlpha = p.life; x.fillStyle = p.color;
        x.shadowBlur = 8; x.shadowColor = p.color;
        x.beginPath(); x.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); x.fill();
        x.shadowBlur = 0;
      }
      x.globalAlpha = 1;
      // player paddle (glow)
      x.shadowBlur = 14; x.shadowColor = '#7ecaff';
      x.fillStyle = accent;
      x.beginPath(); x.roundRect(10, py - PH / 2, 8, PH, 4); x.fill();
      x.shadowBlur = 0;
      // AI paddle
      x.shadowBlur = 10; x.shadowColor = '#ffb347';
      x.fillStyle = '#ffb347';
      x.beginPath(); x.roundRect(W - 18, ay - PH / 2, 8, PH, 4); x.fill();
      x.shadowBlur = 0;
      // ball (glow)
      x.shadowBlur = 18; x.shadowColor = '#ffffff';
      x.fillStyle = '#ffffff'; x.beginPath(); x.arc(bx, by, PR, 0, 7); x.fill();
      x.shadowBlur = 0;
      // hud pill
      const hudText = 'Points ' + sc + '   Misses ' + miss + '/3';
      x.font = 'bold 13px system-ui'; x.textAlign = 'center';
      const tw = x.measureText(hudText).width;
      x.fillStyle = 'rgba(0,0,0,0.45)';
      x.beginPath(); x.roundRect(W/2 - tw/2 - 10, 4, tw + 20, 22, 8); x.fill();
      x.fillStyle = '#ffffff'; x.textBaseline = 'middle'; x.fillText(hudText, W / 2, 15);
      x.textBaseline = 'alphabetic';
      if (over) {
        x.fillStyle = 'rgba(0,0,0,0.65)'; x.fillRect(0, 0, W, H);
        x.shadowBlur = 20; x.shadowColor = '#7ecaff';
        x.fillStyle = 'rgba(20,20,60,0.9)';
        x.beginPath(); x.roundRect(W/2-120, H/2-28, 240, 56, 12); x.fill();
        x.shadowBlur = 0;
        x.strokeStyle = '#7ecaff'; x.lineWidth = 1.5;
        x.beginPath(); x.roundRect(W/2-120, H/2-28, 240, 56, 12); x.stroke();
        x.fillStyle = '#fff'; x.font = 'bold 15px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('Game over — Space or tap to restart', W / 2, H / 2);
        x.textBaseline = 'alphabetic';
      }
    }
    const kd = e => { keys[e.key] = true; if (e.key.startsWith('Arrow') || e.key == ' ') e.preventDefault(); if (e.key == ' ' && over) reset(); };
    const ku = e => keys[e.key] = false;
    c.onpointermove = e => { if (e.buttons || e.pointerType !== 'mouse') { const r = c.getBoundingClientRect(); py = (e.clientY - r.top) * H / r.height; } };
    c.onpointerdown = e => { const r = c.getBoundingClientRect(); py = Math.max(PH/2, Math.min(H - PH/2, (e.clientY - r.top) * H / r.height)); if (over) reset(); };
    c.style.touchAction = 'none';
    document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
    reset(); tick();
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); };
  }
});
