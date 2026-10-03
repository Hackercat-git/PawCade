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

    let ax, ay, phase, spd, state, round, darts, roundScore, total, thrown, raf, frame;

    function reset() {
      total = 0; round = 0; state = 'ready'; frame = 0;
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
      draw();
      raf = requestAnimationFrame(tick);
    }

    function draw() {
      const cs = getComputedStyle(el);
      const bg = cs.getPropertyValue('--bg').trim();
      const accent = cs.getPropertyValue('--accent').trim();
      const ink = cs.getPropertyValue('--ink').trim();
      const line = cs.getPropertyValue('--line').trim();

      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // dartboard rings
      const COLORS = ['#222','#e44','#fff','#e44','#fff'];
      for (let i = RINGS.length - 1; i >= 0; i--) {
        ctx.fillStyle = COLORS[i % COLORS.length];
        ctx.beginPath(); ctx.arc(CX, CY, RINGS[i].r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = line; ctx.lineWidth = 1;
        ctx.stroke();
      }
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

      // thrown darts
      thrown.forEach(d => {
        ctx.font = '14px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🎯', d.x, d.y);
        ctx.fillStyle = accent; ctx.font = 'bold 10px system-ui';
        ctx.fillText('+' + d.pts, d.x + 10, d.y - 10);
        ctx.fillStyle = '#fff';
      });

      // crosshair (moving aim)
      if (state === 'play') {
        ctx.strokeStyle = accent; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(ax - 10, ay); ctx.lineTo(ax + 10, ay); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ax, ay - 10); ctx.lineTo(ax, ay + 10); ctx.stroke();
        ctx.beginPath(); ctx.arc(ax, ay, 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1; ctx.stroke();
      }

      // HUD
      ctx.fillStyle = ink; ctx.font = 'bold 13px system-ui';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(`Round ${Math.min(round + 1, ROUNDS)}/${ROUNDS}`, 8, 8);
      ctx.textAlign = 'right';
      ctx.fillText(`🎯 ${darts}  Total: ${total}`, W - 8, 8);

      // dart counter dots
      ctx.textAlign = 'left';
      for (let i = 0; i < DARTS_PER_ROUND; i++) {
        ctx.fillStyle = i < darts ? accent : line;
        ctx.beginPath(); ctx.arc(8 + i * 14, H - 14, 5, 0, Math.PI * 2); ctx.fill();
      }

      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (state === 'ready') {
        ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, H - 50, W, 44);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 15px system-ui';
        ctx.fillText('Click to throw!', W/2, H - 28);
      }
      if (state === 'between') {
        ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, H/2 - 20, W, 36);
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
