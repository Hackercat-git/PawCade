Pawcade.register({
  id: 'flappy', title: 'Flappy Cat', emoji: '🐈', tags: 'arcade reflex one-button',
  blurb: 'Tap or press Space to flap. Squeeze between the scratching posts.',
  mount(el, api) {
    const W = 320, H = 480, c = document.createElement('canvas');
    c.width = W; c.height = H; c.className = 'board';
    const hint = document.createElement('p'); hint.className = 'hint'; hint.textContent = 'Tap, click or press Space to flap.';
    el.append(c, hint);
    const x = c.getContext('2d'), G = .30, J = -5.4, PW = 48;
    let y, v, ps, sc, state, raf, frame, GAP;
    function reset() { y = H / 2; v = 0; ps = []; sc = 0; frame = 0; GAP = 145; state = 'ready'; }
    function die() { state = 'over'; api.score(sc); api.beep(140, .3, 'sawtooth'); }
    function flap() { if (state == 'over') { reset(); return; } if (state == 'ready') state = 'play'; v = J; api.beep(520, .05); }
    function tick() {
      if (state == 'play') {
        v += G; y += v; frame++;
        // spawn a pipe every 90 frames; gap shrinks slowly (min 90)
        if (frame % 90 == 1) {
          GAP = Math.max(90, 145 - Math.floor(sc / 5) * 5);
          ps.push({ x: W, top: 60 + Math.random() * (H - GAP - 120), ok: false });
        }
        const spd = 2.2 + sc * .04;
        ps.forEach(p => p.x -= spd); ps = ps.filter(p => p.x > -PW);
        for (const p of ps) {
          if (!p.ok && p.x + PW < 68) { p.ok = true; sc++; api.beep(800, .05); }
          if (92 > p.x && 68 < p.x + PW && (y - 12 < p.top || y + 12 > p.top + GAP)) die();
        }
        if (y > H - 12 || y < 0) die();
      } else if (state == 'ready') y = H / 2 + Math.sin(Date.now() / 200) * 8;
      draw(); raf = requestAnimationFrame(tick);
    }
    function draw() {
      const cs = getComputedStyle(el);
      x.fillStyle = cs.getPropertyValue('--bg'); x.fillRect(0, 0, W, H);

      // pipes
      x.fillStyle = cs.getPropertyValue('--accent');
      ps.forEach(p => {
        x.beginPath(); x.roundRect(p.x, 0, PW, p.top, [0,0,8,8]); x.fill();
        x.beginPath(); x.roundRect(p.x, p.top + GAP, PW, H - p.top - GAP, [8,8,0,0]); x.fill();
        // pipe caps
        x.fillStyle = cs.getPropertyValue('--line');
        x.fillRect(p.x - 4, p.top - 10, PW + 8, 10);
        x.fillRect(p.x - 4, p.top + GAP, PW + 8, 10);
        x.fillStyle = cs.getPropertyValue('--accent');
      });

      // cat
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '28px serif';
      x.save(); x.translate(80, y);
      x.rotate(Math.max(-0.4, Math.min(0.4, v * 0.06)));
      x.fillText('🐈', 0, 0); x.restore();

      // score
      x.fillStyle = cs.getPropertyValue('--ink'); x.font = 'bold 22px system-ui'; x.fillText(sc, W / 2, 30);
      x.font = '15px system-ui';
      if (state == 'ready') x.fillText('Tap to start', W / 2, H / 2 + 55);
      if (state == 'over') { x.fillText('Game over — tap to restart', W / 2, H / 2); }
    }
    const key = e => { if (e.key == ' ' || e.key == 'ArrowUp') { e.preventDefault(); flap(); } };
    c.onpointerdown = flap; document.addEventListener('keydown', key);
    reset(); tick();
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', key); };
  }
});
