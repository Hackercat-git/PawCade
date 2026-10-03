Pawcade.register({
  id: 'darts', title: 'Cat Darts', emoji: '🎯', tags: 'arcade reflex clicking',
  blurb: 'Hit the cat dartboard! 3 darts per round, aim for the bullseye.',
  mount(el, api) {
    const W = 320, H = 360;
    const c = document.createElement('canvas');
    c.width = W; c.height = H; c.className = 'board';
    const hint = document.createElement('p'); hint.className = 'hint';
    hint.textContent = 'Click / tap when the crosshair is on target!';
    el.append(c, hint);
    const ctx = c.getContext('2d');

    const CX = W / 2, CY = H / 2 - 10;
    const RINGS = [
      { r: 16, pts: 50, label: '🐱' },
      { r: 34, pts: 25, label: '🐾' },
      { r: 56, pts: 10, label: '' },
      { r: 80, pts: 5,  label: '' },
      { r: 108, pts: 1, label: '' },
    ];
    const DARTS_PER_ROUND = 3, ROUNDS = 5;

    let ax, ay, phase, spd, state, round, darts, roundScore, total, thrown, raf, frame, particles;

    function reset() {
      total = 0; round = 0; state = 'ready'; frame = 0; particles = [];
      startRound();
    }

    function startRound() {
      darts = DARTS_PER_ROUND; roundScore = 0; thrown = [];
      ax = CX; ay = CY;
      const diff = 1 + round * 0.35;
      spd = diff;
      phase = Math.random() * Math.PI * 2;
      state = round < ROUNDS ? 'play' : 'done';
    }

    function throwDart() {
      if (state !== 'play') { reset(); return; }
      const dx = ax - CX, dy = ay - CY;
      const dist = Math.hypot(dx, dy);
      let pts = 0;
      for (const r of RINGS) {
        if (dist <= r.r) { pts = r.pts; break; }
      }
      api.beep(pts >= 25 ? 800 : pts >= 10 ? 560 : 300, .07);
      thrown.push({ x: ax, y: ay, pts });
      // score popup particles
      const col = pts >= 25 ? '#ff4466' : pts >= 10 ? '#ffb347' : '#7ecaff';
      for (let i = 0; i < 8; i++) {
        particles.push({ x: ax, y: ay, vx: (Math.random()-.5)*3, vy: (Math.random()-.5)*3 - 1,
          life: 1, color: col, size: 2 + Math.random()*2 });
      }
      roundScore += pts;
      darts--;
      if (darts <= 0) {
        total += roundScore;
        api.score(total);
        round++;
        if (round >= ROUNDS) { state = 'done'; }
        else {
          state = 'between';
          setTimeout(() => startRound(), 1000);
        }
      }
    }

    function tick() {
      frame++;
      if (state === 'play') {
        const diff = 1 + (round - 1) * 0.35;
        const spdX = diff * 2.2;
        const spdY = diff * 1.5;
        ax = CX + Math.sin(frame * 0.045 * spdX + phase) * (55 + diff * 12);
        ay = CY + Math.cos(frame * 0.033 * spdY + phase * 1.3) * (40 + diff * 8);
      }
      particles = particles.filter(p => p.life > 0);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life -= 0.04;
      }
      draw();
      raf = requestAnimationFrame(tick);
    }

    function draw() {
      const cs = getComputedStyle(el);
      const accent = cs.getPropertyValue('--accent').trim();
      const ink = cs.getPropertyValue('--ink').trim();
      const line = cs.getPropertyValue('--line').trim();

      // Dark wood panel background
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#1a0e06'); grad.addColorStop(0.5, '#2a1a0a'); grad.addColorStop(1, '#12122a');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      // subtle wood grain lines
      ctx.save(); ctx.globalAlpha = 0.06;
      for (let i = 0; i < 12; i++) {
        ctx.strokeStyle = '#a0622a'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, i * 30 + 5); ctx.lineTo(W, i * 30 + 10); ctx.stroke();
      }
      ctx.restore();

      // dartboard shadow
      ctx.shadowBlur = 30; ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.beginPath(); ctx.arc(CX, CY, RINGS[RINGS.length-1].r + 4, 0, Math.PI*2);
      ctx.fillStyle = '#111'; ctx.fill(); ctx.shadowBlur = 0;

      // dartboard rings — proper darts colors
      const RING_COLORS = [
        '#cc1133', // bullseye red
        '#116622', // 25 green
        '#1a1a1a', // 10 black
        '#f0f0e0', // 5 white
        '#cc1133', // 1 red (outer)
      ];
      for (let i = RINGS.length - 1; i >= 0; i--) {
        ctx.fillStyle = RING_COLORS[i];
        ctx.shadowBlur = i === 0 ? 18 : i === 1 ? 10 : 0;
        ctx.shadowColor = i === 0 ? '#ff4466' : i === 1 ? '#22ff88' : 'transparent';
        ctx.beginPath(); ctx.arc(CX, CY, RINGS[i].r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
        ctx.stroke();
      }
      // board outer glow
      ctx.shadowBlur = 20; ctx.shadowColor = '#ffb34766';
      ctx.strokeStyle = '#a06030'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(CX, CY, RINGS[RINGS.length-1].r + 4, 0, Math.PI*2); ctx.stroke();
      ctx.shadowBlur = 0;

      // bullseye emoji
      ctx.font = '14px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🐱', CX, CY);

      // ring labels
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px system-ui'; ctx.textBaseline = 'middle';
      [50, 25, 10, 5, 1].forEach((pts, i) => {
        if (i === 0) return;
        const r = (RINGS[i - 1].r + RINGS[i].r) / 2;
        ctx.fillText(pts, CX + r, CY);
      });

      // thrown darts with glow
      thrown.forEach(d => {
        ctx.shadowBlur = 12; ctx.shadowColor = '#ffb347';
        ctx.font = '14px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🎯', d.x, d.y);
        ctx.shadowBlur = 0;
        // score label
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.roundRect(d.x + 4, d.y - 18, 28, 14, 4); ctx.fill();
        ctx.fillStyle = '#ffb347'; ctx.font = 'bold 10px system-ui';
        ctx.fillText('+' + d.pts, d.x + 18, d.y - 11);
        ctx.fillStyle = '#fff';
      });

      // particles
      particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8; ctx.shadowColor = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
      });
      ctx.globalAlpha = 1;

      // crosshair (moving aim)
      if (state === 'play') {
        ctx.shadowBlur = 10; ctx.shadowColor = accent;
        ctx.strokeStyle = accent; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(ax - 12, ay); ctx.lineTo(ax + 12, ay); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ax, ay - 12); ctx.lineTo(ax, ay + 12); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(ax, ay, 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1; ctx.stroke();
      }

      // HUD pill
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.roundRect(4, 4, 150, 22, 6); ctx.fill();
      ctx.beginPath(); ctx.roundRect(W - 154, 4, 150, 22, 6); ctx.fill();
      ctx.fillStyle = ink; ctx.font = 'bold 12px system-ui';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(`Round ${Math.min(round + 1, ROUNDS)}/${ROUNDS}`, 10, 15);
      ctx.textAlign = 'right';
      ctx.fillText(`🎯 ${darts}  Total: ${total}`, W - 10, 15);

      // dart counter dots
      ctx.textAlign = 'left';
      for (let i = 0; i < DARTS_PER_ROUND; i++) {
        ctx.fillStyle = i < darts ? accent : line;
        ctx.shadowBlur = i < darts ? 8 : 0; ctx.shadowColor = accent;
        ctx.beginPath(); ctx.arc(8 + i * 14, H - 14, 5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (state === 'ready') {
        ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, H - 50, W, 44);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 15px system-ui';
        ctx.fillText('Click to throw!', W/2, H - 28);
      }
      if (state === 'between') {
        ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, H/2 - 20, W, 36);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 15px system-ui';
        ctx.fillText(`Round score: ${roundScore} pts!`, W/2, H/2);
      }
      if (state === 'done') {
        ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, H/2 - 40, W, 74);
        ctx.fillStyle = accent; ctx.font = 'bold 20px system-ui';
        ctx.fillText('🎯 Final: ' + total + ' pts', W/2, H/2 - 14);
        ctx.fillStyle = '#fff'; ctx.font = '14px system-ui';
        ctx.fillText('Tap to play again', W/2, H/2 + 14);
      }
    }

    const kd = e => { if (e.key === ' ') { e.preventDefault(); throwDart(); } };
    document.addEventListener('keydown', kd);
    c.addEventListener('pointerdown', () => throwDart());
    reset(); tick();
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); };
  }
});
