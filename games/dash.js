Pawcade.register({
  id: 'dash', title: 'Cat Dash', emoji: '🏃', tags: 'endless runner jump reflex',
  blurb: 'Jump over dogs and yarn. Collect coins. How far can you run?',
  mount(el, api) {
    const W = 340, H = 200, GY = 155, c = document.createElement('canvas');
    c.width = W; c.height = H; c.className = 'board';
    const hint = document.createElement('p'); hint.className = 'hint';
    hint.textContent = 'Space, ↑, or tap to jump. Double-jump allowed! Collect 🪙 coins.';
    el.append(c, hint);
    const x = c.getContext('2d');
    const OBSTACLES = ['🐕', '🧶', '🐾', '🦮'];
    let cy, vy, jumps, obs, coins, sc, coins_total, spd, state, raf, frame, bgOffset;

    function reset() {
      cy = GY; vy = 0; jumps = 0; obs = []; coins = []; sc = 0; coins_total = 0;
      spd = 3; frame = 0; state = 'ready'; bgOffset = 0;
    }
    function jump() {
      if (state === 'over') { reset(); return; }
      if (state === 'ready') { state = 'play'; return; }
      if (jumps < 2) {
        vy = jumps === 0 ? -7.5 : -5.5;
        jumps++; api.beep(jumps === 1 ? 600 : 800, .05);
      }
    }
    function tick() {
      if (state === 'play') {
        frame++; sc = Math.floor(frame / 6);
        spd = 3 + sc * .008;
        bgOffset = (bgOffset + spd * .3) % W;
        vy += .45; cy += vy;
        if (cy >= GY) { cy = GY; vy = 0; jumps = 0; }
        // spawn obstacles
        const gap = Math.max(55, 110 - sc / 4);
        if (obs.length === 0 || obs[obs.length - 1].x < W - gap - Math.random() * 80) {
          const ox = W + 20;
          const oh = 28 + Math.random() * 14;
          obs.push({ x: ox, e: OBSTACLES[Math.random() * OBSTACLES.length | 0], h: oh });
          // maybe spawn a coin above this obstacle
          if (Math.random() < .6) {
            coins.push({ x: ox + Math.random() * 40 - 20, y: GY - oh - 30 - Math.random() * 30, collected: false });
          }
        }
        obs.forEach(o => o.x -= spd);
        obs = obs.filter(o => o.x > -40);
        coins.forEach(co => co.x -= spd);
        coins = coins.filter(co => co.x > -20);
        // collision with obstacles
        for (const o of obs) {
          if (Math.abs(o.x - 60) < 20 && cy + 12 > GY - o.h + 4) {
            state = 'over'; api.score(sc + coins_total * 10); api.beep(150, .3, 'sawtooth'); break;
          }
        }
        // collect coins
        for (const co of coins) {
          if (!co.collected && Math.abs(co.x - 60) < 18 && Math.abs(co.y - cy) < 22) {
            co.collected = true; coins_total++; api.beep(1100, .04); api.score(sc + coins_total * 10);
          }
        }
        api.score(sc + coins_total * 10);
      }
      draw(); raf = requestAnimationFrame(tick);
    }
    function draw() {
      const cs = getComputedStyle(el);
      const bg = cs.getPropertyValue('--bg').trim();
      const accent = cs.getPropertyValue('--accent').trim();
      const ink = cs.getPropertyValue('--ink').trim();
      const line = cs.getPropertyValue('--line').trim();
      const mute = cs.getPropertyValue('--mute').trim();
      x.fillStyle = bg; x.fillRect(0, 0, W, H);
      // scrolling bg trees
      x.fillStyle = mute; x.globalAlpha = .18; x.font = '22px serif';
      for (let i = 0; i < 5; i++) {
        const tx = ((i * 70 - bgOffset + W) % W);
        x.fillText('🌲', tx, GY - 10);
      }
      x.globalAlpha = 1;
      // ground
      x.fillStyle = line; x.fillRect(0, GY + 18, W, 2);
      // cat
      x.font = '28px serif'; x.textAlign = 'center'; x.textBaseline = 'bottom';
      x.save(); x.translate(60, cy);
      if (cy < GY) x.rotate(Math.max(-.3, Math.min(.3, vy * .04)));
      x.fillText('🐱', 0, 0); x.restore();
      // obstacles
      obs.forEach(o => { x.font = o.h + 'px serif'; x.textBaseline = 'bottom'; x.fillText(o.e, o.x, GY + 18); });
      // coins
      coins.forEach(co => {
        if (co.collected) return;
        x.font = '16px serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('🪙', co.x, co.y);
      });
      // hud
      x.fillStyle = ink; x.font = 'bold 14px system-ui'; x.textAlign = 'left'; x.textBaseline = 'top';
      x.fillText('Distance: ' + sc + 'm' + (spd > 4 ? '  🔥' : '') + '  🪙×' + coins_total, 8, 6);
      if (state === 'ready') {
        x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(0, 70, W, 36);
        x.fillStyle = '#fff'; x.font = 'bold 16px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('Space or tap to start', W / 2, 88);
      }
      if (state === 'over') {
        x.fillStyle = 'rgba(0,0,0,.5)'; x.fillRect(0, 60, W, 54);
        x.fillStyle = '#fff'; x.font = 'bold 15px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('Wiped out at ' + sc + 'm!', W / 2, 80);
        x.font = '13px system-ui';
        x.fillText('🪙 Coins: ' + coins_total + '  Total: ' + (sc + coins_total * 10) + 'pts — tap to retry', W / 2, 100);
      }
    }
    const kd = e => { if (['ArrowUp',' '].includes(e.key)) { e.preventDefault(); jump(); } };
    c.onpointerdown = () => jump();
    document.addEventListener('keydown', kd);
    reset(); tick();
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); };
  }
});
