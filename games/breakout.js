Pawcade.register({
  id: 'breakout', title: 'Cat Breakout', emoji: '🧱', tags: 'arcade classic paddle ball',
  blurb: 'Bounce the ball to smash all the fish bricks. Three lives.',
  mount(el, api) {
    const W = 340, H = 420, PW = 60, PH = 10, BR = 5, BC = 7, c = document.createElement('canvas');
    c.width = W; c.height = H; c.className = 'board';
    const hint = document.createElement('p'); hint.className = 'hint';
    hint.textContent = 'Mouse, touch, or A/D to move. Space or tap to launch.';
    el.append(c, hint);
    const x = c.getContext('2d'), keys = {};
    let px, bx, by, vx, vy, bricks, sc, lives, state, raf;

    function makeBricks() {
      const b = [];
      for (let r = 0; r < BR; r++) for (let col = 0; col < BC; col++) {
        b.push({ x: 10 + col * (W - 20) / BC, y: 38 + r * 30, w: (W - 20) / BC - 6, h: 22, hp: BR - r, alive: true });
      }
      return b;
    }
    function reset() {
      px = W / 2; bx = W / 2; by = H - 60; vx = 0; vy = 0;
      bricks = makeBricks(); sc = 0; lives = 3; state = 'ready';
    }
    function launch() {
      if (state === 'over') { reset(); return; }
      if (state === 'ready') { state = 'play'; vx = (Math.random() > .5 ? 1 : -1) * 2.8; vy = -3.8; }
    }
    function tick() {
      if (state === 'play') {
        if (keys.a || keys.ArrowLeft) px = Math.max(PW / 2, px - 5.5);
        if (keys.d || keys.ArrowRight) px = Math.min(W - PW / 2, px + 5.5);
        bx += vx; by += vy;
        // walls
        if (bx < 8) { bx = 8; vx = Math.abs(vx); api.beep(300, .03); }
        if (bx > W - 8) { bx = W - 8; vx = -Math.abs(vx); api.beep(300, .03); }
        if (by < 12) { by = 12; vy = Math.abs(vy); api.beep(300, .03); }
        // paddle
        if (vy > 0 && by > H - 30 - 8 && by < H - 30 + 6 && Math.abs(bx - px) < PW / 2 + 8) {
          vy = -Math.abs(vy) * 1.01;
          vx += (bx - px) / (PW / 2) * 1.5;
          vx = Math.max(-6, Math.min(6, vx));
          by = H - 38; api.beep(500, .04);
        }
        // bricks
        for (const br of bricks) {
          if (!br.alive) continue;
          if (bx + 8 > br.x && bx - 8 < br.x + br.w && by + 8 > br.y && by - 8 < br.y + br.h) {
            // which face
            const ol = bx - (br.x + br.w), or2 = br.x - bx, ot = by - (br.y + br.h), ob = br.y - by;
            const hv = Math.min(Math.abs(ol), Math.abs(or2)) < Math.min(Math.abs(ot), Math.abs(ob));
            if (hv) vx = -vx; else vy = -vy;
            br.hp--;
            if (br.hp <= 0) { br.alive = false; sc++; api.beep(660 + sc * 10, .05); api.score(sc); }
            else api.beep(400, .03);
            break;
          }
        }
        // fell off
        if (by > H + 10) {
          lives--; api.beep(150, .25, 'sawtooth');
          if (lives <= 0) { state = 'over'; api.score(sc); }
          else { bx = px; by = H - 60; vx = vy = 0; state = 'ready'; }
        }
        // cleared
        if (bricks.every(b => !b.alive)) {
          bricks = makeBricks(); vy -= .3; api.beep(880, .15); state = 'ready';
          bx = px; by = H - 60; vx = vy = 0;
        }
      } else if (state === 'ready') {
        if (keys.a || keys.ArrowLeft) px = Math.max(PW / 2, px - 5.5);
        if (keys.d || keys.ArrowRight) px = Math.min(W - PW / 2, px + 5.5);
        bx = px;
      }
      draw(); raf = requestAnimationFrame(tick);
    }
    function draw() {
      const cs = getComputedStyle(el);
      const bg = cs.getPropertyValue('--bg').trim(), accent = cs.getPropertyValue('--accent').trim();
      const ink = cs.getPropertyValue('--ink').trim(), line = cs.getPropertyValue('--line').trim();
      x.fillStyle = bg; x.fillRect(0, 0, W, H);
      // bricks
      bricks.forEach(br => {
        if (!br.alive) return;
        const alpha = br.hp / (BR);
        x.globalAlpha = .4 + alpha * .6;
        x.fillStyle = accent;
        x.beginPath(); x.roundRect(br.x, br.y, br.w, br.h, 5); x.fill();
        x.globalAlpha = 1;
        x.font = '14px serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('🐟', br.x + br.w / 2, br.y + br.h / 2);
      });
      // paddle
      x.fillStyle = accent;
      x.beginPath(); x.roundRect(px - PW / 2, H - 30, PW, PH, 6); x.fill();
      // ball
      x.fillStyle = ink;
      x.beginPath(); x.arc(bx, by, 8, 0, Math.PI * 2); x.fill();
      // hud
      x.fillStyle = ink; x.font = 'bold 14px system-ui'; x.textAlign = 'left'; x.textBaseline = 'top';
      x.fillText('Score ' + sc + '   Lives ' + '❤️'.repeat(Math.max(0, lives)), 8, 6);
      if (state === 'ready') {
        x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(0, H / 2 - 24, W, 36);
        x.fillStyle = '#fff'; x.font = 'bold 16px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('Space or tap to launch', W / 2, H / 2 - 6);
      }
      if (state === 'over') {
        x.fillStyle = 'rgba(0,0,0,.5)'; x.fillRect(0, H / 2 - 30, W, 44);
        x.fillStyle = '#fff'; x.font = 'bold 17px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('Game over — Space or tap to restart', W / 2, H / 2 - 8);
      }
    }
    const kd = e => {
      keys[e.key] = true;
      if (['ArrowLeft','ArrowRight','a','d',' '].includes(e.key)) e.preventDefault();
      if (e.key === ' ') launch();
    };
    const ku = e => keys[e.key] = false;
    c.onpointermove = e => { const r = c.getBoundingClientRect(); px = Math.max(PW/2, Math.min(W - PW/2, (e.clientX - r.left) * W / r.width)); };
    c.onpointerdown = () => launch();
    c.style.touchAction = 'none';
    document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
    reset(); tick();
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); };
  }
});
