Pawcade.register({
  id: 'snake', title: 'Cat Snake', emoji: '🐟', tags: 'classic arcade reflex',
  blurb: 'Eat fish, grow longer, never bite your own tail.',
  mount(el, api) {
    const N = 18, S = 20, c = document.createElement('canvas');
    c.width = c.height = N * S; c.className = 'board';
    const row = document.createElement('div'); row.className = 'row';
    const msg = document.createElement('p'); msg.className = 'hint';
    msg.textContent = '📱 Swipe to steer · Tap to restart · ⌨️ WASD / arrows · P = pause';
    const wrapBtn = document.createElement('button');
    wrapBtn.textContent = 'Walls: On'; wrapBtn.title = 'Toggle wall-wrap mode';
    wrapBtn.onclick = () => { wrap = !wrap; wrapBtn.textContent = wrap ? 'Walls: Off' : 'Walls: On'; draw(); };
    row.append(wrapBtn); el.append(c, row, msg);
    const x = c.getContext('2d');
    let s, d, nd, f, sc, t, over, sp, pz, wrap = false, combo = 0, lastEat = 0;
    const same = (a, b) => a[0] == b[0] && a[1] == b[1];
    function food() { do f = [Math.random() * N | 0, Math.random() * N | 0]; while (s.some(p => same(p, f))); }
    function reset() { s = [[9,9],[8,9],[7,9]]; d = nd = [1,0]; sc = 0; over = false; combo = 0; food(); clearInterval(t); sp = 110; pz = false; t = setInterval(step, sp); draw(); }
    function step() {
      d = nd;
      let h = [s[0][0]+d[0], s[0][1]+d[1]];
      if (wrap) { h[0]=(h[0]+N)%N; h[1]=(h[1]+N)%N; }
      if (!wrap&&(h[0]<0||h[1]<0||h[0]>=N||h[1]>=N)){over=true;clearInterval(t);api.score(sc);api.beep(150,.3,'sawtooth');draw();return;}
      if (s.some(p=>same(p,h))){over=true;clearInterval(t);api.score(sc);api.beep(150,.3,'sawtooth');draw();return;}
      s.unshift(h);
      if (same(h,f)){
        const now=Date.now();combo=now-lastEat<3000?combo+1:1;lastEat=now;
        const pts=combo>=3?2:1;sc+=pts;
        food();api.beep(combo>=3?880:660,.06);api.score(sc);
        if(sc%4==0){sp=Math.max(55,sp-10);clearInterval(t);t=setInterval(step,sp);}
      } else { s.pop(); }
      draw();
    }
    function draw() {
      const cs = getComputedStyle(el);
      const bg=cs.getPropertyValue('--bg').trim(), accent=cs.getPropertyValue('--accent').trim();
      const ink=cs.getPropertyValue('--ink').trim(), line=cs.getPropertyValue('--line').trim();
      x.fillStyle=bg; x.fillRect(0,0,c.width,c.height);
      x.strokeStyle=line; x.lineWidth=.3; x.globalAlpha=.4;
      for(let i=0;i<=N;i++){x.beginPath();x.moveTo(i*S,0);x.lineTo(i*S,c.height);x.stroke();x.beginPath();x.moveTo(0,i*S);x.lineTo(c.width,i*S);x.stroke();}
      x.globalAlpha=1;
      for(let i=s.length-1;i>=1;i--){
        const p=s[i]; x.globalAlpha=1-(i/s.length)*.4; x.fillStyle=accent;
        x.beginPath();x.roundRect(p[0]*S+2,p[1]*S+2,S-4,S-4,4);x.fill();
      }
      x.globalAlpha=1;
      // cat head — flip when moving left
      Sprites.draw(x,'cat',s[0][0]*S+S/2,s[0][1]*S+S/2,2,d[0]===-1);
      // fish food
      Sprites.draw(x,'fish',f[0]*S+S/2,f[1]*S+S/2,2,false);
      if(combo>=3){x.fillStyle='#ff6b9a';x.font='bold 12px system-ui';x.textBaseline='top';x.textAlign='right';x.fillText('x'+combo+' COMBO!',c.width-6,4);}
      x.fillStyle=ink;x.font='bold 14px system-ui';x.textBaseline='top';x.textAlign='left';
      x.fillText('Fish: '+sc+'  Speed: '+Math.round(100*110/sp)+'%'+(wrap?'  wrap':''),6,4);
      // swipe hint overlay (fades after first move)
      if (!over && !pz) {
        x.save(); x.globalAlpha = 0.22;
        x.fillStyle = ink; x.font = 'bold 20px system-ui'; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.fillText('↑', c.width/2, 16);
        x.fillText('↓', c.width/2, c.height - 14);
        x.fillText('←', 14, c.height/2);
        x.fillText('→', c.width - 14, c.height/2);
        x.restore();
      }
      if(pz){x.fillStyle='rgba(0,0,0,.45)';x.fillRect(0,0,c.width,c.height);x.fillStyle='#fff';x.font='bold 20px system-ui';x.textAlign='center';x.fillText('Paused — press P',c.width/2,c.height/2);}
      if(over){x.fillStyle='rgba(0,0,0,.52)';x.fillRect(0,0,c.width,c.height);x.fillStyle='#fff';x.font='bold 18px system-ui';x.textAlign='center';x.fillText('Game over! Score: '+sc,c.width/2,c.height/2-14);x.font='14px system-ui';x.fillText('Space or tap to restart',c.width/2,c.height/2+14);}
    }
    const dirs={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0],W:[0,-1],S:[0,1],A:[-1,0],D:[1,0]};
    const kd=e=>{
      if(e.key==='p'||e.key==='P'){if(!over){pz=!pz;if(!pz)draw();}return;}
      if(e.key===' '){e.preventDefault();if(over||pz){pz=false;reset();}return;}
      const ndir=dirs[e.key];if(!ndir)return;e.preventDefault();
      if(pz)return;if(ndir[0]!==-d[0]||ndir[1]!==-d[1])nd=ndir;
    };
    let tx0,ty0;
    c.addEventListener('touchstart',e=>{const t2=e.touches[0];tx0=t2.clientX;ty0=t2.clientY;},{passive:true});
    c.addEventListener('touchend',e=>{
      if(over){reset();return;}
      const t2=e.changedTouches[0],dx=t2.clientX-tx0,dy=t2.clientY-ty0;
      if(Math.abs(dx)<10&&Math.abs(dy)<10){if(over)reset();return;}
      if(Math.abs(dx)>Math.abs(dy))nd=dx>0?[1,0]:[-1,0];else nd=dy>0?[0,1]:[0,-1];
    },{passive:true});
    c.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'&&over)reset();});
    document.addEventListener('keydown',kd);
    reset();
    return ()=>{clearInterval(t);document.removeEventListener('keydown',kd);};
  }
});
