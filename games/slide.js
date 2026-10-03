Pawcade.register({
  id: 'slide', title: 'Slide Paws', emoji: '🔢', tags: 'puzzle sliding brain',
  blurb: 'Slide the cat tiles into order. Fewer moves = better score.',
  mount(el, api) {
    const N = 4, EMOJIS = ['🐱','😸','😺','😻','🙀','😽','🐾','🐈','🐟','🧶','🧤','😹','😼','🐭','🐀'];
    el.innerHTML = `
      <div class="row"><span class="sl-info">Moves: 0</span><button class="sl-sz">3×3</button><button class="primary sl-new">New game</button></div>
      <div class="sl-board"></div>
      <p class="hint">Click/tap a tile next to the gap to slide it. Arrow keys also work.</p>`;
    const board = el.querySelector('.sl-board'), info = el.querySelector('.sl-info'), szBtn = el.querySelector('.sl-sz');
    board.style.cssText = 'display:grid;gap:6px;touch-action:none;margin-top:8px;background:rgba(0,0,0,0.3);padding:10px;border-radius:14px;box-shadow:0 4px 24px rgba(0,0,0,0.4);';
    let size = 4, tiles, blank, moves, solved;

    function setSize(n) { size=n; szBtn.textContent=size===4?'3×3':'4×4'; start(); }
    szBtn.onclick = () => setSize(size===4?3:4);

    function start() {
      const n=size*size, emojis=EMOJIS.slice(0,n-1);
      tiles=[...emojis,null]; moves=0; solved=false;
      blank=n-1;
      for (let i=0;i<300;i++) {
        const r=blank%size, co=Math.floor(blank/size)%size;
        const neighbors=[];
        if (r>0) neighbors.push(blank-1);
        if (r<size-1) neighbors.push(blank+1);
        if (co>0) neighbors.push(blank-size);
        if (co<size-1) neighbors.push(blank+size);
        const nb=neighbors[Math.random()*neighbors.length|0];
        [tiles[blank],tiles[nb]]=[tiles[nb],tiles[blank]]; blank=nb;
      }
      info.textContent='Moves: 0'; render();
    }

    function tryMove(idx) {
      if (solved) return;
      const r0=blank%size, c0=Math.floor(blank/size);
      const r1=idx%size, c1=Math.floor(idx/size);
      if (Math.abs(r0-r1)+Math.abs(c0-c1)!==1) return;
      [tiles[blank],tiles[idx]]=[tiles[idx],tiles[blank]]; blank=idx;
      moves++; info.textContent='Moves: '+moves; api.beep(440,.04);
      const n=size*size;
      if (tiles.slice(0,n-1).every((t,i)=>t===EMOJIS[i])&&tiles[n-1]===null) {
        solved=true;
        const score=Math.max(1,Math.floor(500/moves*(size-2)));
        api.score(score); api.beep(880,.15);
        info.textContent=`🎉 Solved in ${moves} moves! Score: ${score}`;
      }
      render();
    }

    function render() {
      board.style.gridTemplateColumns=`repeat(${size}, 1fr)`;
      board.innerHTML='';
      tiles.forEach((t,i) => {
        const b=document.createElement('button');
        const fs=size===3?'2.2':'1.8';
        b.style.cssText=`aspect-ratio:1;font-size:${fs}rem;border-radius:12px;`+
          (t ? 'background:linear-gradient(135deg,#1c1c3d,#252550);border:2px solid rgba(126,202,255,0.3);cursor:pointer;box-shadow:0 2px 12px rgba(126,202,255,0.15);color:#f0f0ff;transition:transform .1s,box-shadow .15s;'
             : 'background:rgba(0,0,0,0.2);border:2px solid transparent;cursor:default;');
        if (t) {
          b.textContent=t;
          b.onmouseenter=()=>{b.style.boxShadow='0 2px 20px rgba(126,202,255,0.45)';b.style.transform='scale(1.06)';};
          b.onmouseleave=()=>{b.style.boxShadow='0 2px 12px rgba(126,202,255,0.15)';b.style.transform='';};
          b.onclick=()=>tryMove(i);
        } else b.setAttribute('aria-hidden','true');
        board.append(b);
      });
    }

    el.querySelector('.sl-new').onclick=start;
    const DIRS={ArrowLeft:1,ArrowRight:-1,ArrowUp:size,ArrowDown:-size};
    const kd=e=>{if(!(e.key in DIRS))return;e.preventDefault();const target=blank+DIRS[e.key];if(target>=0&&target<size*size)tryMove(target);};
    document.addEventListener('keydown',kd);
    start();
    return ()=>document.removeEventListener('keydown',kd);
  }
});
