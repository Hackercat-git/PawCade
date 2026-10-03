Pawcade.register({
  id: 'typing', title: 'Typing Cat', emoji: '⌨️', tags: 'typing words speed reflex',
  blurb: 'Type the falling cat words before they hit the floor. Three misses.',
  mount(el, api) {
    const W = 340, H = 360, c = document.createElement('canvas');
    c.width = W; c.height = H; c.className = 'board';
    const inp = document.createElement('input');
    inp.type = 'text'; inp.autocomplete = 'off'; inp.autocapitalize = 'off';
    inp.spellcheck = false; inp.placeholder = 'Type here…';
    inp.style.cssText = 'width:100%;margin-top:8px;';
    const hint = document.createElement('p'); hint.className = 'hint';
    hint.textContent = '📱 Tap the text field to type · 3 misses = game over · Enter or tap canvas to restart';
    el.append(c, inp, hint);
    const ctx = c.getContext('2d');

    const WORDS = 'cat paw fur meow purr claw tail yarn kitten tabby whisker nap pounce scratch feline chase mouse bird sleep cozy hunt prowl sprint leap groom stalk catnip fluffy stretch yawn twitch hiss boop sniff curl nuzzle chirp trill mrrp pawprint mew catfish wildcat tomcat calico tortie bobcat ocelot cougar lynx prowler mouser ratter slink swagger tiptoe lunge swipe dart bolt lope'.split(' ');
    let words, sc, lives, state, raf, frame, spawnInterval, startTime, wordsDone;

    function reset() {
      words = []; sc = 0; lives = 3; state = 'play'; frame = 0; wordsDone = 0;
      startTime = Date.now(); spawnInterval = 90;
      inp.value = ''; inp.disabled = false; inp.focus();
    }
    function wpm() {
      const mins = (Date.now() - startTime) / 60000;
      return mins < .05 ? 0 : Math.round(wordsDone / mins);
    }
    function spawnWord() {
      const w = WORDS[Math.random() * WORDS.length | 0];
      const wx = 20 + Math.random() * (W - 120);
      const spd = .4 + sc * .015;
      words.push({ w, x: wx, y: -16, spd, typed: 0 });
    }
    function tick() {
      if (state === 'play') {
        frame++;
        spawnInterval = Math.max(45, 90 - sc * 2);
        if (frame % spawnInterval === 0) spawnWord();
        words.forEach(wo => wo.y += wo.spd);
        const hit = words.filter(wo => wo.y > H - 10);
        if (hit.length) {
          hit.forEach(() => { lives--; api.beep(180, .2, 'sawtooth'); });
          words = words.filter(wo => wo.y <= H - 10);
          if (lives <= 0) { state = 'over'; inp.disabled = true; api.score(sc); }
        }
      }
      draw(); raf = requestAnimationFrame(tick);
    }
    function draw() {
      const cs = getComputedStyle(el);
      const bg = cs.getPropertyValue('--bg').trim(), ink = cs.getPropertyValue('--ink').trim();
      const accent = cs.getPropertyValue('--accent').trim(), mute = cs.getPropertyValue('--mute').trim();
      const line = cs.getPropertyValue('--line').trim();
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      // danger zone
      ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.setLineDash([4,4]);
      ctx.beginPath(); ctx.moveTo(0, H-10); ctx.lineTo(W, H-10); ctx.stroke();
      ctx.setLineDash([]);
      // words
      words.forEach(wo => {
        const pct = wo.y / (H - 10);
        ctx.font = 'bold 18px system-ui';
        const done = wo.w.slice(0, wo.typed), rest = wo.w.slice(wo.typed);
        const wFull = ctx.measureText(wo.w).width;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(${pct > .7 ? '255,80,80' : '80,80,180'},.18)`;
        ctx.beginPath(); ctx.roundRect(wo.x - 6, wo.y - 14, wFull + 12, 26, 6); ctx.fill();
        ctx.fillStyle = accent; ctx.fillText(done, wo.x, wo.y);
        ctx.fillStyle = pct > .75 ? '#ff6b6b' : ink;
        ctx.fillText(rest, wo.x + ctx.measureText(done).width, wo.y);
      });
      // current input
      const cur = inp.value;
      if (cur) {
        ctx.font = 'bold 15px system-ui'; ctx.textAlign = 'left'; ctx.fillStyle = accent;
        ctx.fillText('→ ' + cur, 8, H - 30);
      }
      // hud
      ctx.fillStyle = ink; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      const w = wpm();
      ctx.fillText('Score ' + sc + '   Lives ' + '❤️'.repeat(Math.max(0,lives)) + (w > 0 ? '   ' + w + ' wpm' : ''), 6, 5);
      if (state === 'over') {
        ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(0, H/2-36, W, 60);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 16px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('Game over — ' + sc + ' words, ' + wpm() + ' wpm', W/2, H/2 - 14);
        ctx.font = '14px system-ui';
        ctx.fillText('Click here or press Enter to restart', W/2, H/2 + 12);
      }
    }
    inp.addEventListener('input', () => {
      if (state !== 'play') return;
      const v = inp.value.toLowerCase().trim();
      words.forEach(wo => {
        if (wo.w.startsWith(v)) wo.typed = v.length;
        else if (wo.typed > 0 && !wo.w.startsWith(v)) wo.typed = 0;
      });
      const idx = words.findIndex(wo => wo.w === v);
      if (idx !== -1) {
        sc++; wordsDone++; api.score(sc); api.beep(700 + sc * 8, .07);
        words.splice(idx, 1); inp.value = '';
        words.forEach(wo => wo.typed = 0);
      }
    });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter' && state === 'over') reset(); });
    c.addEventListener('pointerdown', () => { if (state === 'over') reset(); inp.focus(); });
    reset(); tick();
    return () => { cancelAnimationFrame(raf); };
  }
});
