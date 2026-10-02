Pawcade.register({
  id: 'whack', title: 'Whack-a-Mouse', emoji: '🐭', tags: 'reflex clicking',
  blurb: 'Tap the mice, not the cats. You have 30 seconds.',
  mount(el, api) {
    el.innerHTML = '<div class="row"><span class="wt">Time 30</span><span class="ws">Mice 0</span></div><div class="holes"></div><button class="primary go">Start</button>';
    const H = el.querySelector('.holes'), T = el.querySelector('.wt'), S = el.querySelector('.ws'), go = el.querySelector('.go');
    const hs = [...Array(9)].map(() => { const b = document.createElement('button'); b.className = 'hole'; b.setAttribute('aria-label', 'Hole'); H.append(b); return b; });
    let sc = 0, left = 0, tick, pop, up = -1, on = false, decoy = false;
    function show() {
      hs.forEach(h => h.textContent = ''); if (!on) return;
      let i; do i = Math.random() * 9 | 0; while (i == up);
      up = i; decoy = sc > 3 && Math.random() < .2; hs[i].textContent = decoy ? '🐱' : '🐭'; pop = setTimeout(show, Math.max(380, 800 - sc * 12));
    }
    hs.forEach((h, i) => h.onclick = () => {
      if (on && i == up && h.textContent) { sc = decoy ? Math.max(0, sc - 3) : sc + 1; api.beep(decoy ? 150 : 700, .07); S.textContent = 'Mice ' + sc; h.textContent = ''; clearTimeout(pop); pop = setTimeout(show, 150); }
    });
    function end() { on = false; clearInterval(tick); clearTimeout(pop); show(); api.score(sc); go.disabled = false; go.textContent = 'Play again'; T.textContent = 'Time is up'; }
    go.onclick = () => {
      sc = 0; left = 30; on = true; S.textContent = 'Mice 0'; T.textContent = 'Time 30'; go.disabled = true; show();
      tick = setInterval(() => { left--; T.textContent = 'Time ' + left; if (left <= 0) end(); }, 1000);
    };
    return () => { on = false; clearInterval(tick); clearTimeout(pop); };
  }
});
