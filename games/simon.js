Pawcade.register({
  id: 'simon', title: 'Simon Paws', emoji: '🐾', tags: 'memory sequence pattern multiplayer two-player',
  blurb: 'Repeat the growing paw pattern. Solo or challenge a friend — highest round wins!',
  mount(el, api) {
    if (!document.getElementById('simon-styles')) {
      const s = document.createElement('style');
      s.id = 'simon-styles';
      s.textContent = `
        .simon-wrap { background:linear-gradient(160deg,#0d0d1f,#12122a); border-radius:16px; padding:16px; box-shadow:0 8px 32px #0009; }
        .simon-hud { display:flex; align-items:center; gap:12px; margin-bottom:10px; justify-content:space-between; }
        .simon-hud span { color:#ccc; font-weight:600; font-size:1rem; }
        .simon-hud button { background:linear-gradient(135deg,#2a1a4a,#3a2a5a); color:#c0a0ff; border:1px solid #5a3a8a; border-radius:20px; padding:5px 18px; cursor:pointer; font-size:.9rem; font-weight:700; }
        .simon-mode-bar { display:flex; gap:8px; justify-content:center; margin-bottom:10px; }
        .simon-mode-bar button { background:#1c1c3d; color:#aaa; border:1px solid #3a3a6a; border-radius:20px; padding:4px 14px; cursor:pointer; font-size:.82rem; font-weight:700; transition:background .15s,color .15s; }
        .simon-mode-bar button.active { background:linear-gradient(135deg,#2a1a4a,#3a2a6a); color:#c0a0ff; border-color:#7a5aaa; }
        .si-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; max-width:280px; margin:0 auto 14px; }
        .si-btn { aspect-ratio:1; font-size:2.6rem; border-radius:24px; display:flex; align-items:center; justify-content:center; cursor:pointer; border:none; transition:transform .1s, box-shadow .1s; touch-action:none; }
        .si-btn[data-c="0"] { background:radial-gradient(circle at 35% 35%,#ff6b6b,#c0392b); box-shadow:0 4px 18px #c0392b66; }
        .si-btn[data-c="1"] { background:radial-gradient(circle at 35% 35%,#51cf66,#2f9e44); box-shadow:0 4px 18px #2f9e4466; }
        .si-btn[data-c="2"] { background:radial-gradient(circle at 35% 35%,#4dabf7,#1971c2); box-shadow:0 4px 18px #1971c266; }
        .si-btn[data-c="3"] { background:radial-gradient(circle at 35% 35%,#ffd43b,#f59f00); box-shadow:0 4px 18px #f59f0066; }
        .si-btn.lit[data-c="0"] { background:radial-gradient(circle at 35% 35%,#ff9a9a,#e03131); box-shadow:0 0 32px #ff000088, 0 4px 18px #e0313188; transform:scale(1.08); }
        .si-btn.lit[data-c="1"] { background:radial-gradient(circle at 35% 35%,#8ce99a,#37b24d); box-shadow:0 0 32px #00ff5588, 0 4px 18px #37b24d88; transform:scale(1.08); }
        .si-btn.lit[data-c="2"] { background:radial-gradient(circle at 35% 35%,#74c0fc,#228be6); box-shadow:0 0 32px #0080ff88, 0 4px 18px #228be688; transform:scale(1.08); }
        .si-btn.lit[data-c="3"] { background:radial-gradient(circle at 35% 35%,#ffe066,#fcc419); box-shadow:0 0 32px #ffcc0088, 0 4px 18px #fcc41988; transform:scale(1.08); }
        .si-btn:disabled { filter:brightness(.55); cursor:default; }
        .hint { color:#667; font-size:.85rem; text-align:center; margin-top:8px; }
      `;
      document.head.appendChild(s);
    }

    const COLORS = ['#e03131', '#2f9e44', '#1971c2', '#f59f00'];
    const ICONS  = ['🐾', '🐟', '🐱', '🧶'];
    const NOTES  = [330, 415, 523, 659];

    el.innerHTML = `
      <div class="simon-wrap">
        <div class="simon-mode-bar">
          <button class="active" data-m="1p">👤 Solo</button>
          <button data-m="2p">🆚 2 Players</button>
        </div>
        <div class="simon-hud"><span class="si-info">Press Start</span><button class="primary si-start">Start</button></div>
        <div class="si-grid"></div>
        <p class="hint">Watch the sequence, then repeat it. Gets faster each 3 rounds.</p>
      </div>`;

    const grid = el.querySelector('.si-grid'), info = el.querySelector('.si-info');
    const modeBar = el.querySelector('.simon-mode-bar');
    const btns = COLORS.map((col, i) => {
      const b = document.createElement('button');
      b.className = 'si-btn'; b.dataset.c = i;
      b.setAttribute('aria-label', ICONS[i]);
      b.textContent = ICONS[i];
      grid.append(b); return b;
    });

    let seq = [], pos, showing, score, mode = '1p';
    let p2Phase = false, p1Score = 0;

    modeBar.addEventListener('click', e => {
      const btn = e.target.closest('button'); if (!btn) return;
      mode = btn.dataset.m;
      modeBar.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.m === mode));
      seq = []; p2Phase = false; info.textContent = 'Press Start';
      el.querySelector('.si-start').textContent = 'Start';
    });

    function interval() {
      const lvl = Math.floor(seq.length / 3);
      return Math.max(220, 650 - lvl * 80);
    }
    function light(i, dur) {
      const d = dur ?? Math.round(interval() * .85);
      btns[i].classList.add('lit');
      api.beep(NOTES[i], d / 1000 * .8);
      setTimeout(() => { btns[i].classList.remove('lit'); }, d);
    }
    function showSeq(cb) {
      showing = true; let idx = 0;
      btns.forEach(b => b.disabled = true);
      const iv_ms = interval();
      info.textContent = 'Watch… ' + (iv_ms <= 320 ? '⚡' : iv_ms <= 450 ? '🔥' : '');
      const iv = setInterval(() => {
        light(seq[idx++], Math.round(iv_ms * .75));
        if (idx >= seq.length) {
          clearInterval(iv);
          setTimeout(() => {
            showing = false; btns.forEach(b => b.disabled = false);
            pos = 0;
            if (mode === '2p' && p2Phase) {
              info.textContent = '🩷 P2 — step 1/' + seq.length;
            } else {
              info.textContent = (mode === '2p' ? '🔵 P1 — ' : '') + 'Your turn — step 1/' + seq.length;
            }
            if (cb) cb();
          }, iv_ms);
        }
      }, iv_ms);
    }
    function nextRound() {
      seq.push(Math.random() * 4 | 0);
      info.textContent = (mode === '2p' ? (p2Phase ? '🩷 P2 — ' : '🔵 P1 — ') : '') + 'Round ' + seq.length;
      setTimeout(() => showSeq(), 600);
    }
    function start() {
      seq = []; score = 0; p2Phase = false; p1Score = 0;
      el.querySelector('.si-start').textContent = 'Restart';
      btns.forEach(b => b.disabled = false);
      nextRound();
    }
    function startP2() {
      seq = []; score = 0; p2Phase = true;
      btns.forEach(b => b.disabled = false);
      info.textContent = '🩷 Player 2 — get ready!';
      setTimeout(() => nextRound(), 800);
    }

    btns.forEach((b, i) => b.addEventListener('pointerdown', () => {
      if (showing || b.disabled) return;
      light(i, 200);
      if (seq[pos] === i) {
        pos++;
        if (pos === seq.length) {
          score = seq.length; api.score(score);
          const prefix = mode === '2p' ? (p2Phase ? '🩷 P2 — ' : '🔵 P1 — ') : '';
          info.textContent = prefix + '✅ Round ' + score + ' done!';
          api.beep(880, .12);
          setTimeout(nextRound, 900);
        } else {
          const prefix = mode === '2p' ? (p2Phase ? '🩷 P2 — ' : '🔵 P1 — ') : '';
          info.textContent = prefix + 'step ' + (pos + 1) + '/' + seq.length;
        }
      } else {
        api.beep(120, .4, 'sawtooth');
        btns.forEach(b => b.disabled = true);
        if (mode === '2p' && !p2Phase) {
          // P1 failed — save score, hand to P2
          p1Score = score;
          info.textContent = '🔵 P1 scored ' + p1Score + ' rounds — hand to Player 2!';
          el.querySelector('.si-start').textContent = '▶ Player 2';
          el.querySelector('.si-start').onclick = startP2;
        } else if (mode === '2p' && p2Phase) {
          // P2 failed — compare
          const p2Score = score;
          api.score(Math.max(p1Score, p2Score));
          if (p2Score > p1Score) info.textContent = `🩷 P2 wins! (${p2Score} vs ${p1Score}) 🏆`;
          else if (p1Score > p2Score) info.textContent = `🔵 P1 wins! (${p1Score} vs ${p2Score}) 🏆`;
          else info.textContent = `🤝 Tie! Both got ${p1Score} rounds`;
          el.querySelector('.si-start').textContent = 'Play again';
          el.querySelector('.si-start').onclick = start;
          btns.forEach(b => b.disabled = false);
        } else {
          info.textContent = '❌ Wrong! Score: ' + score;
          setTimeout(() => {
            seq.forEach((s, k) => setTimeout(() => light(s), k * 420));
            setTimeout(() => {
              btns.forEach(b => b.disabled = false);
              el.querySelector('.si-start').textContent = 'Play again';
              info.textContent = 'Score: ' + score + ' — Play again?';
            }, seq.length * 420 + 600);
          }, 400);
        }
      }
    }));

    el.querySelector('.si-start').addEventListener('click', start);
    return () => {};
  }
});
