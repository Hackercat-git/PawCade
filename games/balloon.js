Pawcade.register({
  id: 'balloon', title: 'Balloon Pop', emoji: '🎈', tags: 'arcade reflex chill one-button',
  blurb: 'Pop the cat balloons before they escape! Dodge the dog balloons.',
  mount(el, api) {
    const W = 300, H = 420;
    const c = document.createElement('canvas');
    c.width = W; c.height = H; c.className = 'board'; c.style.touchAction = 'none';
    const hint = document.createElement('p'); hint.className = 'hint';
    hint.textContent = '📱 Tap balloons to pop them · 🐾=+1 · ⭐=+3 · 🐶=avoid · Miss 🐾=-life';
    el.append(c, hint);
    const ctx = c.getContext('2d');

    const TYPES = [
      { e:'🐾', pts:1,  bad:false, r:22, w:0.55 },
      { e:'⭐', pts:3,  bad:false, r:18, w:0.08 },
      { e:'🐟', pts:2,  bad:false, r:20, w:0.22 },
      { e:'🐶', pts:-1, bad:true,  r:22, w:0.15 },
    ];
    let balloons, score, lives, state, raf, frame, spawnT;

    function mkBalloon() {
      const rnd = Math.random(), cum = TYPES.reduce((a,t,i) => { a.push((a[i-1]||0)+t.w); return a; }, []);
      const type = TYPES[cum.findIndex(v => rnd < v)] || TYPES[0];
      return { x: 30 + Math.random() * (W - 60), y: H + 30, vy: -(0.8 + Math.random() * 1.2), wobble: Math.random()*Math.PI*2, ...type, alive: true };
    }
    function reset() { balloons = []; score = 0; lives = 3; state = 'play'; frame = 0; spawnT = 0; }

    function tick() {
      if (state === 'play') {
        frame++;
        if (frame >= spawnT) {
          balloons.push(mkBalloon());
          spawnT = frame + Math.max(28, 60 - Math.floor(score / 5) * 3);
        }
        balloons.forEach(b => {
          b.y += b.vy - (score * 0.008);
          b.x += Math.sin(frame * 0.04 + b.wobble) * 0.6;
        });
        // escaped (off top)
        balloons.filter(b => b.alive && b.y < -50).forEach(b => {
          b.alive = false;
          if (!b.bad) { lives--; api.beep(180, .15, 'sawtooth'); }
        });
        balloons = balloons.filter(b => b.y > -80);
        if (lives <= 0) { state = 'over'; api.score(score); api.beep(120, .4, 'sawtooth'); }
      }
      draw(); raf = requestAnimationFrame(tick);
    }

    function draw() {
      const cs = getComputedStyle(el);
      const bg = cs.getPropertyValue('--bg').trim(), accent = cs.getPropertyValue('--accent').trim();
      const ink = cs.getPropertyValue('--ink').trim();
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      // floating clouds (decorative)
      ctx.fillStyle = 'rgba(255,255,255,.04)';
      [[60,80,60,24],[200,160,80,20],[100,280,70,18],[240,340,50,16]].forEach(([x,y,w,h]) => {
        ctx.beginPath(); ctx.ellipse(x,y,w,h,0,0,Math.PI*2); ctx.fill();
      });
      balloons.forEach(b => {
        if (!b.alive) return;
        // string
        ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(b.x, b.y + b.r); ctx.lineTo(b.x + Math.sin(frame*0.06)*4, b.y + b.r + 18); ctx.stroke();
        // balloon circle
        const col = b.bad ? '#d44' : b.pts >= 3 ? '#ffd700' : accent;
        ctx.fillStyle = col + '44';
        ctx.strokeStyle = col; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        // emoji
        ctx.font = (b.r * 1.1) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(b.e, b.x, b.y);
      });
      ctx.fillStyle = ink; ctx.font = 'bold 14px system-ui'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('Score: ' + score + '  Lives: ' + '❤️'.repeat(Math.max(0, lives)), 6, 5);
      if (state === 'over') {
        ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, H/2-32, W, 56);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🎈 Score: ' + score, W/2, H/2-10);
        ctx.font = '13px system-ui'; ctx.fillText('Tap to play again', W/2, H/2+14);
      }
    }

    c.addEventListener('pointerdown', e => {
      if (state === 'over') { reset(); return; }
      const r = c.getBoundingClientRect();
      const mx = (e.clientX - r.left) * W / r.width, my = (e.clientY - r.top) * H / r.height;
      let popped = false;
      for (let i = balloons.length - 1; i >= 0; i--) {
        const b = balloons[i];
        if (!b.alive) continue;
        if (Math.hypot(mx - b.x, my - b.y) < b.r + 10) {
          b.alive = false;
          if (b.bad) { lives = Math.max(0, lives - 1); api.beep(150, .2, 'sawtooth'); if (lives <= 0) { state='over'; api.score(score); } }
          else { score += b.pts; api.score(score); api.beep(600 + score * 4, .07); }
          popped = true; break;
        }
      }
      if (!popped) api.beep(200, .02);
    });

    reset(); tick();
    return () => cancelAnimationFrame(raf);
  }
});
