Pawcade.register({
  id: 'simon', title: 'Simon Paws', emoji: '🐾', tags: 'memory sequence pattern',
  blurb: 'Repeat the growing paw pattern. How long can your memory stretch?',
  mount(el, api) {
    const PAWS = ['🐾', '🐾', '🐾', '🐾'];
    const COLORS = ['#e03131', '#2f9e44', '#1971c2', '#f59f00'];
    const NOTES = [330, 415, 523, 659];
    el.innerHTML = `
      <div class="row"><span class="si-info">Press Start</span><button class="primary si-start">Start</button></div>
      <div class="si-grid"></div>
      <p class="hint">Watch the sequence, then repeat it in order.</p>`;
    el.querySelector('.si-grid').style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px';
    const grid = el.querySelector('.si-grid'), info = el.querySelector('.si-info');
    const btns = COLORS.map((col, i) => {
      const b = document.createElement('button');
      b.style.cssText = `aspect-ratio:1;font-size:2.4rem;border-radius:16px;background:${col}33;border:2px solid ${col}55;color:${col};transition:background .1s,transform .1s;`;
      b.textContent = PAWS[i]; grid.append(b); return b;
    });
    let seq = [], pos, showing, score;
    function light(i, dur = 350) {
      btns[i].style.background = COLORS[i] + 'cc';
      btns[i].style.transform = 'scale(1.08)';
      api.beep(NOTES[i], dur / 1000 * .85);
      setTimeout(() => { btns[i].style.background = COLORS[i] + '33'; btns[i].style.transform = ''; }, dur);
    }
    function showSeq(cb) {
      showing = true; let idx = 0;
      btns.forEach(b => b.disabled = true);
      info.textContent = 'Watch…';
      const iv = setInterval(() => {
        light(seq[idx++]);
        if (idx >= seq.length) { clearInterval(iv); setTimeout(() => { showing = false; btns.forEach(b => b.disabled = false); pos = 0; info.textContent = 'Your turn — step 1/' + seq.length; if (cb) cb(); }, 500); }
      }, 650);
    }
    function nextRound() {
      seq.push(Math.random() * 4 | 0);
      info.textContent = 'Round ' + seq.length;
      setTimeout(() => showSeq(), 600);
    }
    function start() {
      seq = []; score = 0; el.querySelector('.si-start').textContent = 'Restart';
      btns.forEach(b => { b.disabled = false; });
      nextRound();
    }
    btns.forEach((b, i) => b.addEventListener('click', () => {
      if (showing || b.disabled) return;
      light(i, 200);
      if (seq[pos] === i) {
        pos++;
        if (pos === seq.length) {
          score = seq.length; api.score(score); info.textContent = '✅ Round ' + score + ' complete!';
          api.beep(880, .1); setTimeout(nextRound, 900);
        } else {
          info.textContent = 'Your turn — step ' + (pos + 1) + '/' + seq.length;
        }
      } else {
        api.beep(120, .4, 'sawtooth');
        btns.forEach(b => b.disabled = true);
        info.textContent = '❌ Wrong! Score: ' + score;
        api.score(score);
        setTimeout(() => {
          seq.forEach((s, k) => setTimeout(() => light(s), k * 400));
          setTimeout(() => { btns.forEach(b => b.disabled = false); el.querySelector('.si-start').textContent = 'Play again'; }, seq.length * 400 + 600);
        }, 400);
      }
    }));
    el.querySelector('.si-start').addEventListener('click', start);
    return () => {};
  }
});
