Pawcade.register({
  id: 'flappy', title: 'Flappy Cat', emoji: '🐈', tags: 'arcade reflex one-button',
  blurb: 'Tap or press Space to flap. Squeeze between the scratching posts.',
  mount(el, api) {
    const W = 320, H = 480, c = document.createElement('canvas');
    c.width = W; c.height = H; c.className = 'board';
    const hint = document.createElement('p'); hint.className = 'hint'; hint.textContent = 'Tap, click or press Space to flap.';
    el.append(c, hint);
    const x = c.getContext('2d'), G = .32, J = -5.6, GAP = 140, PW = 50;
    let y, v, ps, sc, state, raf, frame;
    function reset() { y = H / 2; v = 0; ps = []; sc = 0; frame = 0; state = 'ready'; }
    function die() { state = 'over'; api.score(sc); api.beep(140, .3, 'sawtooth'); }
    function flap() { if (state == 'over') { reset(); return; } if (state == 'ready') state = 'play'; v = J; api.beep(520, .05); }
    function tick() {
      if (state == 'play') {
        v += G; y += v; frame++;
        if (frame % 90 == 1) ps.push({ x: W, top: 60 + Math.random() * (H - GAP - 120), ok: false });
        ps.forEach(p => p.x -= 2.2); ps = ps.filter(p => p.x > -PW);
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
      x.fillStyle = cs.getPropertyValue('--accent');
      ps.forEach(p => { x.fillRect(p.x, 0, PW, p.top); x.fillRect(p.x, p.top + GAP, PW, H); });
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '28px serif'; x.fillText('🐈', 80, y);
      x.fillStyle = cs.getPropertyValue('--ink'); x.font = 'bold 22px system-ui'; x.fillText(sc, W / 2, 30);
      x.font = '16px system-ui';
      if (state == 'ready') x.fillText('Tap to start', W / 2, H / 2 + 50);
      if (state == 'over') x.fillText('Game over. Tap to restart.', W / 2, H / 2);
    }
    const key = e => { if (e.key == ' ' || e.key == 'ArrowUp') { e.preventDefault(); flap(); } };
    c.onpointerdown = flap; document.addEventListener('keydown', key);
    reset(); tick();
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', key); };
  }
});
