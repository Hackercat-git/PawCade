Pawcade.register({
  id: 'dash', title: 'Cat Dash', emoji: '🏃', tags: 'endless runner jump reflex',
  blurb: 'Jump over dogs and yarn. Collect coins. How far can you run?',
  mount(el, api) {
    const W=340,H=200,GY=155,c=document.createElement('canvas');
    c.width=W;c.height=H;c.className='board';
    const hint=document.createElement('p');hint.className='hint';
    hint.textContent='Space, up, or tap to jump. Double-jump allowed! Collect coins.';
    el.append(c,hint);
    const x=c.getContext('2d');
    const OBS_TYPES=['dog','yarn','yarn','dog'];
    let cy,vy,jumps,obs,coins,sc,coins_total,spd,state,raf,frame,bgOffset,particles;

    function spawnParticles(px,py,col,n){
      for(let i=0;i<n;i++){
        const a=Math.random()*Math.PI*2,spd=1+Math.random()*3;
        particles.push({x:px,y:py,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd-1,life:1,size:2+Math.random()*3,color:col});
      }
    }
    function reset(){cy=GY;vy=0;jumps=0;obs=[];coins=[];sc=0;coins_total=0;spd=3;frame=0;state='ready';bgOffset=0;particles=[];}
    function jump(){
      if(state==='over'){reset();return;}
      if(state==='ready'){state='play';return;}
      if(jumps<2){vy=jumps===0?-7.5:-5.5;jumps++;api.beep(jumps===1?600:800,.05);}
    }
    function tick(){
      if(state==='play'){
        frame++;sc=Math.floor(frame/6);
        spd=3+sc*.008;
        bgOffset=(bgOffset+spd*.3)%W;
        vy+=.45;cy+=vy;
        if(cy>=GY){cy=GY;vy=0;jumps=0;}
        const gap=Math.max(55,110-sc/4);
        if(obs.length===0||obs[obs.length-1].x<W-gap-Math.random()*80){
          const ox=W+20,oh=28+Math.random()*14;
          obs.push({x:ox,type:OBS_TYPES[Math.random()*OBS_TYPES.length|0],h:oh});
          if(Math.random()<.6)coins.push({x:ox+Math.random()*40-20,y:GY-oh-30-Math.random()*30,collected:false});
        }
        obs.forEach(o=>o.x-=spd);obs=obs.filter(o=>o.x>-40);
        coins.forEach(co=>co.x-=spd);coins=coins.filter(co=>co.x>-20);
        for(const o of obs){
          if(Math.abs(o.x-60)<20&&cy+12>GY-o.h+4){state='over';api.score(sc+coins_total*10);api.beep(150,.3,'sawtooth');spawnParticles(60,cy,'#ff5555',16);break;}
        }
        for(const co of coins){
          if(!co.collected&&Math.abs(co.x-60)<18&&Math.abs(co.y-cy)<22){co.collected=true;coins_total++;api.beep(1100,.04);api.score(sc+coins_total*10);spawnParticles(co.x,co.y,'#ffd700',10);}
        }
        api.score(sc+coins_total*10);
      }
      draw();raf=requestAnimationFrame(tick);
    }
    function draw(){
      const cs=getComputedStyle(el);
      const accent=cs.getPropertyValue('--accent').trim();
      const ink=cs.getPropertyValue('--ink').trim();
      const mute=cs.getPropertyValue('--mute').trim();
      // gradient bg
      const grad=x.createLinearGradient(0,0,0,H);
      grad.addColorStop(0,'#12122a');grad.addColorStop(1,'#0d1b3e');
      x.fillStyle=grad;x.fillRect(0,0,W,H);
      // scrolling bg trees
      x.globalAlpha=.15;
      for(let i=0;i<5;i++){
        const tx=((i*70-bgOffset+W)%W);
        x.fillStyle=mute||'#8a80cc';
        x.fillRect(tx+9,GY-28,6,18);
        x.fillRect(tx,GY-52,24,14);
        x.fillRect(tx+3,GY-66,18,14);
        x.fillRect(tx+7,GY-76,10,12);
      }
      x.globalAlpha=1;
      // ground glow
      x.shadowBlur=8;x.shadowColor='rgba(126,202,255,0.4)';
      x.fillStyle='rgba(126,202,255,0.5)';x.fillRect(0,GY+18,W,2);
      x.shadowBlur=0;
      // particles
      particles=particles.filter(p=>p.life>0);
      for(const p of particles){
        p.x+=p.vx;p.y+=p.vy;p.vy+=0.1;p.life-=0.06;
        x.globalAlpha=p.life;x.fillStyle=p.color;
        x.shadowBlur=8;x.shadowColor=p.color;
        x.beginPath();x.arc(p.x,p.y,p.size*p.life,0,Math.PI*2);x.fill();
        x.shadowBlur=0;
      }
      x.globalAlpha=1;
      // running cat sprite
      x.save();x.translate(60,cy);
      if(cy<GY)x.rotate(Math.max(-.3,Math.min(.3,vy*.04)));
      x.shadowBlur=12;x.shadowColor='#7ecaff';
      Sprites.draw(x,'cat',0,0,2,false);
      x.shadowBlur=0;
      x.restore();
      // obstacles
      obs.forEach(o=>{
        x.shadowBlur=8;x.shadowColor='#ff8888';
        Sprites.draw(x,o.type,o.x,GY+8-o.h/2,2,false);
        x.shadowBlur=0;
      });
      // coins
      coins.forEach(co=>{
        if(co.collected)return;
        x.shadowBlur=10;x.shadowColor='#ffd700';
        Sprites.draw(x,'coin',co.x,co.y,2,false);
        x.shadowBlur=0;
      });
      // hud pill
      const hudText='Dist: '+sc+'m'+(spd>4?'  !!':'')+'  coins:'+coins_total;
      x.font='bold 13px system-ui';x.textAlign='left';x.textBaseline='top';
      const tw=x.measureText(hudText).width;
      x.fillStyle='rgba(0,0,0,0.45)';
      x.beginPath();x.roundRect(4,4,tw+16,22,8);x.fill();
      x.fillStyle='#ffffff';x.fillText(hudText,12,8);
      if(state==='ready'){
        x.fillStyle='rgba(0,0,0,.55)';
        x.beginPath();x.roundRect(W/2-110,70,220,36,10);x.fill();
        x.strokeStyle='rgba(126,202,255,0.4)';x.lineWidth=1.5;
        x.beginPath();x.roundRect(W/2-110,70,220,36,10);x.stroke();
        x.fillStyle='#fff';x.font='bold 16px system-ui';x.textAlign='center';x.textBaseline='middle';
        x.fillText('Space or tap to start',W/2,88);
      }
      if(state==='over'){
        x.fillStyle='rgba(0,0,0,0.65)';x.fillRect(0,0,W,H);
        x.shadowBlur=20;x.shadowColor='#ff5555';
        x.fillStyle='rgba(30,10,10,0.9)';
        x.beginPath();x.roundRect(W/2-120,H/2-36,240,72,12);x.fill();
        x.shadowBlur=0;
        x.strokeStyle='#ff7777';x.lineWidth=1.5;
        x.beginPath();x.roundRect(W/2-120,H/2-36,240,72,12);x.stroke();
        x.fillStyle='#fff';x.font='bold 15px system-ui';x.textAlign='center';x.textBaseline='middle';
        x.fillText('Wiped out at '+sc+'m!',W/2,H/2-10);
        x.font='13px system-ui';
        x.fillText('Coins: '+coins_total+'  Total: '+(sc+coins_total*10)+'pts — tap to retry',W/2,H/2+14);
      }
    }
    const kd=e=>{if(['ArrowUp',' '].includes(e.key)){e.preventDefault();jump();}};
    c.onpointerdown=()=>jump();
    document.addEventListener('keydown',kd);
    reset();tick();
    return ()=>{cancelAnimationFrame(raf);document.removeEventListener('keydown',kd);};
  }
});
