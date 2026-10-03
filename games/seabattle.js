Pawcade.register({
  id: 'seabattle', title: 'Sea Battle', emoji: '⚓', tags: 'puzzle brain multiplayer two-player',
  blurb: 'Sink the fleet! Classic battleship vs AI, or challenge a friend in pass-and-play.',
  mount(el, api) {
    if (!document.getElementById('seabattle-mode-styles')) {
      const s = document.createElement('style');
      s.id = 'seabattle-mode-styles';
      s.textContent = `
        .sb-mode-bar { display:flex; gap:8px; justify-content:center; margin-bottom:6px; }
        .sb-mode-bar button { background:#1c1c3d; color:#aaa; border:1px solid #3a3a6a; border-radius:20px; padding:5px 16px; cursor:pointer; font-size:.85rem; font-weight:700; transition:background .15s,color .15s; }
        .sb-mode-bar button.active { background:linear-gradient(135deg,#2a1a4a,#3a2a6a); color:#c0a0ff; border-color:#7a5aaa; }
        .sb-handoff { display:none; position:absolute; inset:0; background:rgba(10,15,40,.92); border-radius:14px; align-items:center; justify-content:center; flex-direction:column; gap:14px; z-index:10; }
        .sb-handoff.show { display:flex; }
        .sb-handoff h3 { color:#fff; font-size:1.1rem; margin:0; text-align:center; }
        .sb-handoff p { color:#aaa; font-size:.85rem; margin:0; text-align:center; }
        .sb-handoff button { background:linear-gradient(135deg,#ff6b9a,#c04070); color:#fff; border:none; border-radius:20px; padding:10px 28px; cursor:pointer; font-size:1rem; font-weight:700; }
      `;
      document.head.appendChild(s);
    }

    const N = 8, CS = Math.min(32, Math.floor((Math.min(window.innerWidth, 520) - 56) / (N * 2 + 0.5)));
    const SHIPS = [4, 3, 3, 2, 2];
    const wrap = document.createElement('div');
    wrap.style.cssText='display:flex;flex-direction:column;align-items:center;gap:6px;padding:4px;position:relative;';
    const modeBar = document.createElement('div');
    modeBar.className = 'sb-mode-bar';
    modeBar.innerHTML = '<button class="active" data-m="1p">👤 vs AI</button><button data-m="2p">🆚 2 Players</button>';
    const hint = document.createElement('p'); hint.className='hint';
    hint.style.margin='0'; hint.textContent='📱 Tap enemy waters to fire · Sink all 5 ships to win!';
    const c = document.createElement('canvas');
    const CW = (N*CS+8)*2+40, CH = N*CS+80;
    c.width=CW; c.height=CH; c.className='board';
    const handoff = document.createElement('div');
    handoff.className = 'sb-handoff';
    wrap.append(modeBar, c, hint, handoff); el.append(wrap);
    const ctx = c.getContext('2d');
    const OX1=4, OX2=N*CS+44, OY=44;

    let grids, shots, ships, state, message, raf, particles=[], mode='1p';
    let curPlayer = 0; // 0 or 1 in 2P mode

    function setMode(m) {
      mode = m;
      modeBar.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.m === m));
      reset();
    }
    modeBar.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setMode(b.dataset.m); });

    function makeGrid(){return Array.from({length:N},()=>Array(N).fill(0));}

    function placeShips(grid) {
      const sh=[];
      for (const len of SHIPS) {
        let placed=false,tries=0;
        while (!placed&&tries++<200) {
          const horiz=Math.random()<0.5;
          const row=Math.floor(Math.random()*(horiz?N:N-len+1));
          const col=Math.floor(Math.random()*(horiz?N-len+1:N));
          let ok=true;
          for (let i=0;i<len;i++){const r=horiz?row:row+i,c2=horiz?col+i:col;if(grid[r][c2]){ok=false;break;}}
          if (ok) {
            const cells=[];
            for (let i=0;i<len;i++){const r=horiz?row:row+i,c2=horiz?col+i:col;grid[r][c2]=1;cells.push([r,c2]);}
            sh.push({cells,sunk:false}); placed=true;
          }
        }
      }
      return sh;
    }

    function spawnParticles(px, py, color, n) {
      for (let i=0;i<n;i++){const a=Math.random()*Math.PI*2,sp=1.5+Math.random()*4;particles.push({x:px,y:py,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,color,size:2+Math.random()*4});}
    }

    function reset() {
      grids=[makeGrid(),makeGrid()];
      shots=[makeGrid(),makeGrid()];
      ships=[placeShips(grids[0]),placeShips(grids[1])];
      curPlayer=0;
      if (mode==='2p') message='🔵 Player 1 — tap enemy waters!';
      else message='Your turn — click the enemy waters!';
      state='play'; particles=[];
      handoff.classList.remove('show');
    }

    function checkSunk(shipList,shotGrid,r,c) {
      for (const s of shipList) {
        if (s.sunk) continue;
        if (s.cells.some(([sr,sc])=>sr===r&&sc===c)) {
          if (s.cells.every(([sr,sc])=>shotGrid[sr][sc]===1)){s.sunk=true;return true;}
        }
      }
      return false;
    }

    function allSunk(shipList){return shipList.every(s=>s.sunk);}

    function aiMove() {
      const ai=1, human=0;
      let r,c2,tries=0;
      do{r=Math.floor(Math.random()*N);c2=Math.floor(Math.random()*N);tries++;}while(shots[ai][r][c2]!==0&&tries<200);
      if (shots[ai][r][c2]!==0) return;
      const hit=grids[human][r][c2]===1;
      shots[ai][r][c2]=hit?2:1;
      if (hit) {
        checkSunk(ships[human],shots[ai],r,c2);
        spawnParticles(OX1+c2*CS+CS/2,OY+r*CS+CS/2,'#ff4444',14);
        api.beep(250,.2,'sawtooth');
        if (allSunk(ships[human])){message='The enemy sunk your fleet! 😿';state='over';api.score(1);}
        else message='Enemy hit your ship! 😾';
      } else {api.beep(180,.1);message='Enemy missed.';}
    }

    function showHandoff(p2Label, cb) {
      handoff.innerHTML = `<h3>${p2Label}</h3><p>Hand the device to Player 2, then tap below.</p><button>▶ Player 2's Turn</button>`;
      handoff.classList.add('show');
      handoff.querySelector('button').addEventListener('click', () => { handoff.classList.remove('show'); cb(); }, { once: true });
    }

    function playerFire(r, c2) {
      if (state!=='play'){reset();return;}
      const attacker = mode==='2p' ? curPlayer : 0;
      const defender = mode==='2p' ? 1 - curPlayer : 1;

      if (shots[attacker][r][c2]!==0) return;
      const hit=grids[defender][r][c2]===1;
      shots[attacker][r][c2]=hit?2:1;
      if (hit) {
        const sunk=checkSunk(ships[defender],shots[attacker],r,c2);
        const ex = OX2+c2*CS+CS/2, ey = OY+r*CS+CS/2;
        spawnParticles(ex,ey,sunk?'#ffd700':'#ff9a3c',sunk?20:12);
        api.beep(sunk?800:600,.1);
        if (allSunk(ships[defender])){
          if (mode==='2p') {
            message=`🏆 Player ${curPlayer+1} wins! Fleet sunk!`;
            api.score(SHIPS.length*10);
          } else {
            message='🏆 You sunk the enemy fleet! 🐾';
            api.score(SHIPS.length*10);
          }
          state='over'; return;
        }
        message=sunk
          ? (mode==='2p' ? `Player ${curPlayer+1}: ship sunk! 💥 Keep firing!` : 'Direct hit — ship sunk! 💥 Keep firing!')
          : (mode==='2p' ? `Player ${curPlayer+1}: hit! Keep firing!` : 'Hit! Keep firing!');
        // Hit = fire again (same player keeps going)
      } else {
        api.beep(280,.08);
        spawnParticles(OX2+c2*CS+CS/2,OY+r*CS+CS/2,'#4ec4ff',6);
        if (mode==='2p') {
          // Switch players after a miss
          curPlayer = 1 - curPlayer;
          const nextLabel = curPlayer===0 ? '🔵 Player 1' : '🩷 Player 2';
          message=`${nextLabel} — tap enemy waters!`;
          showHandoff(nextLabel + "'s turn", () => {});
        } else {
          message='Miss... 💧';
          setTimeout(()=>{if(state==='play')aiMove();},400);
        }
      }
    }

    function draw() {
      const grad=ctx.createLinearGradient(0,0,0,CH);
      grad.addColorStop(0,'#0d1240'); grad.addColorStop(1,'#12122a');
      ctx.fillStyle=grad; ctx.fillRect(0,0,CW,CH);

      ctx.font='bold 12px system-ui'; ctx.textAlign='center'; ctx.textBaseline='top';
      const p1Color = mode==='2p' ? (curPlayer===0?'#7ecaff':'rgba(126,202,255,0.4)') : '#7ecaff';
      const p2Color = mode==='2p' ? (curPlayer===1?'#ff6b9a':'rgba(255,107,154,0.4)') : '#ff6b9a';
      ctx.shadowBlur=8; ctx.shadowColor=p1Color;
      ctx.fillStyle=p1Color;
      ctx.fillText(mode==='2p'?'Player 1 fleet':'Your fleet',OX1+N*CS/2,8);
      ctx.fillStyle=p2Color; ctx.shadowColor=p2Color;
      ctx.fillText(mode==='2p'?'Player 2 fleet (enemy)':'Enemy waters',OX2+N*CS/2,8);
      ctx.shadowBlur=0;
      ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='10px system-ui';
      ctx.fillText('(ships shown)',OX1+N*CS/2,23);
      ctx.fillText(mode==='2p'?'(shoot here!)':'(shoot here!)',OX2+N*CS/2,23);

      const attacker = mode==='2p' ? curPlayer : 0;
      const defender = mode==='2p' ? 1-curPlayer : 1;
      drawGrid(OX1,OY,grids[attacker],shots[defender],ships[attacker],false);
      drawGrid(OX2,OY,grids[defender],shots[attacker],ships[defender],true);

      particles=particles.filter(p=>p.life>0);
      for (const p of particles) {
        p.x+=p.vx;p.y+=p.vy;p.vy+=0.1;p.life-=0.04;
        ctx.globalAlpha=p.life; ctx.fillStyle=p.color;
        ctx.shadowBlur=8; ctx.shadowColor=p.color;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2); ctx.fill();
        ctx.shadowBlur=0;
      }
      ctx.globalAlpha=1;

      ctx.fillStyle='rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.roundRect(0,OY+N*CS+6,CW,32,0); ctx.fill();
      ctx.fillStyle='#fff'; ctx.font=state==='over'?'bold 13px system-ui':'13px system-ui';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.shadowBlur=state==='over'?8:0; ctx.shadowColor='#7ecaff';
      ctx.fillText(state==='over'?message+'  Tap to play again!':message,CW/2,OY+N*CS+22);
      ctx.shadowBlur=0;
    }

    function drawGrid(ox, oy, grid, shotsGrid, shipList, hideShips) {
      const wg=ctx.createLinearGradient(ox,oy,ox+N*CS,oy+N*CS);
      wg.addColorStop(0,'#0d2a5a'); wg.addColorStop(1,'#0a1e3d');
      ctx.fillStyle=wg;
      ctx.shadowBlur=12; ctx.shadowColor='rgba(30,80,180,0.5)';
      ctx.fillRect(ox,oy,N*CS,N*CS);
      ctx.shadowBlur=0;

      for (let r=0;r<N;r++) for (let c2=0;c2<N;c2++) {
        const x=ox+c2*CS, y=oy+r*CS;
        if (!hideShips&&grid[r][c2]===1) {
          const sg=ctx.createLinearGradient(x,y,x+CS,y);
          sg.addColorStop(0,'#3a5a8a'); sg.addColorStop(1,'#5a7aaa');
          ctx.fillStyle=sg; ctx.beginPath(); ctx.roundRect(x+1,y+1,CS-2,CS-2,3); ctx.fill();
        }
        if (shotsGrid[r][c2]===2) {
          ctx.fillStyle='rgba(220,50,50,0.4)'; ctx.fillRect(x,y,CS,CS);
          ctx.font='14px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.shadowBlur=10; ctx.shadowColor='#ff4444';
          ctx.fillText('💥',x+CS/2,y+CS/2);
          ctx.shadowBlur=0;
        } else if (shotsGrid[r][c2]===1) {
          ctx.fillStyle='rgba(150,220,255,0.5)';
          ctx.beginPath(); ctx.arc(x+CS/2,y+CS/2,4,0,Math.PI*2); ctx.fill();
        }
        ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=1;
        ctx.strokeRect(x,y,CS,CS);
      }
      for (const ship of shipList) {
        if (!ship.sunk) continue;
        ship.cells.forEach(([r,c2])=>{
          ctx.font='14px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.shadowBlur=8; ctx.shadowColor='#7ecaff';
          ctx.fillText('🐱',ox+c2*CS+CS/2,oy+r*CS+CS/2);
          ctx.shadowBlur=0;
        });
      }
      ctx.strokeStyle='rgba(126,202,255,0.5)'; ctx.lineWidth=1.5;
      ctx.strokeRect(ox,oy,N*CS,N*CS);
    }

    c.style.touchAction='none';
    c.addEventListener('pointerdown', e => {
      const r2=c.getBoundingClientRect();
      const cx2=(e.clientX-r2.left)*(CW/r2.width);
      const cy2=(e.clientY-r2.top)*(CH/r2.height);
      const col=Math.floor((cx2-OX2)/CS), row=Math.floor((cy2-OY)/CS);
      if (col>=0&&col<N&&row>=0&&row<N) playerFire(row,col);
      else if (state==='over') reset();
    });

    function tick(){draw();raf=requestAnimationFrame(tick);}
    reset(); tick();
    return ()=>cancelAnimationFrame(raf);
  }
});
