Pawcade.register({
  id: 'tugofwar', title: 'Tug of War', emoji: '🐈', tags: 'arcade multiplayer two-player reflex',
  blurb: 'Two cats fight over a fish! Mash your key to pull! P1: Z  P2: M',
  mount(el, api) {
    const W = 380, H = 220;
    const c = document.createElement('canvas');
    c.width = W; c.height = H; c.className = 'board';
    const hint = document.createElement('p'); hint.className = 'hint';
    hint.textContent = 'P1: mash Z   |   P2: mash M   (or tap your side!)';
    el.append(c, hint);
    const ctx = c.getContext('2d');

    const ROPE_Y = H / 2 + 10, WIN = 100, DECAY = 0.97;
    let pos, p1pwr, p2pwr, state, raf, frame, winner;

    function reset() {
      pos = 0; p1pwr = 0; p2pwr = 0; state = 'ready'; frame = 0; winner = '';
    }

    function press(side) {
      if (state === 'over') { reset(); return; }
      if (state === 'ready') state = 'play';
      if (side === 1) { p1pwr = Math.min(p1pwr + 14, 60); api.beep(400 + Math.random() * 100, .03); }
      else            { p2pwr = Math.min(p2pwr + 14, 60); api.beep(600 + Math.random() * 100, .03); }
    }

    function tick() {
      frame++;
      if (state === 'play') {
        p1pwr *= DECAY; p2pwr *= DECAY;
        pos += (p1pwr - p2pwr) * 0.04;
        if (pos <= -WIN) { pos = -WIN; winner = 'P1 🐱'; state = 'over'; api.score(WIN); api.beep(800, .3); }
        if (pos >= WIN)  { pos = WIN;  winner = 'P2 😸'; state = 'over'; api.score(WIN); api.beep(800, .3); }
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

      // ground
      ctx.fillStyle = line; ctx.fillRect(0, ROPE_Y + 24, W, 4);

      // rope
      const cx = W / 2 + pos * 0.9;
      ctx.strokeStyle = '#a07840'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(40, ROPE_Y); ctx.lineTo(W - 40, ROPE_Y); ctx.stroke();
      // rope stripes
      ctx.strokeStyle = '#c49a50'; ctx.lineWidth = 2;
      for (let x = 44; x < W - 40; x += 18) {
        ctx.beginPath(); ctx.moveTo(x, ROPE_Y - 3); ctx.lineTo(x + 8, ROPE_Y + 3); ctx.stroke();
      }

      // knot / fish in center of rope
      ctx.font = '20px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🐟', cx, ROPE_Y);

      // left cat P1 (pulls left = negative pos)
      ctx.save(); ctx.translate(30 + pos * 0.6, ROPE_Y - 6);
      ctx.font = '32px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const lean1 = Math.min(p1pwr / 60, 1) * 0.3;
      ctx.rotate(-lean1);
      ctx.fillText('🐱', 0, 0);
      ctx.restore();

      // right cat P2
      ctx.save(); ctx.translate(W - 30 + pos * 0.6, ROPE_Y - 6);
      ctx.scale(-1, 1);
      ctx.font = '32px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const lean2 = Math.min(p2pwr / 60, 1) * 0.3;
      ctx.rotate(-lean2);
      ctx.fillText('😸', 0, 0);
      ctx.restore();

      // power bars
      const bw = 70, bh = 10, by = 14;
      // P1 bar (left)
      ctx.fillStyle = line; ctx.beginPath(); ctx.roundRect(10, by, bw, bh, 3); ctx.fill();
      ctx.fillStyle = accent;
      ctx.beginPath(); ctx.roundRect(10, by, bw * (p1pwr / 60), bh, 3); ctx.fill();
      // P2 bar (right)
      ctx.fillStyle = line; ctx.beginPath(); ctx.roundRect(W - 10 - bw, by, bw, bh, 3); ctx.fill();
      ctx.fillStyle = accent;
      ctx.beginPath(); ctx.roundRect(W - 10 - bw, by, bw * (p2pwr / 60), bh, 3); ctx.fill();

      // labels
      ctx.fillStyle = ink; ctx.font = '11px system-ui';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText('P1  [Z]', 10, by + 14);
      ctx.textAlign = 'right'; ctx.fillText('[M]  P2', W - 10, by + 14);

      // tug meter center bar
      const mw = 140, mx = (W - mw) / 2, my = H - 26;
      ctx.fillStyle = line; ctx.beginPath(); ctx.roundRect(mx, my, mw, 10, 4); ctx.fill();
      // pos -100..100 → needle
      const npos = (pos / WIN) * (mw / 2 - 8) + mw / 2;
      ctx.fillStyle = accent;
      ctx.beginPath(); ctx.roundRect(mx + npos - 5, my - 2, 10, 14, 3); ctx.fill();
      ctx.fillStyle = '#e44'; ctx.beginPath(); ctx.arc(mx, my + 5, 4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#4ae'; ctx.beginPath(); ctx.arc(mx + mw, my + 5, 4, 0, Math.PI*2); ctx.fill();

      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (state === 'ready') {
        ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, H/2 - 22, W, 40);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 15px system-ui';
        ctx.fillText('Mash Z and M to fight for the fish!', W/2, H/2);
      }
      if (state === 'over') {
        ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, H/2 - 28, W, 50);
        ctx.fillStyle = accent; ctx.font = 'bold 18px system-ui';
        ctx.fillText('🏆 ' + winner + ' wins the fish!', W/2, H/2 - 6);
        ctx.fillStyle = '#fff'; ctx.font = '13px system-ui';
        ctx.fillText('Tap / press to rematch', W/2, H/2 + 16);
      }
    }

    const kd = e => {
      if (e.key === 'z' || e.key === 'Z') { e.preventDefault(); press(1); }
      if (e.key === 'm' || e.key === 'M') { e.preventDefault(); press(2); }
    };
    c.addEventListener('pointerdown', e => {
      const r = c.getBoundingClientRect();
      press(e.clientX - r.left < W / 2 ? 1 : 2);
    });
    document.addEventListener('keydown', kd);
    reset(); tick();
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); };
  }
});
