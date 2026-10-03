Pawcade.register({
  id: 'meowmory', title: 'Meowmory', emoji: '😺', tags: 'memory puzzle cards',
  blurb: 'Find all eight cat pairs in as few moves as you can.',
  mount(el, api) {
    if (!document.getElementById('memory-styles')) {
      const s = document.createElement('style');
      s.id = 'memory-styles';
      s.textContent = `
        .mem-wrap { background:linear-gradient(160deg,#0d1b2a,#1a2a3a); border-radius:16px; padding:16px; box-shadow:0 8px 32px #0008; }
        .mem-hud { display:flex; align-items:center; gap:12px; margin-bottom:14px; justify-content:space-between; }
        .mem-hud span { color:#7ecaff; font-weight:700; font-size:1rem; }
        .mem-hud button { background:linear-gradient(135deg,#1c3a5a,#2a4f70); color:#7ecaff; border:1px solid #3a6080; border-radius:20px; padding:5px 18px; cursor:pointer; font-size:.9rem; font-weight:600; }
        .mem { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
        .tile { aspect-ratio:1; background:linear-gradient(135deg,#1a2a3a,#0d1b2a); border:2px solid #2a4060; border-radius:12px; font-size:1.7rem; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:transform .15s, box-shadow .15s; perspective:400px; transform-style:preserve-3d; position:relative; }
        .tile::before { content:'?'; position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:1.4rem; color:#3a6080; font-weight:900; }
        .tile.up::before, .tile.done::before { display:none; }
        .tile.up { animation: mem-flip .22s ease-out forwards; border-color:#7ecaff55; background:linear-gradient(135deg,#1c3a5a,#0d2030); }
        .tile.done { border-color:#7ecaff; box-shadow:0 0 14px #7ecaff88, inset 0 0 10px #7ecaff22; background:linear-gradient(135deg,#0d2a3a,#0d3040); }
        @keyframes mem-flip { 0%{transform:rotateY(90deg) scale(.8)} 100%{transform:rotateY(0deg) scale(1)} }
      `;
      document.head.appendChild(s);
    }

    const E = ['😺', '😸', '😻', '🙀', '😽', '😹', '🐱', '🐾'];
    el.innerHTML = `
      <div class="mem-wrap">
        <div class="mem-hud"><span class="mm">Moves 0</span><button class="mr">New game</button></div>
        <div class="mem"></div>
      </div>`;
    const B = el.querySelector('.mem'), M = el.querySelector('.mm');
    let first, lock, moves, left, tm;
    function deal() {
      clearTimeout(tm); B.textContent = ''; moves = 0; left = 8; first = null; lock = false; M.textContent = 'Moves 0';
      [...E, ...E].sort(() => Math.random() - .5).forEach(e => {
        const b = document.createElement('button'); b.className = 'tile'; b.dataset.e = e; b.setAttribute('aria-label', 'Card');
        b.onclick = () => {
          if (lock || b.classList.contains('up')) return;
          b.classList.add('up'); b.textContent = e;
          if (!first) { first = b; return; }
          moves++; M.textContent = 'Moves ' + moves;
          const a = first; first = null;
          if (a.dataset.e == e) { a.classList.add('done'); b.classList.add('done'); api.beep(700, .1); if (!--left) api.score(Math.max(1, 60 - moves * 2)); }
          else { lock = true; api.beep(200, .12); tm = setTimeout(() => { [a, b].forEach(x => { x.classList.remove('up'); x.textContent = ''; }); lock = false; }, 700); }
        };
        B.append(b);
      });
    }
    el.querySelector('.mr').onclick = deal; deal();
    return () => clearTimeout(tm);
  }
});
