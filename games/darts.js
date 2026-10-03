Pawcade.register({
  id: 'darts', title: 'Cat Darts', emoji: '🎯', tags: 'arcade reflex clicking multiplayer',
  blurb: 'Hit the cat dartboard! Play solo (5 rounds, 3 darts) or challenge a friend.',
  mount(el, api) {
    const W = 320, H = 380;
    const c = document.createElement('canvas');
    c.width = W; c.height = H; c.className = 'board';

    // mode buttons
    const modeBar = document.createElement('div');
    modeBar.style.cssText = 'display:flex;gap:8px;justify-content:center;margin-bottom:8px;';
    modeBar.innerHTML = `
      <button id="dm1p" style="padding:6px 20px;border-radius:20px;border:2px solid #3a6080;background:linear-gradient(135deg,#2a5a8a,#1a3a5a);color:#7ecaff;font-weight:700;cursor:pointer;box-shadow:0 0 10px #7ecaff55;font-size:.85rem;">👤 1 Player</button>
      <button id="dm2p" style="padding:6px 20px;border-radius:20px;border:2px solid #3a6080;background:linear-gradient(135deg,#1a2a3a,#0d1b2a);color:#7ecaff;font-weight:700;cursor:pointer;font-size:.85rem;">🆚 2 Players</button>`;

    const hint = document.createElement('p'); hint.className = 'hint';
    hint.textContent = 'Click / tap when the crosshair is on target!';
    el.append(modeBar, c, hint);
    const ctx = c.getContext('2d');

    const CX = W / 2, CY = H / 2 - 6;
    const RINGS = [
      { r: 16, pts: 50 },
      { r: 34, pts: 25 },
      { r: 56, pts: 10 },
      { r: 80, pts: 5  },
      { r: 108, pts: 1 },
    ];
    const DARTS_PER_ROUND = 3, ROUNDS = 5;
    const PLAYER_COLORS = ['#7ecaff', '#ff6b9a'];
    const PLAYER_NAMES = ['Player 1', 'Player 2'];

    let mode = '1p'; // '1p' or '2p'
    let ax, ay, phase, spd, state, round, darts, roundScore, total, thrown, raf, frame, particles;
    let currentPlayer, playerTotals, playerRound;

    const btn1p = el.querySelector('#dm1p');
    const btn2p = el.querySelector('#dm2p');

    function setMode(m) {
      mode = m;
      btn1p.style.background = m === '1p' ? 'linear-gradient(135deg,#2a5a8a,#1a3a5a)' : 'linear-gradient(135deg,#1a2a3a,#0d1b2a)';
      btn1p.style.boxShadow = m === '1p' ? '0 0 10px #7ecaff55' : 'none';
      btn2p.style.background = m === '2p' ? 'linear-gradient(135deg,#6a1a3a,#3a0a2a)' : 'linear-gradient(135deg,#1a2a3a,#0d1b2a)';
      btn2p.style.boxShadow = m === '2p' ? '0 0 10px #ff6b9a55' : 'none';
      btn2p.style.color = m === '2p' ? '#ff6b9a' : '#7ecaff';
      btn2p.style.borderColor = m === '2p' ? '#ff6b9a55' : '#3a6080';
      reset();
    }

    function reset() {
      currentPlayer = 0;
      playerTotals = [0, 0];
      playerRound = [0, 0];
      total = 0; round = 0; state = 'ready'; frame = 0; particles = [];
      startRound();
    }

    function startRound() {
      darts = DARTS_PER_ROUND; roundScore = 0; thrown = [];
      ax = CX; ay = CY;
      const diff = 1 + round * 0.35;
      spd = diff;
      phase = Math.random() * Math.PI * 2;
      state = 'play';
    }

    function throwDart() {
      if (state === 'done') { reset(); return; }
      if (state === 'switch') {
        if (mode === '2p') {
          currentPlayer = 1 - currentPlayer;
          round = playerRound[currentPlayer];
          total = playerTotals[currentPlayer];
        }
        state = 'play';
        startRound();
        return;
      }
      if (state !== 'play') return;

      const dx = ax - CX, dy = ay - CY;
      const dist = Math.hypot(dx, dy);
      let pts = 0;
      for (const r of RINGS) { if (dist <= r.r) { pts = r.pts; break; } }

      api.beep(pts >= 25 ? 800 : pts >= 10 ? 560 : 300, .07);
      thrown.push({ x: ax, y: ay, pts });
      const col = pts >= 25 ? '#ff4466' : pts >= 10 ? '#ffb347' : '#7ecaff';
      for (let i = 0; i < 8; i++) {
        particles.push({ x: ax, y: ay, vx: (Math.random()-.5)*3, vy: (Math.random()-.5)*3 - 1,
          life: 1, color: col, size: 2 + Math.random()*2 });
      }
      roundScore += pts;
      darts--;

      if (darts <= 0) {
        total += roundScore;
        playerTotals[currentPlayer] = total;
        playerRound[currentPlayer] = round + 1;
        round++;

        if (mode === '2p') {
          // In 2P: player 0 plays ROUNDS, then player 1, then done
          if (currentPlayer === 0 && round >= ROUNDS) {
            state = 'switch'; // P1 done, P2's turn
          } else if (currentPlayer === 1 && round >= ROUNDS) {
            state = 'done';
            api.score(Math.max(playerTotals[0], playerTotals[1]));
          } else {
            state = 'between';
            setTimeout(() => startRound(), 1000);
          }
        } else {
          // 1P
          if (round >= ROUNDS) {
            state = 'done';
            api.score(total);
          } else {
            state = 'between';
            setTimeout(() => startRound(), 1000);
          }
        }
      }
    }

    function tick() {
      frame++;
      if (state === 'play') {
        const diff = 1 + (round) * 0.35;
        const spdX = diff * 2.2, spdY = diff * 1.5;
        ax = CX + Math.sin(frame * 0.045 * spdX + phase) * (55 + diff * 12);
        ay = CY + Math.cos(frame * 0.033 * spdY + phase * 1.3) * (40 + diff * 8);
      }
      particles = particles.filter(p => p.life > 0);
      for (const p of particles) { p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life -= 0.04; }
      draw();
      raf = requestAnimationFrame(tick);
    }

    function draw() {
      const cs = getComputedStyle(el);
      const accent = cs.getPropertyValue('--accent').trim() || '#7ecaff';
      const ink = cs.getPropertyValue('--ink').trim() || '#f0f0ff';

      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#1a0e06'); grad.addColorStop(0.5, '#2a1a0a'); grad.addColorStop(1, '#12122a');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalAlpha = 0.06;
      for (let i = 0; i < 12; i++) {
        ctx.strokeStyle = '#a0622a'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, i * 32 + 5); ctx.lineTo(W, i * 32 + 10); ctx.stroke();
      }
      ctx.restore();

      // Board shadow
      ctx.shadowBlur = 30; ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.beginPath(); ctx.arc(CX, CY, RINGS[RINGS.length-1].r + 4, 0, Math.PI*2);
      ctx.fillStyle = '#111'; ctx.fill(); ctx.shadowBlur = 0;

      const RING_COLORS = ['#cc1133', '#116622', '#1a1a1a', '#f0f0e0', '#cc1133'];
      for (let i = RINGS.length - 1; i >= 0; i--) {
        ctx.fillStyle = RING_COLORS[i];
        ctx.shadowBlur = i === 0 ? 18 : i === 1 ? 10 : 0;
        ctx.shadowColor = i === 0 ? '#ff4466' : i === 1 ? '#22ff88' : 'transparent';
        ctx.beginPath(); ctx.arc(CX, CY, RINGS[i].r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.shadowBlur = 20; ctx.shadowColor = '#ffb34766';
      ctx.strokeStyle = '#a06030'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(CX, CY, RINGS[RINGS.length-1].r + 4, 0, Math.PI*2); ctx.stroke();
      ctx.shadowBlur = 0;

      ctx.font = '14px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🐱', CX, CY);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 9px system-ui';
      [50, 25, 10, 5, 1].forEach((pts, i) => {
        if (i === 0) return;
        const r = (RINGS[i-1].r + RINGS[i].r) / 2;
        ctx.fillText(pts, CX + r, CY);
      });

      // Thrown darts
      thrown.forEach(d => {
        ctx.shadowBlur = 12; ctx.shadowColor = '#ffb347';
        ctx.font = '14px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🎯', d.x, d.y); ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.roundRect(d.x + 4, d.y - 18, 28, 14, 4); ctx.fill();
        ctx.fillStyle = '#ffb347'; ctx.font = 'bold 10px system-ui';
        ctx.fillText('+' + d.pts, d.x + 18, d.y - 11); ctx.fillStyle = '#fff';
      });

      // Particles
      particles.forEach(p => {
        ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
        ctx.shadowBlur = 8; ctx.shadowColor = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
      });
      ctx.globalAlpha = 1;

      // Crosshair
      if (state === 'play') {
        const ac = mode === '2p' ? PLAYER_COLORS[currentPlayer] : accent;
        ctx.shadowBlur = 10; ctx.shadowColor = ac;
        ctx.strokeStyle = ac; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(ax - 12, ay); ctx.lineTo(ax + 12, ay); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ax, ay - 12); ctx.lineTo(ax, ay + 12); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(ax, ay, 5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1; ctx.stroke();
      }

      // HUD
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath(); ctx.roundRect(4, 4, W - 8, 26, 7); ctx.fill();

      if (mode === '2p') {
        // P1 score left, P2 score right
        ctx.font = 'bold 11px system-ui'; ctx.textBaseline = 'middle';
        const ac0 = currentPlayer === 0 ? PLAYER_COLORS[0] : 'rgba(126,202,255,.5)';
        const ac1 = currentPlayer === 1 ? PLAYER_COLORS[1] : 'rgba(255,107,154,.5)';
        ctx.shadowBlur = currentPlayer === 0 ? 8 : 0; ctx.shadowColor = PLAYER_COLORS[0];
        ctx.fillStyle = ac0; ctx.textAlign = 'left';
        ctx.fillText(`P1 ${playerTotals[0]}`, 10, 17);
        ctx.shadowBlur = currentPlayer === 1 ? 8 : 0; ctx.shadowColor = PLAYER_COLORS[1];
        ctx.fillStyle = ac1; ctx.textAlign = 'right';
        ctx.fillText(`P2 ${playerTotals[1]}`, W - 10, 17);
        ctx.shadowBlur = 0;
        // round indicator center
        const rnd = playerRound[currentPlayer];
        ctx.fillStyle = PLAYER_COLORS[currentPlayer]; ctx.textAlign = 'center';
        ctx.fillText(`R${Math.min(rnd+1,ROUNDS)}/${ROUNDS}`, W/2, 17);
      } else {
        ctx.fillStyle = ink; ctx.font = 'bold 12px system-ui';
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(`Round ${Math.min(round + 1, ROUNDS)}/${ROUNDS}`, 10, 17);
        ctx.textAlign = 'right';
        ctx.fillText(`🎯 ${darts}  Total: ${total}`, W - 10, 17);
      }

      // Dart counter dots
      ctx.textAlign = 'left';
      for (let i = 0; i < DARTS_PER_ROUND; i++) {
        const dc = mode === '2p' ? PLAYER_COLORS[currentPlayer] : accent;
        ctx.fillStyle = i < darts ? dc : '#2a2a55';
        ctx.shadowBlur = i < darts ? 8 : 0; ctx.shadowColor = dc;
        ctx.beginPath(); ctx.arc(8 + i * 14, H - 14, 5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

      if (state === 'between') {
        ctx.fillStyle = 'rgba(0,0,10,.6)'; ctx.fillRect(0, H/2 - 22, W, 40);
        const pname = mode === '2p' ? PLAYER_NAMES[currentPlayer] + ': ' : '';
        ctx.fillStyle = mode === '2p' ? PLAYER_COLORS[currentPlayer] : '#fff';
        ctx.font = 'bold 14px system-ui';
        ctx.fillText(`${pname}${roundScore} pts this round!`, W/2, H/2);
      }

      if (state === 'switch') {
        // P1 finished, P2 about to start
        ctx.fillStyle = 'rgba(0,0,15,.75)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.beginPath(); ctx.roundRect(W/2-130, H/2-50, 260, 90, 14); ctx.fill();
        ctx.strokeStyle = PLAYER_COLORS[1]; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(W/2-130, H/2-50, 260, 90, 14); ctx.stroke();
        ctx.shadowBlur = 14; ctx.shadowColor = PLAYER_COLORS[0];
        ctx.fillStyle = PLAYER_COLORS[0]; ctx.font = 'bold 16px system-ui';
        ctx.fillText(`Player 1 done: ${playerTotals[0]} pts`, W/2, H/2 - 20);
        ctx.shadowBlur = 0;
        ctx.fillStyle = PLAYER_COLORS[1]; ctx.font = 'bold 15px system-ui';
        ctx.shadowBlur = 12; ctx.shadowColor = PLAYER_COLORS[1];
        ctx.fillText(`Player 2 — tap to start!`, W/2, H/2 + 14);
        ctx.shadowBlur = 0;
      }

      if (state === 'done') {
        ctx.fillStyle = 'rgba(0,0,15,.75)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.beginPath(); ctx.roundRect(W/2-130, H/2-60, 260, 108, 14); ctx.fill();

        if (mode === '2p') {
          const diff = playerTotals[0] - playerTotals[1];
          const winCol = diff > 0 ? PLAYER_COLORS[0] : diff < 0 ? PLAYER_COLORS[1] : '#ffd700';
          ctx.strokeStyle = winCol; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.roundRect(W/2-130, H/2-60, 260, 108, 14); ctx.stroke();
          ctx.shadowBlur = 18; ctx.shadowColor = winCol;
          ctx.fillStyle = winCol; ctx.font = 'bold 18px system-ui';
          const msg = diff > 0 ? 'Player 1 wins! 🎉' : diff < 0 ? 'Player 2 wins! 🎉' : 'Draw! 🤝';
          ctx.fillText(msg, W/2, H/2 - 26); ctx.shadowBlur = 0;
          ctx.fillStyle = PLAYER_COLORS[0]; ctx.font = 'bold 13px system-ui';
          ctx.fillText(`P1: ${playerTotals[0]} pts`, W/2, H/2 + 0);
          ctx.fillStyle = PLAYER_COLORS[1];
          ctx.fillText(`P2: ${playerTotals[1]} pts`, W/2, H/2 + 20);
        } else {
          ctx.strokeStyle = accent; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.roundRect(W/2-130, H/2-60, 260, 108, 14); ctx.stroke();
          ctx.shadowBlur = 18; ctx.shadowColor = accent;
          ctx.fillStyle = '#fff'; ctx.font = 'bold 20px system-ui';
          ctx.fillText('🎯 Final: ' + total + ' pts', W/2, H/2 - 14); ctx.shadowBlur = 0;
        }
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.font = '13px system-ui';
        ctx.fillText('Tap to play again', W/2, H/2 + 44);
      }
    }

    const kd = e => { if (e.key === ' ') { e.preventDefault(); throwDart(); } };
    document.addEventListener('keydown', kd);
    c.addEventListener('pointerdown', () => throwDart());
    btn1p.onclick = () => setMode('1p');
    btn2p.onclick = () => setMode('2p');
    reset(); tick();
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); };
  }
});
