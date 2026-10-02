Pawcade.register({
  id: 'fish', title: 'Fish Catcher', emoji: '🧺', tags: 'arcade reflex catch',
  blurb: 'Catch the falling fish. Dodge the boots and do not miss three.',
  mount(el, api) {
    const W = 320, H = 420, c = document.createElement('canvas');
    c.width = W; c.height = H; c.className = 'board';
    const hint = document.createElement('p'); hint.className = 'hint'; hint.textContent = 'Drag, or use the arrow keys or A and D. Space or tap to restart.';
    el.append(c, hint);
    const x = c.getContext('2d'), keys = {};
    let bx, items, sc, lives, over, spawn, raf;
    function reset() { bx = W / 2; items = []; sc = 0; lives = 3; over = false; spawn = 0; }
    function tick() {
      if (!over) {
        if (--spawn <= 0) { items.push({ x: 20 + Math.random() * (W - 40), y: -20, bad: Math.random() < .25, v: 1.6 + sc * .05 }); spawn = Math.max(25, 55 - sc); }
        if (keys.ArrowLeft || keys.a) bx -= 5; if (keys.ArrowRight || keys.d) bx += 5;
        bx = Math.max(30, Math.min(W - 30, bx));
        items.forEach(i => i.y += i.v);
        items = items.filter(i => {
          if (i.y > H - 50 && i.y < H - 20 && Math.abs(i.x - bx) < 34) {
            if (i.bad) { lives--; api.beep(150, .2, 'sawtooth'); } else { sc++; api.beep(700, .05); } return false;
          }
          if (i.y > H) { if (!i.bad) { lives--; api.beep(200, .1); } return false; }
          return true;
        });
        if (lives <= 0) { over = true; api.score(sc); }
      }
      draw(); raf = requestAnimationFrame(tick);
    }
    function draw() {
      const cs = getComputedStyle(el);
      x.fillStyle = cs.getPropertyValue('--bg'); x.fillRect(0, 0, W, H);
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '28px serif';
      items.forEach(i => x.fillText(i.bad ? '🥾' : '🐟', i.x, i.y));
      x.font = '40px serif'; x.fillText('🧺', bx, H - 34);
      x.fillStyle = cs.getPropertyValue('--ink'); x.font = 'bold 16px system-ui'; x.textAlign = 'left';
      x.fillText('Fish ' + sc + '   Lives ' + '❤'.repeat(Math.max(0, lives)), 8, 18);
      if (over) { x.textAlign = 'center'; x.fillText('Game over. Space or tap to restart.', W / 2, H / 2); }
    }
    const kd = e => { keys[e.key] = true; if (e.key.startsWith('Arrow') || e.key == ' ') e.preventDefault(); if (e.key == ' ' && over) reset(); };
    const ku = e => keys[e.key] = false;
    c.onpointermove = e => { const r = c.getBoundingClientRect(); bx = (e.clientX - r.left) * W / r.width; };
    c.onpointerdown = e => { if (over) reset(); };
    c.style.touchAction = 'none';
    document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
    reset(); tick();
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); };
  }
});
