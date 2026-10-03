Pawcade.register({
  id: 'flappy', title: 'Flappy Cat', emoji: '🐈', tags: 'arcade reflex one-button',
  blurb: 'Tap or press Space to flap. Squeeze between the scratching posts.',
  mount(el, api) {
    const W=320,H=480,c=document.createElement('canvas');
    c.width=W;c.height=H;c.className='board';
    const hint=document.createElement('p');hint.className='hint';hint.textContent='Tap, click or press Space to flap.';
    el.append(c,hint);
    const x=c.getContext('2d'),G=.30,J=-5.4,PW=48;
    let y,v,ps,sc,best,state,raf,frame,GAP;
    let particles=[], stars=[], cloudX=0;
    best=0;

    for (let i=0;i<40;i++) stars.push({x:Math.random()*W, y:Math.random()*H*0.65, r:Math.random()*1.5+0.4, t:Math.random()*Math.PI*2});

    function medal(n){return n>=20?'🥇 Gold':n>=10?'🥈 Silver':n>=4?'🥉 Bronze':'';}
    function reset(){y=H/2;v=0;ps=[];sc=0;frame=0;GAP=145;state='ready';particles=[];}
    function die(){state='over';best=Math.max(best,sc);api.score(sc);api.beep(140,.3,'sawtooth');
      for(let i=0;i<24;i++){const a=Math.random()*Math.PI*2,sp=1+Math.random()*4;particles.push({x:80,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,color:i%2?'#ff6b9a':'#ffd700'});}
    }
    function flap(){if(state=='over'){reset();return;}if(state=='ready')state='play';v=J;api.beep(520,.05);}

    function tick(){
      cloudX = (cloudX - 0.4) % W;
      if(state=='play'){
        v+=G;y+=v;frame++;
        if(frame%90==1){GAP=Math.max(90,145-Math.floor(sc/5)*5);ps.push({x:W,top:60+Math.random()*(H-GAP-120),ok:false});}
        const spd=2.2+sc*.04;
        ps.forEach(p=>p.x-=spd);ps=ps.filter(p=>p.x>-PW);
        for(const p of ps){
          if(!p.ok&&p.x+PW<68){p.ok=true;sc++;api.beep(800,.05);}
          if(92>p.x&&68<p.x+PW&&(y-12<p.top||y+12>p.top+GAP))die();
        }
        if(y>H-12||y<0)die();
      }else if(state=='ready')y=H/2+Math.sin(Date.now()/200)*8;
      particles=particles.filter(p=>p.life>0);
      draw();raf=requestAnimationFrame(tick);
    }

    function drawCloud(cx,cy,w){
      x.fillStyle='rgba(255,255,255,0.08)';
      x.beginPath();x.arc(cx,cy,w*0.4,0,Math.PI*2);x.fill();
      x.beginPath();x.arc(cx+w*0.3,cy+4,w*0.28,0,Math.PI*2);x.fill();
      x.beginPath();x.arc(cx-w*0.25,cy+5,w*0.24,0,Math.PI*2);x.fill();
    }

    function draw(){
      const sky=x.createLinearGradient(0,0,0,H);
      sky.addColorStop(0,'#0d1240'); sky.addColorStop(0.6,'#12122a'); sky.addColorStop(1,'#1a1a40');
      x.fillStyle=sky; x.fillRect(0,0,W,H);

      const t_now=Date.now()/800;
      for(const s2 of stars){
        const alpha=0.3+0.3*Math.sin(s2.t+t_now);
        x.globalAlpha=alpha; x.fillStyle='#fff';
        x.beginPath(); x.arc(s2.x, s2.y, s2.r, 0, Math.PI*2); x.fill();
      }
      x.globalAlpha=1;

      const offsets=[0, W*0.42, W*0.75];
      offsets.forEach((o,i)=>{
        const cx=((cloudX*0.5+o)%(W+80)+(i*120)%(W+80)+W+80)%(W+80)-40;
        drawCloud(cx, 60+i*35, 55+i*12);
      });

      const grd=x.createLinearGradient(0,H-20,0,H);
      grd.addColorStop(0,'#2a1a4a'); grd.addColorStop(1,'#1a0f33');
      x.fillStyle=grd; x.fillRect(0,H-20,W,20);

      ps.forEach(p=>{
        const pg=x.createLinearGradient(p.x,0,p.x+PW,0);
        pg.addColorStop(0,'#5a3fa0'); pg.addColorStop(0.4,'#7e5fc4'); pg.addColorStop(1,'#4a2f90');
        x.fillStyle=pg;
        x.shadowBlur=12; x.shadowColor='#7e5fc4';
        x.beginPath();x.roundRect(p.x,0,PW,p.top,[0,0,8,8]);x.fill();
        x.beginPath();x.roundRect(p.x,p.top+GAP,PW,H-p.top-GAP,[8,8,0,0]);x.fill();
        x.shadowBlur=0;
        x.fillStyle='rgba(255,255,255,0.12)';
        x.fillRect(p.x+4,0,6,p.top-2);
        x.fillRect(p.x+4,p.top+GAP+2,6,H-p.top-GAP-4);
        x.fillStyle='#9b7de0';
        x.fillRect(p.x-4,p.top-10,PW+8,10);
        x.fillRect(p.x-4,p.top+GAP,PW+8,10);
      });

      for(const p of particles){
        p.x+=p.vx; p.y+=p.vy; p.vy+=0.12; p.life-=0.05;
        x.globalAlpha=p.life; x.fillStyle=p.color;
        x.shadowBlur=8; x.shadowColor=p.color;
        x.beginPath(); x.arc(p.x,p.y,4*p.life,0,Math.PI*2); x.fill();
        x.shadowBlur=0;
      }
      x.globalAlpha=1;

      x.save(); x.translate(80,y);
      x.rotate(Math.max(-0.4,Math.min(0.4,v*0.06)));
      x.shadowBlur=16; x.shadowColor='#7ecaff';
      Sprites.draw(x,'cat',0,0,2,false);
      x.shadowBlur=0; x.restore();

      x.fillStyle='rgba(0,0,0,0.45)';
      x.beginPath(); x.roundRect(W/2-38,8,76,28,10); x.fill();
      x.shadowBlur=10; x.shadowColor='#fff';
      x.fillStyle='#fff'; x.font='bold 20px system-ui'; x.textAlign='center'; x.textBaseline='middle';
      x.fillText(sc, W/2, 22);
      x.shadowBlur=0;

      if(state=='ready'){
        x.fillStyle='rgba(0,0,0,0.45)';
        x.beginPath(); x.roundRect(W/2-80,H/2+38,160,32,10); x.fill();
        x.fillStyle='#fff'; x.font='16px system-ui'; x.textAlign='center'; x.textBaseline='middle';
        x.fillText('Tap to start',W/2,H/2+54);
        if(best>0){x.font='13px system-ui';x.fillStyle='rgba(255,255,255,0.7)';x.fillText('Best: '+best+(medal(best)?' '+medal(best):''),W/2,H/2+80);}
      }

      if(state=='over'){
        x.fillStyle='rgba(0,0,15,0.7)'; x.fillRect(0,0,W,H);
        x.fillStyle='rgba(255,255,255,0.07)';
        x.beginPath(); x.roundRect(W/2-115,H/2-70,230,130,18); x.fill();
        x.strokeStyle='#7e5fc4'; x.lineWidth=1.5;
        x.beginPath(); x.roundRect(W/2-115,H/2-70,230,130,18); x.stroke();
        x.shadowBlur=20; x.shadowColor='#7e5fc4';
        x.fillStyle='#fff'; x.font='bold 20px system-ui'; x.textAlign='center'; x.textBaseline='middle';
        const m=medal(sc);
        x.fillText(m ? m+' — Score: '+sc : 'Score: '+sc, W/2, H/2-36);
        x.shadowBlur=0;
        if(sc>=best&&sc>0){x.fillStyle='#ffd700';x.shadowBlur=12;x.shadowColor='#ffd700';x.font='bold 15px system-ui';x.fillText('✨ New Best!',W/2,H/2-8);x.shadowBlur=0;}
        else if(best>0){x.fillStyle='rgba(255,255,255,0.65)';x.font='14px system-ui';x.fillText('Best: '+best,W/2,H/2-8);}
        x.fillStyle='rgba(255,255,255,0.6)'; x.font='13px system-ui';
        x.fillText('Tap or Space to retry',W/2,H/2+22);
        x.fillText('Bronze 4+   Silver 10+   Gold 20+',W/2,H/2+46);
      }
    }
    const key=e=>{if(e.key==' '||e.key==='ArrowUp'){e.preventDefault();flap();}};
    c.onpointerdown=flap;document.addEventListener('keydown',key);
    reset();tick();
    return ()=>{cancelAnimationFrame(raf);document.removeEventListener('keydown',key);};
  }
});
