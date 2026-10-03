Pawcade.register({
  id: 'seabattle', title: 'Sea Battle', emoji: '⚓', tags: 'puzzle brain',
  blurb: 'Sink the enemy cat fleet! Classic battleship vs the AI.',
  mount(el, api) {
    const N = 8, CS = Math.min(32, Math.floor((Math.min(window.innerWidth, 520) - 56) / (N * 2 + 0.5)));
    const SHIPS = [4, 3, 3, 2, 2];
    const wrap = document.createElement('div');
    wrap.style.cssText='display:flex;flex-direction:column;align-items:center;gap:6px;padding:4px;';
    const hint = document.createElement('p'); hint.className='hint';
    hint.style.margin='0'; hint.textContent='📱 Tap enemy waters to fire · Sink all 5 ships to win!';
    const c = document.createElement('canvas');
    const CW = (N*CS+8)*2+40, CH = N*CS+80;
    c.width=CW; c.height=CH; c.className='board';
    wrap.append(c, hint); el.append(wrap);
    const ctx = c.getContext('2d');
    const OX1=4, OX2=N*CS+44, OY=44;

    let playerGrid, aiGrid, playerShips, aiShips, playerShots, aiShots;
    let state, message, raf, frame, particles=[];

    function makeGrid(){return Array.from({length:N},()=>Array(N).fill(0));}

    function placeShips(grid) {
      const ships=[];
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
            ships.push({cells,sunk:false}); placed=true;
          }
        }
      }
      return ships;
    }

    function spawnParticles(px, py, color, n) {
      for (let i=0;i<n;i++){const a=Math.random()*Math.PI*2,sp=1.5+Math.random()*4;particles.push({x:px,y:py,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,color,size:2+Math.random()*4});}
    }

    function reset() {
      playerGrid=makeGrid();aiGrid=makeGrid();playerShots=makeGrid();aiShots=makeGrid();
      playerShips=placeShips(playerGrid);aiShips=placeShips(aiGrid);
      message='Your turn — click the enemy waters!';state='play';frame=0;particles=[];
    }

    function checkSunk(ships,shots,r,c) {
      for (const s of ships) {
        if (s.sunk) continue;
        if (s.cells.some(([sr,sc])=>sr===r&&sc===c)) {
          if (s.cells.every(([sr,sc])=>shots[sr][sc]===1)){s.sunk=true;return true;}
        }
      }
      return false;
    }

    function allSunk(ships){return ships.every(s=>s.sunk);}

    function aiMove() {
      let r,c2,tries=0;
      do{r=Math.floor(Math.random()*N);c2=Math.floor(Math.random()*N);tries++;}while(aiShots[r][c2]!==0&&tries<200);
      if (aiShots[r][c2]!==0) return;
      const hit=playerGrid[r][c2]===1;
      aiShots[r][c2]=hit?2:1;
      if (hit) {
        checkSunk(playerShips,aiShots,r,c2);
        spawnParticles(OX1+c2*CS+CS/2,OY+r*CS+CS/2,'#ff4444',14);
        api.beep(250,.2,'sawtooth');
        if (allSunk(playerShips)){message='The enemy sunk your fleet! 😿';state='over';api.score(1);}
        else message='Enemy hit your ship! 😾';
      } else {api.beep(180,.1);message='Enemy missed.';}
    }

    function playerFire(r,c2) {
      if (state!=='play'){reset();return;}
      if (playerShots[r][c2]!==0) return;
      const hit=aiGrid[r][c2]===1;
      playerShots[r][c2]=hit?2:1;
      if (hit) {
        const sunk=checkSunk(aiShips,playerShots,r,c2);
        spawnParticles(OX2+c2*CS+CS/2,OY+r*CS+CS/2,sunk?'#ffd700':'#ff9a3c',sunk?20:12);
        api.beep(sunk?800:600,.1);
        if (allSunk(aiShips)){message='🏆 You sunk the enemy fleet! 🐾';state='over';api.score(SHIPS.length*10);return;}
        message=sunk?'Direct hit — enemy ship sunk! 💥🐱':'Hit! Keep firing!';
      } else {
        api.beep(280,.08);message='Miss... 💧';
        spawnParticles(OX2+c2*CS+CS/2,OY+r*CS+CS/2,'#4ec4ff',6);
        setTimeout(()=>{if(state==='play')aiMove();},400);
      }
    }

    function draw() {
      // Dark gradient bg
      const grad=ctx.createLinearGradient(0,0,0,CH);
      grad.addColorStop(0,'#0d1240'); grad.addColorStop(1,'#12122a');
      ctx.fillStyle=grad; ctx.fillRect(0,0,CW,CH);

      // Labels
      ctx.font='bold 12px system-ui'; ctx.textAlign='center'; ctx.textBaseline='top';
      ctx.shadowBlur=8; ctx.shadowColor='#7ecaff';
      ctx.fillStyle='#7ecaff'; ctx.fillText('Your fleet',OX1+N*CS/2,8);
      ctx.fillStyle='#ff6b9a'; ctx.shadowColor='#ff6b9a';
      ctx.fillText('Enemy waters',OX2+N*CS/2,8);
      ctx.shadowBlur=0;
      ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='10px system-ui';
      ctx.fillText('(ships shown)',OX1+N*CS/2,23);
      ctx.fillText('(shoot here!)',OX2+N*CS/2,23);

      drawGrid(OX1,OY,playerGrid,aiShots,playerShips,false);
      drawGrid(OX2,OY,aiGrid,playerShots,aiShips,true);

      // Particles
      particles=particles.filter(p=>p.life>0);
      for (const p of particles) {
        p.x+=p.vx;p.y+=p.vy;p.vy+=0.1;p.life-=0.04;
        ctx.globalAlpha=p.life; ctx.fillStyle=p.color;
        ctx.shadowBlur=8; ctx.shadowColor=p.color;
        ctx.beginPath(); ctx.arc(p.x,p.y,p.size*p.life,0,Math.PI*2); ctx.fill();
        ctx.shadowBlur=0;
      }
      ctx.globalAlpha=1;

      // Message bar
      ctx.fillStyle='rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.roundRect(0,OY+N*CS+6,CW,32,0); ctx.fill();
      ctx.fillStyle='#fff'; ctx.font=state==='over'?'bold 13px system-ui':'13px system-ui';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.shadowBlur=state==='over'?8:0; ctx.shadowColor='#7ecaff';
      ctx.fillText(state==='over'?message+'  Tap to play again!':message,CW/2,OY+N*CS+22);
      ctx.shadowBlur=0;
    }

    function drawGrid(ox, oy, grid, shots, ships, hideShips) {
      // Water gradient
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
        if (shots[r][c2]===2) {
          ctx.fillStyle='rgba(220,50,50,0.4)'; ctx.fillRect(x,y,CS,CS);
          ctx.font='14px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
          ctx.shadowBlur=10; ctx.shadowColor='#ff4444';
          ctx.fillText('💥',x+CS/2,y+CS/2);
          ctx.shadowBlur=0;
        } else if (shots[r][c2]===1) {
          ctx.fillStyle='rgba(150,220,255,0.5)';
          ctx.beginPath(); ctx.arc(x+CS/2,y+CS/2,4,0,Math.PI*2); ctx.fill();
        }
        ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=1;
        ctx.strokeRect(x,y,CS,CS);
      }
      for (const ship of ships) {
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
