Pawcade.register({
  id: 'whack', title: 'Whack-a-Mouse', emoji: '🐭', tags: 'reflex clicking multiplayer',
  blurb: 'Tap the mice, not the cats. You have 30 seconds.',
  mount(el, api) {
    if (!document.getElementById('whack-styles')) {
      const s = document.createElement('style');
      s.id = 'whack-styles';
      s.textContent = `
        .whack-wrap { background: linear-gradient(135deg,#5c3317,#3d2008); border-radius:16px; padding:16px; box-shadow:0 8px 32px #0007; }
        .whack-mode { display:flex; gap:8px; justify-content:center; margin-bottom:10px; }
        .whack-mode button { padding:7px 20px; border-radius:20px; border:2px solid #9c5a2a; background:linear-gradient(135deg,#2a1200,#1a0800); color:#f0c080; font-size:.9rem; font-weight:700; cursor:pointer; transition:all .15s; }
        .whack-mode button.active { background:linear-gradient(135deg,#9c5a2a,#c47830); border-color:#f0c080; box-shadow:0 0 12px #f0c08055; color:#fff; }
        .whack-hud { display:flex; gap:12px; margin-bottom:14px; justify-content:center; flex-wrap:wrap; }
        .whack-hud span { background:#2a1200cc; border:1px solid #9c5a2a; color:#f0c080; padding:4px 18px; border-radius:20px; font-weight:700; font-size:1rem; letter-spacing:.04em; }
        .whack-turn { text-align:center; padding:4px 0 8px; font-weight:700; font-size:1rem; min-height:26px; }
        .whack-turn.p1 { color:#7ecaff; text-shadow:0 0 10px #7ecaff88; }
        .whack-turn.p2 { color:#ff6b9a; text-shadow:0 0 10px #ff6b9a88; }
        .holes { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; padding:8px; }
        .hole { width:100%; aspect-ratio:1.3; background:radial-gradient(ellipse at 60% 40%,#1a0a00,#0a0400); border:3px solid #2a1200; border-radius:50%; cursor:pointer; font-size:2rem; display:flex; align-items:center; justify-content:center; transition:transform .08s; box-shadow:inset 0 4px 12px #0008,0 2px 4px #0005; outline:none; }
        .hole:focus-visible { outline:2px solid #f0c080; }
        .hole.popping { animation: whack-pop .18s cubic-bezier(.2,1.6,.4,1) forwards; }
        @keyframes whack-pop { 0%{transform:scale(0) translateY(30%)} 100%{transform:scale(1) translateY(0)} }
        .hole.bonked { animation: whack-bonk .15s ease-out forwards; }
        @keyframes whack-bonk { 0%{transform:scale(1.2)} 100%{transform:scale(0.85)} }
        .whack-go { display:block; margin:14px auto 0; padding:8px 32px; background:linear-gradient(135deg,#9c5a2a,#c47830); color:#fff; border:none; border-radius:20px; font-size:1rem; font-weight:700; cursor:pointer; box-shadow:0 4px 12px #0005; transition:opacity .2s; }
        .whack-go:disabled { opacity:.45; cursor:default; }
        .whack-switch { display:none; position:absolute; inset:0; background:rgba(0,0,0,0.88); border-radius:16px; flex-direction:column; align-items:center; justify-content:center; gap:14px; z-index:10; }
        .whack-switch.show { display:flex; }
        .whack-switch h2 { color:#7ecaff; font-size:1.3rem; font-weight:900; text-shadow:0 0 16px #7ecaff; margin:0; }
        .whack-switch p { color:#f0f0ff; font-size:1rem; margin:0; text-align:center; padding:0 16px; }
        .whack-switch .score-row { display:flex; gap:20px; }
        .whack-switch .sc-badge { padding:6px 22px; border-radius:20px; font-weight:800; font-size:1.1rem; }
        .whack-switch .sc-badge.p1c { color:#7ecaff; border:2px solid #7ecaff55; background:rgba(126,202,255,0.1); }
        .whack-switch button { padding:10px 32px; background:linear-gradient(135deg,#9c5a2a,#c47830); color:#fff; border:none; border-radius:20px; font-size:1rem; font-weight:700; cursor:pointer; }
        .whack-result { text-align:center; padding:10px 0 2px; font-weight:700; font-size:1.1rem; min-height:30px; }
        .whack-wrap-inner { position:relative; }
      `;
      document.head.appendChild(s);
    }

    let mode = '1p';

    el.innerHTML = `
      <div class="whack-wrap">
        <div class="whack-mode">
          <button class="wm1p active">👤 1 Player</button>
          <button class="wm2p">🆚 2 Players</button>
        </div>
        <div class="whack-hud"><span class="wt">Time 30</span><span class="ws">Mice 0</span></div>
        <div class="whack-turn"></div>
        <div class="whack-wrap-inner">
          <div class="whack-switch">
            <h2>🎉 Player 1 done!</h2>
            <div class="score-row"><div class="sc-badge p1c wsw-p1s"></div></div>
            <p>Hand the device to Player 2.<br>Tap to start your turn!</p>
            <button class="wsw-btn">▶ Player 2's turn</button>
          </div>
          <div class="holes"></div>
        </div>
        <div class="whack-result"></div>
        <button class="whack-go go">Start</button>
      </div>`;

    const H = el.querySelector('.holes');
    const T = el.querySelector('.wt'), S = el.querySelector('.ws');
    const go = el.querySelector('.go');
    const turnEl = el.querySelector('.whack-turn');
    const switchScreen = el.querySelector('.whack-switch');
    const resultEl = el.querySelector('.whack-result');

    const hs = [...Array(9)].map(() => {
      const b = document.createElement('button'); b.className = 'hole';
      b.setAttribute('aria-label', 'Hole'); H.append(b); return b;
    });

    let sc = 0, left = 0, tick, pop, up = -1, on = false, decoy = false;
    let currentPlayer = 0, scores = [0, 0];

    function updateTurn() {
      if (mode !== '2p') { turnEl.textContent = ''; return; }
      const name = currentPlayer === 0 ? 'Player 1' : 'Player 2';
      turnEl.textContent = `${currentPlayer === 0 ? '🔵' : '🩷'} ${name}'s turn`;
      turnEl.className = 'whack-turn ' + (currentPlayer === 0 ? 'p1' : 'p2');
    }

    function show() {
      hs.forEach(h => { h.textContent = ''; h.classList.remove('popping'); });
      if (!on) return;
      let i; do i = Math.random() * 9 | 0; while (i == up);
      up = i; decoy = sc > 3 && Math.random() < .2;
      hs[i].textContent = decoy ? '🐱' : '🐭';
      void hs[i].offsetWidth;
      hs[i].classList.add('popping');
      pop = setTimeout(show, Math.max(380, 800 - sc * 12));
    }

    hs.forEach((h, i) => h.onclick = () => {
      if (on && i == up && h.textContent) {
        sc = decoy ? Math.max(0, sc - 3) : sc + 1;
        api.beep(decoy ? 150 : 700, .07);
        S.textContent = 'Mice ' + sc;
        h.classList.remove('popping'); h.classList.add('bonked');
        h.textContent = '';
        clearTimeout(pop); pop = setTimeout(show, 150);
      }
    });

    function end() {
      on = false; clearInterval(tick); clearTimeout(pop); show();
      scores[currentPlayer] = sc;

      if (mode === '2p' && currentPlayer === 0) {
        // Show switch screen
        el.querySelector('.wsw-p1s').textContent = `P1: ${sc} mice`;
        switchScreen.classList.add('show');
        go.disabled = true;
        go.textContent = 'New game';
      } else {
        finishGame();
      }
    }

    function finishGame() {
      if (mode === '2p') {
        const diff = scores[0] - scores[1];
        const col = diff > 0 ? '#7ecaff' : diff < 0 ? '#ff6b9a' : '#ffd700';
        resultEl.textContent = diff > 0 ? `🔵 P1 wins! (${scores[0]} vs ${scores[1]})` :
                               diff < 0 ? `🩷 P2 wins! (${scores[1]} vs ${scores[0]})` :
                               `🤝 Draw! Both got ${scores[0]}`;
        resultEl.style.color = col;
        resultEl.style.textShadow = `0 0 12px ${col}`;
        api.score(Math.max(scores[0], scores[1]));
      } else {
        api.score(sc);
        resultEl.textContent = '';
      }
      go.disabled = false;
      go.textContent = 'Play again';
      T.textContent = 'Time is up';
    }

    function startRound() {
      sc = 0; left = 30; on = true;
      S.textContent = 'Mice 0'; T.textContent = 'Time 30';
      go.disabled = true; go.textContent = 'Playing…';
      updateTurn();
      show();
      tick = setInterval(() => { left--; T.textContent = 'Time ' + left; if (left <= 0) end(); }, 1000);
    }

    el.querySelector('.wsw-btn').onclick = () => {
      switchScreen.classList.remove('show');
      currentPlayer = 1;
      startRound();
    };

    go.onclick = () => {
      currentPlayer = 0; scores = [0, 0];
      resultEl.textContent = '';
      switchScreen.classList.remove('show');
      startRound();
    };

    function setMode(m) {
      mode = m;
      el.querySelector('.wm1p').classList.toggle('active', m === '1p');
      el.querySelector('.wm2p').classList.toggle('active', m === '2p');
      updateTurn();
      resultEl.textContent = '';
      go.textContent = 'Start';
    }

    el.querySelector('.wm1p').onclick = () => setMode('1p');
    el.querySelector('.wm2p').onclick = () => setMode('2p');

    return () => { on = false; clearInterval(tick); clearTimeout(pop); };
  }
});
