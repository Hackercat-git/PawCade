Pawcade.register({
  id: 'zen', title: 'Zen Cat', emoji: '😽', tags: 'relax sound calm',
  blurb: 'No goal. Pet the cat and listen to it purr.',
  mount(el, api) {
    if (!document.getElementById('zen-styles')) {
      const s = document.createElement('style');
      s.id = 'zen-styles';
      s.textContent = `
        .zen-wrap { position:relative; border-radius:16px; overflow:hidden; background:linear-gradient(160deg,#0d0820,#1a0a30,#0a1a20); min-height:260px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px 16px; box-shadow:0 8px 32px #0009; cursor:pointer; user-select:none; }
        .zen-particles { position:absolute; inset:0; pointer-events:none; overflow:hidden; }
        .zen-particle { position:absolute; font-size:1.2rem; animation: zen-float 3s ease-out forwards; opacity:0; }
        @keyframes zen-float { 0%{opacity:0;transform:translateY(0) scale(.5)} 20%{opacity:1;transform:translateY(-20px) scale(1)} 80%{opacity:.8;transform:translateY(-80px) scale(.9)} 100%{opacity:0;transform:translateY(-120px) scale(.7)} }
        .zen-star { position:absolute; border-radius:50%; background:#fff; animation:zen-twinkle 2s ease-in-out infinite alternate; }
        @keyframes zen-twinkle { 0%{opacity:.15} 100%{opacity:.7} }
        .zen { font-size:5rem; line-height:1; transition:transform .2s, filter .3s; filter:drop-shadow(0 0 12px #a070ff88); display:block; position:relative; z-index:1; }
        .zen.pet { transform:scale(1.15); filter:drop-shadow(0 0 24px #ff90c0cc) drop-shadow(0 0 40px #ff90c044); animation:zen-purr .15s ease-in-out 0s 2 alternate; }
        @keyframes zen-purr { 0%{transform:scale(1.12) rotate(-2deg)} 100%{transform:scale(1.18) rotate(2deg)} }
        .zen-hint { color:#8060a0; font-size:.85rem; margin-top:16px; position:relative; z-index:1; text-align:center; transition:color .3s; }
        .zen-hint.active { color:#c090e0; }
        .zen-aura { position:absolute; border-radius:50%; pointer-events:none; transition:transform .4s, opacity .4s; }
        .zen-aura-1 { width:200px; height:200px; background:radial-gradient(circle,#8040ff15 0%,transparent 70%); top:50%; left:50%; transform:translate(-50%,-50%) scale(0); }
        .zen-aura-2 { width:280px; height:280px; background:radial-gradient(circle,#ff60a010 0%,transparent 70%); top:50%; left:50%; transform:translate(-50%,-50%) scale(0); }
        .zen-wrap.petting .zen-aura-1 { transform:translate(-50%,-50%) scale(1); }
        .zen-wrap.petting .zen-aura-2 { transform:translate(-50%,-50%) scale(1.2); }
      `;
      document.head.appendChild(s);
    }

    el.innerHTML = `
      <div class="zen-wrap" role="button" tabindex="0" aria-label="Pet the cat">
        <div class="zen-particles"></div>
        <div class="zen-aura zen-aura-2"></div>
        <div class="zen-aura zen-aura-1"></div>
        <span class="zen">🐱</span>
        <p class="hint zen-hint zc">Move over the cat or tap it. Sound starts after your first touch.</p>
      </div>`;

    el.style.position = 'relative';
    const wrap = el.querySelector('.zen-wrap');
    const Z = el.querySelector('.zen'), C = el.querySelector('.zc');
    const pContainer = el.querySelector('.zen-particles');

    // Add twinkling stars
    for (let i = 0; i < 18; i++) {
      const star = document.createElement('div');
      star.className = 'zen-star';
      const size = 1 + Math.random() * 2.5;
      star.style.cssText = `width:${size}px;height:${size}px;top:${Math.random()*100}%;left:${Math.random()*100}%;animation-delay:${Math.random()*2}s;animation-duration:${1.5+Math.random()*2}s;`;
      pContainer.appendChild(star);
    }

    let n = 0, last = 0, ac, m, timer, pettingTimer;
    const EMOJIS = ['💗','💜','✨','🌸','💫','⭐','🌙'];
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
    function spawnParticle() {
      const h = document.createElement('span');
      h.className = 'zen-particle';
      h.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      h.style.left = (20 + Math.random() * 60) + '%';
      h.style.bottom = '30%';
      h.style.animationDuration = (2 + Math.random() * 1.5) + 's';
      h.style.animationDelay = (Math.random() * .3) + 's';
      pContainer.appendChild(h);
      setTimeout(() => h.remove(), 3500);
    }
    function pet() {
      snd(); if (m) m.gain.setTargetAtTime(1, ac.currentTime, .05);
      wrap.classList.add('petting');
      clearTimeout(pettingTimer);
      pettingTimer = setTimeout(() => wrap.classList.remove('petting'), 600);
      if (Date.now() - last > 250) {
        last = Date.now(); n++; api.score(n);
        C.textContent = 'Pets: ' + n; C.classList.add('active');
        spawnParticle();
        // extra particle burst every 5 pets
        if (n % 5 === 0) { spawnParticle(); spawnParticle(); }
      }
      Z.classList.add('pet'); clearTimeout(timer);
      timer = setTimeout(() => { Z.classList.remove('pet'); if (m) m.gain.setTargetAtTime(0, ac.currentTime, .2); }, 400);
    }
    Z.onpointermove = pet; Z.onclick = pet; wrap.onclick = pet;
    Z.onkeydown = e => { if (e.key == 'Enter' || e.key == ' ') { e.preventDefault(); pet(); } };
    return () => { clearTimeout(timer); clearTimeout(pettingTimer); if (ac) ac.close(); };
  }
});
