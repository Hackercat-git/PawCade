Pawcade.register({
  id: 'fishslap', title: 'Fish Slap', emoji: '🐟', tags: 'arcade reflex multiplayer two-player one-button',
  blurb: 'Two players, one fish. Slap first to claim it! P1: top half · P2: bottom half.',
  mount(el, api) {
    const W = 320, H = 280;
    const c = document.createElement('canvas');
    c.width = W; c.height = H; c.className = 'board'; c.style.touchAction = 'none';
    const hint = document.createElement('p'); hint.className = 'hint';
    hint.textContent = '📱 P1 taps TOP · P2 taps BOTTOM · First to 5 wins!';
    el.append(c, hint);
    const ctx = c.getContext('2d');

    const GOAL = 5;
    let sc1, sc2, state, phase, timer, winner, raf, frame, flashCol, fishX, fishY, fishAngle, baitTimer, baitDur;
    const PHASES = ['wait','bait','ready','show','over'];

    function reset() {
      sc1 = 0; sc2 = 0; state = 'start'; frame = 0; flashCol = null; winner = '';
      nextRound();
    }
    function nextRound() {
      phase = 'wait'; timer = 60 + Math.random() * 90; // random delay
      baitTimer = 0; baitDur = 20 + Math.random() * 30;
      fishX = W/2; fishY = H/2; fishAngle = 0;
      state = 'wait';
    }
    function slap(player) {
      if (state === 'show') {
        if (player === 1) sc1++; else sc2++;
        flashCol = player === 1 ? '#ffb347' : '#6cf';
        api.beep(800, .12);
        if (sc1 >= GOAL || sc2 >= GOAL) { state = 'over'; winner = sc1 >= GOAL ? 'P1' : 'P2'; api.score(Math.max(sc1,sc2)); api.beep(880,.3); }
        else nextRound();
      } else if (state === 'wait' || state === 'bait') {
        // too early! flash red
        flashCol = '#e44';
        api.beep(120, .2, 'sawtooth');
      } else if (state === 'over') {
        reset();
      } else if (state === 'start') {
        state = 'wait'; nextRound();
      }
    }

    function tick() {
      frame++;
      if (flashCol && frame % 3 === 0) flashCol = null;
      if (state === 'wait') {
        timer--;
        if (timer <= 0) { state = 'bait'; baitTimer = baitDur; }
      } else if (state === 'bait') {
        // fish teases — wobbles near edge
        fishX = W/2 + Math.sin(frame*0.18)*80;
        fishAngle = Math.sin(frame*0.18)*0.4;
        baitTimer--;
        if (baitTimer <= 0) { state = 'show'; fishX = W/2; fishAngle = 0; api.beep(440,.04); }
      }
      draw(); raf = requestAnimationFrame(tick);
    }

    function draw() {
      const cs = getComputedStyle(el);
      const bg = cs.getPropertyValue('--bg').trim(), accent = cs.getPropertyValue('--accent').trim();
      const ink = cs.getPropertyValue('--ink').trim(), line = cs.getPropertyValue('--line').trim();
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Player zones
      ctx.fillStyle = 'rgba(255,179,71,.07)'; ctx.fillRect(0, 0, W, H/2);
      ctx.fillStyle = 'rgba(100,200,255,.07)'; ctx.fillRect(0, H/2, W, H/2);
      ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.setLineDash([6,6]);
      ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke(); ctx.setLineDash([]);

      // P labels
      ctx.font = 'bold 13px system-ui'; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
      ctx.fillStyle = '#ffb347'; ctx.fillText('P1  ' + '⭐'.repeat(sc1), 10, 6);
      ctx.fillStyle = '#6cf'; ctx.textBaseline = 'bottom'; ctx.fillText('P2  ' + '⭐'.repeat(sc2), 10, H - 6);

      // flash overlay
      if (flashCol) { ctx.fillStyle = flashCol + '44'; ctx.fillRect(0,0,W,H); }

      // center fish / status
      ctx.save(); ctx.translate(fishX, fishY); ctx.rotate(fishAngle);
      if (state === 'show') {
        ctx.font = '52px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🐟', 0, 0);
      } else if (state === 'bait') {
        ctx.globalAlpha = 0.45 + Math.sin(frame*0.3)*0.3;
        ctx.font = '40px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🐟', 0, 0);
        ctx.globalAlpha = 1;
      } else if (state === 'wait') {
        ctx.font = '14px system-ui'; ctx.fillStyle = '#555'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('…', 0, 0);
      }
      ctx.restore();

      // start screen
      if (state === 'start') {
        ctx.fillStyle='rgba(0,0,0,.55)'; ctx.fillRect(0,H/2-30,W,54);
        ctx.fillStyle='#fff'; ctx.font='bold 16px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('🐟 Fish Slap — tap to start!', W/2, H/2);
      }
      if (state === 'over') {
        ctx.fillStyle='rgba(0,0,0,.6)'; ctx.fillRect(0,H/2-32,W,58);
        ctx.fillStyle=accent; ctx.font='bold 18px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('🏆 '+winner+' wins the fish!', W/2, H/2-8);
        ctx.fillStyle='#fff'; ctx.font='13px system-ui';
        ctx.fillText('Tap to rematch', W/2, H/2+16);
      }
      if (state === 'show') {
        ctx.fillStyle=accent; ctx.font='bold 22px system-ui'; ctx.textAlign='center'; ctx.textBaseline='top';
        ctx.fillText('SLAP!', W/2, 8);
      }
    }

    c.addEventListener('pointerdown', e => {
      const r = c.getBoundingClientRect();
      const ty = (e.clientY - r.top) / r.height;
      slap(ty < 0.5 ? 1 : 2);
    });
    document.addEventListener('keydown', e => {
      if (e.code === 'Space') { e.preventDefault(); slap(1); }
      if (e.code === 'Enter') { e.preventDefault(); slap(2); }
    });
    reset(); tick();
    return () => cancelAnimationFrame(raf);
  }
});
