Pawcade.register({
  id: 'stack', title: 'Cat Stack', emoji: '📦', tags: 'arcade reflex one-button',
  blurb: 'Stack cat boxes as high as you can! Tap to drop each layer.',
  mount(el, api) {
    const W = 300, H = 420, BASE_H = 18, SPEED_START = 2.2, SPEED_INC = 0.18;
    const c = document.createElement('canvas');
    c.width = W; c.height = H; c.className = 'board';
    const hint = document.createElement('p'); hint.className = 'hint';
    hint.textContent = 'Tap / Space / click to drop the box';
    el.append(c, hint);
    const ctx = c.getContext('2d');

    let layers, moving, score, state, raf, frame;

    const EMOJIS = ['📦','🐱','🧶','🐾','🐟','🛖','🪣'];

    function reset() {
      score = 0; frame = 0; state = 'ready';
      const bw = 160;
      layers = [{ x: (W - bw) / 2, w: bw, y: H - BASE_H, h: BASE_H, emoji: '🏠' }];
      spawnMoving();
    }

    function spawnMoving() {
      const prev = layers[layers.length - 1];
      const spd = Math.min(SPEED_START + score * SPEED_INC, 9);
      moving = {
        x: 0, w: prev.w,
        y: prev.y - BASE_H - 2,
        h: BASE_H,
        vx: spd,
        emoji: EMOJIS[score % EMOJIS.length]
      };
    }

    function drop() {
      if (state === 'ready') { state = 'play'; return; }
      if (state !== 'play') { reset(); return; }
      const prev = layers[layers.length - 1];
      const ox1 = Math.max(moving.x, prev.x);
      const ox2 = Math.min(moving.x + moving.w, prev.x + prev.w);
      const overlap = ox2 - ox1;
      if (overlap <= 0) {
        api.beep(150, .3, 'sawtooth');
        state = 'over';
        api.score(score);
        return;
      }
      api.beep(overlap < prev.w * 0.6 ? 440 : 600, .06);
      const trimmed = { x: ox1, w: overlap, y: moving.y, h: moving.h, emoji: moving.emoji };
      layers.push(trimmed);
      score++;
      // scroll if stack getting tall
      spawnMoving();
    }

    function tick() {
      frame++;
      if (state === 'play') {
        moving.x += moving.vx;
        if (moving.x + moving.w > W) { moving.x = W - moving.w; moving.vx = -Math.abs(moving.vx); }
        if (moving.x < 0) { moving.x = 0; moving.vx = Math.abs(moving.vx); }
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
      const panel = cs.getPropertyValue('--panel').trim();

      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // scroll offset so top of stack is always visible
      const topY = layers.length > 1 ? layers[layers.length - 1].y : H - BASE_H;
      const scroll = Math.max(0, H - topY - H * 0.55);

      ctx.save(); ctx.translate(0, scroll);

      // draw layers
      layers.forEach((l, i) => {
        const hue = (i * 37) % 360;
        ctx.fillStyle = i === 0 ? line : accent;
        ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.roundRect(l.x, l.y, l.w, l.h, 4); ctx.fill();
        ctx.globalAlpha = 1;
        if (l.w > 22) {
          ctx.font = `${Math.min(14, l.h - 2)}px serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(l.emoji, l.x + l.w / 2, l.y + l.h / 2);
        }
      });

      // moving block
      if (state === 'play') {
        ctx.fillStyle = accent; ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.roundRect(moving.x, moving.y, moving.w, moving.h, 4); ctx.fill();
        ctx.globalAlpha = 1;
        if (moving.w > 22) {
          ctx.font = `${Math.min(14, moving.h - 2)}px serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(moving.emoji, moving.x + moving.w / 2, moving.y + moving.h / 2);
        }
      }

      ctx.restore();

      // HUD
      ctx.fillStyle = ink; ctx.font = 'bold 18px system-ui';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('📦 ' + score, 10, 8);

      // overlays
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (state === 'ready') {
        ctx.fillStyle = 'rgba(0,0,0,.48)'; ctx.fillRect(0, H/2 - 26, W, 46);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 16px system-ui';
        ctx.fillText('Tap to start stacking!', W/2, H/2);
      }
      if (state === 'over') {
        ctx.fillStyle = 'rgba(0,0,0,.58)'; ctx.fillRect(0, H/2 - 38, W, 70);
        ctx.fillStyle = accent; ctx.font = 'bold 19px system-ui';
        ctx.fillText('Stack: ' + score + (score >= 10 ? ' 🐾' : ''), W/2, H/2 - 12);
        ctx.fillStyle = '#fff'; ctx.font = '14px system-ui';
        ctx.fillText('Tap to try again', W/2, H/2 + 14);
      }
    }

    const kd = e => { if (e.key === ' ') { e.preventDefault(); drop(); } };
    document.addEventListener('keydown', kd);
    c.addEventListener('pointerdown', () => drop());
    reset(); tick();
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); };
  }
});
