Pawcade.register({
  id: 'meowmory', title: 'Meowmory', emoji: '😺', tags: 'memory puzzle cards multiplayer',
  blurb: 'Find all eight cat pairs. Play solo or challenge a friend — most pairs wins!',
  mount(el, api) {
    if (!document.getElementById('memory-styles')) {
      const s = document.createElement('style');
      s.id = 'memory-styles';
      s.textContent = `
        .mem-wrap { background:linear-gradient(160deg,#0d1b2a,#1a2a3a); border-radius:16px; padding:16px; box-shadow:0 8px 32px #0008; }
        .mem-hud { display:flex; align-items:center; gap:8px; margin-bottom:12px; justify-content:space-between; flex-wrap:wrap; }
        .mem-hud span { color:#7ecaff; font-weight:700; font-size:.95rem; }
        .mem-hud button { background:linear-gradient(135deg,#1c3a5a,#2a4f70); color:#7ecaff; border:1px solid #3a6080; border-radius:20px; padding:5px 16px; cursor:pointer; font-size:.85rem; font-weight:600; }
        .mem-mode { display:flex; gap:8px; justify-content:center; margin-bottom:12px; }
        .mem-mode button { padding:8px 22px; border-radius:20px; border:2px solid #3a6080; background:linear-gradient(135deg,#1a2a3a,#0d1b2a); color:#7ecaff; font-size:.9rem; font-weight:700; cursor:pointer; transition:all .15s; }
        .mem-mode button.active { background:linear-gradient(135deg,#2a5a8a,#1a3a5a); border-color:#7ecaff; box-shadow:0 0 12px #7ecaff55; }
        .mem-turn { text-align:center; padding:6px 0 10px; font-weight:700; font-size:1rem; min-height:28px; }
        .mem-turn.p1 { color:#7ecaff; text-shadow:0 0 10px #7ecaff88; }
        .mem-turn.p2 { color:#ff6b9a; text-shadow:0 0 10px #ff6b9a88; }
        .mem-scores { display:flex; justify-content:center; gap:24px; margin-bottom:10px; }
        .mem-scores .pscore { padding:4px 18px; border-radius:20px; font-weight:700; font-size:.9rem; background:rgba(0,0,0,0.35); border:1px solid transparent; transition:all .2s; }
        .mem-scores .pscore.p1 { color:#7ecaff; border-color:#7ecaff33; }
        .mem-scores .pscore.p2 { color:#ff6b9a; border-color:#ff6b9a33; }
        .mem-scores .pscore.active { box-shadow:0 0 14px currentColor; border-color:currentColor; }
        .mem { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
        .tile { aspect-ratio:1; background:linear-gradient(135deg,#1a2a3a,#0d1b2a); border:2px solid #2a4060; border-radius:12px; font-size:1.7rem; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:transform .15s, box-shadow .15s; position:relative; }
        .tile::before { content:'?'; position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:1.4rem; color:#3a6080; font-weight:900; }
        .tile.up::before, .tile.done::before { display:none; }
        .tile.up { animation: mem-flip .22s ease-out forwards; border-color:#7ecaff55; background:linear-gradient(135deg,#1c3a5a,#0d2030); }
        .tile.done-p1 { border-color:#7ecaff; box-shadow:0 0 14px #7ecaff88, inset 0 0 10px #7ecaff22; background:linear-gradient(135deg,#0d2a3a,#0d3040); }
        .tile.done-p2 { border-color:#ff6b9a; box-shadow:0 0 14px #ff6b9a88, inset 0 0 10px #ff6b9a22; background:linear-gradient(135deg,#2a0d1a,#300d20); }
        @keyframes mem-flip { 0%{transform:rotateY(90deg) scale(.8)} 100%{transform:rotateY(0deg) scale(1)} }
        .mem-result { text-align:center; padding:14px 0 4px; font-weight:700; font-size:1.1rem; min-height:36px; }
      `;
      document.head.appendChild(s);
    }

    const E = ['😺', '😸', '😻', '🙀', '😽', '😹', '🐱', '🐾'];
    let mode = '1p'; // '1p' or '2p'

    el.innerHTML = `
      <div class="mem-wrap">
        <div class="mem-mode">
          <button class="m1p active">👤 1 Player</button>
          <button class="m2p">🆚 2 Players</button>
        </div>
        <div class="mem-hud"><span class="mm">Moves 0</span><button class="mr">New game</button></div>
        <div class="mem-turn"></div>
        <div class="mem-scores" style="display:none">
          <div class="pscore p1 active">P1: 0</div>
          <div class="pscore p2">P2: 0</div>
        </div>
        <div class="mem"></div>
        <div class="mem-result"></div>
      </div>`;

    const B = el.querySelector('.mem');
    const M = el.querySelector('.mm');
    const turnEl = el.querySelector('.mem-turn');
    const scoresEl = el.querySelector('.mem-scores');
    const resultEl = el.querySelector('.mem-result');
    const p1sc = el.querySelector('.pscore.p1');
    const p2sc = el.querySelector('.pscore.p2');

    let first, lock, moves, left, tm;
    let currentPlayer, scores;

    function setMode(m) {
      mode = m;
      el.querySelector('.m1p').classList.toggle('active', m === '1p');
      el.querySelector('.m2p').classList.toggle('active', m === '2p');
      scoresEl.style.display = m === '2p' ? 'flex' : 'none';
      deal();
    }

    function updateTurn() {
      if (mode !== '2p') { turnEl.textContent = ''; return; }
      const name = currentPlayer === 0 ? 'Player 1' : 'Player 2';
      turnEl.textContent = `${currentPlayer === 0 ? '🔵' : '🩷'} ${name}'s turn`;
      turnEl.className = 'mem-turn ' + (currentPlayer === 0 ? 'p1' : 'p2');
      p1sc.classList.toggle('active', currentPlayer === 0);
      p2sc.classList.toggle('active', currentPlayer === 1);
    }

    function updateScores() {
      p1sc.textContent = `P1: ${scores[0]}`;
      p2sc.textContent = `P2: ${scores[1]}`;
    }

    function deal() {
      clearTimeout(tm);
      B.textContent = '';
      resultEl.textContent = '';
      moves = 0; left = 8; first = null; lock = false;
      M.textContent = 'Moves 0';
      currentPlayer = 0;
      scores = [0, 0];
      updateScores();
      updateTurn();

      [...E, ...E].sort(() => Math.random() - .5).forEach(e => {
        const b = document.createElement('button');
        b.className = 'tile'; b.dataset.e = e; b.setAttribute('aria-label', 'Card');
        b.onclick = () => {
          if (lock || b.classList.contains('up') || b.classList.contains('done-p1') || b.classList.contains('done-p2')) return;
          b.classList.add('up'); b.textContent = e;
          if (!first) { first = b; return; }

          moves++; M.textContent = 'Moves ' + moves;
          const a = first; first = null;

          if (a.dataset.e == e) {
            // Match!
            const matchClass = mode === '2p' ? (currentPlayer === 0 ? 'done-p1' : 'done-p2') : 'done-p1';
            a.classList.add(matchClass); b.classList.add(matchClass);
            api.beep(700, .1);
            if (mode === '2p') {
              scores[currentPlayer]++;
              updateScores();
              // matched player goes again — no turn switch
            }
            if (!--left) {
              // Game over
              if (mode === '2p') {
                const diff = scores[0] - scores[1];
                const winner = diff > 0 ? 'Player 1 wins! 🎉' : diff < 0 ? 'Player 2 wins! 🎉' : "It's a draw! 🤝";
                resultEl.textContent = winner;
                resultEl.style.color = diff > 0 ? '#7ecaff' : diff < 0 ? '#ff6b9a' : '#ffd700';
                resultEl.style.textShadow = `0 0 12px ${diff > 0 ? '#7ecaff' : diff < 0 ? '#ff6b9a' : '#ffd700'}`;
                api.score(Math.max(scores[0], scores[1]));
              } else {
                api.score(Math.max(1, 60 - moves * 2));
              }
            }
          } else {
            // Mismatch
            lock = true; api.beep(200, .12);
            tm = setTimeout(() => {
              [a, b].forEach(x => { x.classList.remove('up'); x.textContent = ''; });
              lock = false;
              if (mode === '2p') {
                currentPlayer = 1 - currentPlayer;
                updateTurn();
              }
            }, 700);
          }
        };
        B.append(b);
      });
    }

    el.querySelector('.mr').onclick = deal;
    el.querySelector('.m1p').onclick = () => setMode('1p');
    el.querySelector('.m2p').onclick = () => setMode('2p');
    deal();
    return () => clearTimeout(tm);
  }
});
