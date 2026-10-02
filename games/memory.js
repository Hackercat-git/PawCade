Pawcade.register({
  id: 'meowmory', title: 'Meowmory', emoji: '😺', tags: 'memory puzzle cards',
  blurb: 'Find all eight cat pairs in as few moves as you can.',
  mount(el, api) {
    const E = ['😺', '😸', '😻', '🙀', '😽', '😹', '🐱', '🐾'];
    el.innerHTML = '<div class="row"><span class="mm">Moves 0</span><button class="mr">New game</button></div><div class="mem"></div>';
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
