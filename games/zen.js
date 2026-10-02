Pawcade.register({
  id: 'zen', title: 'Zen Cat', emoji: '😽', tags: 'relax sound calm',
  blurb: 'No goal. Pet the cat and listen to it purr.',
  mount(el, api) {
    el.innerHTML = '<div class="zen" role="button" tabindex="0" aria-label="Pet the cat">🐱</div><p class="hint zc">Move over the cat or tap it. Sound starts after your first touch.</p>';
    el.style.position = 'relative';
    const Z = el.querySelector('.zen'), C = el.querySelector('.zc');
    let n = 0, last = 0, ac, m, timer;
    function snd() {
      if (ac) return;
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        const o = ac.createOscillator(), l = ac.createOscillator(), lg = ac.createGain(), a = ac.createGain();
        m = ac.createGain(); o.type = 'sawtooth'; o.frequency.value = 70; l.frequency.value = 22;
        lg.gain.value = .04; a.gain.value = .05; m.gain.value = 0;
        l.connect(lg); lg.connect(a.gain); o.connect(a); a.connect(m); m.connect(ac.destination); o.start(); l.start();
      } catch {}
    }
    function pet() {
      snd(); if (m) m.gain.setTargetAtTime(1, ac.currentTime, .05);
      if (Date.now() - last > 250) { last = Date.now(); n++; api.score(n); C.textContent = 'Pets: ' + n; const h = document.createElement('span'); h.className = 'heart'; h.textContent = '💗'; h.style.left = (25 + Math.random() * 50) + '%'; el.append(h); setTimeout(() => h.remove(), 900); }
      Z.classList.add('pet'); clearTimeout(timer);
      timer = setTimeout(() => { Z.classList.remove('pet'); if (m) m.gain.setTargetAtTime(0, ac.currentTime, .2); }, 400);
    }
    Z.onpointermove = pet; Z.onclick = pet;
    Z.onkeydown = e => { if (e.key == 'Enter' || e.key == ' ') { e.preventDefault(); pet(); } };
    return () => { clearTimeout(timer); if (ac) ac.close(); };
  }
});
