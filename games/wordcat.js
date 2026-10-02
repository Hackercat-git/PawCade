Pawcade.register({
  id: 'wordcat', title: 'Wordcat', emoji: '🔤', tags: 'word puzzle',
  blurb: 'Guess the five-letter word in six tries.',
  mount(el, api) {
    const W = 'kitty purrs claws fluff whisk tabby mouse sleep cream tiger apple brave chair dream eagle flame grape house light music ocean plant quiet river stone table water zebra cloud bread candy dance earth ghost happy jelly lemon magic night olive pearl robot sugar bacon brick crown daisy fairy giant honey ivory jolly knife lucky maple noble paint rainy shell storm sunny train unity vivid whale yacht'.split(' ');
    const hint = 'Green is the right spot, yellow is in the word, grey is not.';
    el.innerHTML = `<div class="wc"></div><div class="row"><input class="wi" maxlength="5" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Your guess" placeholder="5 letters"><button class="primary wg">Guess</button><button class="wn">New word</button></div><p class="hint wm">${hint}</p>`;
    const G = el.querySelector('.wc'), I = el.querySelector('.wi'), M = el.querySelector('.wm');
    let w, n, done;
    function reset() { w = W[Math.random() * W.length | 0]; n = 0; done = false; G.innerHTML = '<i></i>'.repeat(30); I.value = ''; M.textContent = hint; I.focus(); }
    function guess() {
      if (done) return; const g = I.value.toLowerCase();
      if (!/^[a-z]{5}$/.test(g)) { M.textContent = 'Type exactly five letters (a to z).'; return; }
      const c = [...G.children].slice(n * 5, n * 5 + 5), left = [...w], r = Array(5).fill('x');
      for (let i = 0; i < 5; i++) if (g[i] == w[i]) { r[i] = 'g'; left[i] = null; }
      for (let i = 0; i < 5; i++) if (r[i] == 'x') { const k = left.indexOf(g[i]); if (k > -1) { r[i] = 'y'; left[k] = null; } }
      c.forEach((e, i) => { e.textContent = g[i]; e.className = r[i]; });
      n++; I.value = '';
      if (g == w) { done = true; api.score(7 - n); M.textContent = 'Purrfect! Solved in ' + n + (n == 1 ? ' try.' : ' tries.'); }
      else if (n == 6) { done = true; M.textContent = 'Out of tries. The word was ' + w + '.'; }
      else M.textContent = (6 - n) + ' tries left.';
    }
    el.querySelector('.wg').onclick = guess;
    el.querySelector('.wn').onclick = reset;
    I.onkeydown = e => { if (e.key == 'Enter') guess(); };
    reset();
    return () => {};
  }
});
