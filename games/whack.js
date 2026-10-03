Pawcade.register({
  id: 'whack', title: 'Whack-a-Mouse', emoji: '🐭', tags: 'reflex clicking',
  blurb: 'Tap the mice, not the cats. You have 30 seconds.',
  mount(el, api) {
    if (!document.getElementById('whack-styles')) {
      const s = document.createElement('style');
      s.id = 'whack-styles';
      s.textContent = `
        .whack-wrap { background: linear-gradient(135deg,#5c3317,#3d2008); border-radius:16px; padding:16px; box-shadow:0 8px 32px #0007; }
        .whack-hud { display:flex; gap:12px; margin-bottom:14px; justify-content:center; }
        .whack-hud span { background:#2a1200cc; border:1px solid #9c5a2a; color:#f0c080; padding:4px 18px; border-radius:20px; font-weight:700; font-size:1rem; letter-spacing:.04em; }
        .holes { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; padding:8px; }
        .hole { width:100%; aspect-ratio:1.3; background:radial-gradient(ellipse at 60% 40%,#1a0a00,#0a0400); border:3px solid #2a1200; border-radius:50%; cursor:pointer; font-size:2rem; display:flex; align-items:center; justify-content:center; transition:transform .08s; box-shadow:inset 0 4px 12px #0008,0 2px 4px #0005; outline:none; }
        .hole:focus-visible { outline:2px solid #f0c080; }
        .hole.popping { animation: whack-pop .18s cubic-bezier(.2,1.6,.4,1) forwards; }
        @keyframes whack-pop { 0%{transform:scale(0) translateY(30%)} 100%{transform:scale(1) translateY(0)} }
        .hole.bonked { animation: whack-bonk .15s ease-out forwards; }
        @keyframes whack-bonk { 0%{transform:scale(1.2)} 100%{transform:scale(0.85)} }
        .whack-go { display:block; margin:14px auto 0; padding:8px 32px; background:linear-gradient(135deg,#9c5a2a,#c47830); color:#fff; border:none; border-radius:20px; font-size:1rem; font-weight:700; cursor:pointer; box-shadow:0 4px 12px #0005; transition:opacity .2s; }
        .whack-go:disabled { opacity:.45; cursor:default; }
      `;
      document.head.appendChild(s);
    }

    el.innerHTML = `
      <div class="whack-wrap">
        <div class="whack-hud"><span class="wt">Time 30</span><span class="ws">Mice 0</span></div>
        <div class="holes"></div>
        <button class="whack-go go">Start</button>
      </div>`;

    const H = el.querySelector('.holes'), T = el.querySelector('.wt'), S = el.querySelector('.ws'), go = el.querySelector('.go');
    const hs = [...Array(9)].map(() => { const b = document.createElement('button'); b.className = 'hole'; b.setAttribute('aria-label', 'Hole'); H.append(b); return b; });
    let sc = 0, left = 0, tick, pop, up = -1, on = false, decoy = false;
    function show() {
      hs.forEach(h => { h.textContent = ''; h.classList.remove('popping'); });
      if (!on) return;
      let i; do i = Math.random() * 9 | 0; while (i == up);
      up = i; decoy = sc > 3 && Math.random() < .2;
      hs[i].textContent = decoy ? '🐱' : '🐭';
      // trigger reflow then add class
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
    function end() { on = false; clearInterval(tick); clearTimeout(pop); show(); api.score(sc); go.disabled = false; go.textContent = 'Play again'; T.textContent = 'Time is up'; }
    go.onclick = () => {
      sc = 0; left = 30; on = true; S.textContent = 'Mice 0'; T.textContent = 'Time 30'; go.disabled = true; show();
      tick = setInterval(() => { left--; T.textContent = 'Time ' + left; if (left <= 0) end(); }, 1000);
    };
    return () => { on = false; clearInterval(tick); clearTimeout(pop); };
  }
});
