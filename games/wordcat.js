Pawcade.register({
  id: 'wordcat', title: 'Wordcat', emoji: '🔤', tags: 'word puzzle',
  blurb: 'Guess the five-letter word in six tries.',
  mount(el, api) {
    const W = 'kitty purrs claws fluff whisk tabby mouse sleep cream tiger apple brave chair dream eagle flame grape house light music ocean plant quiet river stone table water zebra cloud bread candy dance earth ghost happy jelly lemon magic night olive pearl robot sugar bacon brick crown daisy fairy giant honey ivory jolly knife lucky maple noble paint rainy shell storm sunny train unity vivid whale yacht'.split(' ');
    const hintText = 'Green is the right spot, yellow is in the word, grey is not.';
    el.innerHTML = `
      <div class="wc-grid"></div>
      <div class="bar"><input class="wi" maxlength="5" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Your guess" placeholder="5 letters"><button class="primary wg">Guess</button><button class="wn">New word</button></div>
      <p class="hint wm">${hintText}</p>`;

    // Style the grid container
    const G = el.querySelector('.wc-grid');
    G.style.cssText = 'display:grid;grid-template-columns:repeat(5,1fr);gap:5px;padding:8px;background:rgba(0,0,0,0.25);border-radius:12px;margin-bottom:10px;max-width:280px;margin-left:auto;margin-right:auto;';

    const I = el.querySelector('.wi'), M = el.querySelector('.wm');
    let w, n, done;

    function reset() {
      w=W[Math.random()*W.length|0]; n=0; done=false;
      G.innerHTML='';
      for (let i=0;i<30;i++) {
        const cell=document.createElement('div');
        cell.style.cssText='aspect-ratio:1;display:flex;align-items:center;justify-content:center;border-radius:8px;font-size:1.4rem;font-weight:bold;background:rgba(255,255,255,0.06);border:2px solid rgba(255,255,255,0.15);color:#f0f0ff;transition:background .3s,border-color .3s,transform .2s;';
        G.append(cell);
      }
      I.value=''; M.textContent=hintText; I.focus();
    }

    function guess() {
      if (done) return;
      const g=I.value.toLowerCase();
      if (!/^[a-z]{5}$/.test(g)){M.textContent='Type exactly five letters (a to z).';return;}
      const cells=[...G.children].slice(n*5,n*5+5);
      const left=[...w], r=Array(5).fill('x');
      for (let i=0;i<5;i++) if (g[i]==w[i]){r[i]='g';left[i]=null;}
      for (let i=0;i<5;i++) if (r[i]==='x'){const k=left.indexOf(g[i]);if(k>-1){r[i]='y';left[k]=null;}}
      cells.forEach((cell,i)=>{
        cell.textContent=g[i].toUpperCase();
        setTimeout(()=>{
          if (r[i]==='g') {
            cell.style.background='linear-gradient(135deg,#2a7a3a,#3aaa4a)';
            cell.style.borderColor='#4ef07c';
            cell.style.boxShadow='0 0 10px rgba(78,240,124,0.4)';
          } else if (r[i]==='y') {
            cell.style.background='linear-gradient(135deg,#7a5a10,#b08020)';
            cell.style.borderColor='#ffd600';
            cell.style.boxShadow='0 0 10px rgba(255,214,0,0.4)';
          } else {
            cell.style.background='rgba(255,255,255,0.1)';
            cell.style.borderColor='rgba(255,255,255,0.2)';
          }
          cell.style.transform='scale(1.05)';
          setTimeout(()=>cell.style.transform='',200);
        }, i*60);
      });
      n++; I.value='';
      if (g==w){done=true;api.score(7-n);M.textContent='Purrfect! 😻 Solved in '+n+(n==1?' try.':' tries.');}
      else if (n==6){done=true;M.textContent='Out of tries. The word was '+w+'.';}
      else M.textContent=(6-n)+' tries left.';
    }

    el.querySelector('.wg').onclick=guess;
    G.addEventListener('pointerdown',()=>I.focus());
    el.querySelector('.wn').onclick=reset;
    I.onkeydown=e=>{if(e.key=='Enter')guess();};
    reset();
    return ()=>{};
  }
});
