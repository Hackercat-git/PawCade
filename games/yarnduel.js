Pawcade.register({
  id: 'yarnduel', title: 'Yarn Duel', emoji: '🧶', tags: 'arcade multiplayer two-player fighting',
  blurb: 'Two cats, one screen. Throw yarn balls at each other. 3 hits wins!',
  mount(el, api) {
    const W=320,H=260,GY=195,LIVES=3;
    const c=document.createElement('canvas');
    c.width=W;c.height=H;c.className='board';
    const hint=document.createElement('p');hint.className='hint';
    hint.textContent='📱 P1: tap left half (top=jump, bottom=throw) · P2: tap right half · ⌨️ A/D/W/Space · arrows/Enter';
    el.append(c,hint);
    const ctx=c.getContext('2d'),keys={};

    const PLATFORMS=[
      {x:0,  y:GY,w:W},
      {x:60, y:140,w:80},
      {x:180,y:140,w:80},
      {x:120,y:90, w:80},
    ];

    let p1,p2,balls,state,raf,frame,flashTimer;

    function makePlayer(side){
      return{x:side===1?50:W-50,y:GY-32,vx:0,vy:0,dir:side===1?1:-1,lives:LIVES,inv:0,grounded:false,side};
    }
    function reset(){p1=makePlayer(1);p2=makePlayer(2);balls=[];frame=0;flashTimer=0;state='ready';}
    function throwBall(player){
      if(state!=='play')return;
      if(balls.filter(b=>b.owner===player.side).length>=2)return;
      balls.push({x:player.x+player.dir*18,y:player.y-8,vx:player.dir*7.5,vy:-1.5,owner:player.side,life:80});
      api.beep(player.side===1?600:750,.05);
    }
    function applyGravity(p){
      p.vy+=.45;p.x+=p.vx;p.y+=p.vy;
      p.vx*=.84;p.grounded=false;
      for(const pl of PLATFORMS){
        if(p.x+14>pl.x&&p.x-14<pl.x+pl.w&&p.y>pl.y-4&&p.y<pl.y+10&&p.vy>=0){
          p.y=pl.y;p.vy=0;p.grounded=true;break;
        }
      }
      p.x=Math.max(16,Math.min(W-16,p.x));
      if(p.y>H+30){p.y=GY-32;p.vy=0;}
    }
    function tick(){
      frame++;
      if(state==='play'){
        if(keys.a||keys.A){p1.vx-=1.5;p1.dir=-1;}if(keys.d||keys.D){p1.vx+=1.5;p1.dir=1;}
        if((keys.w||keys.W)&&p1.grounded){p1.vy=-9.5;api.beep(550,.04);}
        if(keys.ArrowLeft){p2.vx-=1.5;p2.dir=-1;}if(keys.ArrowRight){p2.vx+=1.5;p2.dir=1;}
        if(keys.ArrowUp&&p2.grounded){p2.vy=-9.5;api.beep(700,.04);}
        applyGravity(p1);applyGravity(p2);
        if(p1.inv>0)p1.inv--;if(p2.inv>0)p2.inv--;
        balls.forEach(b=>{b.x+=b.vx;b.y+=b.vy;b.vy+=.18;b.life--;});
        balls=balls.filter(b=>b.life>0&&b.x>-10&&b.x<W+10&&b.y<H+20);
        for(let i=balls.length-1;i>=0;i--){
          const b=balls[i];
          const target=b.owner===1?p2:p1;
          if(target.inv===0&&Math.hypot(b.x-target.x,b.y-target.y)<22){
            target.lives--;target.inv=120;flashTimer=12;
            api.beep(200,.25,'sawtooth');balls.splice(i,1);
            if(target.lives<=0){state=b.owner===1?'win1':'win2';api.score(LIVES);}
            break;
          }
        }
      }
      draw();raf=requestAnimationFrame(tick);
    }
    function draw(){
      const cs=getComputedStyle(el);
      const bg=cs.getPropertyValue('--bg').trim(),accent=cs.getPropertyValue('--accent').trim();
      const ink=cs.getPropertyValue('--ink').trim(),line=cs.getPropertyValue('--line').trim();
      ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
      if(flashTimer>0){flashTimer--;ctx.fillStyle='rgba(255,100,100,.08)';ctx.fillRect(0,0,W,H);}
      // platforms
      PLATFORMS.forEach(pl=>{
        ctx.fillStyle=line;
        ctx.beginPath();ctx.roundRect(pl.x,pl.y,pl.w,10,[0,0,6,6]);ctx.fill();
      });
      // yarn balls
      balls.forEach(b=>{
        ctx.globalAlpha=Math.min(1,b.life/15);
        Sprites.draw(ctx,'yarn',b.x,b.y,2,false);
      });
      ctx.globalAlpha=1;
      // players
      [p1,p2].forEach(p=>{
        if(p.inv>0&&Math.floor(frame/5)%2===0)return;
        ctx.save();ctx.translate(p.x,p.y-10);
        Sprites.draw(ctx,p.side===1?'cat':'catGray',0,0,2,p.dir<0);
        ctx.restore();
      });
      // HUD
      ctx.font='bold 13px system-ui';ctx.textBaseline='top';
      ctx.textAlign='left';ctx.fillStyle=accent;
      // P1 lives as heart pixels
      let hw=0;for(let i=0;i<Math.max(0,p1.lives);i++){ctx.fillStyle=i<p1.lives?'#e44':'#444';ctx.fillRect(8+i*14,5,10,10);hw++;}
      ctx.fillStyle=accent;ctx.fillText('P1',8,18);
      ctx.textAlign='right';
      for(let i=0;i<Math.max(0,p2.lives);i++){ctx.fillStyle=i<p2.lives?'#e44':'#444';ctx.fillRect(W-18-i*14,5,10,10);}
      ctx.fillStyle=accent;ctx.fillText('P2',W-8,18);
      // touch zone hint lines
      ctx.save(); ctx.globalAlpha=0.08; ctx.strokeStyle='#fff'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke();// center
      ctx.beginPath(); ctx.moveTo(0,H*.72); ctx.lineTo(W,H*.72); ctx.stroke();// throw strip
      // column dividers P1
      ctx.beginPath();ctx.moveTo(W/6,0);ctx.lineTo(W/6,H*.72);ctx.stroke();
      ctx.beginPath();ctx.moveTo(W/3,0);ctx.lineTo(W/3,H*.72);ctx.stroke();
      // column dividers P2
      ctx.beginPath();ctx.moveTo(W*2/3,0);ctx.lineTo(W*2/3,H*.72);ctx.stroke();
      ctx.beginPath();ctx.moveTo(W*5/6,0);ctx.lineTo(W*5/6,H*.72);ctx.stroke();
      // labels
      ctx.globalAlpha=0.25; ctx.fillStyle='#fff'; ctx.font='11px system-ui';
      ctx.textBaseline='top'; ctx.textAlign='center';
      ctx.fillText('◀',W/12,4); ctx.fillText('↑',W/4,4); ctx.fillText('▶',W*5/12,4);
      ctx.fillText('◀',W*7/12,4); ctx.fillText('↑',W*3/4,4); ctx.fillText('▶',W*11/12,4);
      ctx.fillText('🧶 throw',W/4,H*.74); ctx.fillText('🧶 throw',W*3/4,H*.74);
      ctx.restore();
      ctx.textAlign='center';ctx.textBaseline='middle';
      if(state==='ready'){
        ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(0,H/2-24,W,42);
        ctx.fillStyle='#fff';ctx.font='bold 16px system-ui';
        ctx.fillText('Space or tap to start',W/2,H/2);
      }
      if(state==='win1'||state==='win2'){
        const w=state==='win1'?'P1 wins!':'P2 wins!';
        ctx.fillStyle='rgba(0,0,0,.58)';ctx.fillRect(0,H/2-30,W,54);
        ctx.fillStyle=accent;ctx.font='bold 20px system-ui';
        ctx.fillText('🏆 '+w,W/2,H/2-6);
        ctx.fillStyle='#fff';ctx.font='14px system-ui';
        ctx.fillText('Space or tap to rematch',W/2,H/2+16);
      }
    }
    const kd=e=>{
      keys[e.key]=true;
      if([' ','ArrowUp','ArrowLeft','ArrowRight','ArrowDown'].includes(e.key))e.preventDefault();
      if(e.key===' '){
        if(state==='ready'){state='play';}
        else if(state==='play')throwBall(p1);
        else if(state==='win1'||state==='win2')reset();
      }
      if(e.key==='Enter'){
        e.preventDefault();
        if(state==='play')throwBall(p2);
        else if(state==='ready')state='play';
        else if(state==='win1'||state==='win2')reset();
      }
    };
    const ku=e=>keys[e.key]=false;
    // Touch: each half split into 3 columns (left=move left, center=jump, right=move right)
    //        + bottom 30% = throw
    c.addEventListener('touchstart',e=>{
      e.preventDefault();
      [...e.changedTouches].forEach(t=>{
        const r=c.getBoundingClientRect();
        const tx=(t.clientX-r.left)/r.width,ty=(t.clientY-r.top)/r.height;
        if(state==='ready'||state==='win1'||state==='win2'){
          if(state!=='ready')reset(); state='play'; return;
        }
        if(ty>0.72){// bottom strip = throw for whichever side
          if(tx<.5)throwBall(p1); else throwBall(p2); return;
        }
        if(tx<.5){// P1 side
          const lx=tx*2;// 0..1 within P1 half
          if(lx<0.33){p1.vx-=2.5;p1.dir=-1;}
          else if(lx>0.67){p1.vx+=2.5;p1.dir=1;}
          else if(p1.grounded){p1.vy=-9.5;api.beep(550,.04);}
        } else {// P2 side
          const rx=(tx-.5)*2;// 0..1 within P2 half
          if(rx<0.33){p2.vx-=2.5;p2.dir=-1;}
          else if(rx>0.67){p2.vx+=2.5;p2.dir=1;}
          else if(p2.grounded){p2.vy=-9.5;api.beep(700,.04);}
        }
      });
    },{passive:false});
    c.style.touchAction='none';
    document.addEventListener('keydown',kd);document.addEventListener('keyup',ku);
    reset();tick();
    return ()=>{cancelAnimationFrame(raf);document.removeEventListener('keydown',kd);document.removeEventListener('keyup',ku);};
  }
});
